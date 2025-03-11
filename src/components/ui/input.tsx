
import * as React from "react"

import { cn } from "@/lib/utils"

const Input = React.forwardRef<HTMLInputElement, React.ComponentProps<"input">>(
  ({ className, type, ...props }, ref) => {
    // Check if this is an auth input based on the className
    const isAuthInput = className?.includes('auth-input');
    
    return (
      <input
        type={type}
        className={cn(
          isAuthInput 
            ? "flex h-10 w-full rounded-md border border-indigo-800/50 bg-black/50 px-3 py-2 text-base ring-offset-background text-white placeholder:text-gray-400 file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:ring-offset-1 focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 md:text-sm"
            : "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
          className
        )}
        ref={ref}
        {...props}
      />
    )
  }
)
Input.displayName = "Input"

export { Input }
