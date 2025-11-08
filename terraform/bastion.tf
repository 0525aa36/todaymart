# Bastion Host for RDS Access

# Key Pair (사용자가 이미 가지고 있는 키 사용 또는 새로 생성)
resource "aws_key_pair" "bastion" {
  key_name   = "${var.project_name}-bastion-key"
  public_key = file("~/.ssh/id_rsa.pub") # 로컬 SSH 공개키 사용
}

# Bastion Security Group
resource "aws_security_group" "bastion" {
  name        = "${var.project_name}-bastion-sg"
  description = "Security group for bastion host"
  vpc_id      = aws_vpc.main.id

  # SSH from your IP
  ingress {
    from_port   = 22
    to_port     = 22
    protocol    = "tcp"
    cidr_blocks = ["121.166.94.242/32"] # 사용자 IP
  }

  # Allow all outbound
  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = {
    Name = "${var.project_name}-bastion-sg"
  }
}

# Update RDS Security Group to allow from Bastion
resource "aws_security_group_rule" "rds_from_bastion" {
  type                     = "ingress"
  from_port                = 3306
  to_port                  = 3306
  protocol                 = "tcp"
  source_security_group_id = aws_security_group.bastion.id
  security_group_id        = aws_security_group.rds.id
}

# Get latest Amazon Linux 2023 AMI
data "aws_ami" "amazon_linux_2023" {
  most_recent = true
  owners      = ["amazon"]

  filter {
    name   = "name"
    values = ["al2023-ami-*-x86_64"]
  }

  filter {
    name   = "virtualization-type"
    values = ["hvm"]
  }
}

# Bastion Host EC2 Instance (t3.nano - 가장 저렴)
resource "aws_instance" "bastion" {
  ami           = data.aws_ami.amazon_linux_2023.id
  instance_type = "t3.nano"
  key_name      = aws_key_pair.bastion.key_name

  subnet_id                   = aws_subnet.public[0].id
  vpc_security_group_ids      = [aws_security_group.bastion.id]
  associate_public_ip_address = true

  user_data = <<-EOF
              #!/bin/bash
              yum update -y
              yum install -y mysql
              EOF

  tags = {
    Name = "${var.project_name}-bastion"
  }
}

# Outputs
output "bastion_public_ip" {
  description = "Bastion host public IP"
  value       = aws_instance.bastion.public_ip
}

output "bastion_ssh_command" {
  description = "SSH command to connect to bastion"
  value       = "ssh -i ~/.ssh/id_rsa ec2-user@${aws_instance.bastion.public_ip}"
}

output "mysql_workbench_ssh_tunnel" {
  description = "MySQL Workbench SSH 터널 설정"
  value = {
    ssh_hostname = aws_instance.bastion.public_ip
    ssh_username = "ec2-user"
    ssh_key_file = "~/.ssh/id_rsa"
    mysql_hostname = aws_db_instance.main.address
    mysql_port = 3306
  }
}
