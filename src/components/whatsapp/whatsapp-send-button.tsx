"use client";

import { WhatsAppIcon } from "@/components/icons/whatsapp-icon";
import { Button } from "@/components/ui/button";
import { openWhatsAppChat } from "@/lib/whatsapp";
import { ExternalLink } from "lucide-react";

type Props = {
  phone: string;
  message?: string;
  label?: string;
  compact?: boolean;
};

export function WhatsAppSendButton({
  phone,
  message,
  label = "WhatsApp",
  compact,
}: Props) {
  return (
    <Button
      type="button"
      size={compact ? "sm" : "md"}
      className="gap-2 bg-[#25D366] text-white hover:bg-[#1da851]"
      onClick={() => openWhatsAppChat(phone, message)}
    >
      <WhatsAppIcon className={compact ? "h-3.5 w-3.5" : "h-4 w-4"} />
      {label}
      <ExternalLink className="h-3 w-3 opacity-70" />
    </Button>
  );
}
