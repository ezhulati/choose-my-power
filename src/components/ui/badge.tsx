import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const badgeVariants = cva(
  "inline-flex items-center rounded-md border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
  {
    variants: {
      variant: {
        default:
          "border-transparent bg-primary text-primary-foreground shadow hover:bg-primary/80",
        secondary:
          "border-transparent bg-secondary text-secondary-foreground hover:bg-secondary/80",
        destructive:
          "border-transparent bg-destructive text-destructive-foreground shadow hover:bg-destructive/80",
        outline: "text-foreground",
        success: "border-transparent bg-texas-gold-100 text-texas-navy hover:bg-texas-gold-200",
        warning: "border-transparent bg-orange-100 text-orange-800 hover:bg-orange-200",
        info: "border-transparent bg-texas-navy/10 text-texas-navy hover:bg-texas-navy/20",
        // Texas-themed badges
        "texas-primary": "border-transparent bg-texas-navy text-white shadow hover:bg-texas-navy/90",
        "texas-secondary": "border-transparent bg-texas-red text-white shadow hover:bg-texas-red/90",
        "texas-accent": "border-transparent bg-texas-gold text-texas-navy shadow hover:bg-texas-gold/90 font-semibold",
        "texas-outline": "border-texas-navy text-texas-navy bg-transparent hover:bg-texas-navy/10",
        "plan-type": "border-gray-200 bg-gray-50 text-gray-700 hover:bg-gray-100",
        "featured": "border-transparent bg-gradient-to-r from-texas-gold to-yellow-600 text-white shadow",
        "popular": "border-transparent bg-gradient-to-r from-texas-navy to-blue-800 text-white shadow",
        "green-energy": "border-green-200 bg-green-50 text-green-700 hover:bg-green-100",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  )
}

export { Badge, badgeVariants }
