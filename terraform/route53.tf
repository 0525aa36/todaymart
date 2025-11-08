# Route 53 Hosted Zone
resource "aws_route53_zone" "main" {
  name = "todaymart.co.kr"

  tags = {
    Name = "${var.project_name}-hosted-zone"
  }
}

# ACM Certificate for CloudFront (must be in us-east-1)
provider "aws" {
  alias  = "us_east_1"
  region = "us-east-1"
}

resource "aws_acm_certificate" "cloudfront" {
  provider = aws.us_east_1

  domain_name               = "todaymart.co.kr"
  subject_alternative_names = ["*.todaymart.co.kr"]
  validation_method         = "DNS"

  lifecycle {
    create_before_destroy = true
  }

  tags = {
    Name = "${var.project_name}-cloudfront-cert"
  }
}

# DNS validation records for ACM
resource "aws_route53_record" "cert_validation" {
  for_each = {
    for dvo in aws_acm_certificate.cloudfront.domain_validation_options : dvo.domain_name => {
      name   = dvo.resource_record_name
      record = dvo.resource_record_value
      type   = dvo.resource_record_type
    }
  }

  allow_overwrite = true
  name            = each.value.name
  records         = [each.value.record]
  ttl             = 60
  type            = each.value.type
  zone_id         = aws_route53_zone.main.zone_id
}

# ACM certificate validation
resource "aws_acm_certificate_validation" "cloudfront" {
  provider = aws.us_east_1

  certificate_arn         = aws_acm_certificate.cloudfront.arn
  validation_record_fqdns = [for record in aws_route53_record.cert_validation : record.fqdn]
}

# ACM Certificate for ALB (ap-northeast-2)
resource "aws_acm_certificate" "alb" {
  domain_name               = "api.todaymart.co.kr"
  validation_method         = "DNS"

  lifecycle {
    create_before_destroy = true
  }

  tags = {
    Name = "${var.project_name}-alb-cert"
  }
}

# DNS validation for ALB certificate
resource "aws_route53_record" "alb_cert_validation" {
  for_each = {
    for dvo in aws_acm_certificate.alb.domain_validation_options : dvo.domain_name => {
      name   = dvo.resource_record_name
      record = dvo.resource_record_value
      type   = dvo.resource_record_type
    }
  }

  allow_overwrite = true
  name            = each.value.name
  records         = [each.value.record]
  ttl             = 60
  type            = each.value.type
  zone_id         = aws_route53_zone.main.zone_id
}

resource "aws_acm_certificate_validation" "alb" {
  certificate_arn         = aws_acm_certificate.alb.arn
  validation_record_fqdns = [for record in aws_route53_record.alb_cert_validation : record.fqdn]
}

# Route 53 Records
# A record for root domain -> Amplify (will be added manually or via Amplify)
# Note: Amplify custom domain setup requires manual steps

# A record for API subdomain -> CloudFront
resource "aws_route53_record" "api" {
  zone_id = aws_route53_zone.main.zone_id
  name    = "api.todaymart.co.kr"
  type    = "A"

  alias {
    name                   = aws_cloudfront_distribution.backend_api.domain_name
    zone_id                = aws_cloudfront_distribution.backend_api.hosted_zone_id
    evaluate_target_health = false
  }
}

# Outputs
output "route53_name_servers" {
  description = "가비아에 설정할 네임서버 (Name Servers)"
  value       = aws_route53_zone.main.name_servers
}

output "route53_zone_id" {
  description = "Route 53 Hosted Zone ID"
  value       = aws_route53_zone.main.zone_id
}

output "acm_certificate_cloudfront_arn" {
  description = "CloudFront ACM Certificate ARN (us-east-1)"
  value       = aws_acm_certificate.cloudfront.arn
}

output "acm_certificate_alb_arn" {
  description = "ALB ACM Certificate ARN (ap-northeast-2)"
  value       = aws_acm_certificate.alb.arn
}

output "domain_setup_instructions" {
  description = "도메인 설정 안내"
  value = <<-EOT

  ============================================
  도메인 설정 단계:
  ============================================

  1. 가비아 관리 콘솔 접속
     - https://domain.gabia.com

  2. 네임서버 변경
     - todaymart.co.kr 도메인 선택
     - 네임서버 설정 클릭
     - 아래 네임서버로 변경:
       ${join("\n       ", aws_route53_zone.main.name_servers)}

  3. Amplify 커스텀 도메인 설정
     - AWS Amplify Console 접속
     - 앱 선택 → Domain management
     - Add domain 클릭
     - Domain: todaymart.co.kr 입력
     - ACM Certificate: 자동으로 생성됨

  4. CloudFront에 커스텀 도메인 적용 (자동 적용됨)
     - api.todaymart.co.kr → CloudFront

  5. 전파 대기 (24-48시간)
     - DNS 변경이 전파되는 데 시간이 걸립니다

  ============================================
  최종 도메인:
  ============================================
  - https://todaymart.co.kr → 프론트엔드
  - https://www.todaymart.co.kr → 프론트엔드
  - https://api.todaymart.co.kr → 백엔드 API

  EOT
}
