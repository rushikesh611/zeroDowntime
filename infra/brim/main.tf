# Define a provider for each region
provider "aws" {
  alias  = "ap-south-1"
  region = "ap-south-1"
}

provider "aws" {
  alias  = "us-east-1"
  region = "us-east-1"
}

provider "aws" {
  alias  = "eu-west-1"
  region = "eu-west-1"
}

# Global IAM role 
data "aws_iam_policy_document" "assume_role" {
  statement {
    effect = "Allow"
    principals {
      type        = "Service"
      identifiers = ["lambda.amazonaws.com"]
    }
    actions = ["sts:AssumeRole"]
  }
}

resource "aws_iam_role" "zd-lambda-role" {
  provider           = aws.ap-south-1 # Create in one region
  name               = "lambda_execution_role"
  assume_role_policy = data.aws_iam_policy_document.assume_role.json
}

# Package Lambda code once
data "archive_file" "example" {
  type        = "zip"
  source_file = "${path.module}/../../monitor-lambda/dist/index.js"
  output_path = "${path.module}/function.zip"
}

locals {
  function_zip     = data.archive_file.example.output_path
  source_code_hash = data.archive_file.example.output_base64sha256
  iam_role_arn     = aws_iam_role.zd-lambda-role.arn
}

# Deploy to ap-south-1
module "monitor_lambda_ap_south_1" {
  source = "./modules/monitor_lambda"

  providers = {
    aws = aws.ap-south-1
  }

  region           = "ap-south-1"
  function_zip     = local.function_zip
  source_code_hash = local.source_code_hash
  iam_role_arn     = local.iam_role_arn
}

# Deploy to us-east-1
module "monitor_lambda_us_east_1" {
  source = "./modules/monitor_lambda"

  providers = {
    aws = aws.us-east-1
  }

  region           = "us-east-1"
  function_zip     = local.function_zip
  source_code_hash = local.source_code_hash
  iam_role_arn     = local.iam_role_arn
}

# Deploy to eu-west-1
module "monitor_lambda_eu_west_1" {
  source = "./modules/monitor_lambda"

  providers = {
    aws = aws.eu-west-1
  }

  region           = "eu-west-1"
  function_zip     = local.function_zip
  source_code_hash = local.source_code_hash
  iam_role_arn     = local.iam_role_arn
}
