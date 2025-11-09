"use client";

import { useState, useEffect } from "react";
import { UserCoupon } from "@/types/coupon";
import { apiFetch } from "@/lib/api-client";
import CouponList from "@/components/coupon/CouponList";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { ChevronLeft, Download } from "lucide-react";
import { useRouter } from "next/navigation";
import { Header } from "@/components/header";
import { Footer } from "@/components/footer";
import Link from "next/link";

export default function MyCouponsPage() {
  const router = useRouter();
  const [allCoupons, setAllCoupons] = useState<UserCoupon[]>([]);
  const [availableCoupons, setAvailableCoupons] = useState<UserCoupon[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedFilter, setSelectedFilter] = useState<"available" | "all">("available");

  const [couponCode, setCouponCode] = useState("");
  const [downloading, setDownloading] = useState(false);
  const [downloadMessage, setDownloadMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  useEffect(() => {
    fetchCoupons();
  }, []);

  const fetchCoupons = async () => {
    setLoading(true);
    setError(null);

    try {
      const [all, available] = await Promise.all([
        apiFetch<UserCoupon[]>('/api/user/coupons', { auth: true }),
        apiFetch<UserCoupon[]>('/api/user/coupons/available', { auth: true })
      ]);

      setAllCoupons(all);
      setAvailableCoupons(available);
    } catch (err: any) {
      if (err.status === 401) {
        router.push('/login');
        return;
      }
      setError(err.message || "쿠폰을 불러오는데 실패했습니다.");
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadCoupon = async () => {
    if (!couponCode.trim()) {
      setDownloadMessage({ type: 'error', text: '쿠폰 코드를 입력하세요.' });
      return;
    }

    setDownloading(true);
    setDownloadMessage(null);

    try {
      await apiFetch(`/api/user/coupons/download/${couponCode.toUpperCase()}`, {
        auth: true,
        method: 'POST'
      });

      setDownloadMessage({ type: 'success', text: '쿠폰이 발급되었습니다!' });
      setCouponCode("");

      // 쿠폰 목록 다시 불러오기
      setTimeout(() => {
        fetchCoupons();
        setDownloadMessage(null);
      }, 1500);
    } catch (err: any) {
      setDownloadMessage({
        type: 'error',
        text: err.payload?.message || err.message || '쿠폰 발급에 실패했습니다.'
      });
    } finally {
      setDownloading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-1 py-8 bg-muted/30">
          <div className="container mx-auto px-4">
            <p className="text-center">로딩 중...</p>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  const displayCoupons = selectedFilter === "available" ? availableCoupons : allCoupons;

  return (
    <div className="min-h-screen flex flex-col">
      <Header />

      <main className="flex-1 py-8 bg-muted/30">
        <div className="container mx-auto px-4 max-w-6xl">
          {/* Header */}
          <div className="mb-8">
            <Button variant="ghost" asChild className="mb-4">
              <Link href="/mypage">
                <ChevronLeft className="h-4 w-4 mr-2" />
                마이페이지로 돌아가기
              </Link>
            </Button>
            <h1 className="text-3xl font-bold mb-2">내 쿠폰</h1>
            <p className="text-muted-foreground">총 {allCoupons.length}개의 쿠폰 보유 중</p>
          </div>

          {/* Coupon Download Card */}
          <Card className="mb-6">
            <CardContent className="pt-6">
              <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <Download className="h-5 w-5" />
                쿠폰 코드로 다운로드
              </h2>
              <div className="flex gap-2">
                <Input
                  placeholder="쿠폰 코드 입력 (예: WELCOME)"
                  value={couponCode}
                  onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                  onKeyDown={(e) => e.key === 'Enter' && handleDownloadCoupon()}
                  disabled={downloading}
                />
                <Button
                  onClick={handleDownloadCoupon}
                  disabled={downloading || !couponCode.trim()}
                >
                  {downloading ? "발급 중..." : "다운로드"}
                </Button>
              </div>

              {downloadMessage && (
                <Alert
                  variant={downloadMessage.type === 'error' ? 'destructive' : 'default'}
                  className="mt-3"
                >
                  <AlertDescription>{downloadMessage.text}</AlertDescription>
                </Alert>
              )}
            </CardContent>
          </Card>

          {/* Error Alert */}
          {error && (
            <Alert variant="destructive" className="mb-6">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* Filters */}
          <Card className="mb-6">
            <CardContent className="pt-6">
              <div className="flex gap-2">
                <Button
                  variant={selectedFilter === "available" ? "default" : "outline"}
                  onClick={() => setSelectedFilter("available")}
                  className="flex-1"
                >
                  사용 가능
                  <Badge variant="secondary" className="ml-2">
                    {availableCoupons.length}
                  </Badge>
                </Button>
                <Button
                  variant={selectedFilter === "all" ? "default" : "outline"}
                  onClick={() => setSelectedFilter("all")}
                  className="flex-1"
                >
                  전체
                  <Badge variant="secondary" className="ml-2">
                    {allCoupons.length}
                  </Badge>
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Coupon List */}
          <div className="space-y-4">
            <CouponList
              userCoupons={displayCoupons}
              emptyMessage={
                selectedFilter === "available"
                  ? "사용 가능한 쿠폰이 없습니다."
                  : "보유한 쿠폰이 없습니다."
              }
            />
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
