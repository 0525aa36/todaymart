"use client";

import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Gift, X } from "lucide-react";
import { useRouter } from "next/navigation";

const MODAL_SHOWN_KEY = "signup_promotion_shown";
const MODAL_CLOSE_COUNT_KEY = "signup_promotion_close_count";

export default function SignupPromotionModal() {
  const router = useRouter();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    // 로그인한 사용자는 팝업 표시 안 함
    const token = localStorage.getItem("token");
    if (token) {
      return;
    }

    // 세션 스토리지에서 확인 (같은 세션에서는 한 번만)
    const shownInSession = sessionStorage.getItem(MODAL_SHOWN_KEY);
    if (shownInSession) {
      return;
    }

    // 로컬 스토리지에서 닫은 횟수 확인 (3회 이상 닫으면 더 이상 표시 안 함)
    const closeCount = parseInt(localStorage.getItem(MODAL_CLOSE_COUNT_KEY) || "0");
    if (closeCount >= 3) {
      return;
    }

    // 1초 후에 팝업 표시
    const timer = setTimeout(() => {
      setOpen(true);
      sessionStorage.setItem(MODAL_SHOWN_KEY, "true");
    }, 1000);

    return () => clearTimeout(timer);
  }, []);

  const handleClose = () => {
    setOpen(false);
    // 닫은 횟수 증가
    const closeCount = parseInt(localStorage.getItem(MODAL_CLOSE_COUNT_KEY) || "0");
    localStorage.setItem(MODAL_CLOSE_COUNT_KEY, String(closeCount + 1));
  };

  const handleSignup = () => {
    setOpen(false);
    router.push("/register");
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="sm:max-w-md">
        <button
          onClick={handleClose}
          className="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100"
        >
          <X className="h-4 w-4" />
          <span className="sr-only">Close</span>
        </button>

        <DialogHeader>
          <div className="flex justify-center mb-4">
            <div className="rounded-full bg-primary/10 p-4">
              <Gift className="h-12 w-12 text-primary" />
            </div>
          </div>
          <DialogTitle className="text-center text-2xl">
            신규 회원가입 시<br />
            <span className="text-primary">10,000원 할인 쿠폰</span> 증정!
          </DialogTitle>
          <DialogDescription className="text-center space-y-4">
            <div className="py-4">
              <div className="text-base font-semibold text-foreground mb-2">
                🎁 회원 혜택
              </div>
              <ul className="text-sm space-y-2 text-left max-w-xs mx-auto">
                <li>✅ 신규 가입 즉시 10,000원 쿠폰 지급</li>
                <li>✅ 30,000원 이상 주문 시 사용 가능</li>
                <li>✅ 유효기간 1년</li>
                <li>✅ 모든 상품에 사용 가능</li>
              </ul>
            </div>

            <div className="flex flex-col gap-2">
              <Button onClick={handleSignup} size="lg" className="w-full">
                지금 가입하고 쿠폰 받기
              </Button>
              <Button onClick={handleClose} variant="ghost" size="sm">
                다음에 할게요
              </Button>
            </div>

            <p className="text-xs text-muted-foreground">
              * 1인 1회 한정 혜택입니다
            </p>
          </DialogDescription>
        </DialogHeader>
      </DialogContent>
    </Dialog>
  );
}
