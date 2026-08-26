"use client";

import { useEffect, useState } from "react";
import { WhatsAppIcon } from "@/components/icons/whatsapp-icon";
import { Button } from "@/components/ui/button";
import {
  isOfficeWhatsAppConnected,
  OFFICE_WHATSAPP_CONNECT_ID,
  OFFICE_WHATSAPP_REQUIRED_MESSAGE,
} from "@/lib/office-whatsapp";
import { openWhatsAppChat } from "@/lib/whatsapp";
import type { Profile } from "@/lib/types/database";
import { ExternalLink } from "lucide-react";

type Props = {
  phone: string;
  message?: string;
  label?: string;
  compact?: boolean;
  profile: Profile | null;
  onNeedConnect?: (message: string) => void;
};

export function WhatsAppSendButton({
  phone,
  message,
  label = "WhatsApp",
  compact,
  profile,
  onNeedConnect,
}: Props) {
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    setConnected(isOfficeWhatsAppConnected(profile));
  }, [profile]);

  function scrollToConnect() {
    document.getElementById(OFFICE_WHATSAPP_CONNECT_ID)?.scrollIntoView({ behavior: "smooth" });
  }

  function handleClick() {
    if (!connected) {
      onNeedConnect?.(OFFICE_WHATSAPP_REQUIRED_MESSAGE);
      scrollToConnect();
      return;
    }
    openWhatsAppChat(phone, message);
  }

  return (
    <Button
      type="button"
      size={compact ? "sm" : "md"}
      className="gap-2 bg-[#25D366] text-white hover:bg-[#1da851]"
      onClick={handleClick}
    >
      <WhatsAppIcon className={compact ? "h-3.5 w-3.5" : "h-4 w-4"} />
      {label}
      <ExternalLink className="h-3 w-3 opacity-70" />
    </Button>
  );
}
