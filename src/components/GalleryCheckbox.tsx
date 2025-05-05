import * as React from "react"
import { cn } from "@/lib/utils"

const GalleryCheckbox = React.forwardRef<
  HTMLInputElement,
  React.InputHTMLAttributes<HTMLInputElement>
>(({ className, ...props }, ref) => (
  <input
    type="checkbox"
    ref={ref}
    className={cn(
      "h-5 w-5 rounded border-border bg-card text-primary focus:ring-2 focus:ring-primary",
      className
    )}
    {...props}
  />
))
GalleryCheckbox.displayName = "GalleryCheckbox"

export { GalleryCheckbox }
