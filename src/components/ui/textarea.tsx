import * as React from "react";

import { cn } from "@/lib/utils";

export const Textarea = React.forwardRef<
  HTMLTextAreaElement,
  React.TextareaHTMLAttributes<HTMLTextAreaElement>
>(({ className, ...props }, ref) => (
  <textarea
    ref={ref}
    className={cn(
      "min-h-[120px] w-full rounded-2xl border border-app-ink/10 bg-white/80 px-4 py-3 text-sm text-app-ink shadow-sm focus:outline-none focus:ring-2 focus:ring-app-accent/40",
      className
    )}
    {...props}
  />
));

Textarea.displayName = "Textarea";
