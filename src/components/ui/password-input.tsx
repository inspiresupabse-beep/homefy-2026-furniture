"use client";

import { forwardRef, useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";

export const PasswordInput = forwardRef<
  HTMLInputElement,
  React.InputHTMLAttributes<HTMLInputElement>
>(({ className, ...props }, ref) => {
  const [visible, setVisible] = useState(false);

  return (
    <div className="relative">
      <Input
        ref={ref}
        type={visible ? "text" : "password"}
        className={cn("pr-11", className)}
        {...props}
      />
      <button
        type="button"
        onClick={() => setVisible((show) => !show)}
        className="absolute right-1.5 top-1/2 -translate-y-1/2 rounded-md p-1.5 text-stone-400 transition-colors hover:bg-stone-100 hover:text-stone-600 focus:outline-none focus:ring-2 focus:ring-amber-600/20"
        aria-label={visible ? "Hide password" : "Show password"}
        aria-pressed={visible}
      >
        <span className="relative block h-4 w-4 overflow-hidden">
          <Eye
            aria-hidden
            className={cn(
              "absolute inset-0 h-4 w-4 transition-all duration-200 ease-out",
              visible
                ? "scale-50 opacity-0 rotate-90"
                : "scale-100 opacity-100 rotate-0"
            )}
          />
          <EyeOff
            aria-hidden
            className={cn(
              "absolute inset-0 h-4 w-4 transition-all duration-200 ease-out",
              visible
                ? "scale-100 opacity-100 rotate-0"
                : "scale-50 opacity-0 -rotate-90"
            )}
          />
        </span>
      </button>
    </div>
  );
});
PasswordInput.displayName = "PasswordInput";
