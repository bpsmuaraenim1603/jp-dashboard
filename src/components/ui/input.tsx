"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

// Removed redundant InputProps interface

const Input = React.forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(
  ({ className, type = "text", ...props }, ref) => {
    return (
      <input
        ref={ref}
        type={type}
        className={cn(
          "flex h-10 w-full rounded-md border border-white/20 bg-white/10 px-3 py-2 text-sm shadow-sm placeholder:text-slate-400",
          "focus:outline-none focus:ring-2 focus:ring-[#39CCCC] focus:ring-offset-2 focus:ring-offset-transparent",
          "disabled:cursor-not-allowed disabled:opacity-50",
          className
        )}
        {...props}
      />
    );
  }
);

Input.displayName = "Input";

export { Input };
