"use client"

import { Input } from "@/components/ui/input"
import { formatPhoneNumber } from "@/lib/format-phone"
import { forwardRef, ChangeEvent } from "react"

interface PhoneInputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'onChange' | 'type'> {
  value?: string
  onChange?: (value: string) => void
}

export const PhoneInput = forwardRef<HTMLInputElement, PhoneInputProps>(
  ({ value = '', onChange, ...props }, ref) => {
    const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
      const formatted = formatPhoneNumber(e.target.value)
      onChange?.(formatted)
    }

    return (
      <Input
        ref={ref}
        type="tel"
        value={value}
        onChange={handleChange}
        placeholder="010-0000-0000"
        maxLength={13} // 010-0000-0000 = 13자
        {...props}
      />
    )
  }
)

PhoneInput.displayName = 'PhoneInput'
