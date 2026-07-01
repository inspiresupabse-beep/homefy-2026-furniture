"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

export function NavigationProgress() {
  const pathname = usePathname();
  const [active, setActive] = useState(false);

  useEffect(() => {
    setActive(true);
    const timer = window.setTimeout(() => setActive(false), 500);
    return () => window.clearTimeout(timer);
  }, [pathname]);

  return (
    <div
      className={cn(
        "pointer-events-none fixed inset-x-0 top-0 z-[100] h-0.5 origin-left bg-amber-600 transition-transform duration-500",
        active ? "scale-x-100 opacity-100" : "scale-x-0 opacity-0"
      )}
      aria-hidden
    />
  );
}
