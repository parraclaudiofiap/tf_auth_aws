terraform {
  backend "s3" {
    bucket = "fiapterraform"
    key    = "cognito/terraform.tfstate"
    region = "us-east-1"
  }
}

provider "aws" {
  //profile = "default"
  region  = var.aws_region_default
}
