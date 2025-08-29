import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default:
          "bg-primary text-primary-foreground shadow hover:bg-primary/90",
        destructive:
          "bg-destructive text-destructive-foreground shadow-sm hover:bg-destructive/90",
        outline:
          "border border-input bg-background shadow-sm hover:bg-accent hover:text-accent-foreground",
        secondary:
          "bg-secondary text-secondary-foreground shadow-sm hover:bg-secondary/80",
        ghost: "hover:bg-accent hover:text-accent-foreground",
        link: "text-primary underline-offset-4 hover:underline",
        // Texas-themed variants
        "texas-primary": 
          "bg-gradient-to-r from-texas-navy to-blue-800 text-white shadow-lg hover:from-texas-navy/90 hover:to-blue-800/90 hover:shadow-xl focus-visible:ring-texas-navy/50",
        "texas-secondary":
          "bg-gradient-to-r from-texas-red to-red-700 text-white shadow-lg hover:from-texas-red/90 hover:to-red-700/90 hover:shadow-xl focus-visible:ring-texas-red/50",
        "texas-accent":
          "bg-gradient-to-r from-texas-gold to-yellow-600 text-texas-navy shadow-lg hover:from-texas-gold/90 hover:to-yellow-600/90 hover:shadow-xl focus-visible:ring-texas-gold/50 font-semibold",
        "texas-outline":
          "border-2 border-texas-navy text-texas-navy bg-white hover:bg-texas-navy hover:text-white shadow-sm hover:shadow-md focus-visible:ring-texas-navy/50",
        "texas-outline-red":
          "border-2 border-texas-red text-texas-red bg-white hover:bg-texas-red hover:text-white shadow-sm hover:shadow-md focus-visible:ring-texas-red/50",
        "texas-ghost":
          "text-texas-navy hover:bg-texas-navy/10 hover:text-texas-navy focus-visible:ring-texas-navy/30",
        "texas-cream":
          "bg-texas-cream text-texas-navy border border-texas-cream hover:bg-texas-cream/80 shadow-sm focus-visible:ring-texas-gold/50",
      },
      size: {
        default: "h-10 px-4 py-2",
        sm: "h-8 rounded-md px-3 text-xs",
        lg: "h-12 rounded-lg px-8 text-base",
        xl: "h-14 rounded-lg px-10 text-lg",
        icon: "h-10 w-10",
        "icon-sm": "h-8 w-8",
        "icon-lg": "h-12 w-12",
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
