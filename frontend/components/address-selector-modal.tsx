"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Label } from "@/components/ui/label"
import { apiFetch } from "@/lib/api-client"
import { useToast } from "@/hooks/use-toast"

interface UserAddress {
  id: number
  label: string
  recipient: string
  phone: string
  postcode: string
  addressLine1: string
  addressLine2: string
  isDefault: boolean
}

interface AddressSelectorModalProps {
  isOpen: boolean
  onClose: () => void
  onSelectAddress: (address: UserAddress) => void
}

export function AddressSelectorModal({ isOpen, onClose, onSelectAddress }: AddressSelectorModalProps) {
  const [addresses, setAddresses] = useState<UserAddress[]>([])
  const [selectedAddressId, setSelectedAddressId] = useState<number | null>(null)
  const [loading, setLoading] = useState(false)
  const { toast } = useToast()

  useEffect(() => {
    if (isOpen) {
      fetchAddresses()
    }
  }, [isOpen])

  const fetchAddresses = async () => {
    setLoading(true)
    try {
      const data = await apiFetch<UserAddress[]>("/api/addresses", { auth: true })
      setAddresses(data)

      // 기본 배송지가 있으면 선택
      const defaultAddress = data.find((addr) => addr.isDefault)
      if (defaultAddress) {
        setSelectedAddressId(defaultAddress.id)
      } else if (data.length > 0) {
        setSelectedAddressId(data[0].id)
      }
    } catch (error) {
      console.error("Error fetching addresses:", error)
      toast({
        title: "오류",
        description: "배송지 목록을 불러오는 중 오류가 발생했습니다.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleConfirm = () => {
    const selectedAddress = addresses.find((addr) => addr.id === selectedAddressId)
    if (selectedAddress) {
      onSelectAddress(selectedAddress)
      onClose()
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>배송지 선택</DialogTitle>
        </DialogHeader>

        {loading ? (
          <div className="py-8 text-center text-muted-foreground">로딩 중...</div>
        ) : addresses.length === 0 ? (
          <div className="py-8 text-center text-muted-foreground">
            등록된 배송지가 없습니다.
          </div>
        ) : (
          <div className="space-y-4">
            <RadioGroup value={selectedAddressId?.toString()} onValueChange={(value) => setSelectedAddressId(Number(value))}>
              {addresses.map((address) => (
                <div
                  key={address.id}
                  className="flex items-start space-x-3 rounded-lg border p-4 hover:bg-muted/50 transition-colors"
                >
                  <RadioGroupItem value={address.id.toString()} id={`address-${address.id}`} className="mt-1" />
                  <Label htmlFor={`address-${address.id}`} className="flex-1 cursor-pointer">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold">{address.label}</span>
                        {address.isDefault && (
                          <span className="text-xs bg-primary text-primary-foreground px-2 py-0.5 rounded">기본배송지</span>
                        )}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        <div>{address.recipient} | {address.phone}</div>
                        <div className="mt-1">
                          [{address.postcode}] {address.addressLine1}
                        </div>
                        {address.addressLine2 && <div>{address.addressLine2}</div>}
                      </div>
                    </div>
                  </Label>
                </div>
              ))}
            </RadioGroup>

            <div className="flex justify-end gap-2 pt-4">
              <Button variant="outline" onClick={onClose}>
                취소
              </Button>
              <Button onClick={handleConfirm} disabled={!selectedAddressId}>
                선택
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
