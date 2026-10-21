variable "aws_region" {
  description = "Target AWS Region (Selected Region)"
  type        = string
  default     = "ap-southeast-2"
}

variable "project_name" {
  description = "Project Name identifier"
  type        = string
  default     = "aicte-fdr-portal"
}

variable "environment" {
  description = "Deployment environment"
  type        = string
  default     = "production"
}

variable "db_username" {
  description = "RDS PostgreSQL master username"
  type        = string
  default     = "aicte_admin"
  sensitive   = true
}

variable "db_password" {
  description = "RDS PostgreSQL master password"
  type        = string
  default     = "AicteSecurePass2026!"
  sensitive   = true
}
