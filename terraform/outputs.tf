# VPC Outputs
output "vpc_id" {
  description = "VPC ID"
  value       = aws_vpc.main.id
}

output "public_subnet_ids" {
  description = "Public subnet IDs"
  value       = aws_subnet.public[*].id
}

output "private_subnet_ids" {
  description = "Private subnet IDs"
  value       = aws_subnet.private[*].id
}

# RDS Outputs
output "rds_endpoint" {
  description = "RDS instance endpoint"
  value       = aws_db_instance.main.endpoint
}

output "rds_address" {
  description = "RDS instance address"
  value       = aws_db_instance.main.address
}

output "rds_secrets_arn" {
  description = "ARN of RDS credentials secret"
  value       = aws_secretsmanager_secret.rds_credentials.arn
}

# S3 Outputs
output "s3_bucket_name" {
  description = "S3 bucket name for uploads"
  value       = aws_s3_bucket.uploads.bucket
}

output "s3_bucket_arn" {
  description = "S3 bucket ARN"
  value       = aws_s3_bucket.uploads.arn
}

# ECR Outputs
output "ecr_repository_url" {
  description = "ECR repository URL for backend"
  value       = aws_ecr_repository.backend.repository_url
}

# ALB Outputs
output "alb_dns_name" {
  description = "DNS name of Application Load Balancer"
  value       = aws_lb.main.dns_name
}

output "alb_zone_id" {
  description = "Zone ID of Application Load Balancer (for Route 53)"
  value       = aws_lb.main.zone_id
}

output "alb_arn" {
  description = "ARN of Application Load Balancer"
  value       = aws_lb.main.arn
}

# ECS Outputs
output "ecs_cluster_name" {
  description = "ECS cluster name"
  value       = aws_ecs_cluster.main.name
}

output "ecs_cluster_arn" {
  description = "ECS cluster ARN"
  value       = aws_ecs_cluster.main.arn
}

output "ecs_service_name" {
  description = "ECS service name"
  value       = aws_ecs_service.backend.name
}

output "ecs_task_definition_family" {
  description = "ECS task definition family"
  value       = aws_ecs_task_definition.backend.family
}

# CloudWatch Outputs
output "cloudwatch_log_group_name" {
  description = "CloudWatch log group name for backend"
  value       = aws_cloudwatch_log_group.backend.name
}

# Application URL
output "application_url" {
  description = "Application URL"
  value       = var.domain_name != "" ? "https://${var.domain_name}" : "http://${aws_lb.main.dns_name}"
}

# Deployment Information
output "deployment_info" {
  description = "Deployment information"
  value = {
    ecr_repository = aws_ecr_repository.backend.repository_url
    ecs_cluster    = aws_ecs_cluster.main.name
    ecs_service    = aws_ecs_service.backend.name
    alb_url        = "http://${aws_lb.main.dns_name}"
  }
}
