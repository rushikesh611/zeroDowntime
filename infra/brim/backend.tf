terraform {
  backend "s3" {
    bucket = "zd-terraform-state-bucket"
    key    = "zd/brim/terraform.tfstate"
    region = "ap-south-1"
    # dynamodb_table = "terraform-lock"
  }
}
