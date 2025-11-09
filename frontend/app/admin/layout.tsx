'use client'

import { useRouter, usePathname } from 'next/navigation'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import NextImage from 'next/image'
import {
  LayoutDashboard,
  Package,
  ShoppingCart,
  Users,
  Store,
  Receipt,
  LogOut,
  Menu,
  X,
  Image,
  HelpCircle,
  ChevronDown,
  ChevronRight,
  Ticket,
  MessageSquare,
  Bell,
  MessageCircle
} from 'lucide-react'
import { API_BASE_URL } from '@/lib/api-client'

interface MenuItem {
  icon: any
  label: string
  href?: string
  children?: MenuItem[]
}

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const router = useRouter()
  const pathname = usePathname()
  const [user, setUser] = useState<any>(null)
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [expandedMenus, setExpandedMenus] = useState<string[]>(['주문/배송', '상품', '고객센터'])

  useEffect(() => {
    const token = localStorage.getItem('token')
    if (!token) {
      router.push('/login')
      return
    }

    // 사용자 정보 확인
    fetch(`${API_BASE_URL}/api/auth/me`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    })
      .then(res => res.json())
      .then(data => {
        if (data.role !== 'ROLE_ADMIN') {
          alert('관리자 권한이 필요합니다.')
          router.push('/')
        } else {
          setUser(data)
        }
      })
      .catch(() => {
        router.push('/login')
      })
  }, [router])

  const handleLogout = () => {
    localStorage.removeItem('token')
    router.push('/login')
  }

  const toggleMenu = (label: string) => {
    setExpandedMenus(prev =>
      prev.includes(label)
        ? prev.filter(item => item !== label)
        : [...prev, label]
    )
  }

  const menuGroups: { label: string; items: MenuItem[] }[] = [
    {
      label: '주요 메뉴',
      items: [
        { icon: LayoutDashboard, label: '대시보드', href: '/admin' },
      ]
    },
    {
      label: '주문/배송',
      items: [
        { icon: ShoppingCart, label: '주문 관리', href: '/admin/orders' },
        { icon: Receipt, label: '정산 관리', href: '/admin/settlements' },
      ]
    },
    {
      label: '상품',
      items: [
        { icon: Package, label: '상품 관리', href: '/admin/products' },
        { icon: Store, label: '판매자 관리', href: '/admin/sellers' },
      ]
    },
    {
      label: '회원',
      items: [
        { icon: Users, label: '회원 관리', href: '/admin/users' },
      ]
    },
    {
      label: '마케팅',
      items: [
        { icon: Ticket, label: '쿠폰 관리', href: '/admin/coupons' },
        { icon: Image, label: '배너 관리', href: '/admin/banners' },
      ]
    },
    {
      label: '고객센터',
      items: [
        { icon: HelpCircle, label: '자주 묻는 질문', href: '/admin/help/faq' },
        { icon: Bell, label: '공지사항', href: '/admin/help/notices' },
        { icon: MessageCircle, label: '1:1문의 관리', href: '/admin/help/inquiries' },
      ]
    },
  ]

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">로딩 중...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 사이드바 */}
      <aside
        className={`fixed top-0 left-0 z-40 h-screen transition-transform ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        } bg-white border-r border-gray-200`}
        style={{ width: '260px' }}
      >
        <div className="h-full flex flex-col">
          {/* 로고 영역 */}
          <div className="flex items-center justify-between px-5 py-4 border-b border-gray-200">
            <Link href="/admin" className="flex items-center">
              <NextImage
                src="/logo_main.png"
                alt="오늘마트 로고"
                width={120}
                height={40}
                className="object-contain"
                unoptimized
              />
            </Link>
            <button
              onClick={() => setSidebarOpen(false)}
              className="lg:hidden text-gray-400 hover:text-gray-600"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* 메뉴 */}
          <nav className="flex-1 overflow-y-auto py-4">
            {menuGroups.map((group) => {
              const isExpanded = expandedMenus.includes(group.label)
              return (
                <div key={group.label} className="mb-1">
                  <button
                    onClick={() => toggleMenu(group.label)}
                    className="w-full flex items-center justify-between px-5 py-2 text-xs font-medium text-gray-500 hover:text-gray-700 uppercase tracking-wider"
                  >
                    <span>{group.label}</span>
                    {isExpanded ? (
                      <ChevronDown className="w-4 h-4" />
                    ) : (
                      <ChevronRight className="w-4 h-4" />
                    )}
                  </button>
                  {isExpanded && (
                    <ul className="mt-1 space-y-0.5">
                      {group.items.map((item) => {
                        const Icon = item.icon
                        const isActive = pathname === item.href
                        return (
                          <li key={item.label}>
                            <Link
                              href={item.href || '#'}
                              className={`flex items-center space-x-3 px-5 py-2.5 text-sm transition-colors ${
                                isActive
                                  ? 'bg-blue-50 text-blue-700 font-medium border-r-2 border-blue-700'
                                  : 'text-gray-700 hover:bg-gray-50'
                              }`}
                            >
                              <Icon className="w-4 h-4" />
                              <span>{item.label}</span>
                            </Link>
                          </li>
                        )
                      })}
                    </ul>
                  )}
                </div>
              )
            })}
          </nav>

          {/* 하단 사용자 정보 */}
          <div className="border-t border-gray-200 p-4">
            <div className="flex items-center space-x-3 px-2 py-2 mb-2">
              <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center">
                <span className="text-gray-600 font-medium text-sm">
                  {user.name?.charAt(0) || 'A'}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium text-gray-900 truncate">
                  {user.name || user.email}
                </p>
                <p className="text-xs text-gray-500 truncate">{user.email}</p>
              </div>
            </div>
            <Link
              href="/"
              className="flex items-center space-x-3 px-2 py-2 rounded text-sm text-gray-600 hover:bg-gray-50 mb-1"
            >
              <Store className="w-4 h-4" />
              <span>쇼핑몰로 이동</span>
            </Link>
            <button
              onClick={handleLogout}
              className="w-full flex items-center space-x-3 px-2 py-2 rounded text-sm text-red-600 hover:bg-red-50"
            >
              <LogOut className="w-4 h-4" />
              <span>로그아웃</span>
            </button>
          </div>
        </div>
      </aside>

      {/* 메인 컨텐츠 */}
      <div
        className={`transition-all ${sidebarOpen ? 'lg:ml-[260px]' : 'ml-0'}`}
      >
        {/* 상단 헤더 */}
        <header className="bg-white border-b border-gray-200 sticky top-0 z-30">
          <div className="px-6 py-3.5">
            <div className="flex items-center justify-between">
              <button
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className="text-gray-500 hover:text-gray-700"
              >
                <Menu className="w-5 h-5" />
              </button>
              <div className="text-xs text-gray-500">
                {new Date().toLocaleDateString('ko-KR', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                  weekday: 'short'
                })}
              </div>
            </div>
          </div>
        </header>

        {/* 페이지 컨텐츠 */}
        <main className="p-6">
          {children}
        </main>
      </div>

      {/* 모바일 오버레이 */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-30 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}
    </div>
  )
}
