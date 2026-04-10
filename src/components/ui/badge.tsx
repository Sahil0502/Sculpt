import * as React from "react";

import { cn } from "@/lib/utils";

export function Badge({
  className,
  ...props
}: React.HTMLAttributes<HTMLSpanElement>) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border border-app-ink/10 bg-white/70 px-3 py-1 text-xs font-medium text-app-ink",
        className
      )}
      {...props}
    />
  );
}
