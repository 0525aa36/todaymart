import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { HelpCircle, MessageSquare, Bell, Search } from "lucide-react"
import Link from "next/link"

export default function HelpCenterPage() {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />

      <main className="flex-1 bg-gradient-to-b from-background to-muted">
        {/* Hero Section */}
        <div className="bg-primary text-primary-foreground py-16">
          <div className="container mx-auto px-4 text-center">
            <h1 className="text-4xl font-bold mb-4">무엇을 도와드릴까요?</h1>
            <p className="text-lg mb-8 opacity-90">
              자주 묻는 질문과 공지사항을 확인하거나 1:1 문의를 남겨주세요
            </p>
            <div className="max-w-2xl mx-auto">
              <div className="relative">
                <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-muted-foreground" />
                <input
                  type="text"
                  placeholder="궁금한 내용을 검색해보세요"
                  className="w-full pl-12 pr-4 py-4 rounded-lg text-foreground"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="container mx-auto px-4 py-12">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
            {/* FAQ 카드 */}
            <Card className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-center justify-between mb-4">
                  <div className="bg-blue-100 p-3 rounded-full">
                    <HelpCircle className="h-6 w-6 text-blue-600" />
                  </div>
                </div>
                <CardTitle>자주 묻는 질문</CardTitle>
                <CardDescription>
                  가장 많이 묻는 질문과 답변을 확인하세요
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Link href="/help/faq">
                  <Button className="w-full" variant="outline">
                    FAQ 보기
                  </Button>
                </Link>
              </CardContent>
            </Card>

            {/* 공지사항 카드 */}
            <Card className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-center justify-between mb-4">
                  <div className="bg-green-100 p-3 rounded-full">
                    <Bell className="h-6 w-6 text-green-600" />
                  </div>
                </div>
                <CardTitle>공지사항</CardTitle>
                <CardDescription>
                  오늘마트의 새로운 소식을 확인하세요
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Link href="/help/notices">
                  <Button className="w-full" variant="outline">
                    공지사항 보기
                  </Button>
                </Link>
              </CardContent>
            </Card>

            {/* 1:1 문의 카드 */}
            <Card className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-center justify-between mb-4">
                  <div className="bg-orange-100 p-3 rounded-full">
                    <MessageSquare className="h-6 w-6 text-orange-600" />
                  </div>
                </div>
                <CardTitle>1:1 문의</CardTitle>
                <CardDescription>
                  궁금한 점을 직접 문의해주세요
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Link href="/mypage/inquiries">
                  <Button className="w-full">
                    문의하기
                  </Button>
                </Link>
              </CardContent>
            </Card>
          </div>

          {/* Quick Links */}
          <div className="bg-white rounded-lg p-8 shadow">
            <h2 className="text-2xl font-bold mb-6">빠른 도움말</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Link href="/help/faq?category=ORDER_DELIVERY" className="p-4 border rounded-lg hover:bg-muted transition-colors">
                <h3 className="font-semibold mb-1">주문/배송</h3>
                <p className="text-sm text-muted-foreground">주문 방법, 배송 조회, 배송 기간 등</p>
              </Link>
              <Link href="/help/faq?category=PAYMENT" className="p-4 border rounded-lg hover:bg-muted transition-colors">
                <h3 className="font-semibold mb-1">결제</h3>
                <p className="text-sm text-muted-foreground">결제 수단, 영수증 발행, 할인 쿠폰 등</p>
              </Link>
              <Link href="/help/faq?category=CANCEL_REFUND" className="p-4 border rounded-lg hover:bg-muted transition-colors">
                <h3 className="font-semibold mb-1">취소/환불</h3>
                <p className="text-sm text-muted-foreground">주문 취소, 반품, 환불 절차 등</p>
              </Link>
              <Link href="/help/faq?category=MEMBER" className="p-4 border rounded-lg hover:bg-muted transition-colors">
                <h3 className="font-semibold mb-1">회원</h3>
                <p className="text-sm text-muted-foreground">회원가입, 정보 수정, 탈퇴 등</p>
              </Link>
            </div>
          </div>

          {/* Contact Info */}
          <div className="mt-12 bg-muted rounded-lg p-8">
            <div className="text-center">
              <h2 className="text-2xl font-bold mb-4">추가 도움이 필요하신가요?</h2>
              <p className="text-muted-foreground mb-6">
                고객센터로 직접 문의해주세요
              </p>
              <div className="flex flex-col md:flex-row gap-4 justify-center items-center">
                <div className="text-center">
                  <p className="text-sm text-muted-foreground">이메일</p>
                  <p className="font-semibold">help.todaymart@gmail.com</p>
                </div>
                <div className="hidden md:block h-8 w-px bg-border"></div>
                <div className="text-center">
                  <p className="text-sm text-muted-foreground">운영시간</p>
                  <p className="font-semibold">평일 09:00 - 18:00</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  )
}
