"use client";

import { useState } from "react";
import { ArrowLeft, UserRound } from "lucide-react";
import { switchBackToAdmin } from "@/app/(dashboard)/users/actions";
import { Button } from "@/components/ui/button";
import type { ImpersonationMeta } from "@/lib/auth/impersonation";

export function ImpersonationBanner({ meta }: { meta: ImpersonationMeta }) {
  const [switchingBack, setSwitchingBack] = useState(false);

  async function handleSwitchBack() {
    setSwitchingBack(true);

    try {
      const result = await switchBackToAdmin();
      if (result?.error) {
        setSwitchingBack(false);
        alert(result.error);
      }
    } catch {
      // switchBackToAdmin redirects on success
    }
  }

  return (
    <div className="border-b border-amber-300 bg-amber-100 px-4 py-2.5 text-sm text-amber-950">
      <div className="mx-auto flex max-w-7xl flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2">
          <UserRound className="h-4 w-4 shrink-0" />
          <span>
            Viewing as <strong>{meta.staffName}</strong> (admin: {meta.adminName})
          </span>
        </div>
        <Button
          type="button"
          size="sm"
          variant="secondary"
          className="gap-1.5 self-start border-amber-300 bg-white sm:self-auto"
          onClick={handleSwitchBack}
          disabled={switchingBack}
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          {switchingBack ? "Switching back..." : "Back to admin"}
        </Button>
      </div>
    </div>
  );
}
