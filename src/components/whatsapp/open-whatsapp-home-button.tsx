"use client";

import { WhatsAppIcon } from "@/components/icons/whatsapp-icon";
import { Button } from "@/components/ui/button";
import { openWhatsAppHome } from "@/lib/whatsapp";

type Props = {
  label?: string;
  compact?: boolean;
};

export function OpenWhatsAppHomeButton({
  label = "Open WhatsApp",
  compact,
}: Props) {
  return (
    <Button
      type="button"
      size={compact ? "sm" : "md"}
      className="gap-2 bg-[#25D366] text-white hover:bg-[#1da851]"
      onClick={openWhatsAppHome}
    >
      <WhatsAppIcon className={compact ? "h-3.5 w-3.5" : "h-4 w-4"} />
      {label}
    </Button>
  );
}
