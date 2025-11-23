terraform {
  required_providers {
    aws = {
      source = "hashicorp/aws"
    }
  }
}

variable "region" {
  type = string
}

variable "function_zip" {
  type = string
}

variable "source_code_hash" {
  type = string
}

variable "iam_role_arn" {
  type = string
}

resource "aws_lambda_function" "zd-check-http-endpoint" {
  filename         = var.function_zip
  function_name    = "zd-check-http-endpoint"
  role             = var.iam_role_arn
  handler          = "index.handler"
  source_code_hash = var.source_code_hash
  runtime          = "nodejs24.x"

  environment {
    variables = {
      ENVIRONMENT = "production"
      LOG_LEVEL   = "info"
      REGION      = var.region
    }
  }

  tags = {
    Environment = "production"
    Application = "zd-check-http-endpoint"
    Region      = var.region
  }
}

output "lambda_arn" {
  value = aws_lambda_function.zd-check-http-endpoint.arn
}
