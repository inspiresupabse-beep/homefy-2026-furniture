"use client";

import type { ReactNode } from "react";
import { useBodyScrollLock } from "@/lib/use-body-scroll-lock";
import { cn } from "@/lib/utils";

interface ModalOverlayProps {
  children: ReactNode;
  className?: string;
  panelClassName?: string;
  onClose?: () => void;
}

export function ModalOverlay({
  children,
  className,
  panelClassName,
  onClose,
}: ModalOverlayProps) {
  useBodyScrollLock(true);

  return (
    <div
      className={cn(
        "fixed inset-0 z-[60] flex items-end justify-center bg-black/40 p-0 sm:items-center sm:p-4",
        "overscroll-contain supports-[height:100dvh]:min-h-[100dvh]",
        className
      )}
      onClick={onClose}
      role="presentation"
    >
      <div
        className={cn(
          "max-h-[min(92dvh,100%)] w-full overflow-y-auto overscroll-contain rounded-t-xl bg-white shadow-xl sm:max-w-lg sm:rounded-xl",
          panelClassName
        )}
        onClick={(e) => e.stopPropagation()}
      >
        {children}
      </div>
    </div>
  );
}
