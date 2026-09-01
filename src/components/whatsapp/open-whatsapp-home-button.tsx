"use client";

import { useState } from "react";
import { WhatsAppIcon } from "@/components/icons/whatsapp-icon";
import { Button } from "@/components/ui/button";
import { WhatsAppAppPickerModal } from "@/components/whatsapp/whatsapp-app-picker-modal";
import { cn } from "@/lib/utils";

type Props = {
  label?: string;
  compact?: boolean;
  variant?: "whatsapp" | "secondary";
  className?: string;
};

export function OpenWhatsAppHomeButton({
  label = "Open WhatsApp",
  compact,
  variant = "whatsapp",
  className,
}: Props) {
  const [pickerOpen, setPickerOpen] = useState(false);

  return (
    <>
      <Button
        type="button"
        size={compact ? "sm" : "md"}
        variant={variant === "secondary" ? "secondary" : "primary"}
        className={cn(
          "gap-2",
          variant === "whatsapp" && "bg-[#25D366] text-white hover:bg-[#1da851]",
          className
        )}
        onClick={() => setPickerOpen(true)}
      >
        <WhatsAppIcon className={compact ? "h-3.5 w-3.5" : "h-4 w-4"} />
        {label}
      </Button>

      <WhatsAppAppPickerModal open={pickerOpen} onClose={() => setPickerOpen(false)} />
    </>
  );
}
