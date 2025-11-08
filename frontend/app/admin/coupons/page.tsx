"use client";

import { useState, useEffect } from "react";
import { Coupon } from "@/types/coupon";
import { apiFetch } from "@/lib/api-client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Ticket, Plus } from "lucide-react";
import { useRouter } from "next/navigation";
import { useToast } from "@/hooks/use-toast";
import { CouponCreateDialog } from "@/components/admin/CouponCreateDialog";

export default function AdminCouponsPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [loading, setLoading] = useState(true);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);

  useEffect(() => {
    fetchCoupons();
  }, []);

  const fetchCoupons = async () => {
    setLoading(true);
    try {
      const response = await apiFetch<{ content: Coupon[] }>("/api/admin/coupons?size=100", {
        auth: true
      });
      setCoupons(response.content || []);
    } catch (err: any) {
      if (err.status === 401 || err.status === 403) {
        toast({
          title: "권한 없음",
          description: "관리자 권한이 필요합니다.",
          variant: "destructive"
        });
        router.push("/");
        return;
      }
      toast({
        title: "오류",
        description: err.message || "쿠폰을 불러오는데 실패했습니다.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ko-KR');
  };

  const formatDiscount = (coupon: Coupon) => {
    if (coupon.discountType === 'FIXED_AMOUNT') {
      return `${coupon.discountValue.toLocaleString()}원`;
    } else {
      return `${coupon.discountValue}%`;
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <p className="text-center">로딩 중...</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <Ticket className="h-8 w-8" />
          쿠폰 관리
        </h1>
        <Button onClick={() => setCreateDialogOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          쿠폰 생성
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>전체 쿠폰 목록 ({coupons.length}개)</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>코드</TableHead>
                <TableHead>이름</TableHead>
                <TableHead>할인</TableHead>
                <TableHead>최소 주문</TableHead>
                <TableHead>유효기간</TableHead>
                <TableHead>사용/전체</TableHead>
                <TableHead>상태</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {coupons.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center text-muted-foreground">
                    등록된 쿠폰이 없습니다.
                  </TableCell>
                </TableRow>
              ) : (
                coupons.map((coupon) => (
                  <TableRow key={coupon.id}>
                    <TableCell className="font-mono font-semibold">
                      {coupon.code}
                    </TableCell>
                    <TableCell>{coupon.name}</TableCell>
                    <TableCell>{formatDiscount(coupon)}</TableCell>
                    <TableCell>
                      {coupon.minOrderAmount > 0
                        ? `${coupon.minOrderAmount.toLocaleString()}원`
                        : '-'
                      }
                    </TableCell>
                    <TableCell className="text-sm">
                      {formatDate(coupon.startDate)} ~ {formatDate(coupon.endDate)}
                    </TableCell>
                    <TableCell>
                      {coupon.totalQuantity
                        ? `${coupon.usedQuantity} / ${coupon.totalQuantity}`
                        : `${coupon.usedQuantity} / 무제한`
                      }
                    </TableCell>
                    <TableCell>
                      {coupon.isValid ? (
                        <Badge variant="default" className="bg-green-600">
                          유효
                        </Badge>
                      ) : coupon.isExpired ? (
                        <Badge variant="destructive">만료</Badge>
                      ) : !coupon.isActive ? (
                        <Badge variant="secondary">비활성</Badge>
                      ) : (
                        <Badge variant="outline">소진</Badge>
                      )}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <div className="mt-6 p-4 border rounded-lg bg-muted/50">
        <h3 className="font-semibold mb-2">관리 기능 안내</h3>
        <p className="text-sm text-muted-foreground">
          쿠폰 생성 기능을 통해 새로운 쿠폰을 등록할 수 있습니다.
          쿠폰 수정 및 삭제 기능은 추후 구현 예정입니다.
        </p>
      </div>

      <CouponCreateDialog
        open={createDialogOpen}
        onOpenChange={setCreateDialogOpen}
        onSuccess={fetchCoupons}
      />
    </div>
  );
}
