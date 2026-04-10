import * as React from "react";

import { cn } from "@/lib/utils";

export const Input = React.forwardRef<
  HTMLInputElement,
  React.InputHTMLAttributes<HTMLInputElement>
>(({ className, ...props }, ref) => (
  <input
    ref={ref}
    className={cn(
      "flex h-11 w-full rounded-2xl border border-app-ink/10 bg-white/80 px-4 text-sm text-app-ink placeholder:text-app-ink-soft/60 shadow-sm focus:outline-none focus:ring-2 focus:ring-app-accent/40",
      className
    )}
    {...props}
  />
));

Input.displayName = "Input";
