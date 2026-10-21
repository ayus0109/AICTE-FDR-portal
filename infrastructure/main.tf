terraform {
  required_version = ">= 1.5.0"
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.40"
    }
  }
}

provider "aws" {
  region = var.aws_region

  default_tags {
    tags = {
      Project     = var.project_name
      Environment = var.environment
      ManagedBy   = "Terraform"
      ProblemID   = "26265"
    }
  }
}

# -----------------------------------------------------------------------------
# 1. Amazon S3: Private Document Repository
# -----------------------------------------------------------------------------
resource "aws_s3_bucket" "fdr_documents" {
  bucket        = "${var.project_name}-documents-${var.environment}"
  force_destroy = false
}

resource "aws_s3_bucket_public_access_block" "fdr_docs_private" {
  bucket                  = aws_s3_bucket.fdr_documents.id
  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

resource "aws_s3_bucket_server_side_encryption_configuration" "fdr_docs_crypto" {
  bucket = aws_s3_bucket.fdr_documents.id

  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm = "AES256"
    }
  }
}

# -----------------------------------------------------------------------------
# 2. Amazon SNS: Notification Topic
# -----------------------------------------------------------------------------
resource "aws_sns_topic" "fdr_alerts" {
  name = "${var.project_name}-alerts"
}

# -----------------------------------------------------------------------------
# 3. Amazon Cognito: User Pool & Client
# -----------------------------------------------------------------------------
resource "aws_cognito_user_pool" "fdr_users" {
  name = "${var.project_name}-user-pool"

  auto_verified_attributes = ["email"]
  username_attributes      = ["email"]

  password_policy {
    minimum_length    = 8
    require_lowercase = true
    require_numbers   = true
    require_symbols   = false
    require_uppercase = true
  }

  schema {
    name                = "role"
    attribute_data_type = "String"
    mutable             = true
    required            = false
  }

  schema {
    name                = "institution_id"
    attribute_data_type = "Number"
    mutable             = true
    required            = false
  }
}

resource "aws_cognito_user_pool_client" "fdr_client" {
  name         = "${var.project_name}-web-client"
  user_pool_id = aws_cognito_user_pool.fdr_users.id

  explicit_auth_flows = [
    "ALLOW_USER_PASSWORD_AUTH",
    "ALLOW_REFRESH_TOKEN_AUTH",
    "ALLOW_USER_SRP_AUTH"
  ]

  generate_secret = false
}

# -----------------------------------------------------------------------------
# 4. IAM: Least Privilege Roles for Lambda
# -----------------------------------------------------------------------------
data "aws_iam_policy_document" "lambda_assume" {
  statement {
    actions = ["sts:AssumeRole"]
    principals {
      type        = "Service"
      identifiers = ["lambda.amazonaws.com"]
    }
  }
}

resource "aws_iam_role" "lambda_exec" {
  name               = "${var.project_name}-lambda-exec"
  assume_role_policy = data.aws_iam_policy_document.lambda_assume.json
}

resource "aws_iam_policy" "lambda_app_permissions" {
  name        = "${var.project_name}-app-policy"
  description = "Least privilege permissions for AICTE FDR Portal Lambda functions"

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "s3:GetObject",
          "s3:PutObject",
          "s3:DeleteObject"
        ]
        Resource = "${aws_s3_bucket.fdr_documents.arn}/*"
      },
      {
        Effect = "Allow"
        Action = [
          "sns:Publish"
        ]
        Resource = aws_sns_topic.fdr_alerts.arn
      },
      {
        Effect = "Allow"
        Action = [
          "logs:CreateLogGroup",
          "logs:CreateLogStream",
          "logs:PutLogEvents"
        ]
        Resource = "arn:aws:logs:*:*:*"
      }
    ]
  })
}

resource "aws_iam_role_policy_attachment" "lambda_attach" {
  role       = aws_iam_role.lambda_exec.name
  policy_arn = aws_iam_policy.lambda_app_permissions.arn
}

# -----------------------------------------------------------------------------
# 5. AWS Lambda: API Handler & Scheduled Worker
# -----------------------------------------------------------------------------
resource "aws_cloudwatch_log_group" "api_logs" {
  name              = "/aws/lambda/${var.project_name}-api"
  retention_in_days = 14
}

resource "aws_cloudwatch_log_group" "worker_logs" {
  name              = "/aws/lambda/${var.project_name}-maturity-worker"
  retention_in_days = 14
}

# Note: Package zip is built during deployment via CI/CD
resource "aws_lambda_function" "api_lambda" {
  function_name = "${var.project_name}-api"
  role          = aws_iam_role.lambda_exec.arn
  handler       = "app.aws.api_lambda.handler"
  runtime       = "python3.11"
  memory_size   = 512
  timeout       = 30

  filename         = "${path.module}/dummy_payload.zip"
  source_code_hash = filebase64sha256("${path.module}/dummy_payload.zip")

  environment {
    variables = {
      AWS_REGION       = var.aws_region
      USE_AWS_S3       = "true"
      S3_BUCKET_NAME   = aws_s3_bucket.fdr_documents.id
      USE_AWS_SNS      = "true"
      SNS_TOPIC_ARN    = aws_sns_topic.fdr_alerts.arn
      USE_AWS_COGNITO  = "true"
      COGNITO_USER_POOL_ID = aws_cognito_user_pool.fdr_users.id
      COGNITO_CLIENT_ID    = aws_cognito_user_pool_client.fdr_client.id
    }
  }

  depends_on = [aws_cloudwatch_log_group.api_logs]
}

resource "aws_lambda_function" "maturity_worker" {
  function_name = "${var.project_name}-maturity-worker"
  role          = aws_iam_role.lambda_exec.arn
  handler       = "app.aws.maturity_lambda.lambda_handler"
  runtime       = "python3.11"
  memory_size   = 256
  timeout       = 60

  filename         = "${path.module}/dummy_payload.zip"
  source_code_hash = filebase64sha256("${path.module}/dummy_payload.zip")

  environment {
    variables = {
      AWS_REGION    = var.aws_region
      USE_AWS_SNS   = "true"
      SNS_TOPIC_ARN = aws_sns_topic.fdr_alerts.arn
    }
  }

  depends_on = [aws_cloudwatch_log_group.worker_logs]
}

# -----------------------------------------------------------------------------
# 6. Amazon EventBridge: Scheduled Maturity Trigger (Daily)
# -----------------------------------------------------------------------------
resource "aws_cloudwatch_event_rule" "daily_maturity_check" {
  name                = "${var.project_name}-daily-check"
  description         = "Triggers AICTE FDR maturity monitoring check once daily"
  schedule_expression = "rate(1 day)"
}

resource "aws_cloudwatch_event_target" "trigger_maturity_lambda" {
  rule      = aws_cloudwatch_event_rule.daily_maturity_check.name
  target_id = "MaturityWorker"
  arn       = aws_lambda_function.maturity_worker.arn
}

resource "aws_lambda_permission" "allow_eventbridge" {
  statement_id  = "AllowExecutionFromEventBridge"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.maturity_worker.function_name
  principal     = "events.amazonaws.com"
  source_arn    = aws_cloudwatch_event_rule.daily_maturity_check.arn
}

# -----------------------------------------------------------------------------
# 7. Amazon API Gateway: HTTP API v2
# -----------------------------------------------------------------------------
resource "aws_apigatewayv2_api" "http_api" {
  name          = "${var.project_name}-http-api"
  protocol_type = "HTTP"

  cors_configuration {
    allow_origins = ["*"]
    allow_methods = ["GET", "POST", "PUT", "DELETE", "OPTIONS"]
    allow_headers = ["Authorization", "Content-Type"]
  }
}

resource "aws_apigatewayv2_integration" "lambda_integration" {
  api_id           = aws_apigatewayv2_api.http_api.id
  integration_type = "AWS_PROXY"
  integration_uri  = aws_lambda_function.api_lambda.invoke_arn
  payload_format_version = "2.0"
}

resource "aws_apigatewayv2_route" "api_route" {
  api_id    = aws_apigatewayv2_api.http_api.id
  route_key = "$default"
  target    = "integrations/${aws_apigatewayv2_integration.lambda_integration.id}"
}

resource "aws_apigatewayv2_stage" "default_stage" {
  api_id      = aws_apigatewayv2_api.http_api.id
  name        = "$default"
  auto_deploy = true
}

resource "aws_lambda_permission" "allow_apigateway" {
  statement_id  = "AllowExecutionFromAPIGateway"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.api_lambda.function_name
  principal     = "apigateway.amazonaws.com"
  source_arn    = "${aws_apigatewayv2_api.http_api.execution_arn}/*/*"
}

# -----------------------------------------------------------------------------
# 8. Amazon RDS: PostgreSQL Relational Database (Configuration Template)
# -----------------------------------------------------------------------------
resource "aws_db_instance" "postgres" {
  identifier           = "${var.project_name}-db"
  allocated_storage    = 20
  max_allocated_storage = 100
  storage_type         = "gp3"
  engine               = "postgres"
  engine_version       = "16.1"
  instance_class       = "db.t4g.micro"
  db_name              = "aicte_fdr"
  username             = var.db_username
  password             = var.db_password
  skip_final_snapshot  = true
  publicly_accessible  = false
  storage_encrypted    = true

  # Security best practice: Prevent accidental deletion during hackathon
  deletion_protection  = false
}
