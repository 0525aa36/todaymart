'use client'

import { useState } from 'react'
import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { ChevronRight } from "lucide-react"
import Link from "next/link"
import { COLORS } from "@/lib/colors"

type MenuItem = 'notices' | 'faq' | 'inquiries' | 'bulk-inquiry'

export default function HelpCenterPage() {
  const [activeMenu, setActiveMenu] = useState<MenuItem>('inquiries')

  const menuItems = [
    { id: 'notices' as MenuItem, label: '공지사항', href: '/help/notices' },
    { id: 'faq' as MenuItem, label: '자주하는 질문', href: '/help/faq' },
    { id: 'inquiries' as MenuItem, label: '1:1 문의', href: '/mypage/inquiries' },
    { id: 'bulk-inquiry' as MenuItem, label: '대량 주문 문의', subtitle: '1:1 문의하기' },
  ]

  return (
    <div className="min-h-screen flex flex-col bg-white">
      <Header />

      <main className="flex-1">
        {/* 페이지 타이틀 */}
        <div className="border-b bg-white">
          <div className="container mx-auto px-4 max-w-6xl py-8">
            <h1 className="text-3xl font-bold">고객센터</h1>
          </div>
        </div>

        {/* 메인 컨텐츠 */}
        <div className="container mx-auto px-4 max-w-6xl py-8">
          <div className="flex gap-8">
            {/* 좌측 사이드바 */}
            <aside className="w-64 flex-shrink-0">
              <nav className="space-y-1">
                {menuItems.map((item) => {
                  const isActive = activeMenu === item.id
                  const isLink = !!item.href

                  const content = (
                    <div
                      className={`
                        flex items-center justify-between px-4 py-4 rounded-lg cursor-pointer transition-all
                        ${isActive
                          ? 'bg-purple-50 border-l-4 border-purple-600 font-semibold text-purple-600'
                          : 'hover:bg-gray-50 border-l-4 border-transparent text-gray-700'
                        }
                      `}
                      onClick={() => setActiveMenu(item.id)}
                    >
                      <div>
                        <div className={isActive ? 'text-purple-600' : 'text-gray-900'}>
                          {item.label}
                        </div>
                        {item.subtitle && (
                          <div className="text-xs text-gray-500 mt-1">{item.subtitle}</div>
                        )}
                      </div>
                      <ChevronRight className={`h-5 w-5 ${isActive ? 'text-purple-600' : 'text-gray-400'}`} />
                    </div>
                  )

                  return isLink ? (
                    <Link key={item.id} href={item.href}>
                      {content}
                    </Link>
                  ) : (
                    <div key={item.id}>{content}</div>
                  )
                })}
              </nav>

              {/* 도움이 필요하신가요? */}
              <div className="mt-8 p-6 bg-gray-50 rounded-lg">
                <h3 className="font-semibold mb-3 text-sm">도움이 필요하신가요 ?</h3>
                <Link href="/mypage/inquiries">
                  <div className="text-sm text-purple-600 hover:text-purple-700 cursor-pointer flex items-center">
                    1:1 문의하기
                    <ChevronRight className="h-4 w-4 ml-1" />
                  </div>
                </Link>
              </div>
            </aside>

            {/* 우측 컨텐츠 영역 */}
            <div className="flex-1">
              {activeMenu === 'notices' && (
                <div>
                  <h2 className="text-2xl font-bold mb-6">공지사항</h2>
                  <div className="border rounded-lg">
                    <div className="bg-gray-50 px-6 py-4 border-b flex items-center">
                      <div className="flex-1 text-center font-semibold">제목</div>
                      <div className="w-32 text-center font-semibold">작성일</div>
                    </div>
                    <div className="p-12 text-center text-gray-500">
                      게시글이 없습니다.
                    </div>
                  </div>
                </div>
              )}

              {activeMenu === 'faq' && (
                <div>
                  <h2 className="text-2xl font-bold mb-6">자주하는 질문</h2>
                  <div className="border rounded-lg">
                    <div className="bg-gray-50 px-6 py-4 border-b flex items-center">
                      <div className="flex-1 text-center font-semibold">제목</div>
                      <div className="w-32 text-center font-semibold">카테고리</div>
                    </div>
                    <div className="p-12 text-center text-gray-500">
                      게시글이 없습니다.
                    </div>
                  </div>
                </div>
              )}

              {activeMenu === 'inquiries' && (
                <div>
                  <h2 className="text-2xl font-bold mb-6">1:1 문의</h2>
                  <div className="border rounded-lg">
                    <div className="bg-gray-50 px-6 py-4 border-b">
                      <div className="flex items-center">
                        <div className="flex-1 text-center font-semibold">제목</div>
                        <div className="w-32 text-center font-semibold">작성일</div>
                        <div className="w-32 text-center font-semibold">답변상태</div>
                      </div>
                    </div>
                    <div className="p-12 text-center text-gray-500">
                      게시글이 없습니다.
                    </div>
                  </div>

                  {/* 문의하기 버튼 */}
                  <div className="flex justify-end mt-6">
                    <Link href="/mypage/inquiries">
                      <button
                        className="px-8 py-3 text-white rounded-lg font-semibold hover:opacity-90 transition-opacity"
                        style={{ backgroundColor: '#7C3AED' }}
                      >
                        문의하기
                      </button>
                    </Link>
                  </div>
                </div>
              )}

              {activeMenu === 'bulk-inquiry' && (
                <div>
                  <h2 className="text-2xl font-bold mb-6">대량 주문 문의</h2>
                  <div className="border rounded-lg p-8">
                    <div className="text-center space-y-4">
                      <p className="text-gray-600">
                        대량 주문이 필요하신가요?
                      </p>
                      <p className="text-gray-600">
                        1:1 문의를 통해 상담받으실 수 있습니다.
                      </p>
                      <Link href="/mypage/inquiries">
                        <button
                          className="mt-4 px-8 py-3 text-white rounded-lg font-semibold hover:opacity-90 transition-opacity"
                          style={{ backgroundColor: '#7C3AED' }}
                        >
                          1:1 문의하기
                        </button>
                      </Link>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  )
}
