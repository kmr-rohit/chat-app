import * as React from "react";
import { cn } from "@/lib/utils";

const ChatInput = React.forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(
  ({ className, ...props }, ref) => (
    <input
      ref={ref}
      className={cn(
        "w-full px-3 py-2 rounded border border-border bg-gray-800 text-white placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-primary",
        className
      )}
      {...props}
    />
  )
);
ChatInput.displayName = "ChatInput";

export { ChatInput };
