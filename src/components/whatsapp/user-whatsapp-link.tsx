"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/input";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { WhatsAppIcon } from "@/components/icons/whatsapp-icon";
import { formatPhoneDisplay } from "@/lib/phone";
import type { Profile } from "@/lib/types/database";
import { CheckCircle2, Phone } from "lucide-react";

export function UserWhatsAppLink({
  profile,
  onSaved,
}: {
  profile: Profile;
  onSaved: (next: Profile) => void;
}) {
  const [phone, setPhone] = useState(profile.phone?.replace(/^\+91/, "") ?? "");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  const digits = phone.replace(/\D/g, "").slice(0, 10);
  const isLinked = Boolean(profile.phone && profile.phone.replace(/\D/g, "").length >= 10);

  async function handleSave(e: React.FormEvent) {
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

    onSaved(data as Profile);
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  }

  return (
    <Card className="border-stone-200">
      <CardHeader className="pb-3">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#25D366]/10 text-[#25D366]">
            <Phone className="h-5 w-5" />
          </div>
          <div>
            <h2 className="font-semibold text-stone-900">Your WhatsApp number</h2>
            <p className="text-sm text-stone-500">
              Messages open from <strong>{profile.full_name}</strong>&apos;s number on your phone
            </p>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSave} className="space-y-4">
          <div>
            <Label htmlFor="user-whatsapp">WhatsApp mobile number</Label>
            <div className="mt-1 flex gap-2">
              <span className="flex items-center rounded-lg border border-stone-200 bg-stone-50 px-3 text-sm text-stone-600">
                +91
              </span>
              <Input
                id="user-whatsapp"
                type="tel"
                inputMode="numeric"
                placeholder="9876543210"
                value={digits}
                onChange={(e) => setPhone(e.target.value.replace(/\D/g, "").slice(0, 10))}
                required
              />
            </div>
            {isLinked && profile.phone && (
              <p className="mt-2 flex items-center gap-1.5 text-sm text-emerald-700">
                <CheckCircle2 className="h-4 w-4 shrink-0" />
                Linked: {formatPhoneDisplay(profile.phone)}
              </p>
            )}
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
            <WhatsAppIcon className="h-4 w-4" />
            {saving ? "Saving..." : isLinked ? "Update my WhatsApp" : "Link my WhatsApp"}
          </Button>

          <p className="text-xs leading-relaxed text-stone-500">
            Optional — used to personalize messages with your name. Tapping WhatsApp opens the app or
            WhatsApp Web already logged in on this device.
          </p>
        </form>
      </CardContent>
    </Card>
  );
}
