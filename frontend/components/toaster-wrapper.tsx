'use client'

import { useEffect } from 'react'
import { Toaster, toast } from 'sonner'

export function ToasterWrapper() {
  useEffect(() => {
    const handleClick = () => {
      toast.dismiss()
    }

    document.addEventListener('click', handleClick)

    return () => {
      document.removeEventListener('click', handleClick)
    }
  }, [])

  return (
    <Toaster
      position="bottom-right"
      richColors
      closeButton
      duration={4000}
      toastOptions={{
        style: {
          marginBottom: '1rem',
          marginRight: '1rem',
          backgroundColor: '#DAE7E9',
          border: 'none',
          color: '#1a1a1a',
        },
        classNames: {
          closeButton: '!bg-transparent !text-black hover:!bg-black/10 !border-none',
        },
      }}
    />
  )
}
