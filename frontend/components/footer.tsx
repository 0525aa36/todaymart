import Link from 'next/link';
import { Phone, Mail, MessageCircle, Clock } from 'lucide-react';
import { Button } from './ui/button';

export function Footer() {
  return (
    <footer className="border-t bg-background mt-20">
      <div className="container mx-auto px-4 py-16 max-w-7xl">
        {/* 상단: 고객센터 및 빠른 링크 */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-12">
          {/* 고객센터 */}
          <div>
            <h3 className="text-sm font-semibold mb-4 text-foreground/70">고객센터</h3>
            <div className="space-y-3">
              <a
                href="tel:1644-1473"
                className="text-4xl font-bold hover:text-primary transition-colors flex items-center gap-2"
              >
                <Phone className="h-8 w-8" />
                1644-1473
              </a>
              <div className="text-sm text-muted-foreground flex items-start gap-2">
                <Clock className="h-4 w-4 mt-0.5 flex-shrink-0" />
                <div>
                  <p>월~토 09:00 - 18:00</p>
                  <p>일요일 및 공휴일 휴무</p>
                </div>
              </div>
            </div>
          </div>

          {/* 고객지원 */}
          <div>
            <h3 className="text-sm font-semibold mb-4 text-foreground/70">고객지원</h3>
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <MessageCircle className="h-4 w-4 flex-shrink-0" />
                <Link href="/help" className="hover:text-primary transition-colors">
                  1:1 문의
                </Link>
              </div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Mail className="h-4 w-4 flex-shrink-0" />
                <a href="mailto:help.todaymart@gmail.com" className="hover:text-primary transition-colors">
                  help.todaymart@gmail.com
                </a>
              </div>
            </div>
          </div>

          {/* SNS */}
          <div>
            <h3 className="text-sm font-semibold mb-4 text-foreground/70">소셜 미디어</h3>
            <div className="flex gap-3">
              <a
                href="https://www.instagram.com/todaymart_?igsh=ZG5iZXNmZ3VkOHBr&utm_source=qr"
                target="_blank"
                rel="noopener noreferrer"
                className="w-9 h-9 rounded-full bg-gradient-to-br from-purple-600 via-pink-600 to-orange-500 flex items-center justify-center text-white hover:scale-110 transition-transform"
                aria-label="Instagram"
              >
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
                </svg>
              </a>
              <a
                href="https://band.us/@todaymart"
                target="_blank"
                rel="noopener noreferrer"
                className="w-9 h-9 rounded-full overflow-hidden hover:scale-110 transition-transform"
                aria-label="네이버 밴드"
              >
                <img
                  src="https://www.band.us/favicon.ico"
                  alt="네이버 밴드"
                  className="w-full h-full object-cover"
                />
              </a>
              <a
                href="https://pf.kakao.com/_xlTLHn"
                target="_blank"
                rel="noopener noreferrer"
                className="w-9 h-9 rounded-full bg-[#FEE500] flex items-center justify-center text-[#000000] hover:scale-110 transition-transform"
                aria-label="카카오톡 채널"
              >
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 3c5.799 0 10.5 3.664 10.5 8.185 0 4.52-4.701 8.184-10.5 8.184a13.5 13.5 0 0 1-1.727-.11l-4.408 2.883c-.501.265-.678.236-.472-.413l.892-3.678c-2.88-1.46-4.785-3.99-4.785-6.866C1.5 6.665 6.201 3 12 3z"/>
                </svg>
              </a>
            </div>
          </div>
        </div>

        {/* 구분선 */}
        <div className="border-t mb-8"></div>

        {/* 하단: 회사 정보 및 링크 */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* 링크 메뉴 */}
          <div className="flex flex-wrap gap-x-4 gap-y-2 text-sm items-center">
            <Link href="/terms" className="hover:text-primary transition-colors text-muted-foreground">
              이용약관
            </Link>
            <span className="text-muted-foreground/40">|</span>
            <Link href="/privacy" className="hover:text-primary transition-colors font-semibold text-foreground">
              개인정보처리방침
            </Link>
            <span className="text-muted-foreground/40">|</span>
            <Link href="/help#notice" className="hover:text-primary transition-colors text-muted-foreground">
              공지사항
            </Link>
            <span className="text-muted-foreground/40">|</span>
            <a
              href="https://docs.google.com/forms/d/e/1FAIpQLSexcw4nqKGUU_LYIb1E_wmsmAskANlNz81st-nVyXG6n97BVg/viewform?usp=header"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-primary transition-colors text-muted-foreground"
            >
              입점문의
            </a>
          </div>

          {/* 회사 정보 */}
          <div className="text-xs text-muted-foreground space-y-1.5 lg:text-right">
            <p>
              상호: KROOTS · 대표: 고현진 · 사업자등록번호: 380-11-03350
            </p>
            <p>
              통신판매업: 2025-경기송탄-0986 · 주소: 경기도 평택시 고덕국제5로 160
            </p>
            <p className="pt-2 text-muted-foreground/70">
              © 2025 오늘마트. All rights reserved.
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}
