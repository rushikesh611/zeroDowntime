provider "aws" {
  region = "us-east-1"
}

data "aws_vpc" "default" {
  default = true
}

resource "aws_security_group" "beacn-production-jett-sg" {
  name        = "beacn-production-jett-sg"
  description = "Security group for beacn production jett"
  vpc_id      = data.aws_vpc.default.id

  ingress {
    description = "HTTP from anywhere"
    from_port   = 80
    to_port     = 80
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  ingress {
    description = "HTTPS from anywhere"
    from_port   = 443
    to_port     = 443
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  ingress {
    description = "SSH from anywhere"
    from_port   = 22
    to_port     = 22
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  egress {
    description = "Allow all outbound traffic"
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = {
    Name = "beacn-production-jett-sg"
  }
}


resource "aws_instance" "beacn-production-jett" {
  ami           = "ami-0ecb62995f68bb549"
  instance_type = "t3.small"
  key_name      = "zd-prod"

  vpc_security_group_ids = [aws_security_group.beacn-production-jett-sg.id]

  tags = {
    Name = "beacn-production-jett"
  }
}


output "instance_public_ip" {
  value       = aws_instance.beacn-production-jett.public_ip
  description = "Public IP of the EC2 instance"
}
