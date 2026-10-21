output "s3_bucket_name" {
  description = "Private S3 bucket name for FDR documents"
  value       = aws_s3_bucket.fdr_documents.id
}

output "api_gateway_endpoint" {
  description = "HTTP API Gateway Invocation URL"
  value       = aws_apigatewayv2_api.http_api.api_endpoint
}

output "cognito_user_pool_id" {
  description = "Cognito User Pool ID"
  value       = aws_cognito_user_pool.fdr_users.id
}

output "cognito_client_id" {
  description = "Cognito Client ID"
  value       = aws_cognito_user_pool_client.fdr_client.id
}

output "sns_topic_arn" {
  description = "SNS Alerts Topic ARN"
  value       = aws_sns_topic.fdr_alerts.arn
}

output "rds_endpoint" {
  description = "PostgreSQL RDS Database Endpoint"
  value       = aws_db_instance.postgres.endpoint
}
