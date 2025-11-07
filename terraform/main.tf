terraform {
  required_version = ">= 1.0"

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }

  # S3 backend for state management (uncomment after creating S3 bucket)
  # backend "s3" {
  #   bucket         = "korean-agri-shop-terraform-state"
  #   key            = "prod/terraform.tfstate"
  #   region         = "ap-northeast-2"
  #   dynamodb_table = "terraform-state-lock"
  #   encrypt        = true
  # }
}

provider "aws" {
  region = var.aws_region

  default_tags {
    tags = {
      Project     = "korean-agri-shop"
      Environment = var.environment
      ManagedBy   = "Terraform"
    }
  }
}
