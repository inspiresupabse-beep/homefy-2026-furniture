"use client";

import { useCallback, useEffect, useState } from "react";
import { io, type Socket } from "socket.io-client";
import { WhatsAppIcon } from "@/components/icons/whatsapp-icon";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import {
  getWhatsAppListenerUrl,
  whatsAppListenerApi,
} from "@/lib/whatsapp-listener-config";
import { Download, RefreshCw, Wifi, WifiOff } from "lucide-react";

export type ListenerStatus =
  | "unconfigured"
  | "connecting"
  | "initializing"
  | "waiting_for_qr"
  | "authenticated"
  | "ready"
  | "disconnected"
  | "auth_failure"
  | "error"
  | "offline";

export type ExtractedMessage = {
  id: string;
  timestamp: string;
  source: string;
  senderName: string;
  phone: string;
  body: string;
};

const STATUS_LABELS: Record<string, string> = {
  unconfigured: "Service not configured",
  connecting: "Connecting…",
  initializing: "Starting…",
  waiting_for_qr: "Scan QR to link",
  authenticated: "Authenticated",
  ready: "Connected & listening",
  disconnected: "Disconnected",
  auth_failure: "Auth failed",
  error: "Error",
  offline: "Listener offline",
};

type Props = {
  onStatusChange?: (status: ListenerStatus) => void;
};

export function WhatsAppListenerPanel({ onStatusChange }: Props) {
  const listenerUrl = getWhatsAppListenerUrl();
  const [status, setStatus] = useState<ListenerStatus>(
    listenerUrl ? "connecting" : "unconfigured"
  );
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);
  const [groupName, setGroupName] = useState<string | null>(null);
  const [extracted, setExtracted] = useState<ExtractedMessage[]>([]);
  const [activity, setActivity] = useState<string[]>([]);
  const [socket, setSocket] = useState<Socket | null>(null);

  const pushActivity = useCallback((line: string) => {
    setActivity((prev) => [`${new Date().toLocaleTimeString()} — ${line}`, ...prev].slice(0, 30));
  }, []);

  const updateStatus = useCallback(
    (next: ListenerStatus) => {
      setStatus(next);
      onStatusChange?.(next);
    },
    [onStatusChange]
  );

  useEffect(() => {
    if (!listenerUrl) {
      updateStatus("unconfigured");
      return;
    }

    updateStatus("connecting");
    const s = io(listenerUrl, {
      transports: ["websocket", "polling"],
      reconnection: true,
      reconnectionAttempts: 10,
    });

    s.on("connect", () => {
      pushActivity("Connected to WhatsApp listener service");
      s.emit("request-status");
    });

    s.on("disconnect", () => {
      updateStatus("offline");
      pushActivity("Lost connection to listener service");
    });

    s.on("connect_error", () => {
      updateStatus("offline");
    });

    s.on("status", ({ status: st }: { status: string }) => {
      updateStatus(st as ListenerStatus);
      if (st !== "waiting_for_qr") setQrDataUrl(null);
    });

    s.on("qr", ({ dataUrl }: { dataUrl?: string }) => {
      updateStatus("waiting_for_qr");
      if (dataUrl) setQrDataUrl(dataUrl);
      pushActivity("QR code ready — scan with your phone");
    });

    s.on("ready", ({ groupName: gn }: { groupName?: string }) => {
      updateStatus("ready");
      setGroupName(gn ?? null);
      setQrDataUrl(null);
      pushActivity("WhatsApp is ready");
    });

    s.on("extracted-log", (messages: ExtractedMessage[]) => {
      setExtracted(messages);
    });

    s.on("message-extracted", (entry: ExtractedMessage) => {
      pushActivity(`Captured: ${entry.senderName}`);
    });

    s.on("auto-reply-sent", ({ to }: { to: string }) => {
      pushActivity(`Auto-reply sent to ${to}`);
    });

    s.on("message-sent", ({ to }: { to: string }) => {
      pushActivity(`Message sent to ${to}`);
    });

    s.on("error", ({ message }: { message: string }) => {
      pushActivity(message);
    });

    setSocket(s);

    fetch(whatsAppListenerApi("/api/messages"))
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (data?.messages) setExtracted(data.messages);
      })
      .catch(() => {});

    fetch(whatsAppListenerApi("/api/status"))
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (data?.status) updateStatus(data.status as ListenerStatus);
      })
      .catch(() => updateStatus("offline"));

    return () => {
      s.disconnect();
    };
  }, [listenerUrl, pushActivity, updateStatus]);

  const isReady = status === "ready";
  const showQr = status === "waiting_for_qr" && qrDataUrl;
  const downloadUrl = whatsAppListenerApi("/api/download");

  return (
    <Card className="border-[#25D366]/30 bg-gradient-to-br from-emerald-50/90 to-white">
      <CardHeader className="pb-3">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#25D366] text-white">
              <WhatsAppIcon className="h-6 w-6" />
            </div>
            <div>
              <h2 className="font-semibold text-stone-900">Linked WhatsApp</h2>
              <p className="text-sm text-stone-500">
                Scan QR once to listen to your group & send messages from Homefy
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {isReady ? (
              <Wifi className="h-4 w-4 text-emerald-600" />
            ) : (
              <WifiOff className="h-4 w-4 text-stone-400" />
            )}
            <span
              className={`rounded-full px-3 py-1 text-xs font-semibold ${
                isReady
                  ? "bg-emerald-100 text-emerald-800"
                  : showQr
                    ? "bg-amber-100 text-amber-800"
                    : "bg-stone-100 text-stone-600"
              }`}
            >
              {STATUS_LABELS[status] ?? status}
            </span>
          </div>
        </div>
        {isReady && groupName && (
          <p className="mt-2 text-xs text-stone-500">Monitoring: {groupName}</p>
        )}
      </CardHeader>

      <CardContent className="space-y-4 pt-0">
        {status === "unconfigured" && (
          <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
            <p className="font-medium">WhatsApp listener not running</p>
            <p className="mt-1 text-amber-800">
              Start the listener:{" "}
              <code className="rounded bg-white px-1">npm run whatsapp:listener</code> (port 4000)
            </p>
            <p className="mt-1 text-xs text-amber-700">
              Set <code>NEXT_PUBLIC_WHATSAPP_LISTENER_URL=http://localhost:4000</code> in{" "}
              <code>.env.local</code>
            </p>
          </div>
        )}

        {status === "offline" && listenerUrl && (
          <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-800">
            Cannot reach listener at <strong>{listenerUrl}</strong>. Run{" "}
            <code className="rounded bg-white px-1">npm run whatsapp:listener</code>.
          </div>
        )}

        {showQr && (
          <div className="flex flex-col items-center gap-3 rounded-xl border border-stone-200 bg-white p-6">
            <p className="text-center text-sm font-medium text-stone-700">
              Open WhatsApp on your phone → <strong>Linked devices</strong> → Scan QR
            </p>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={qrDataUrl}
              alt="WhatsApp QR code"
              className="h-56 w-56 rounded-lg border border-stone-200"
            />
          </div>
        )}

        {!showQr && isReady && (
          <p className="text-sm text-emerald-700">
            WhatsApp is linked. Incoming group messages matching your pattern are saved
            automatically. Use &quot;Send via linked WhatsApp&quot; on contacts below.
          </p>
        )}

        <div className="flex flex-wrap gap-2">
          {downloadUrl && (
            <a href={downloadUrl} target="_blank" rel="noopener noreferrer">
              <Button type="button" variant="secondary" size="sm" className="gap-2">
                <Download className="h-4 w-4" />
                Download log (.txt)
              </Button>
            </a>
          )}
          <Button
            type="button"
            variant="secondary"
            size="sm"
            className="gap-2"
            onClick={() => socket?.emit("request-status")}
          >
            <RefreshCw className="h-4 w-4" />
            Refresh status
          </Button>
        </div>

        {extracted.length > 0 && (
          <div>
            <h3 className="mb-2 text-sm font-semibold text-stone-800">Captured messages</h3>
            <ul className="max-h-48 space-y-2 overflow-y-auto rounded-lg border border-stone-100 bg-stone-50/50 p-3 text-sm">
              {extracted.slice(0, 15).map((m) => (
                <li key={m.id} className="border-b border-stone-100 pb-2 last:border-0">
                  <div className="text-xs text-stone-400">
                    {new Date(m.timestamp).toLocaleString()} · {m.source}
                  </div>
                  <span className="font-medium">{m.senderName}</span>
                  <span className="text-stone-400"> · {m.phone}</span>
                  <p className="text-stone-600">{m.body}</p>
                </li>
              ))}
            </ul>
          </div>
        )}

        {activity.length > 0 && (
          <details className="text-xs text-stone-500">
            <summary className="cursor-pointer font-medium text-stone-600">Activity log</summary>
            <ul className="mt-2 max-h-32 space-y-1 overflow-y-auto">
              {activity.map((line, i) => (
                <li key={i}>{line}</li>
              ))}
            </ul>
          </details>
        )}
      </CardContent>
    </Card>
  );
}

export async function sendViaListener(
  phone: string,
  customerName: string,
  reminder: string
): Promise<{ ok: boolean; error?: string }> {
  const url = whatsAppListenerApi("/api/send-lead-reminder");
  if (!url) return { ok: false, error: "Listener URL not configured" };

  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ phone, customerName, reminder }),
    });
    const data = await res.json();
    if (!res.ok) return { ok: false, error: data.error || "Send failed" };
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Network error" };
  }
}
