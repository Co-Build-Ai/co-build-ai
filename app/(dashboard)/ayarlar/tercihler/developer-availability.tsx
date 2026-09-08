"use client";

import { useState } from "react";
import { createClient } from "@/utils/supabase/client";

const OPTIONS: { value: string; label: string }[] = [
  { value: "available", label: "Yeni Tekliflere Açığım" },
  { value: "busy", label: "Şu An Başka Projedeyim" },
  { value: "vacation", label: "Tatil Modu" },
];

export default function DeveloperAvailability({
  userId,
  initialValue,
}: {
  userId: string;
  initialValue: string | null;
}) {
  const supabase = createClient();
  const [value, setValue] = useState(initialValue ?? "available");
  const [saving, setSaving] = useState(false);

  async function handleChange(next: string) {
    setValue(next);
    setSaving(true);
    await supabase.from("profiles").update({ availability: next }).eq("id", userId);
    setSaving(false);
  }

  return (
    <div className="rounded-xl border border-stone-200 bg-white shadow-[inset_0_1px_0_rgba(255,255,255,0.8),0_4px_12px_rgba(17,24,39,0.12)] p-8">
      <h2 className="text-lg font-bold text-ink">Müsaitlik Durumu</h2>
      <p className="mt-1 text-sm text-ink-soft">
        Founder&apos;ların seni keşfederken göreceği durum rozeti.
      </p>

      <div className="mt-4 flex flex-col gap-2 sm:max-w-sm">
        {OPTIONS.map((opt) => (
          <button
            key={opt.value}
            type="button"
            onClick={() => handleChange(opt.value)}
            disabled={saving}
            className={`rounded-lg border px-4 py-2.5 text-left text-sm font-medium transition-colors disabled:opacity-50 ${
              value === opt.value
                ? "border-coral bg-coral/10 text-coral-dark"
                : "border-ink/15 text-ink-soft hover:text-ink"
            }`}
          >
            {opt.label}
          </button>
        ))}
      </div>
    </div>
  );
}
