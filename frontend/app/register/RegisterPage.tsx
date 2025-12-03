"use client"

import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { AddressSearch } from "@/components/address-search"
import { useToast } from "@/hooks/use-toast"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useState } from "react"
import { ChevronRight, Check } from "lucide-react"
import { apiFetch, getErrorMessage } from "@/lib/api-client"
import { PhoneInput } from "@/components/phone-input"
import { TERMS_OF_SERVICE, PRIVACY_POLICY, MARKETING_CONSENT } from "@/lib/terms"
import { formatBirthDate } from "@/lib/format-phone"

export function RegisterPage() {
  const router = useRouter()
  const { toast } = useToast()
  const [step, setStep] = useState(1)
  const [allTermsAgreed, setAllTermsAgreed] = useState(false)
  const [termsService, setTermsService] = useState(false)
  const [termsPrivacy, setTermsPrivacy] = useState(false)
  const [termsMarketing, setTermsMarketing] = useState(false)

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
  const [isAddressSearched, setIsAddressSearched] = useState(false)

  const handleAllTermsChange = (checked: boolean) => {
    setAllTermsAgreed(checked)
    setTermsService(checked)
    setTermsPrivacy(checked)
    setTermsMarketing(checked)
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

  // 개별 필드 검증 함수들
  const validateName = () => {
    if (!formData.name) {
      setErrors(prev => ({ ...prev, name: "이름을 입력해주세요." }))
      return false
    }
    setErrors(prev => ({ ...prev, name: "" }))
    return true
  }

  const validateEmail = () => {
    if (!formData.email) {
      setErrors(prev => ({ ...prev, email: "이메일을 입력해주세요." }))
      return false
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      setErrors(prev => ({ ...prev, email: "올바른 이메일 형식이 아닙니다." }))
      return false
    }
    setErrors(prev => ({ ...prev, email: "" }))
    return true
  }

  const validatePassword = () => {
    if (!formData.password) {
      setErrors(prev => ({ ...prev, password: "비밀번호를 입력해주세요." }))
      return false
    }
    if (formData.password.length < 8) {
      setErrors(prev => ({ ...prev, password: "비밀번호는 최소 8자 이상이어야 합니다." }))
      return false
    }
    // 비밀번호 복잡성 검증: 영문, 숫자, 특수문자 포함 확인
    const passwordRegex = /^(?=.*[A-Za-z])(?=.*\d)(?=.*[@$!%*#?&])[A-Za-z\d@$!%*#?&]{8,}$/
    if (!passwordRegex.test(formData.password)) {
      setErrors(prev => ({ ...prev, password: "비밀번호는 영문, 숫자, 특수문자(@$!%*#?&)를 모두 포함해야 합니다." }))
      return false
    }
    setErrors(prev => ({ ...prev, password: "" }))
    return true
  }

  const validatePasswordConfirm = () => {
    if (!formData.passwordConfirm) {
      setErrors(prev => ({ ...prev, passwordConfirm: "비밀번호 확인을 입력해주세요." }))
      return false
    }
    if (formData.password !== formData.passwordConfirm) {
      setErrors(prev => ({ ...prev, passwordConfirm: "비밀번호가 일치하지 않습니다." }))
      return false
    }
    setErrors(prev => ({ ...prev, passwordConfirm: "" }))
    return true
  }

  const validatePhone = () => {
    if (!formData.phone) {
      setErrors(prev => ({ ...prev, phone: "휴대폰 번호를 입력해주세요." }))
      return false
    }
    // 하이픈 제거 후 숫자만 추출
    const phoneNumbers = formData.phone.replace(/[^\d]/g, "")
    if (phoneNumbers.length !== 11) {
      setErrors(prev => ({ ...prev, phone: "휴대폰 번호는 11자리 숫자여야 합니다." }))
      return false
    }
    setErrors(prev => ({ ...prev, phone: "" }))
    return true
  }

  const validateBirthDate = () => {
    if (!formData.birthDate) {
      setErrors(prev => ({ ...prev, birthDate: "생년월일을 입력해주세요." }))
      return false
    }
    // 하이픈 제거 후 숫자만 추출
    const birthNumbers = formData.birthDate.replace(/[^\d]/g, "")
    if (birthNumbers.length !== 8) {
      setErrors(prev => ({ ...prev, birthDate: "생년월일은 8자리 숫자로 입력해주세요. (예: 1999-01-01)" }))
      return false
    }
    setErrors(prev => ({ ...prev, birthDate: "" }))
    return true
  }

  const validateGender = () => {
    if (!formData.gender) {
      setErrors(prev => ({ ...prev, gender: "성별을 선택해주세요." }))
      return false
    }
    setErrors(prev => ({ ...prev, gender: "" }))
    return true
  }

  const validatePostcode = () => {
    if (!formData.postcode) {
      setErrors(prev => ({ ...prev, postcode: "우편번호를 입력해주세요." }))
      return false
    }
    setErrors(prev => ({ ...prev, postcode: "" }))
    return true
  }

  const validateAddressLine1 = () => {
    if (!formData.addressLine1) {
      setErrors(prev => ({ ...prev, addressLine1: "주소를 입력해주세요." }))
      return false
    }
    setErrors(prev => ({ ...prev, addressLine1: "" }))
    return true
  }

  // 전체 폼 검증 (회원가입 버튼 클릭 시)
  const validateForm = () => {
    const isNameValid = validateName()
    const isEmailValid = validateEmail()
    const isPasswordValid = validatePassword()
    const isPasswordConfirmValid = validatePasswordConfirm()
    const isPhoneValid = validatePhone()
    const isBirthDateValid = validateBirthDate()
    const isGenderValid = validateGender()
    const isPostcodeValid = validatePostcode()
    const isAddressLine1Valid = validateAddressLine1()

    return (
      isNameValid &&
      isEmailValid &&
      isPasswordValid &&
      isPasswordConfirmValid &&
      isPhoneValid &&
      isBirthDateValid &&
      isGenderValid &&
      isPostcodeValid &&
      isAddressLine1Valid
    )
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
          marketingConsent: termsMarketing,
        }),
        parseResponse: "none",
      })

      setStep(3)
      toast({
        title: "회원가입 완료",
        description: "오늘마트에 오신 것을 환영합니다!",
      })
    } catch (error: any) {
      console.log("[Register] 에러 발생:", error)
      console.log("[Register] 에러 상태:", error.status)
      console.log("[Register] 에러 payload:", error.payload)
      console.log("[Register] 에러 message:", error.message)

      // 서버에서 온 구체적인 에러 메시지를 우선적으로 사용
      let errorMessage = error.payload?.message || getErrorMessage(error, "회원가입 중 오류가 발생했습니다.")

      console.log("[Register] 최종 에러 메시지:", errorMessage)

      // 서버 메시지가 없는 400 에러의 경우에만 일반적인 유효성 검사 안내 추가
      if (!error.payload?.message && error.status === 400) {
        errorMessage = "입력하신 정보를 다시 확인해주세요.\n"
        errorMessage += "• 비밀번호는 영문, 숫자, 특수문자(@$!%*#?&)를 모두 포함해야 합니다\n"
        errorMessage += "• 전화번호는 010-1234-5678 형식이어야 합니다\n"
        errorMessage += "• 생년월일은 YYYY-MM-DD 형식이어야 합니다"
      }

      console.log("[Register] 토스트 호출:", { title: "회원가입 실패", description: errorMessage })

      toast({
        title: "회원가입 실패",
        description: errorMessage,
        variant: "destructive",
      })

      console.log("[Register] 토스트 호출 완료")
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
              <p className="text-muted-foreground text-center mb-8">오늘마트 회원이 되어 다양한 혜택을 누리세요</p>

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
                      <div className="flex items-center justify-between">
                        <div className="flex items-start space-x-3">
                          <Checkbox
                            id="terms-service"
                            checked={termsService}
                            onCheckedChange={(checked) => setTermsService(checked as boolean)}
                            className="mt-1"
                          />
                          <label htmlFor="terms-service" className="text-sm cursor-pointer">
                            [필수] 이용약관 동의
                          </label>
                        </div>
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button variant="ghost" size="sm" className="text-xs">
                              자세히 보기
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
                            <DialogHeader>
                              <DialogTitle>이용약관</DialogTitle>
                            </DialogHeader>
                            <div className="whitespace-pre-wrap text-sm">{TERMS_OF_SERVICE}</div>
                          </DialogContent>
                        </Dialog>
                      </div>

                      <div className="flex items-center justify-between">
                        <div className="flex items-start space-x-3">
                          <Checkbox
                            id="terms-privacy"
                            checked={termsPrivacy}
                            onCheckedChange={(checked) => setTermsPrivacy(checked as boolean)}
                            className="mt-1"
                          />
                          <label htmlFor="terms-privacy" className="text-sm cursor-pointer">
                            [필수] 개인정보 수집 및 이용 동의
                          </label>
                        </div>
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button variant="ghost" size="sm" className="text-xs">
                              자세히 보기
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
                            <DialogHeader>
                              <DialogTitle>개인정보 수집 및 이용 동의</DialogTitle>
                            </DialogHeader>
                            <div className="whitespace-pre-wrap text-sm">{PRIVACY_POLICY}</div>
                          </DialogContent>
                        </Dialog>
                      </div>

                      <div className="flex items-center justify-between">
                        <div className="flex items-start space-x-3">
                          <Checkbox
                            id="terms-marketing"
                            checked={termsMarketing}
                            onCheckedChange={(checked) => setTermsMarketing(checked as boolean)}
                            className="mt-1"
                          />
                          <label htmlFor="terms-marketing" className="text-sm cursor-pointer">
                            [선택] 마케팅 정보 수신 동의
                          </label>
                        </div>
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button variant="ghost" size="sm" className="text-xs">
                              자세히 보기
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
                            <DialogHeader>
                              <DialogTitle>마케팅 정보 수신 동의</DialogTitle>
                            </DialogHeader>
                            <div className="whitespace-pre-wrap text-sm">{MARKETING_CONSENT}</div>
                          </DialogContent>
                        </Dialog>
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
                    {/* Name */}
                    <div>
                      <Label htmlFor="name" className="mb-2 block">이름 *</Label>
                      <Input
                        id="name"
                        placeholder="홍길동"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        onBlur={validateName}
                        className={errors.name ? "border-red-500" : ""}
                      />
                      {errors.name && <p className="text-sm text-red-500 mt-1">{errors.name}</p>}
                    </div>

                    {/* Email */}
                    <div>
                      <Label htmlFor="email" className="mb-2 block">이메일 (아이디) *</Label>
                      <Input
                        id="email"
                        type="email"
                        placeholder="example@email.com"
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        onBlur={validateEmail}
                        className={errors.email ? "border-red-500" : ""}
                      />
                      {errors.email && <p className="text-sm text-red-500 mt-1">{errors.email}</p>}
                    </div>

                    {/* Password */}
                    <div>
                      <Label htmlFor="password" className="mb-2 block">비밀번호 *</Label>
                      <Input
                        id="password"
                        type="password"
                        placeholder="영문, 숫자, 특수문자 포함 8자 이상"
                        value={formData.password}
                        onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                        onBlur={validatePassword}
                        className={errors.password ? "border-red-500" : ""}
                      />
                      {!errors.password && formData.password && (
                        <p className="text-xs text-gray-500 mt-1">
                          ✓ 영문, 숫자, 특수문자(@$!%*#?&)를 모두 포함해야 합니다
                        </p>
                      )}
                      {errors.password && <p className="text-sm text-red-500 mt-1">{errors.password}</p>}
                    </div>

                    {/* Password Confirm */}
                    <div>
                      <Label htmlFor="passwordConfirm" className="mb-2 block">비밀번호 확인 *</Label>
                      <Input
                        id="passwordConfirm"
                        type="password"
                        placeholder="비밀번호 재입력"
                        value={formData.passwordConfirm}
                        onChange={(e) => setFormData({ ...formData, passwordConfirm: e.target.value })}
                        onBlur={validatePasswordConfirm}
                        className={errors.passwordConfirm ? "border-red-500" : ""}
                      />
                      {errors.passwordConfirm && <p className="text-sm text-red-500 mt-1">{errors.passwordConfirm}</p>}
                    </div>

                    {/* Phone */}
                    <div>
                      <Label htmlFor="phone" className="mb-2 block">휴대폰 번호 *</Label>
                      <PhoneInput
                        id="phone"
                        value={formData.phone}
                        onChange={(value) => setFormData({ ...formData, phone: value })}
                        onBlur={validatePhone}
                        className={errors.phone ? "border-red-500" : ""}
                      />
                      {errors.phone && <p className="text-sm text-red-500 mt-1">{errors.phone}</p>}
                    </div>

                    {/* Birth Date */}
                    <div>
                      <Label htmlFor="birthDate" className="mb-2 block">생년월일 *</Label>
                      <Input
                        id="birthDate"
                        type="text"
                        placeholder="1999-01-01"
                        maxLength={10}
                        value={formData.birthDate}
                        onChange={(e) => {
                          const formatted = formatBirthDate(e.target.value)
                          setFormData({ ...formData, birthDate: formatted })
                        }}
                        onBlur={validateBirthDate}
                        className={errors.birthDate ? "border-red-500" : ""}
                      />
                      {errors.birthDate && <p className="text-sm text-red-500 mt-1">{errors.birthDate}</p>}
                    </div>

                    {/* Gender */}
                    <div>
                      <Label className="mb-2 block">성별 *</Label>
                      <RadioGroup
                        value={formData.gender}
                        onValueChange={(value) => {
                          setFormData({ ...formData, gender: value })
                          validateGender()
                        }}
                        className="flex gap-4"
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
                    <div className="space-y-3">
                      <div>
                        <Label className="mb-2 block">주소 *</Label>
                        <AddressSearch
                          onComplete={(data) => {
                            setFormData({
                              ...formData,
                              postcode: data.zonecode,
                              addressLine1: data.address,
                            })
                            setIsAddressSearched(true)
                            // 주소 선택 시 에러 클리어
                            setErrors({ ...errors, postcode: "", addressLine1: "" })
                          }}
                          buttonText="주소 검색"
                          variant="outline"
                          size="default"
                          className="w-full"
                        />
                        {(errors.postcode || errors.addressLine1) && (
                          <p className="text-sm text-red-500 mt-1">
                            {errors.postcode || errors.addressLine1}
                          </p>
                        )}
                      </div>

                      {isAddressSearched && (
                        <>
                          <div>
                            <Input
                              id="postcode"
                              placeholder="우편번호"
                              value={formData.postcode}
                              className="bg-muted"
                              readOnly
                            />
                          </div>

                          <div>
                            <Input
                              id="addressLine1"
                              placeholder="기본 주소"
                              value={formData.addressLine1}
                              className="bg-muted"
                              readOnly
                            />
                          </div>

                          <div>
                            <Input
                              id="addressLine2"
                              placeholder="상세주소를 입력하세요 (예: 101동 101호)"
                              value={formData.addressLine2}
                              onChange={(e) => setFormData({ ...formData, addressLine2: e.target.value })}
                            />
                          </div>
                        </>
                      )}
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
                    <p className="text-muted-foreground">오늘마트의 회원이 되신 것을 환영합니다.</p>
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

