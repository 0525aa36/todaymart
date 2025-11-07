# CloudFront Distribution for Backend API (HTTPS support)
resource "aws_cloudfront_distribution" "backend_api" {
  enabled             = true
  comment             = "Backend API CloudFront Distribution"
  price_class         = "PriceClass_200" # US, Europe, Asia, Middle East, and Africa
  http_version        = "http2and3"
  is_ipv6_enabled     = true

  origin {
    domain_name = aws_lb.main.dns_name
    origin_id   = "backend-alb"

    custom_origin_config {
      http_port              = 80
      https_port             = 443
      origin_protocol_policy = "http-only"
      origin_ssl_protocols   = ["TLSv1.2"]
    }
  }

  default_cache_behavior {
    target_origin_id       = "backend-alb"
    viewer_protocol_policy = "redirect-to-https"
    allowed_methods        = ["DELETE", "GET", "HEAD", "OPTIONS", "PATCH", "POST", "PUT"]
    cached_methods         = ["GET", "HEAD", "OPTIONS"]
    compress               = true

    forwarded_values {
      query_string = true
      headers      = ["Authorization", "Accept", "Content-Type", "Origin"]

      cookies {
        forward = "all"
      }
    }

    min_ttl     = 0
    default_ttl = 0
    max_ttl     = 0
  }

  restrictions {
    geo_restriction {
      restriction_type = "none"
    }
  }

  viewer_certificate {
    cloudfront_default_certificate = true
  }

  tags = {
    Name = "${var.project_name}-backend-cloudfront"
  }
}

# Output CloudFront URL
output "cloudfront_domain_name" {
  description = "CloudFront distribution domain name"
  value       = aws_cloudfront_distribution.backend_api.domain_name
}

output "cloudfront_url" {
  description = "CloudFront HTTPS URL for backend API"
  value       = "https://${aws_cloudfront_distribution.backend_api.domain_name}"
}
