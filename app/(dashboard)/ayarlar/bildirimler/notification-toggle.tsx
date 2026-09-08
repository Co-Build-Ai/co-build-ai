"use client";

import { useState } from "react";
import { createClient } from "@/utils/supabase/client";

export default function NotificationToggle({
  userId,
  initialEnabled,
}: {
  userId: string;
  initialEnabled: boolean;
}) {
  const supabase = createClient();
  const [enabled, setEnabled] = useState(initialEnabled);
  const [saving, setSaving] = useState(false);

  async function handleToggle() {
    const next = !enabled;
    setEnabled(next);
    setSaving(true);
    await supabase.from("profiles").update({ notifications_enabled: next }).eq("id", userId);
    setSaving(false);
  }

  return (
    <div className="rounded-xl border border-stone-200 bg-white shadow-[inset_0_1px_0_rgba(255,255,255,0.8),0_4px_12px_rgba(17,24,39,0.12)] p-8">
      <h2 className="text-lg font-bold text-ink">Bildirim Tercihleri</h2>
      <div className="mt-4 flex items-center justify-between sm:max-w-sm">
        <div>
          <p className="text-sm font-medium text-ink">Platform-içi bildirimler</p>
          <p className="text-xs text-ink-soft">
            Yeni teklif, kabul/red ve mesaj bildirimleri (🔔 zili)
          </p>
        </div>
        <button
          onClick={handleToggle}
          disabled={saving}
          className={`h-6 w-11 shrink-0 rounded-full transition-colors disabled:opacity-50 ${
            enabled ? "bg-coral" : "bg-ink/15"
          }`}
        >
          <span
            className={`block h-5 w-5 translate-y-0.5 rounded-full bg-white transition-transform ${
              enabled ? "translate-x-5" : "translate-x-0.5"
            }`}
          />
        </button>
      </div>
      <p className="mt-3 text-xs text-ink-soft">
        E-posta bildirimleri şu an desteklenmiyor, yakında eklenecek.
      </p>
    </div>
  );
}
