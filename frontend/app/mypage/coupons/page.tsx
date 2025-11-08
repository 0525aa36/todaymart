"use client";

import { useState, useEffect } from "react";
import { UserCoupon } from "@/types/coupon";
import { apiFetch } from "@/lib/api-client";
import CouponList from "@/components/coupon/CouponList";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Ticket, Download } from "lucide-react";
import { useRouter } from "next/navigation";

export default function MyCouponsPage() {
  const router = useRouter();
  const [allCoupons, setAllCoupons] = useState<UserCoupon[]>([]);
  const [availableCoupons, setAvailableCoupons] = useState<UserCoupon[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <p className="text-muted-foreground">쿠폰을 불러오는 중...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold mb-6 flex items-center gap-2">
          <Ticket className="h-8 w-8" />
          내 쿠폰
        </h1>

        {/* 쿠폰 다운로드 */}
        <div className="mb-6 p-4 border rounded-lg bg-card">
          <h2 className="text-lg font-semibold mb-3 flex items-center gap-2">
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
        </div>

        {error && (
          <Alert variant="destructive" className="mb-6">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* 쿠폰 목록 탭 */}
        <Tabs defaultValue="available" className="w-full">
          <TabsList className="grid w-full max-w-md grid-cols-2">
            <TabsTrigger value="available">
              사용 가능 ({availableCoupons.length})
            </TabsTrigger>
            <TabsTrigger value="all">
              전체 ({allCoupons.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="available" className="mt-6">
            <CouponList
              userCoupons={availableCoupons}
              emptyMessage="사용 가능한 쿠폰이 없습니다."
            />
          </TabsContent>

          <TabsContent value="all" className="mt-6">
            <CouponList
              userCoupons={allCoupons}
              emptyMessage="보유한 쿠폰이 없습니다."
            />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
