"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { Search, ShoppingCart, User, Menu, LogOut } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { useState, useEffect, useCallback } from "react"
import { ApiError, apiFetch } from "@/lib/api-client"
import { useNotifications } from "@/hooks/use-notifications"

export function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [searchKeyword, setSearchKeyword] = useState("")
  const [user, setUser] = useState<{ name: string; email: string; roles?: string[] } | null>(null)
  const router = useRouter()
  const [cartCount, setCartCount] = useState(0)
  
  // 관리자 여부 확인
  const isAdmin = user?.roles?.some(role => role === "ADMIN" || role === "ROLE_ADMIN") || false

  // 관리자만 알림 활성화
  useNotifications(isAdmin)

  const fetchCartCount = useCallback(async () => {
    const token = localStorage.getItem("token")
    if (!token) {
      setCartCount(0)
      return
    }

    try {
      const cart = await apiFetch<{ cartItems: Array<{ id: number }> }>("/api/cart", { auth: true })
      console.log("[Header] Cart count updated:", cart.cartItems.length)
      setCartCount(cart.cartItems.length)
    } catch (error) {
      console.error("Failed to fetch cart count:", error)
      setCartCount(0)
    }
  }, [])

  useEffect(() => {
    // Check if user is logged in
    const userStr = localStorage.getItem("user")
    if (userStr) {
      try {
        const userData = JSON.parse(userStr)
        setUser(userData)
      } catch (error) {
        console.error("Failed to parse user data:", error)
      }
    }

    fetchCartCount()

    // 장바구니 업데이트 이벤트 리스너 등록
    const handleCartUpdate = () => {
      console.log("[Header] cartUpdated event received, fetching cart count...")
      fetchCartCount()
    }
    window.addEventListener("cartUpdated", handleCartUpdate)

    // 클린업 함수
    return () => {
      window.removeEventListener("cartUpdated", handleCartUpdate)
    }
  }, [fetchCartCount])

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    if (searchKeyword.trim()) {
      router.push(`/search?keyword=${encodeURIComponent(searchKeyword)}`)
    }
  }

  const handleLogout = () => {
    localStorage.removeItem("token")
    localStorage.removeItem("user")
    setUser(null)
    setCartCount(0)
    router.push("/")
    window.location.href = "/"
  }

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      {/* Top Bar */}
      <div className="border-b bg-muted/50">
        <div className="container mx-auto px-4 py-2">
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-4">
              {user ? (
                <>
                  <span className="text-foreground font-medium">{user.name}님</span>
                  <Link href="/mypage" className="text-muted-foreground hover:text-foreground transition-colors">
                    마이페이지
                  </Link>
                  {(user.roles?.includes("ADMIN") || user.roles?.includes("ROLE_ADMIN")) && (
                    <Link
                      href="/admin"
                      className="text-primary hover:text-primary/80 transition-colors font-medium"
                    >
                      관리자 페이지
                    </Link>
                  )}
                  <button
                    onClick={handleLogout}
                    className="text-muted-foreground hover:text-foreground transition-colors"
                  >
                    로그아웃
                  </button>
                </>
              ) : (
                <>
                  <Link href="/login" className="text-muted-foreground hover:text-foreground transition-colors">
                    로그인
                  </Link>
                  <Link href="/register" className="text-muted-foreground hover:text-foreground transition-colors">
                    회원가입
                  </Link>
                </>
              )}
            </div>
            <div className="flex items-center gap-4">
              <span className="text-muted-foreground">고객센터: 1588-0000</span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Header */}
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between gap-4">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2">
            <div className="text-2xl font-bold text-primary">신선마켓</div>
          </Link>

          {/* Search Bar */}
          <div className="hidden md:flex flex-1 max-w-2xl">
            <form onSubmit={handleSearch} className="relative w-full">
              <Input
                type="search"
                placeholder="신선한 농수산물을 검색해보세요"
                className="w-full pr-10"
                value={searchKeyword}
                onChange={(e) => setSearchKeyword(e.target.value)}
              />
              <Button type="submit" size="icon" variant="ghost" className="absolute right-0 top-0 h-full">
                <Search className="h-5 w-5" />
              </Button>
            </form>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2">
            {/* 마이페이지 */}
            {user && (
              <Link href="/mypage">
                <Button variant="ghost" size="icon" className="hidden md:flex" title="마이페이지">
                  <User className="h-5 w-5" />
                </Button>
              </Link>
            )}

            {/* 장바구니 */}
            <Link href="/cart">
              <Button variant="ghost" size="icon" className="relative" title="장바구니">
                <ShoppingCart className="h-5 w-5" />
                {cartCount > 0 && (
                  <span className="absolute -top-1 -right-1 min-h-5 min-w-5 rounded-full bg-accent text-accent-foreground text-xs flex items-center justify-center px-1">
                    {cartCount}
                  </span>
                )}
              </Button>
            </Link>
            <Button variant="ghost" size="icon" className="md:hidden" onClick={() => setIsMenuOpen(!isMenuOpen)}>
              <Menu className="h-5 w-5" />
            </Button>
          </div>
        </div>

        {/* Mobile Search */}
        <div className="md:hidden mt-4">
          <form onSubmit={handleSearch} className="relative">
            <Input
              type="search"
              placeholder="신선한 농수산물을 검색해보세요"
              className="w-full pr-10"
              value={searchKeyword}
              onChange={(e) => setSearchKeyword(e.target.value)}
            />
            <Button type="submit" size="icon" variant="ghost" className="absolute right-0 top-0 h-full">
              <Search className="h-5 w-5" />
            </Button>
          </form>
        </div>
      </div>

      {/* Navigation */}
      <nav className="border-t">
        <div className="container mx-auto px-4">
          <ul className="flex items-center gap-8 py-3 overflow-x-auto">
            <li>
              <Link
                href="/category/vegetables"
                className="text-sm font-medium hover:text-primary transition-colors whitespace-nowrap"
              >
                채소
              </Link>
            </li>
            <li>
              <Link
                href="/category/fruits"
                className="text-sm font-medium hover:text-primary transition-colors whitespace-nowrap"
              >
                과일
              </Link>
            </li>
            <li>
              <Link
                href="/category/seafood"
                className="text-sm font-medium hover:text-primary transition-colors whitespace-nowrap"
              >
                수산물
              </Link>
            </li>
            <li>
              <Link
                href="/category/meat"
                className="text-sm font-medium hover:text-primary transition-colors whitespace-nowrap"
              >
                축산물
              </Link>
            </li>
            <li>
              <Link
                href="/category/rice"
                className="text-sm font-medium hover:text-primary transition-colors whitespace-nowrap"
              >
                쌀/잡곡
              </Link>
            </li>
            <li>
              <Link
                href="/deals"
                className="text-sm font-medium text-accent hover:text-accent/80 transition-colors whitespace-nowrap"
              >
                특가/할인
              </Link>
            </li>
            <li>
              <Link href="/new" className="text-sm font-medium hover:text-primary transition-colors whitespace-nowrap">
                신상품
              </Link>
            </li>
          </ul>
        </div>
      </nav>
    </header>
  )
}
