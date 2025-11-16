import { Button, ButtonProps } from "@/components/ui/button"
import { Loader2 } from "lucide-react"
import { forwardRef } from "react"

interface LoadingButtonProps extends ButtonProps {
  isLoading?: boolean
  loadingText?: string
}

export const LoadingButton = forwardRef<HTMLButtonElement, LoadingButtonProps>(
  ({ isLoading, loadingText, children, disabled, ...props }, ref) => {
    return (
      <Button ref={ref} disabled={isLoading || disabled} {...props}>
        {isLoading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
        {isLoading && loadingText ? loadingText : children}
      </Button>
    )
  }
)

LoadingButton.displayName = "LoadingButton"
