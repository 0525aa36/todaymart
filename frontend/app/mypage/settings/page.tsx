"use client"

import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useToast } from "@/hooks/use-toast"
import Link from "next/link"
import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { ChevronLeft, User, Lock } from "lucide-react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { apiFetch, getErrorMessage } from "@/lib/api-client"
import { PhoneInput } from "@/components/phone-input"
import { AddressSearch } from "@/components/address-search"
import { formatBirthDate } from "@/lib/format-phone"
import { Toaster } from "@/components/ui/toaster"

interface UserProfile {
  id: number
  email: string
  name: string
  phone: string
  addressLine1: string
  addressLine2: string
  postcode: string
  birthDate: string
  gender: string
  role: string
  provider: string
  createdAt: string
}

export default function SettingsPage() {
  const router = useRouter()
  const { toast } = useToast()
  const [loading, setLoading] = useState(true)
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [profileForm, setProfileForm] = useState({
    name: "",
    phone: "",
    addressLine1: "",
    addressLine2: "",
    postcode: "",
    birthDate: "",
    gender: "",
  })
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  })
  const [isAddressSearched, setIsAddressSearched] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})

  // 전화번호 검증 함수
  const validatePhone = () => {
    if (!profileForm.phone) {
      setErrors(prev => ({ ...prev, phone: "휴대폰 번호를 입력해주세요." }))
      return false
    }
    // 하이픈 제거 후 숫자만 추출
    const phoneNumbers = profileForm.phone.replace(/[^\d]/g, "")
    if (phoneNumbers.length !== 11) {
      setErrors(prev => ({ ...prev, phone: "휴대폰 번호는 11자리 숫자여야 합니다." }))
      return false
    }
    setErrors(prev => ({ ...prev, phone: "" }))
    return true
  }

  // 생년월일 검증 함수
  const validateBirthDate = () => {
    if (!profileForm.birthDate) {
      setErrors(prev => ({ ...prev, birthDate: "생년월일을 입력해주세요." }))
      return false
    }
    // 하이픈 제거 후 숫자만 추출
    const birthNumbers = profileForm.birthDate.replace(/[^\d]/g, "")
    if (birthNumbers.length !== 8) {
      setErrors(prev => ({ ...prev, birthDate: "생년월일은 8자리 숫자로 입력해주세요. (예: 1999-01-01)" }))
      return false
    }
    setErrors(prev => ({ ...prev, birthDate: "" }))
    return true
  }

  useEffect(() => {
    const token = localStorage.getItem("token")
    if (!token) {
      router.push("/login")
      return
    }

    fetchProfile()
  }, [])

  const fetchProfile = async () => {
    const token = localStorage.getItem("token")
    if (!token) return

    try {
      const data = await apiFetch<UserProfile>("/api/users/profile", { auth: true })
      setProfile(data)
      setProfileForm({
        name: data.name || "",
        phone: data.phone || "",
        addressLine1: data.addressLine1 || "",
        addressLine2: data.addressLine2 || "",
        postcode: data.postcode || "",
        birthDate: data.birthDate || "",
        gender: data.gender || "",
      })
      // 주소가 있으면 주소 필드 표시
      if (data.postcode || data.addressLine1) {
        setIsAddressSearched(true)
      }
    } catch (error) {
      console.error("Error fetching profile:", error)
      toast({
        title: "오류",
        description: getErrorMessage(error, "프로필 정보를 불러오는 중 오류가 발생했습니다."),
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleProfileUpdate = async (e: React.FormEvent) => {
    e.preventDefault()

    // 검증 실행 (값이 있을 때만)
    if (profileForm.phone) {
      const isPhoneValid = validatePhone()
      if (!isPhoneValid) {
        toast({
          title: "입력 오류",
          description: "전화번호를 확인해주세요.",
          variant: "destructive",
        })
        return
      }
    }

    if (profileForm.birthDate) {
      const isBirthDateValid = validateBirthDate()
      if (!isBirthDateValid) {
        toast({
          title: "입력 오류",
          description: "생년월일을 확인해주세요.",
          variant: "destructive",
        })
        return
      }
    }

    const token = localStorage.getItem("token")
    if (!token) return

    try {
      await apiFetch("/api/users/profile", {
        method: "PUT",
        auth: true,
        body: JSON.stringify(profileForm),
        parseResponse: "none",
      })

      toast({
        title: "저장되었습니다",
        description: "프로필 정보가 성공적으로 수정되었습니다.",
      })
      fetchProfile()
    } catch (error) {
      console.error("Error updating profile:", error)
      toast({
        title: "오류",
        description: getErrorMessage(error, "프로필 수정 중 오류가 발생했습니다."),
        variant: "destructive",
      })
    }
  }

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault()

    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      toast({
        title: "오류",
        description: "새 비밀번호와 확인 비밀번호가 일치하지 않습니다.",
        variant: "destructive",
      })
      return
    }

    const token = localStorage.getItem("token")
    if (!token) return

    try {
      await apiFetch("/api/users/change-password", {
        method: "POST",
        auth: true,
        body: JSON.stringify(passwordForm),
        parseResponse: "none",
      })

      toast({
        title: "변경되었습니다",
        description: "비밀번호가 성공적으로 변경되었습니다.",
      })
      setPasswordForm({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      })
    } catch (error) {
      console.error("Error changing password:", error)
      toast({
        title: "오류",
        description: getErrorMessage(error, "비밀번호 변경 중 오류가 발생했습니다."),
        variant: "destructive",
      })
    }
  }

  const formatDate = (dateString: string) => {
    if (!dateString) return ""
    const date = new Date(dateString)
    return date.toLocaleDateString("ko-KR", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    })
  }

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
    )
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Header />

      <main className="flex-1 py-8 bg-muted/30">
        <div className="container mx-auto px-4 max-w-4xl">
          {/* Header */}
          <div className="mb-8">
            <Button variant="ghost" asChild className="mb-4">
              <Link href="/mypage">
                <ChevronLeft className="h-4 w-4 mr-2" />
                마이페이지로 돌아가기
              </Link>
            </Button>
            <h1 className="text-3xl font-bold">계정 설정</h1>
          </div>

          {/* Settings Tabs */}
          <Tabs defaultValue="profile" className="space-y-6">
            <TabsList className={`grid w-full ${profile?.provider === "LOCAL" ? "grid-cols-2" : "grid-cols-1"}`}>
              <TabsTrigger value="profile">
                <User className="h-4 w-4 mr-2" />
                프로필 정보
              </TabsTrigger>
              {profile?.provider === "LOCAL" && (
                <TabsTrigger value="password">
                  <Lock className="h-4 w-4 mr-2" />
                  비밀번호 변경
                </TabsTrigger>
              )}
            </TabsList>

            {/* Profile Tab */}
            <TabsContent value="profile">
              <Card>
                <CardHeader>
                  <CardTitle>프로필 정보</CardTitle>
                  <CardDescription>회원 정보를 수정할 수 있습니다.</CardDescription>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleProfileUpdate} className="space-y-4">
                    <div className="grid gap-4">
                      <div>
                        <Label htmlFor="email" className="mb-2 block">이메일</Label>
                        <Input
                          id="email"
                          type="email"
                          value={profile?.email || ""}
                          disabled
                          className="bg-muted"
                        />
                        <p className="text-xs text-muted-foreground mt-1">
                          이메일은 변경할 수 없습니다.
                        </p>
                      </div>

                      <div>
                        <Label htmlFor="name" className="mb-2 block">이름</Label>
                        <Input
                          id="name"
                          value={profileForm.name}
                          onChange={(e) => setProfileForm({ ...profileForm, name: e.target.value })}
                          required
                        />
                      </div>

                      <div>
                        <Label htmlFor="phone" className="mb-2 block">전화번호</Label>
                        <PhoneInput
                          id="phone"
                          value={profileForm.phone}
                          onChange={(value) => {
                            setProfileForm({ ...profileForm, phone: value })
                            setErrors(prev => ({ ...prev, phone: "" }))
                          }}
                          onBlur={validatePhone}
                          required
                        />
                        {errors.phone && (
                          <p className="text-sm text-destructive mt-1">{errors.phone}</p>
                        )}
                      </div>

                      <div className="space-y-3">
                        <div>
                          <Label className="mb-2 block">주소</Label>
                          <AddressSearch
                            onComplete={(data) => {
                              setProfileForm({
                                ...profileForm,
                                postcode: data.zonecode,
                                addressLine1: data.address,
                              })
                              setIsAddressSearched(true)
                            }}
                            buttonText="주소 검색"
                            variant="outline"
                            size="default"
                            className="w-full"
                          />
                        </div>

                        {isAddressSearched && (
                          <>
                            <div>
                              <Input
                                id="postcode"
                                placeholder="우편번호"
                                value={profileForm.postcode}
                                readOnly
                                className="bg-muted"
                              />
                            </div>

                            <div>
                              <Input
                                id="addressLine1"
                                placeholder="주소"
                                value={profileForm.addressLine1}
                                readOnly
                                className="bg-muted"
                                required
                              />
                            </div>

                            <div>
                              <Input
                                id="addressLine2"
                                placeholder="상세 주소"
                                value={profileForm.addressLine2}
                                onChange={(e) =>
                                  setProfileForm({ ...profileForm, addressLine2: e.target.value })
                                }
                              />
                            </div>
                          </>
                        )}
                      </div>

                      <div>
                        <Label htmlFor="birthDate" className="mb-2 block">생년월일</Label>
                        <Input
                          id="birthDate"
                          type="text"
                          placeholder="1999-01-01"
                          maxLength={10}
                          value={profileForm.birthDate}
                          onChange={(e) => {
                            const formatted = formatBirthDate(e.target.value)
                            setProfileForm({ ...profileForm, birthDate: formatted })
                            setErrors(prev => ({ ...prev, birthDate: "" }))
                          }}
                          onBlur={validateBirthDate}
                        />
                        {errors.birthDate && (
                          <p className="text-sm text-destructive mt-1">{errors.birthDate}</p>
                        )}
                      </div>

                      <div>
                        <Label className="mb-2 block">성별</Label>
                        <RadioGroup
                          value={profileForm.gender}
                          onValueChange={(value) =>
                            setProfileForm({ ...profileForm, gender: value })
                          }
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
                      </div>

                      <div className="pt-4">
                        <Label className="mb-2 block">가입일</Label>
                        <p className="text-sm text-muted-foreground">
                          {formatDate(profile?.createdAt || "")}
                        </p>
                      </div>
                    </div>

                    <div className="flex justify-end">
                      <Button type="submit">프로필 저장</Button>
                    </div>
                  </form>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Password Tab - LOCAL 사용자만 표시 */}
            {profile?.provider === "LOCAL" && (
              <TabsContent value="password">
                <Card>
                  <CardHeader>
                    <CardTitle>비밀번호 변경</CardTitle>
                    <CardDescription>
                      보안을 위해 주기적으로 비밀번호를 변경하는 것을 권장합니다.
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <form onSubmit={handlePasswordChange} className="space-y-4">
                      <div className="grid gap-4">
                        <div>
                          <Label htmlFor="currentPassword">현재 비밀번호</Label>
                          <Input
                            id="currentPassword"
                            type="password"
                            value={passwordForm.currentPassword}
                            onChange={(e) =>
                              setPasswordForm({ ...passwordForm, currentPassword: e.target.value })
                            }
                            required
                          />
                        </div>

                        <div>
                          <Label htmlFor="newPassword">새 비밀번호</Label>
                          <Input
                            id="newPassword"
                            type="password"
                            value={passwordForm.newPassword}
                            onChange={(e) =>
                              setPasswordForm({ ...passwordForm, newPassword: e.target.value })
                            }
                            required
                          />
                          <p className="text-xs text-muted-foreground mt-1">
                            최소 8자 이상, 영문, 숫자, 특수문자를 포함해야 합니다.
                          </p>
                        </div>

                        <div>
                          <Label htmlFor="confirmPassword">새 비밀번호 확인</Label>
                          <Input
                            id="confirmPassword"
                            type="password"
                            value={passwordForm.confirmPassword}
                            onChange={(e) =>
                              setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })
                            }
                            required
                          />
                        </div>
                      </div>

                      <div className="flex justify-end">
                        <Button type="submit">비밀번호 변경</Button>
                      </div>
                    </form>
                  </CardContent>
                </Card>
              </TabsContent>
            )}
          </Tabs>
        </div>
      </main>

      <Footer />
      <Toaster />
    </div>
  )
}
