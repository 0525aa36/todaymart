"use client"

import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { AddressSearch } from "@/components/address-search"
import { useToast } from "@/hooks/use-toast"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useState } from "react"
import { ChevronRight, Check } from "lucide-react"
import { apiFetch, getErrorMessage } from "@/lib/api-client"
import { PhoneInput } from "@/components/phone-input"

export default function RegisterPage() {
  const router = useRouter()
  const { toast } = useToast()
  const [step, setStep] = useState(1)
  const [allTermsAgreed, setAllTermsAgreed] = useState(false)
  const [termsService, setTermsService] = useState(false)
  const [termsPrivacy, setTermsPrivacy] = useState(false)

  // Form data
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    passwordConfirm: "",
    name: "",
    phone: "",
    birthDate: "",
    gender: "",
    postcode: "",
    addressLine1: "",
    addressLine2: "",
  })

  const [errors, setErrors] = useState<Record<string, string>>({})

  const handleAllTermsChange = (checked: boolean) => {
    setAllTermsAgreed(checked)
    setTermsService(checked)
    setTermsPrivacy(checked)
  }

  const handleStep1Next = () => {
    if (!termsService || !termsPrivacy) {
      toast({
        title: "약관 동의 필요",
        description: "필수 약관에 모두 동의해주세요.",
        variant: "destructive",
      })
      return
    }
    setStep(2)
  }

  const validateForm = () => {
    const newErrors: Record<string, string> = {}

    if (!formData.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = "올바른 이메일 형식이 아닙니다."
    }

    if (!formData.password || formData.password.length < 8) {
      newErrors.password = "비밀번호는 최소 8자 이상이어야 합니다."
    }

    if (formData.password !== formData.passwordConfirm) {
      newErrors.passwordConfirm = "비밀번호가 일치하지 않습니다."
    }

    if (!formData.name) {
      newErrors.name = "이름을 입력해주세요."
    }

    if (!formData.phone) {
      newErrors.phone = "휴대폰 번호를 입력해주세요."
    }

    if (!formData.birthDate) {
      newErrors.birthDate = "생년월일을 입력해주세요."
    }

    if (!formData.gender) {
      newErrors.gender = "성별을 선택해주세요."
    }

    if (!formData.postcode) {
      newErrors.postcode = "우편번호를 입력해주세요."
    }

    if (!formData.addressLine1) {
      newErrors.addressLine1 = "주소를 입력해주세요."
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleRegister = async () => {
    if (!validateForm()) {
      toast({
        title: "입력 오류",
        description: "모든 필수 항목을 올바르게 입력해주세요.",
        variant: "destructive",
      })
      return
    }

    try {
      await apiFetch("/api/auth/register", {
        method: "POST",
        body: JSON.stringify({
          email: formData.email,
          password: formData.password,
          name: formData.name,
          phone: formData.phone,
          birthDate: formData.birthDate,
          gender: formData.gender,
          postcode: formData.postcode,
          addressLine1: formData.addressLine1,
          addressLine2: formData.addressLine2,
        }),
        parseResponse: "none",
      })

      setStep(3)
      toast({
        title: "회원가입 완료",
        description: "신선마켓에 오신 것을 환영합니다!",
      })
    } catch (error) {
      toast({
        title: "회원가입 실패",
        description: getErrorMessage(error, "회원가입 중 오류가 발생했습니다."),
        variant: "destructive",
      })
    }
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Header />

      <main className="flex-1 py-12 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="max-w-2xl mx-auto">
            <div className="bg-card rounded-lg border p-8">
              <h1 className="text-2xl font-bold mb-2 text-center">회원가입</h1>
              <p className="text-muted-foreground text-center mb-8">신선마켓 회원이 되어 다양한 혜택을 누리세요</p>

              {/* Progress Steps */}
              <div className="flex items-center justify-center mb-8">
                <div className="flex items-center">
                  <div
                    className={`flex items-center justify-center w-10 h-10 rounded-full ${
                      step >= 1 ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
                    }`}
                  >
                    {step > 1 ? <Check className="h-5 w-5" /> : "1"}
                  </div>
                  <span className="ml-2 text-sm font-medium">약관동의</span>
                </div>

                <ChevronRight className="mx-4 h-5 w-5 text-muted-foreground" />

                <div className="flex items-center">
                  <div
                    className={`flex items-center justify-center w-10 h-10 rounded-full ${
                      step >= 2 ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
                    }`}
                  >
                    {step > 2 ? <Check className="h-5 w-5" /> : "2"}
                  </div>
                  <span className="ml-2 text-sm font-medium">정보입력</span>
                </div>

                <ChevronRight className="mx-4 h-5 w-5 text-muted-foreground" />

                <div className="flex items-center">
                  <div
                    className={`flex items-center justify-center w-10 h-10 rounded-full ${
                      step >= 3 ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
                    }`}
                  >
                    3
                  </div>
                  <span className="ml-2 text-sm font-medium">가입완료</span>
                </div>
              </div>

              {/* Step 1: Terms Agreement */}
              {step === 1 && (
                <div className="space-y-6">
                  <div className="space-y-4">
                    <div className="flex items-start space-x-3 p-4 border rounded-lg">
                      <Checkbox
                        id="all-terms"
                        checked={allTermsAgreed}
                        onCheckedChange={handleAllTermsChange}
                        className="mt-1"
                      />
                      <div className="flex-1">
                        <label htmlFor="all-terms" className="font-semibold cursor-pointer">
                          전체 약관에 동의합니다
                        </label>
                      </div>
                    </div>

                    <div className="space-y-3 pl-4">
                      <div className="flex items-start space-x-3">
                        <Checkbox
                          id="terms-service"
                          checked={termsService}
                          onCheckedChange={(checked) => setTermsService(checked as boolean)}
                          className="mt-1"
                        />
                        <div className="flex-1">
                          <label htmlFor="terms-service" className="text-sm cursor-pointer">
                            [필수] 이용약관 동의
                          </label>
                        </div>
                      </div>

                      <div className="flex items-start space-x-3">
                        <Checkbox
                          id="terms-privacy"
                          checked={termsPrivacy}
                          onCheckedChange={(checked) => setTermsPrivacy(checked as boolean)}
                          className="mt-1"
                        />
                        <div className="flex-1">
                          <label htmlFor="terms-privacy" className="text-sm cursor-pointer">
                            [필수] 개인정보 수집 및 이용 동의
                          </label>
                        </div>
                      </div>
                    </div>
                  </div>

                  <Button onClick={handleStep1Next} className="w-full" size="lg">
                    다음
                  </Button>
                </div>
              )}

              {/* Step 2: Information Input */}
              {step === 2 && (
                <div className="space-y-6">
                  <div className="space-y-4">
                    {/* Email */}
                    <div>
                      <Label htmlFor="email">이메일 (아이디) *</Label>
                      <Input
                        id="email"
                        type="email"
                        placeholder="example@email.com"
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        className={errors.email ? "border-red-500" : ""}
                      />
                      {errors.email && <p className="text-sm text-red-500 mt-1">{errors.email}</p>}
                    </div>

                    {/* Password */}
                    <div>
                      <Label htmlFor="password">비밀번호 *</Label>
                      <Input
                        id="password"
                        type="password"
                        placeholder="8자 이상 입력"
                        value={formData.password}
                        onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                        className={errors.password ? "border-red-500" : ""}
                      />
                      {errors.password && <p className="text-sm text-red-500 mt-1">{errors.password}</p>}
                    </div>

                    {/* Password Confirm */}
                    <div>
                      <Label htmlFor="passwordConfirm">비밀번호 확인 *</Label>
                      <Input
                        id="passwordConfirm"
                        type="password"
                        placeholder="비밀번호 재입력"
                        value={formData.passwordConfirm}
                        onChange={(e) => setFormData({ ...formData, passwordConfirm: e.target.value })}
                        className={errors.passwordConfirm ? "border-red-500" : ""}
                      />
                      {errors.passwordConfirm && <p className="text-sm text-red-500 mt-1">{errors.passwordConfirm}</p>}
                    </div>

                    {/* Name */}
                    <div>
                      <Label htmlFor="name">이름 *</Label>
                      <Input
                        id="name"
                        placeholder="홍길동"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        className={errors.name ? "border-red-500" : ""}
                      />
                      {errors.name && <p className="text-sm text-red-500 mt-1">{errors.name}</p>}
                    </div>

                    {/* Phone */}
                    <div>
                      <Label htmlFor="phone">휴대폰 번호 *</Label>
                      <PhoneInput
                        id="phone"
                        value={formData.phone}
                        onChange={(value) => setFormData({ ...formData, phone: value })}
                        className={errors.phone ? "border-red-500" : ""}
                      />
                      {errors.phone && <p className="text-sm text-red-500 mt-1">{errors.phone}</p>}
                    </div>

                    {/* Birth Date */}
                    <div>
                      <Label htmlFor="birthDate">생년월일 *</Label>
                      <Input
                        id="birthDate"
                        type="date"
                        value={formData.birthDate}
                        onChange={(e) => setFormData({ ...formData, birthDate: e.target.value })}
                        className={errors.birthDate ? "border-red-500" : ""}
                      />
                      {errors.birthDate && <p className="text-sm text-red-500 mt-1">{errors.birthDate}</p>}
                    </div>

                    {/* Gender */}
                    <div>
                      <Label>성별 *</Label>
                      <RadioGroup
                        value={formData.gender}
                        onValueChange={(value) => setFormData({ ...formData, gender: value })}
                        className="flex gap-4 mt-2"
                      >
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="male" id="male" />
                          <Label htmlFor="male" className="cursor-pointer">남성</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="female" id="female" />
                          <Label htmlFor="female" className="cursor-pointer">여성</Label>
                        </div>
                      </RadioGroup>
                      {errors.gender && <p className="text-sm text-red-500 mt-1">{errors.gender}</p>}
                    </div>

                    {/* Address */}
                    <div>
                      <Label htmlFor="postcode">우편번호 *</Label>
                      <div className="flex gap-2">
                        <Input
                          id="postcode"
                          placeholder="12345"
                          value={formData.postcode}
                          onChange={(e) => setFormData({ ...formData, postcode: e.target.value })}
                          className={errors.postcode ? "border-red-500" : ""}
                          readOnly
                        />
                        <AddressSearch
                          onComplete={(data) => {
                            setFormData({
                              ...formData,
                              postcode: data.zonecode,
                              addressLine1: data.address,
                            })
                            setErrors({ ...errors, postcode: "", addressLine1: "" })
                          }}
                          buttonText="우편번호 찾기"
                        />
                      </div>
                      {errors.postcode && <p className="text-sm text-red-500 mt-1">{errors.postcode}</p>}
                    </div>

                    <div>
                      <Label htmlFor="addressLine1">주소 *</Label>
                      <Input
                        id="addressLine1"
                        placeholder="서울시 강남구 테헤란로"
                        value={formData.addressLine1}
                        onChange={(e) => setFormData({ ...formData, addressLine1: e.target.value })}
                        className={errors.addressLine1 ? "border-red-500" : ""}
                        readOnly
                      />
                      {errors.addressLine1 && <p className="text-sm text-red-500 mt-1">{errors.addressLine1}</p>}
                    </div>

                    <div>
                      <Label htmlFor="addressLine2">상세주소</Label>
                      <Input
                        id="addressLine2"
                        placeholder="101동 101호"
                        value={formData.addressLine2}
                        onChange={(e) => setFormData({ ...formData, addressLine2: e.target.value })}
                      />
                    </div>
                  </div>

                  <div className="flex gap-3">
                    <Button onClick={() => setStep(1)} variant="outline" className="flex-1" size="lg">
                      이전
                    </Button>
                    <Button onClick={handleRegister} className="flex-1" size="lg">
                      회원가입
                    </Button>
                  </div>
                </div>
              )}

              {/* Step 3: Complete */}
              {step === 3 && (
                <div className="text-center space-y-6 py-8">
                  <div className="flex justify-center">
                    <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center">
                      <Check className="h-10 w-10 text-primary" />
                    </div>
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold mb-2">회원가입이 완료되었습니다!</h2>
                    <p className="text-muted-foreground">신선마켓의 회원이 되신 것을 환영합니다.</p>
                  </div>
                  <div className="flex gap-3 justify-center">
                    <Button onClick={() => router.push("/login")} size="lg">
                      로그인하기
                    </Button>
                    <Button onClick={() => router.push("/")} variant="outline" size="lg">
                      홈으로
                    </Button>
                  </div>
                </div>
              )}
            </div>

            {step < 3 && (
              <div className="text-center mt-6">
                <p className="text-sm text-muted-foreground">
                  이미 회원이신가요?{" "}
                  <Link href="/login" className="text-primary hover:underline font-medium">
                    로그인
                  </Link>
                </p>
              </div>
            )}
          </div>
        </div>
      </main>

      <Footer />
    </div>
  )
}
