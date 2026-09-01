"use client";

import { WhatsAppIcon } from "@/components/icons/whatsapp-icon";
import { ModalOverlay } from "@/components/ui/modal-overlay";
import {
  buildWhatsAppAppChatHref,
  buildWhatsAppAppHomeHref,
  buildWebWhatsAppChatUrl,
  WHATSAPP_WEB_URL,
} from "@/lib/whatsapp";
import { cn } from "@/lib/utils";
import { Briefcase, Globe, X } from "lucide-react";

type Props = {
  open: boolean;
  onClose: () => void;
  phone?: string;
  message?: string;
};

const pickerLinkClass =
  "flex h-auto w-full items-center gap-3 rounded-lg px-4 py-3 text-left transition-colors";

export function WhatsAppAppPickerModal({ open, onClose, phone, message }: Props) {
  if (!open) return null;

  const isChat = Boolean(phone?.trim());

  const personalHref = isChat && phone
    ? buildWhatsAppAppChatHref("personal", phone, message)
    : buildWhatsAppAppHomeHref("personal");

  const businessHref = isChat && phone
    ? buildWhatsAppAppChatHref("business", phone, message)
    : buildWhatsAppAppHomeHref("business");

  const webHref = isChat && phone
    ? buildWebWhatsAppChatUrl(phone, message)
    : WHATSAPP_WEB_URL;

  function handleNavigate() {
    window.setTimeout(() => onClose(), 300);
  }

  return (
    <ModalOverlay onClose={onClose}>
      <div className="flex items-center justify-between border-b border-stone-100 px-4 py-4 sm:px-6">
        <h2 className="text-lg font-semibold text-stone-900">Choose WhatsApp app</h2>
        <button
          type="button"
          onClick={onClose}
          className="text-stone-400 hover:text-stone-600"
          aria-label="Close"
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      <div className="space-y-3 p-4 sm:p-6">
        <p className="text-sm text-stone-500">
          {isChat
            ? "Tap an app below. The message will be ready — press Send in WhatsApp."
            : "Tap an app below to open your full chat list on this phone."}
        </p>

        <a
          href={personalHref}
          onClick={handleNavigate}
          className={cn(
            pickerLinkClass,
            "bg-[#25D366] text-white hover:bg-[#1da851] active:bg-[#1da851]"
          )}
        >
          <WhatsAppIcon className="h-5 w-5 shrink-0" />
          <span>
            <span className="block font-semibold">WhatsApp</span>
            <span className="block text-xs text-emerald-50">Personal / regular app</span>
          </span>
        </a>

        <a
          href={businessHref}
          onClick={handleNavigate}
          className={cn(
            pickerLinkClass,
            "bg-[#128C7E] text-white hover:bg-[#0f7a6e] active:bg-[#0f7a6e]"
          )}
        >
          <Briefcase className="h-5 w-5 shrink-0" />
          <span>
            <span className="block font-semibold">WhatsApp Business</span>
            <span className="block text-xs text-teal-50">Business app on this device</span>
          </span>
        </a>

        <div className="border-t border-stone-100 pt-3">
          <a
            href={webHref}
            rel="noopener noreferrer"
            onClick={handleNavigate}
            className={cn(
              pickerLinkClass,
              "border border-stone-200 bg-stone-100 text-stone-900 hover:bg-stone-200 active:bg-stone-200"
            )}
          >
            <Globe className="h-5 w-5 shrink-0 text-stone-500" />
            <span>
              <span className="block font-medium">WhatsApp Web</span>
              <span className="block text-xs text-stone-500">
                Browser — if no app is installed
              </span>
            </span>
          </a>
        </div>
      </div>
    </ModalOverlay>
  );
}
