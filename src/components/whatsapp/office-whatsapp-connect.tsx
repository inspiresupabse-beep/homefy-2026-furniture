"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/input";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { WhatsAppIcon } from "@/components/icons/whatsapp-icon";
import { formatPhoneDisplay } from "@/lib/phone";
import { isWhatsAppLinked } from "@/lib/whatsapp";
import type { Profile } from "@/lib/types/database";
import { ExternalLink, Phone } from "lucide-react";

export const WHATSAPP_WEB_URL = "https://web.whatsapp.com";

export function OfficeWhatsAppConnect({
  profile,
  onUpdated,
}: {
  profile: Profile;
  onUpdated: (next: Profile) => void;
}) {
  const [phone, setPhone] = useState(profile.phone?.replace(/^\+91/, "") ?? "");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  const digits = phone.replace(/\D/g, "").slice(0, 10);
  const numberSaved = isWhatsAppLinked(profile);

  async function handleSaveNumber(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    setSaved(false);

    if (digits.length !== 10) {
      setSaving(false);
      setError("Enter a valid 10-digit WhatsApp number.");
      return;
    }

    const normalized = `+91${digits}`;
    const supabase = createClient();
    const { data, error: updateError } = await supabase
      .from("profiles")
      .update({ phone: normalized })
      .eq("id", profile.id)
      .select("*")
      .single();

    setSaving(false);

    if (updateError) {
      setError(updateError.message);
      return;
    }

    onUpdated(data as Profile);
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  }

  return (
    <Card className="border-[#25D366]/40 bg-gradient-to-br from-emerald-50/80 to-white">
      <CardHeader className="pb-3">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#25D366] text-white">
            <WhatsAppIcon className="h-6 w-6" />
          </div>
          <div>
            <h2 className="font-semibold text-stone-900">Your office WhatsApp</h2>
            <p className="text-sm text-stone-500">
              {profile.full_name}&apos;s number for customer messages
            </p>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        <form onSubmit={handleSaveNumber} className="space-y-3">
          <div>
            <Label htmlFor="office-whatsapp">WhatsApp number</Label>
            <div className="mt-1 flex gap-2">
              <span className="flex items-center rounded-lg border border-stone-200 bg-white px-3 text-sm text-stone-600">
                +91
              </span>
              <Input
                id="office-whatsapp"
                type="tel"
                inputMode="numeric"
                placeholder="9876543210"
                value={digits}
                onChange={(e) => setPhone(e.target.value.replace(/\D/g, "").slice(0, 10))}
                required
              />
            </div>
          </div>

          {error && (
            <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>
          )}
          {saved && (
            <p className="rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
              WhatsApp number saved.
            </p>
          )}

          <Button type="submit" disabled={saving} className="gap-2 bg-[#25D366] text-white hover:bg-[#1da851]">
            <Phone className="h-4 w-4" />
            {saving ? "Saving..." : numberSaved ? "Update number" : "Save number"}
          </Button>
        </form>

        {numberSaved && profile.phone && (
          <p className="text-lg font-semibold text-stone-900">
            {formatPhoneDisplay(profile.phone)}
          </p>
        )}

        <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-950">
          <p className="font-medium">Log in on this PC</p>
          <p className="mt-2 leading-relaxed text-amber-900">
            Open{" "}
            <a
              href={WHATSAPP_WEB_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="font-semibold underline"
            >
              WhatsApp Web
            </a>{" "}
            → scan the QR code from your office phone.
          </p>
          <a
            href={WHATSAPP_WEB_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-3 inline-block"
          >
            <Button type="button" variant="secondary" size="sm" className="gap-2">
              <ExternalLink className="h-4 w-4" />
              Open WhatsApp Web
            </Button>
          </a>
        </div>
      </CardContent>
    </Card>
  );
}
