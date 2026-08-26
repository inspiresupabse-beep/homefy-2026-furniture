"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/input";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { WhatsAppIcon } from "@/components/icons/whatsapp-icon";
import { formatPhoneDisplay } from "@/lib/phone";
import {
  clearOfficeWhatsAppConnection,
  confirmOfficeWhatsApp,
  isOfficeWhatsAppConnected,
  OFFICE_WHATSAPP_CONNECT_ID,
} from "@/lib/office-whatsapp";
import { isWhatsAppLinked } from "@/lib/whatsapp";
import type { Profile } from "@/lib/types/database";
import { CheckCircle2, ExternalLink, Smartphone } from "lucide-react";

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
  const [connected, setConnected] = useState(false);

  const digits = phone.replace(/\D/g, "").slice(0, 10);
  const numberSaved = isWhatsAppLinked(profile);

  useEffect(() => {
    setConnected(isOfficeWhatsAppConnected(profile));
  }, [profile]);

  async function handleSaveNumber(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    setSaved(false);

    if (digits.length !== 10) {
      setSaving(false);
      setError("Enter your 10-digit office WhatsApp number.");
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

    const next = data as Profile;
    if (next.phone !== profile.phone) {
      clearOfficeWhatsAppConnection(profile.id);
      setConnected(false);
    }
    onUpdated(next);
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  }

  function handleConfirmConnected() {
    if (!profile.phone) return;
    confirmOfficeWhatsApp({ id: profile.id, phone: profile.phone });
    setConnected(true);
  }

  function handleDisconnect() {
    clearOfficeWhatsAppConnection(profile.id);
    setConnected(false);
  }

  return (
    <div id={OFFICE_WHATSAPP_CONNECT_ID}>
      <Card className="border-[#25D366]/40 bg-gradient-to-br from-emerald-50/80 to-white">
      <CardHeader className="pb-3">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#25D366] text-white">
              <WhatsAppIcon className="h-6 w-6" />
            </div>
            <div>
              <h2 className="font-semibold text-stone-900">Connect your office WhatsApp</h2>
              <p className="text-sm text-stone-500">
                Link <strong>{profile.full_name}</strong>&apos;s office number for customer messages
              </p>
            </div>
          </div>
          {connected && profile.phone && (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-800">
              <CheckCircle2 className="h-3.5 w-3.5" />
              Connected
            </span>
          )}
        </div>
      </CardHeader>

      <CardContent className="space-y-5">
        <form onSubmit={handleSaveNumber} className="space-y-3">
          <div>
            <Label htmlFor="office-whatsapp">Office WhatsApp number</Label>
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
            {numberSaved && profile.phone && (
              <p className="mt-2 text-sm text-stone-600">
                Saved: <strong>{formatPhoneDisplay(profile.phone)}</strong>
              </p>
            )}
          </div>

          {error && (
            <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>
          )}
          {saved && (
            <p className="rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
              Office number saved. Confirm connection below.
            </p>
          )}

          <Button type="submit" disabled={saving} className="gap-2 bg-[#25D366] text-white hover:bg-[#1da851]">
            <WhatsAppIcon className="h-4 w-4" />
            {saving ? "Saving..." : numberSaved ? "Update office number" : "Save office number"}
          </Button>
        </form>

        {numberSaved && (
          <div className="space-y-3 rounded-xl border border-stone-200 bg-white p-4">
            <p className="text-sm font-medium text-stone-900">Step 2 — Log in on this device</p>
            <ol className="list-decimal space-y-2 pl-5 text-sm text-stone-600">
              <li>
                <strong>On phone:</strong> Open the WhatsApp app with your office number{" "}
                {profile.phone && formatPhoneDisplay(profile.phone)}.
              </li>
              <li>
                <strong>On office PC:</strong> Open WhatsApp Web and log in with the same office
                number (scan QR from your phone).
              </li>
              <li>Come back here and tap <strong>Confirm connected</strong>.</li>
            </ol>

            <div className="flex flex-wrap gap-2 pt-1">
              <a href="https://web.whatsapp.com" target="_blank" rel="noopener noreferrer">
                <Button type="button" variant="secondary" size="sm" className="gap-2">
                  <ExternalLink className="h-4 w-4" />
                  Open WhatsApp Web
                </Button>
              </a>
              {!connected ? (
                <Button
                  type="button"
                  size="sm"
                  className="gap-2 bg-emerald-700 text-white hover:bg-emerald-800"
                  onClick={handleConfirmConnected}
                >
                  <Smartphone className="h-4 w-4" />
                  Confirm connected
                </Button>
              ) : (
                <Button type="button" variant="secondary" size="sm" onClick={handleDisconnect}>
                  Disconnect this device
                </Button>
              )}
            </div>

            {connected && profile.phone && (
              <p className="flex items-center gap-1.5 text-sm text-emerald-700">
                <CheckCircle2 className="h-4 w-4 shrink-0" />
                Ready to send from {formatPhoneDisplay(profile.phone)} on this device
              </p>
            )}
          </div>
        )}
      </CardContent>
    </Card>
    </div>
  );
}
