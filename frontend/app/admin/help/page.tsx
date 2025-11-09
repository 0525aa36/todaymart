'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { HelpCircle, MessageSquare, Bell, ChevronRight } from "lucide-react"
import Link from "next/link"

export default function AdminHelpCenterPage() {
  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">고객센터 관리</h1>
        <p className="text-muted-foreground mt-2">
          FAQ, 공지사항, 1:1 문의를 관리합니다
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* FAQ 관리 카드 */}
        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader>
            <div className="flex items-center justify-between">
              <HelpCircle className="h-10 w-10 text-blue-600" />
              <ChevronRight className="h-5 w-5 text-muted-foreground" />
            </div>
            <CardTitle className="mt-4">자주 묻는 질문</CardTitle>
            <CardDescription>
              카테고리별 FAQ를 관리하고 순서를 조정합니다
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Link href="/admin/help/faq">
              <Button className="w-full">
                FAQ 관리하기
              </Button>
            </Link>
          </CardContent>
        </Card>

        {/* 공지사항 관리 카드 */}
        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader>
            <div className="flex items-center justify-between">
              <Bell className="h-10 w-10 text-green-600" />
              <ChevronRight className="h-5 w-5 text-muted-foreground" />
            </div>
            <CardTitle className="mt-4">공지사항</CardTitle>
            <CardDescription>
              공지사항을 작성하고 고정/팝업 설정을 관리합니다
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Link href="/admin/help/notices">
              <Button className="w-full">
                공지사항 관리하기
              </Button>
            </Link>
          </CardContent>
        </Card>

        {/* 1:1 문의 관리 카드 */}
        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader>
            <div className="flex items-center justify-between">
              <MessageSquare className="h-10 w-10 text-orange-600" />
              <ChevronRight className="h-5 w-5 text-muted-foreground" />
            </div>
            <CardTitle className="mt-4">1:1 문의</CardTitle>
            <CardDescription>
              고객 문의를 확인하고 답변을 작성합니다
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Link href="/admin/help/inquiries">
              <Button className="w-full">
                문의 관리하기
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>

      {/* 통계 요약 (추후 구현) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">활성 FAQ</CardTitle>
            <HelpCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">-</div>
            <p className="text-xs text-muted-foreground">
              총 FAQ 개수
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">공지사항</CardTitle>
            <Bell className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">-</div>
            <p className="text-xs text-muted-foreground">
              총 공지사항 개수
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">답변 대기 문의</CardTitle>
            <MessageSquare className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">-</div>
            <p className="text-xs text-muted-foreground">
              답변이 필요한 문의
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
