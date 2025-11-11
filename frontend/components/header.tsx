'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { Search, ShoppingCart, User, LogOut, Heart, ChevronDown, ArrowUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useState, useEffect, useCallback, useRef } from 'react';
import { ApiError, apiFetch } from '@/lib/api-client';
import { useNotifications } from '@/hooks/use-notifications';
import { CategoryNav } from '@/components/category-nav';

export function Header() {
  const [searchKeyword, setSearchKeyword] = useState('');
  const [user, setUser] = useState<{
    name: string;
    email: string;
    role?: string;
    roles?: string[];
  } | null>(null);
  const router = useRouter();
  const [cartCount, setCartCount] = useState(0);
  const [isHelpMenuOpen, setIsHelpMenuOpen] = useState(false);
  const helpMenuRef = useRef<HTMLDivElement>(null);
  const [isScrolled, setIsScrolled] = useState(false);

  // 관리자 여부 확인 (role 또는 roles 배열 모두 체크)
  const isAdmin =
    user?.role === 'ADMIN' ||
    user?.role === 'ROLE_ADMIN' ||
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

  // 드롭다운 외부 클릭 감지
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (helpMenuRef.current && !helpMenuRef.current.contains(event.target as Node)) {
        setIsHelpMenuOpen(false);
      }
    };

    if (isHelpMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isHelpMenuOpen]);

  // 스크롤 감지
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 100);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

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

  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });
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
                    {isAdmin && (
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
                <div className="relative" ref={helpMenuRef}>
                  <button
                    className="flex items-center gap-1 text-muted-foreground hover:text-foreground transition-colors py-2 px-3"
                    onClick={() => setIsHelpMenuOpen(!isHelpMenuOpen)}
                  >
                    고객센터
                    <ChevronDown className={`h-3 w-3 transition-transform ${isHelpMenuOpen ? 'rotate-180' : ''}`} />
                  </button>
                  {isHelpMenuOpen && (
                    <div className="absolute left-0 top-full mt-1 z-[9999]">
                      <div className="w-36 rounded-md shadow-lg overflow-hidden" style={{ backgroundColor: '#ffffff', border: '1px solid #e5e7eb' }}>
                        <Link
                          href="/help?tab=notices"
                          className="block px-4 py-2.5 text-sm hover:bg-muted transition-colors"
                          style={{ backgroundColor: '#ffffff' }}
                          onClick={() => setIsHelpMenuOpen(false)}
                        >
                          공지사항
                        </Link>
                        <Link
                          href="/help?tab=faq"
                          className="block px-4 py-2.5 text-sm hover:bg-muted transition-colors"
                          style={{ backgroundColor: '#ffffff' }}
                          onClick={() => setIsHelpMenuOpen(false)}
                        >
                          자주하는 질문
                        </Link>
                        <Link
                          href="/help?tab=inquiries"
                          className="block px-4 py-2.5 text-sm hover:bg-muted transition-colors"
                          style={{ backgroundColor: '#ffffff' }}
                          onClick={() => setIsHelpMenuOpen(false)}
                        >
                          1:1 문의
                        </Link>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Main Header */}
        <div className="w-full py-4 relative">
          <div className="container mx-auto px-4 max-w-6xl">
            <div className="hidden md:grid md:grid-cols-[15%_70%_15%] items-center gap-4">
              {/* 로고 - 왼쪽 영역 중앙 정렬 */}
              <div className="flex justify-center">
                <Link href="/" className="flex items-center gap-2">
                  <Image
                    src="/logo_main.png"
                    alt="오늘마트 로고"
                    width={120}
                    height={40}
                    className="object-contain"
                    unoptimized
                  />
                </Link>
              </div>

              {/* Search Bar - 중앙 영역 */}
              <div className="flex justify-center">
                <form onSubmit={handleSearch} className="relative w-full max-w-4xl">
                  <Input
                    type="search"
                    placeholder="신선한 농수산물을 검색해보세요"
                    className="w-full pl-5 pr-14 bg-primary/17 border-primary/17 h-12 text-lg placeholder:text-base"
                    value={searchKeyword}
                    onChange={(e) => setSearchKeyword(e.target.value)}
                  />
                  <Button
                    type="submit"
                    size="icon"
                    variant="ghost"
                    className="absolute right-0 top-0 h-full"
                  >
                    <Search className="h-7 w-7" />
                  </Button>
                </form>
              </div>

              {/* Actions - 오른쪽 정렬 */}
              <div className="flex items-center justify-end gap-3">
                {/* 찜한 상품 */}
                {user && (
                  <Link href="/mypage/wishlist">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-foreground hover:bg-muted h-12 w-12"
                      title="찜한 상품"
                    >
                      <Heart className="h-10 w-10" />
                    </Button>
                  </Link>
                )}

                {/* 장바구니 - 가장 오른쪽 */}
                <Link href="/cart">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="relative text-foreground hover:bg-muted h-12 w-12"
                    title="장바구니"
                  >
                    <ShoppingCart className="h-10 w-10" />
                    {cartCount > 0 && (
                      <span className="absolute -top-1 -right-1 min-h-5 min-w-5 rounded-full bg-primary text-white text-xs flex items-center justify-center px-1 font-bold">
                        {cartCount}
                      </span>
                    )}
                  </Button>
                </Link>
              </div>
            </div>

            {/* Mobile View */}
            <div className="md:hidden flex items-center justify-between">
              <Link href="/" className="flex items-center gap-2">
                <Image
                  src="/logo_main.png"
                  alt="오늘마트 로고"
                  width={100}
                  height={33}
                  className="object-contain"
                  unoptimized
                />
              </Link>
              <Link href="/cart">
                <Button
                  variant="ghost"
                  size="icon"
                  className="relative text-foreground hover:bg-muted h-12 w-12"
                  title="장바구니"
                >
                  <ShoppingCart className="h-10 w-10" />
                  {cartCount > 0 && (
                    <span className="absolute -top-1 -right-1 min-h-5 min-w-5 rounded-full bg-primary text-white text-xs flex items-center justify-center px-1 font-bold">
                      {cartCount}
                    </span>
                  )}
                </Button>
              </Link>
            </div>

            {/* Mobile Search */}
            <div className="md:hidden mt-4">
              <form onSubmit={handleSearch} className="relative">
                <Input
                  type="search"
                  placeholder="신선한 농수산물을 검색해보세요"
                  className="w-full pl-5 pr-14 bg-primary/17 border-primary/17 h-12 text-lg placeholder:text-base"
                  value={searchKeyword}
                  onChange={(e) => setSearchKeyword(e.target.value)}
                />
                <Button
                  type="submit"
                  size="icon"
                  variant="ghost"
                  className="absolute right-0 top-0 h-full"
                >
                  <Search className="h-7 w-7" />
                </Button>
              </form>
            </div>
          </div>
        </div>
      </header>

      {/* Navigation - 고정하지 않음 */}
      <nav className="w-full border-t bg-white shadow-sm">
        <div className="container mx-auto px-4 max-w-6xl">
          <div className="flex items-center py-3 gap-8">
            {/* 카테고리 버튼 */}
            <CategoryNav />

            {/* 신상품, 베스트 링크 */}
            <div className="flex items-center gap-8">
              <Link
                href="/new-arrivals"
                className="text-sm font-medium hover:text-primary transition-colors whitespace-nowrap"
              >
                신상품
              </Link>
              <Link
                href="/best"
                className="text-sm font-medium hover:text-primary transition-colors whitespace-nowrap"
              >
                베스트
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* 스크롤 시 나타나는 고정 헤더 */}
      {isScrolled && (
        <div className="fixed top-0 left-0 right-0 z-[100] bg-white border-b shadow-md animate-in slide-in-from-top duration-200">
          <div className="container mx-auto px-4 max-w-6xl">
            <div className="flex items-center justify-between py-2">
              <div className="flex items-center gap-6">
                <CategoryNav />
                <Link
                  href="/new-arrivals"
                  className="text-sm font-medium hover:text-primary transition-colors whitespace-nowrap"
                >
                  신상품
                </Link>
                <Link
                  href="/best"
                  className="text-sm font-medium hover:text-primary transition-colors whitespace-nowrap"
                >
                  베스트
                </Link>
              </div>

              {/* 우측 아이콘 및 검색창 */}
              <div className="flex items-center gap-2 flex-shrink-0">
                {/* 미니 검색창 */}
                <form onSubmit={handleSearch} className="relative hidden md:block">
                  <Input
                    type="search"
                    placeholder="검색"
                    className="w-40 pl-3 pr-9 bg-primary/17 border-primary/17 h-8 text-sm placeholder:text-xs"
                    value={searchKeyword}
                    onChange={(e) => setSearchKeyword(e.target.value)}
                  />
                  <Button
                    type="submit"
                    size="icon"
                    variant="ghost"
                    className="absolute right-0 top-0 h-full w-8"
                  >
                    <Search className="h-4 w-4" />
                  </Button>
                </form>

                {user && (
                  <Link href="/mypage/wishlist">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="hidden md:flex h-9 w-9"
                      title="찜한 상품"
                    >
                      <Heart className="h-5 w-5" />
                    </Button>
                  </Link>
                )}
                <Link href="/cart">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="relative h-9 w-9"
                    title="장바구니"
                  >
                    <ShoppingCart className="h-5 w-5" />
                    {cartCount > 0 && (
                      <span className="absolute -top-1 -right-1 min-h-4 min-w-4 rounded-full bg-primary text-white text-[10px] flex items-center justify-center px-0.5 font-bold">
                        {cartCount}
                      </span>
                    )}
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 최상단으로 이동 플로팅 버튼 */}
      {isScrolled && (
        <button
          onClick={scrollToTop}
          className="fixed bottom-6 right-6 z-50 h-12 w-12 rounded-full bg-white shadow-lg hover:shadow-xl transition-all duration-200 flex items-center justify-center border border-gray-200 hover:bg-gray-50"
          aria-label="맨 위로 이동"
        >
          <ArrowUp className="h-5 w-5 text-gray-700" />
        </button>
      )}
    </>
  );
}
