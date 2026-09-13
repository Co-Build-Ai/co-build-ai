"use client";

import { useState } from "react";
import { createClient } from "@/utils/supabase/client";

type PaymentType = "fixed" | "equity" | "flexible";

const TYPE_LABELS: Record<PaymentType, string> = {
  fixed: "Sabit Ücret",
  equity: "Ortaklık",
  flexible: "Esnek (İkisi de)",
};

export default function FounderDefaults({
  userId,
  initialType,
  initialAmount,
}: {
  userId: string;
  initialType: PaymentType | null;
  initialAmount: number | null;
}) {
  const supabase = createClient();
  const [type, setType] = useState<PaymentType>(initialType ?? "fixed");
  const [amount, setAmount] = useState(initialAmount ? String(initialAmount) : "");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  async function handleSave() {
    setSaving(true);
    await supabase
      .from("profiles")
      .update({
        default_payment_type: type,
        default_payment_amount: type === "flexible" ? null : amount ? Number(amount) : null,
      })
      .eq("id", userId);
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  return (
    <div className="rounded-xl border border-black/[0.08] bg-white shadow-sm p-8">
      <h2 className="text-lg font-bold text-ink">Varsayılan Proje Tercihleri</h2>
      <p className="mt-1 text-sm text-ink-soft">
        Yeni bir proje yayınlarken ödeme formunun başlangıç değeri olarak kullanılır.
      </p>

      <div className="mt-4 flex gap-2 sm:max-w-sm">
        {(Object.keys(TYPE_LABELS) as PaymentType[]).map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => setType(t)}
            className={`flex-1 rounded-full px-3 py-1.5 text-xs font-semibold transition-all ${
              type === t
                ? "bg-[#1a7a52] text-white transition-colors"
                : "bg-black/[0.04] text-ink-soft"
            }`}
          >
            {TYPE_LABELS[t]}
          </button>
        ))}
      </div>

      {type !== "flexible" && (
        <input
          type="number"
          min="0"
          placeholder={type === "fixed" ? "Varsayılan tutar (₺)" : "Varsayılan pay (%)"}
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          className="mt-3 w-full max-w-sm rounded-lg border border-black/[0.08] bg-black/[0.02] px-4 py-2 text-sm outline-none focus:ring-2 focus:ring-[#8DD9A8]/40"
        />
      )}

      <button
        onClick={handleSave}
        disabled={saving}
        className="mt-3 rounded-full bg-[#1a7a52] px-6 py-2 text-sm font-medium text-white transition-colors hover:bg-[#15633f] disabled:opacity-50"
      >
        {saving ? "Kaydediliyor..." : saved ? "Kaydedildi ✓" : "Kaydet"}
      </button>
    </div>
  );
}
