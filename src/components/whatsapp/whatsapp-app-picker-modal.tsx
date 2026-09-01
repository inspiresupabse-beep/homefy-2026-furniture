"use client";

import { WhatsAppIcon } from "@/components/icons/whatsapp-icon";
import { Button } from "@/components/ui/button";
import { ModalOverlay } from "@/components/ui/modal-overlay";
import {
  openWhatsAppAppHome,
  openWhatsAppWeb,
  type WhatsAppAppKind,
} from "@/lib/whatsapp";
import { Briefcase, Globe, X } from "lucide-react";

type Props = {
  open: boolean;
  onClose: () => void;
};

export function WhatsAppAppPickerModal({ open, onClose }: Props) {
  if (!open) return null;

  function choose(kind: WhatsAppAppKind) {
    openWhatsAppAppHome(kind);
    onClose();
  }

  function chooseWeb() {
    openWhatsAppWeb();
    onClose();
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
          Pick which app to open on this device. Your chat list will open — not a single contact.
        </p>

        <Button
          type="button"
          className="h-auto w-full justify-start gap-3 bg-[#25D366] px-4 py-3 text-left text-white hover:bg-[#1da851]"
          onClick={() => choose("personal")}
        >
          <WhatsAppIcon className="h-5 w-5 shrink-0" />
          <span>
            <span className="block font-semibold">WhatsApp</span>
            <span className="block text-xs text-emerald-50">Personal / regular app</span>
          </span>
        </Button>

        <Button
          type="button"
          className="h-auto w-full justify-start gap-3 bg-[#128C7E] px-4 py-3 text-left text-white hover:bg-[#0f7a6e]"
          onClick={() => choose("business")}
        >
          <Briefcase className="h-5 w-5 shrink-0" />
          <span>
            <span className="block font-semibold">WhatsApp Business</span>
            <span className="block text-xs text-teal-50">Business app on this device</span>
          </span>
        </Button>

        <div className="border-t border-stone-100 pt-3">
          <Button
            type="button"
            variant="secondary"
            className="h-auto w-full justify-start gap-3 px-4 py-3 text-left"
            onClick={chooseWeb}
          >
            <Globe className="h-5 w-5 shrink-0 text-stone-500" />
            <span>
              <span className="block font-medium text-stone-900">WhatsApp Web</span>
              <span className="block text-xs text-stone-500">Browser only — use if no app is installed</span>
            </span>
          </Button>
        </div>
      </div>
    </ModalOverlay>
  );
}
