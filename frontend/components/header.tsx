'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { Search, ShoppingCart, User, Menu, LogOut, Heart } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useState, useEffect, useCallback } from 'react';
import { ApiError, apiFetch } from '@/lib/api-client';
import { useNotifications } from '@/hooks/use-notifications';
import { COLORS } from '@/lib/colors';

export function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [searchKeyword, setSearchKeyword] = useState('');
  const [user, setUser] = useState<{
    name: string;
    email: string;
    roles?: string[];
  } | null>(null);
  const router = useRouter();
  const [cartCount, setCartCount] = useState(0);

  // 관리자 여부 확인
  const isAdmin =
    user?.roles?.some((role) => role === 'ADMIN' || role === 'ROLE_ADMIN') ||
    false;

  // 관리자만 알림 활성화
  useNotifications(isAdmin);

  const fetchCartCount = useCallback(async () => {
    const token = localStorage.getItem('token');
    if (!token) {
      setCartCount(0);
      return;
    }

    try {
      const cart = await apiFetch<{ cartItems: Array<{ id: number }> }>(
        '/api/cart',
        { auth: true }
      );
      console.log('[Header] Cart count updated:', cart.cartItems.length);
      setCartCount(cart.cartItems.length);
    } catch (error) {
      console.error('Failed to fetch cart count:', error);
      setCartCount(0);
    }
  }, []);

  useEffect(() => {
    // Check if user is logged in
    const userStr = localStorage.getItem('user');
    if (userStr) {
      try {
        const userData = JSON.parse(userStr);
        setUser(userData);
      } catch (error) {
        console.error('Failed to parse user data:', error);
      }
    }

    fetchCartCount();

    // 장바구니 업데이트 이벤트 리스너 등록
    const handleCartUpdate = () => {
      console.log(
        '[Header] cartUpdated event received, fetching cart count...'
      );
      fetchCartCount();
    };
    window.addEventListener('cartUpdated', handleCartUpdate);

    // 클린업 함수
    return () => {
      window.removeEventListener('cartUpdated', handleCartUpdate);
    };
  }, [fetchCartCount]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchKeyword.trim()) {
      router.push(`/search?keyword=${encodeURIComponent(searchKeyword)}`);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
    setCartCount(0);
    router.push('/');
    window.location.href = '/';
  };

  return (
    <>
      <header className="w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        {/* Top Bar */}
        <div>
          <div className="container mx-auto px-4 max-w-6xl py-2">
            <div className="flex items-center justify-end text-xs">
              <div className="flex items-center gap-4">
                {user ? (
                  <>
                    <span className="text-foreground font-medium">
                      {user.name}님
                    </span>
                    <Link
                      href="/mypage"
                      className="text-muted-foreground hover:text-foreground transition-colors"
                    >
                      마이페이지
                    </Link>
                    {(user.roles?.includes('ADMIN') ||
                      user.roles?.includes('ROLE_ADMIN')) && (
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
                    <Link
                      href="/login"
                      className="text-muted-foreground hover:text-foreground transition-colors"
                    >
                      로그인
                    </Link>
                    <Link
                      href="/register"
                      className="text-muted-foreground hover:text-foreground transition-colors"
                    >
                      회원가입
                    </Link>
                  </>
                )}
                <span className="text-muted-foreground">고객센터</span>
              </div>
            </div>
          </div>
        </div>

        {/* Main Header with Red Background */}
        <div
          className="w-full py-4 relative"
          style={{ backgroundColor: COLORS.PRIMARY }}
        >
          <div className="container mx-auto px-4 max-w-6xl">
            <div className="flex items-center justify-between gap-4">
              {/* Logo */}
              <Link href="/" className="flex items-center gap-2">
                <Image
                  src="/logo_image_todaymart.png"
                  alt="오늘마트 로고"
                  width={32}
                  height={32}
                  className="object-contain"
                  unoptimized
                />
                <div className="text-2xl font-bold">
                  <span style={{ color: COLORS.SECONDARY_COLOR }}>오늘</span>
                  <span className="text-white">마트</span>
                </div>
              </Link>

              {/* Search Bar - 중앙 배치 */}
              <div className="hidden md:flex absolute left-1/2 -translate-x-1/2 w-full max-w-2xl">
                <form onSubmit={handleSearch} className="relative w-full">
                  <Input
                    type="search"
                    placeholder="신선한 농수산물을 검색해보세요"
                    className="w-full pr-10 bg-white border-white"
                    value={searchKeyword}
                    onChange={(e) => setSearchKeyword(e.target.value)}
                  />
                  <Button
                    type="submit"
                    size="icon"
                    variant="ghost"
                    className="absolute right-0 top-0 h-full"
                  >
                    <Search className="h-5 w-5" />
                  </Button>
                </form>
              </div>

              {/* Actions - 오른쪽 정렬 */}
              <div className="flex items-center gap-2 ml-auto">
                {/* 찜한 상품 */}
                {user && (
                  <Link href="/mypage/wishlist">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="hidden md:flex text-white hover:bg-white/20"
                      title="찜한 상품"
                    >
                      <Heart className="h-5 w-5" />
                    </Button>
                  </Link>
                )}

                {/* 장바구니 - 가장 오른쪽 */}
                <Link href="/cart">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="relative text-white hover:bg-white/20"
                    title="장바구니"
                  >
                    <ShoppingCart className="h-5 w-5" />
                    {cartCount > 0 && (
                      <span className="absolute -top-1 -right-1 min-h-5 min-w-5 rounded-full bg-white text-primary text-xs flex items-center justify-center px-1 font-bold">
                        {cartCount}
                      </span>
                    )}
                  </Button>
                </Link>
                <Button
                  variant="ghost"
                  size="icon"
                  className="md:hidden text-white hover:bg-white/20"
                  onClick={() => setIsMenuOpen(!isMenuOpen)}
                >
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
                  className="w-full pr-10 bg-white border-white"
                  value={searchKeyword}
                  onChange={(e) => setSearchKeyword(e.target.value)}
                />
                <Button
                  type="submit"
                  size="icon"
                  variant="ghost"
                  className="absolute right-0 top-0 h-full"
                >
                  <Search className="h-5 w-5" />
                </Button>
              </form>
            </div>
          </div>
        </div>
      </header>

      {/* Navigation - 헤더 밖으로 분리하여 독립적으로 고정 */}
      <nav className="sticky top-0 z-50 w-full border-t bg-white shadow-sm">
        <div className="container mx-auto px-4 max-w-6xl">
          <ul className="flex items-center gap-8 py-3 overflow-x-auto">
            <li>
              <Link
                href="/deals"
                className="text-sm font-medium text-accent hover:text-accent/80 transition-colors whitespace-nowrap"
              >
                특가/할인
              </Link>
            </li>
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
                href="/new"
                className="text-sm font-medium hover:text-primary transition-colors whitespace-nowrap"
              >
                신상품
              </Link>
            </li>
          </ul>
        </div>
      </nav>
    </>
  );
}
