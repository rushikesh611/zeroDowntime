provider "aws" {
  region = "ap-south-1"
}

# State Bucket
resource "aws_s3_bucket" "tf-state-bucket" {
  bucket = "zd-terraform-state-bucket"
}

# resource "aws_dynamodb_table" "terraform_lock" {
#   name         = "terraform-lock"
#   billing_mode = "PAY_PER_REQUEST"
#   hash_key     = "LockID"

#   attribute {
#     name = "LockID"
#     type = "S"
#   }
# }
