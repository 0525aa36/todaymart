"use client"

import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import Link from "next/link"
import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { MapPin, Plus, Edit, Trash2, ChevronLeft } from "lucide-react"
import { ApiError, apiFetch, getErrorMessage } from "@/lib/api-client"
import { useToast } from "@/hooks/use-toast"
import { AddressSearch } from "@/components/address-search"

interface Address {
  id: number
  label: string
  recipient: string
  phone: string
  postcode: string
  addressLine1: string
  addressLine2: string
  isDefault: boolean
}

const emptyForm = {
  label: "",
  recipient: "",
  phone: "",
  postcode: "",
  addressLine1: "",
  addressLine2: "",
  isDefault: false,
}

export default function AddressManagementPage() {
  const router = useRouter()
  const { toast } = useToast()
  const [addresses, setAddresses] = useState<Address[]>([])
  const [loading, setLoading] = useState(true)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingAddress, setEditingAddress] = useState<Address | null>(null)
  const [formData, setFormData] = useState(emptyForm)

  useEffect(() => {
    const token = localStorage.getItem("token")
    if (!token) {
      router.push("/login")
      return
    }
    fetchAddresses()
  }, [])

  const fetchAddresses = async () => {
    try {
      const data = await apiFetch<Address[]>("/api/addresses", { auth: true })
      setAddresses(data)
    } catch (error) {
      if (error instanceof ApiError && error.status === 401) {
        toast({
          title: "접근 권한 없음",
          description: "세션이 만료되었거나 권한이 없습니다. 다시 로그인해 주세요.",
          variant: "destructive",
        })
        return
      }
      console.error("Error fetching addresses:", error)
      toast({
        title: "오류",
        description: getErrorMessage(error, "배송지를 불러오는 중 오류가 발생했습니다."),
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const openCreateDialog = () => {
    setEditingAddress(null)
    setFormData(emptyForm)
    setIsDialogOpen(true)
  }

  const openEditDialog = (address: Address) => {
    setEditingAddress(address)
    setFormData({
      label: address.label,
      recipient: address.recipient,
      phone: address.phone,
      postcode: address.postcode,
      addressLine1: address.addressLine1,
      addressLine2: address.addressLine2 || "",
      isDefault: address.isDefault,
    })
    setIsDialogOpen(true)
  }

  const handleDialogClose = (open: boolean) => {
    setIsDialogOpen(open)
    if (!open) {
      setEditingAddress(null)
      setFormData(emptyForm)
    }
  }

  const handleDelete = async (id: number) => {
    if (!confirm("배송지를 삭제하시겠습니까?")) return
    try {
      await apiFetch(`/api/addresses/${id}`, {
        method: "DELETE",
        auth: true,
        parseResponse: "none",
      })
      toast({
        title: "삭제 완료",
        description: "배송지가 삭제되었습니다.",
      })
      fetchAddresses()
    } catch (error) {
      if (error instanceof ApiError && error.status === 401) {
        toast({
          title: "접근 권한 없음",
          description: "세션이 만료되었거나 권한이 없습니다. 다시 로그인해 주세요.",
          variant: "destructive",
        })
        return
      }
      console.error("Error deleting address:", error)
      toast({
        title: "오류",
        description: getErrorMessage(error, "배송지 삭제 중 오류가 발생했습니다."),
        variant: "destructive",
      })
    }
  }

  const handleSetDefault = async (id: number) => {
    try {
      await apiFetch(`/api/addresses/${id}/default`, {
        method: "PUT",
        auth: true,
        parseResponse: "none",
      })
      toast({
        title: "기본 배송지 설정",
        description: "기본 배송지가 변경되었습니다.",
      })
      fetchAddresses()
    } catch (error) {
      if (error instanceof ApiError && error.status === 401) {
        toast({
          title: "접근 권한 없음",
          description: "세션이 만료되었거나 권한이 없습니다. 다시 로그인해 주세요.",
          variant: "destructive",
        })
        return
      }
      console.error("Error setting default address:", error)
      toast({
        title: "오류",
        description: getErrorMessage(error, "기본 배송지 설정 중 오류가 발생했습니다."),
        variant: "destructive",
      })
    }
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    const payload = {
      label: formData.label,
      recipient: formData.recipient,
      phone: formData.phone,
      postcode: formData.postcode,
      addressLine1: formData.addressLine1,
      addressLine2: formData.addressLine2,
      isDefault: formData.isDefault,
    }

    try {
      if (editingAddress) {
        await apiFetch(`/api/addresses/${editingAddress.id}`, {
          method: "PUT",
          auth: true,
          body: JSON.stringify(payload),
        })
        toast({
          title: "수정 완료",
          description: "배송지가 수정되었습니다.",
        })
      } else {
        await apiFetch("/api/addresses", {
          method: "POST",
          auth: true,
          body: JSON.stringify(payload),
        })
        toast({
          title: "등록 완료",
          description: "새 배송지가 등록되었습니다.",
        })
      }
      handleDialogClose(false)
      fetchAddresses()
    } catch (error) {
      if (error instanceof ApiError && error.status === 401) {
        toast({
          title: "접근 권한 없음",
          description: "세션이 만료되었거나 권한이 없습니다. 다시 로그인해 주세요.",
          variant: "destructive",
        })
        return
      }
      console.error("Error saving address:", error)
      toast({
        title: "오류",
        description: getErrorMessage(error, "배송지 저장 중 오류가 발생했습니다."),
        variant: "destructive",
      })
    }
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Header />

      <main className="flex-1 py-8 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <div className="flex items-center gap-4 mb-8">
              <Link href="/mypage">
                <Button variant="ghost" size="icon">
                  <ChevronLeft className="h-5 w-5" />
                </Button>
              </Link>
              <h1 className="text-3xl font-bold">배송지 관리</h1>
            </div>

            <Dialog open={isDialogOpen} onOpenChange={handleDialogClose}>
              <DialogTrigger asChild>
                <Button className="w-full mb-6" size="lg" onClick={openCreateDialog}>
                  <Plus className="h-5 w-5 mr-2" />
                  새 배송지 추가
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>{editingAddress ? "배송지 수정" : "새 배송지 추가"}</DialogTitle>
                </DialogHeader>
                <form className="space-y-4 mt-4" onSubmit={handleSave}>
                  <div className="space-y-2">
                    <Label htmlFor="address-name">배송지명 *</Label>
                    <Input
                      id="address-name"
                      placeholder="예: 집, 회사"
                      value={formData.label}
                      onChange={(e) => setFormData({ ...formData, label: e.target.value })}
                    />
                  </div>

                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="recipient">받는 사람 *</Label>
                      <Input
                        id="recipient"
                        placeholder="홍길동"
                        value={formData.recipient}
                        onChange={(e) => setFormData({ ...formData, recipient: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="phone">휴대폰 번호 *</Label>
                      <Input
                        id="phone"
                        placeholder="010-0000-0000"
                        value={formData.phone}
                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="address">주소 *</Label>
                    <div className="flex gap-2 mb-2">
                      <Input
                        id="zipcode"
                        placeholder="우편번호"
                        className="w-32"
                        value={formData.postcode}
                        onChange={(e) => setFormData({ ...formData, postcode: e.target.value })}
                        readOnly
                      />
                      <AddressSearch
                        onComplete={(data) => {
                          setFormData({
                            ...formData,
                            postcode: data.zonecode,
                            addressLine1: data.address,
                          })
                        }}
                        buttonText="주소검색"
                      />
                    </div>
                    <Input
                      id="address"
                      placeholder="기본주소"
                      className="mb-2"
                      value={formData.addressLine1}
                      onChange={(e) => setFormData({ ...formData, addressLine1: e.target.value })}
                      readOnly
                    />
                    <Input
                      id="address-detail"
                      placeholder="상세주소를 입력하세요"
                      value={formData.addressLine2}
                      onChange={(e) => setFormData({ ...formData, addressLine2: e.target.value })}
                    />
                  </div>

                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="set-default"
                      checked={formData.isDefault}
                      onCheckedChange={(checked) => setFormData({ ...formData, isDefault: checked === true })}
                    />
                    <label htmlFor="set-default" className="text-sm cursor-pointer">
                      기본 배송지로 설정
                    </label>
                  </div>

                  <div className="flex gap-3 pt-4">
                    <Button
                      type="button"
                      variant="outline"
                      className="flex-1 bg-transparent"
                      onClick={() => handleDialogClose(false)}
                    >
                      취소
                    </Button>
                    <Button type="submit" className="flex-1">
                      저장
                    </Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>

            {loading ? (
              <Card>
                <CardContent className="py-20 text-center">로딩 중...</CardContent>
              </Card>
            ) : addresses.length === 0 ? (
              <Card>
                <CardContent className="py-20 text-center">
                  <MapPin className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
                  <h2 className="text-xl font-semibold mb-2">등록된 배송지가 없습니다</h2>
                  <p className="text-muted-foreground mb-6">자주 사용하는 배송지를 등록해보세요</p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                {addresses.map((address) => (
                  <Card key={address.id}>
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-2">
                          <CardTitle className="text-lg">{address.label}</CardTitle>
                          {address.isDefault && (
                            <Badge className="bg-primary text-primary-foreground">기본배송지</Badge>
                          )}
                        </div>
                        <div className="flex gap-2">
                          <Button variant="ghost" size="icon" onClick={() => openEditDialog(address)}>
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="text-destructive"
                            onClick={() => handleDelete(address.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      <div className="text-sm text-muted-foreground">
                        <div className="font-semibold">{address.recipient}</div>
                        <div>{address.phone}</div>
                      </div>
                      <div className="text-sm text-muted-foreground">
                        <div>{address.postcode}</div>
                        <div>{address.addressLine1}</div>
                        {address.addressLine2 && <div>{address.addressLine2}</div>}
                      </div>
                      <div className="flex justify-between pt-4">
                        <Button
                          variant="outline"
                          size="sm"
                          disabled={address.isDefault}
                          onClick={() => handleSetDefault(address.id)}
                        >
                          기본설정
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </div>
      </main>

      <Footer />
    </div>
  )
}
