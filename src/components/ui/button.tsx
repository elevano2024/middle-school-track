
import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-full text-label-large font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 state-layer [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground elevation-2 hover:elevation-3 active:elevation-1",
        destructive: "bg-destructive text-destructive-foreground elevation-2 hover:elevation-3 active:elevation-1",
        outline: "border border-input bg-transparent hover:bg-accent hover:text-accent-foreground elevation-0 hover:elevation-1",
        secondary: "bg-secondary text-secondary-foreground elevation-1 hover:elevation-2 active:elevation-0",
        ghost: "hover:bg-accent hover:text-accent-foreground elevation-0",
        link: "text-primary underline-offset-4 hover:underline elevation-0",
        elevated: "bg-surface-container-low text-foreground elevation-1 hover:elevation-2 active:elevation-0",
        filled: "bg-primary text-primary-foreground elevation-0 hover:elevation-1 active:elevation-0",
        tonal: "bg-secondary text-secondary-foreground elevation-0 hover:elevation-1 active:elevation-0",
      },
      size: {
        default: "h-10 px-6 py-2",
        sm: "h-9 rounded-full px-4",
        lg: "h-12 rounded-full px-8",
        icon: "h-10 w-10",
        fab: "h-14 w-14 rounded-2xl elevation-3 hover:elevation-4 active:elevation-2",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button"
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    )
  }
)
Button.displayName = "Button"

export { Button, buttonVariants }
