import Link from "next/link"

export function Footer() {
  return (
    <footer className="border-t bg-muted/30 mt-20">
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Company Info */}
          <div>
            <h3 className="font-bold text-lg mb-4">오늘마트</h3>
            <p className="text-sm text-muted-foreground leading-relaxed">
              농가와 소비자를 직접 연결하는
              <br />
              신선한 농수산물 쇼핑몰
            </p>
          </div>

          {/* Customer Service */}
          <div>
            <h4 className="font-semibold mb-4">고객센터</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>
                <Link href="/help" className="hover:text-foreground transition-colors">
                  자주 묻는 질문
                </Link>
              </li>
              <li>
                <Link href="/notice" className="hover:text-foreground transition-colors">
                  공지사항
                </Link>
              </li>
              <li>
                <Link href="/contact" className="hover:text-foreground transition-colors">
                  1:1 문의
                </Link>
              </li>
              <li className="pt-2">
                {/* <div className="font-semibold text-foreground">1588-0000</div>
                <div className="text-xs">평일 09:00 - 18:00</div> */}
              </li>
            </ul>
          </div>

          {/* Shopping Info */}
          <div>
            <h4 className="font-semibold mb-4">쇼핑 정보</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>
                <Link href="/guide/order" className="hover:text-foreground transition-colors">
                  주문/결제 안내
                </Link>
              </li>
              <li>
                <Link href="/guide/shipping" className="hover:text-foreground transition-colors">
                  배송 안내
                </Link>
              </li>
              <li>
                <Link href="/guide/return" className="hover:text-foreground transition-colors">
                  교환/반품 안내
                </Link>
              </li>
              <li>
                <Link href="/guide/refund" className="hover:text-foreground transition-colors">
                  환불 안내
                </Link>
              </li>
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h4 className="font-semibold mb-4">약관 및 정책</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>
                <Link href="/terms" className="hover:text-foreground transition-colors">
                  이용약관
                </Link>
              </li>
              <li>
                <Link href="/privacy" className="hover:text-foreground transition-colors font-semibold">
                  개인정보처리방침
                </Link>
              </li>
              <li>
                <Link href="/business" className="hover:text-foreground transition-colors">
                  사업자 정보
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom */}
        <div className="border-t mt-8 pt-8 text-sm text-muted-foreground">
          <p className="leading-relaxed">
            (주)오늘마트 | 대표이사: 고현진 | 사업자등록번호: 380-11-03350
            <br />
            {/* 통신판매업신고: 2024-서울강남-00000 | 주소: 서울특별시 강남구 테헤란로 123 */}
            <br />
            이메일: help.todaymart@gmail.com
          </p>
          <p className="mt-4">© 2025 오늘마트. All rights reserved.</p>
        </div>
      </div>
    </footer>
  )
}
