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
    <div className="rounded-xl border border-stone-200 bg-white shadow-[inset_0_1px_0_rgba(255,255,255,0.8),0_4px_12px_rgba(17,24,39,0.12)] p-8">
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
                ? "bg-coral text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.35),0_3px_0_0_var(--color-coral-dark),0_6px_14px_rgba(239,68,104,0.30)] active:translate-y-0.5 active:shadow-[inset_0_1px_0_rgba(255,255,255,0.35),0_0px_0_0_var(--color-coral-dark),0_2px_6px_rgba(239,68,104,0.25)]"
                : "bg-ink/5 text-ink-soft shadow-[inset_0_1px_3px_rgba(17,24,39,0.06)]"
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
          className="mt-3 w-full max-w-sm rounded-lg bg-ink/5 shadow-[inset_0_2px_5px_rgba(17,24,39,0.08)] px-4 py-2 text-sm outline-none focus:ring-2 focus:ring-coral/30"
        />
      )}

      <button
        onClick={handleSave}
        disabled={saving}
        className="mt-3 rounded-full bg-coral px-6 py-2 text-sm font-semibold text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.35),0_4px_0_0_var(--color-coral-dark),0_10px_20px_rgba(239,68,104,0.35)] transition-all hover:brightness-105 active:translate-y-1 active:shadow-[inset_0_1px_0_rgba(255,255,255,0.35),0_0px_0_0_var(--color-coral-dark),0_2px_6px_rgba(239,68,104,0.30)] disabled:opacity-50"
      >
        {saving ? "Kaydediliyor..." : saved ? "Kaydedildi ✓" : "Kaydet"}
      </button>
    </div>
  );
}
