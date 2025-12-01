import { Button, buttonVariants } from "@/components/ui/button"
import { Loader2 } from "lucide-react"
import { forwardRef, ComponentProps } from "react"
import { type VariantProps } from "class-variance-authority"

type ButtonProps = ComponentProps<typeof Button> & VariantProps<typeof buttonVariants>

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
