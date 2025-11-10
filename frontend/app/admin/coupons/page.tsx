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
import { Ticket, Plus, Edit, Trash2, Power } from "lucide-react";
import { useRouter } from "next/navigation";
import { useToast } from "@/hooks/use-toast";
import Link from "next/link";

export default function AdminCouponsPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [loading, setLoading] = useState(true);

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

  const handleDelete = async (id: number) => {
    if (!confirm("정말 삭제하시겠습니까?")) return;

    try {
      await apiFetch(`/api/admin/coupons/${id}`, {
        method: "DELETE",
        auth: true,
        parseResponse: "none",
      });

      toast({
        title: "삭제 완료",
        description: "쿠폰이 삭제되었습니다.",
      });
      fetchCoupons();
    } catch (error: any) {
      toast({
        title: "오류",
        description: error.message || "쿠폰 삭제 중 오류가 발생했습니다.",
        variant: "destructive",
      });
    }
  };

  const handleToggleStatus = async (id: number) => {
    try {
      await apiFetch(`/api/admin/coupons/${id}/toggle`, {
        method: "PUT",
        auth: true,
        parseResponse: "none",
      });

      toast({
        title: "상태 변경 완료",
        description: "쿠폰 활성 상태가 변경되었습니다.",
      });
      fetchCoupons();
    } catch (error: any) {
      toast({
        title: "오류",
        description: error.message || "상태 변경 중 오류가 발생했습니다.",
        variant: "destructive",
      });
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
        <div>
          <h1 className="text-2xl font-semibold text-gray-900 flex items-center gap-2">
            <Ticket className="h-8 w-8" />
            쿠폰 관리
          </h1>
          <p className="text-sm text-gray-500 mt-1">쿠폰을 생성하고 관리하세요</p>
        </div>
        <Link href="/admin/coupons/new">
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            쿠폰 생성
          </Button>
        </Link>
      </div>

      <Card className="border-0 shadow-sm">
        <CardHeader className="border-b bg-gray-50/50 px-6 py-4">
          <CardTitle className="text-lg font-semibold text-gray-900">전체 쿠폰 목록 ({coupons.length}개)</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[60px]">ID</TableHead>
                <TableHead>코드</TableHead>
                <TableHead>이름</TableHead>
                <TableHead>할인</TableHead>
                <TableHead>최소 주문</TableHead>
                <TableHead>유효기간</TableHead>
                <TableHead>사용/전체</TableHead>
                <TableHead>상태</TableHead>
                <TableHead className="text-right">작업</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {coupons.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={9} className="text-center text-muted-foreground">
                    등록된 쿠폰이 없습니다.
                  </TableCell>
                </TableRow>
              ) : (
                coupons.map((coupon) => (
                  <TableRow key={coupon.id}>
                    <TableCell className="font-medium">{coupon.id}</TableCell>
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
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleToggleStatus(coupon.id)}
                        className="mr-2"
                        title={coupon.isActive ? "비활성화" : "활성화"}
                      >
                        <Power className="h-4 w-4" />
                      </Button>
                      <Link href={`/admin/coupons/${coupon.id}/edit`}>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="mr-2"
                          title="수정"
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                      </Link>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDelete(coupon.id)}
                        title="삭제"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
