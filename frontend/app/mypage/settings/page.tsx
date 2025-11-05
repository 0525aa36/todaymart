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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { apiFetch, getErrorMessage } from "@/lib/api-client"
import { PhoneInput } from "@/components/phone-input"

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
        title: "프로필 수정 완료",
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
        title: "비밀번호 변경 완료",
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
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="profile">
                <User className="h-4 w-4 mr-2" />
                프로필 정보
              </TabsTrigger>
              <TabsTrigger value="password">
                <Lock className="h-4 w-4 mr-2" />
                비밀번호 변경
              </TabsTrigger>
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
                        <Label htmlFor="email">이메일</Label>
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
                        <Label htmlFor="name">이름</Label>
                        <Input
                          id="name"
                          value={profileForm.name}
                          onChange={(e) => setProfileForm({ ...profileForm, name: e.target.value })}
                          required
                        />
                      </div>

                      <div>
                        <Label htmlFor="phone">전화번호</Label>
                        <PhoneInput
                          id="phone"
                          value={profileForm.phone}
                          onChange={(value) => setProfileForm({ ...profileForm, phone: value })}
                          required
                        />
                      </div>

                      <div>
                        <Label htmlFor="postcode">우편번호</Label>
                        <Input
                          id="postcode"
                          value={profileForm.postcode}
                          onChange={(e) => setProfileForm({ ...profileForm, postcode: e.target.value })}
                        />
                      </div>

                      <div>
                        <Label htmlFor="addressLine1">주소</Label>
                        <Input
                          id="addressLine1"
                          value={profileForm.addressLine1}
                          onChange={(e) =>
                            setProfileForm({ ...profileForm, addressLine1: e.target.value })
                          }
                          required
                        />
                      </div>

                      <div>
                        <Label htmlFor="addressLine2">상세 주소</Label>
                        <Input
                          id="addressLine2"
                          value={profileForm.addressLine2}
                          onChange={(e) =>
                            setProfileForm({ ...profileForm, addressLine2: e.target.value })
                          }
                        />
                      </div>

                      <div>
                        <Label htmlFor="birthDate">생년월일</Label>
                        <Input
                          id="birthDate"
                          type="date"
                          value={profileForm.birthDate}
                          onChange={(e) =>
                            setProfileForm({ ...profileForm, birthDate: e.target.value })
                          }
                        />
                      </div>

                      <div>
                        <Label htmlFor="gender">성별</Label>
                        <Select
                          value={profileForm.gender}
                          onValueChange={(value) =>
                            setProfileForm({ ...profileForm, gender: value })
                          }
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="성별을 선택하세요" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="male">남성</SelectItem>
                            <SelectItem value="female">여성</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="pt-4">
                        <Label>가입일</Label>
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

            {/* Password Tab */}
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
          </Tabs>
        </div>
      </main>

      <Footer />
    </div>
  )
}
