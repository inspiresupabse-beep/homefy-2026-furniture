"use client";

import { useState } from "react";
import { WhatsAppIcon } from "@/components/icons/whatsapp-icon";
import { Button } from "@/components/ui/button";
import { WhatsAppAppPickerModal } from "@/components/whatsapp/whatsapp-app-picker-modal";
import { cn } from "@/lib/utils";
import { ExternalLink } from "lucide-react";

type Props = {
  phone: string;
  message?: string;
  label?: string;
  compact?: boolean;
  className?: string;
  /** Runs before the picker opens. Return false to cancel. */
  onBeforeOpen?: () => boolean | Promise<boolean>;
};

export function WhatsAppSendButton({
  phone,
  message,
  label = "WhatsApp",
  compact,
  className,
  onBeforeOpen,
}: Props) {
  const [pickerOpen, setPickerOpen] = useState(false);

  async function handleClick() {
    if (onBeforeOpen) {
      const ok = await onBeforeOpen();
      if (!ok) return;
    }
    setPickerOpen(true);
  }

  return (
    <>
      <Button
        type="button"
        size={compact ? "sm" : "md"}
        className={cn(
          "gap-2 bg-[#25D366] text-white hover:bg-[#1da851]",
          className
        )}
        onClick={handleClick}
      >
        <WhatsAppIcon className={compact ? "h-3.5 w-3.5" : "h-4 w-4"} />
        {label}
        <ExternalLink className="h-3 w-3 opacity-70" />
      </Button>

      <WhatsAppAppPickerModal
        open={pickerOpen}
        onClose={() => setPickerOpen(false)}
        phone={phone}
        message={message}
      />
    </>
  );
}
