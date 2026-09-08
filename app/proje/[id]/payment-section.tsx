"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/utils/supabase/client";

type PaymentType = "fixed" | "equity" | "flexible";

const TYPE_LABELS: Record<PaymentType, string> = {
  fixed: "Sabit Ücret",
  equity: "Ortaklık",
  flexible: "Esnek (İkisi de)",
};

function describePayment(type: PaymentType | null, amount: number | null) {
  if (!type) return null;
  if (type === "flexible") return "Esnek — sabit ücret veya ortaklık, teklif veren belirler";
  if (type === "fixed") return `Sabit ücret${amount ? ` — ${amount}₺` : ""}`;
  return `Ortaklık${amount ? ` — %${amount}` : ""}`;
}

function PaymentForm({
  paymentType,
  setPaymentType,
  paymentAmount,
  setPaymentAmount,
}: {
  paymentType: PaymentType;
  setPaymentType: (t: PaymentType) => void;
  paymentAmount: string;
  setPaymentAmount: (v: string) => void;
}) {
  return (
    <div className="w-full max-w-sm">
      <div className="flex gap-2">
        {(Object.keys(TYPE_LABELS) as PaymentType[]).map((type) => (
          <button
            key={type}
            type="button"
            onClick={() => setPaymentType(type)}
            className={`flex-1 rounded-full px-3 py-1.5 text-xs font-semibold transition-all ${
              paymentType === type
                ? "bg-coral text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.35),0_3px_0_0_var(--color-coral-dark),0_6px_14px_rgba(239,68,104,0.30)] active:translate-y-0.5 active:shadow-[inset_0_1px_0_rgba(255,255,255,0.35),0_0px_0_0_var(--color-coral-dark),0_2px_6px_rgba(239,68,104,0.25)]"
                : "bg-ink/5 text-ink-soft shadow-[inset_0_1px_3px_rgba(17,24,39,0.06)]"
            }`}
          >
            {TYPE_LABELS[type]}
          </button>
        ))}
      </div>

      {paymentType !== "flexible" && (
        <input
          type="number"
          min="0"
          placeholder={paymentType === "fixed" ? "Tutar (₺)" : "Pay yüzdesi (%)"}
          value={paymentAmount}
          onChange={(e) => setPaymentAmount(e.target.value)}
          className="mt-3 w-full rounded-lg bg-ink/5 shadow-[inset_0_2px_5px_rgba(17,24,39,0.08)] px-4 py-2 text-center text-sm outline-none focus:ring-2 focus:ring-coral/30"
        />
      )}
    </div>
  );
}

export function PublishForm({
  projectId,
  defaultPaymentType,
  defaultPaymentAmount,
}: {
  projectId: string;
  defaultPaymentType?: PaymentType | null;
  defaultPaymentAmount?: number | null;
}) {
  const router = useRouter();
  const supabase = createClient();
  const [loading, setLoading] = useState(false);
  const [paymentType, setPaymentType] = useState<PaymentType>(defaultPaymentType ?? "fixed");
  const [paymentAmount, setPaymentAmount] = useState(
    defaultPaymentAmount ? String(defaultPaymentAmount) : ""
  );

  async function handlePublish() {
    setLoading(true);
    await supabase
      .from("projects")
      .update({
        status: "published",
        payment_type: paymentType,
        payment_amount: paymentType === "flexible" ? null : paymentAmount ? Number(paymentAmount) : null,
      })
      .eq("id", projectId);
    setLoading(false);
    router.refresh();
  }

  return (
    <div className="flex flex-col items-center gap-3">
      <PaymentForm
        paymentType={paymentType}
        setPaymentType={setPaymentType}
        paymentAmount={paymentAmount}
        setPaymentAmount={setPaymentAmount}
      />
      <button
        onClick={handlePublish}
        disabled={loading}
        className="w-full max-w-sm rounded-full bg-coral px-8 py-3 text-base font-semibold text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.35),0_4px_0_0_var(--color-coral-dark),0_10px_20px_rgba(239,68,104,0.35)] transition-all hover:brightness-105 active:translate-y-1 active:shadow-[inset_0_1px_0_rgba(255,255,255,0.35),0_0px_0_0_var(--color-coral-dark),0_2px_6px_rgba(239,68,104,0.30)] disabled:opacity-50"
      >
        {loading ? "Yayınlanıyor..." : "Projeyi Yayınla"}
      </button>
    </div>
  );
}

export function PaymentEditor({
  projectId,
  initialPaymentType,
  initialPaymentAmount,
}: {
  projectId: string;
  initialPaymentType: PaymentType | null;
  initialPaymentAmount: number | null;
}) {
  const router = useRouter();
  const supabase = createClient();
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [paymentType, setPaymentType] = useState<PaymentType>(initialPaymentType ?? "fixed");
  const [paymentAmount, setPaymentAmount] = useState(
    initialPaymentAmount ? String(initialPaymentAmount) : ""
  );

  async function handleSave() {
    setSaving(true);
    await supabase
      .from("projects")
      .update({
        payment_type: paymentType,
        payment_amount: paymentType === "flexible" ? null : paymentAmount ? Number(paymentAmount) : null,
      })
      .eq("id", projectId);
    setSaving(false);
    setEditing(false);
    router.refresh();
  }

  if (!editing) {
    return (
      <div className="mt-4 flex items-center justify-between rounded-lg border border-stone-200 bg-white shadow-[inset_0_1px_0_rgba(255,255,255,0.8),0_4px_12px_rgba(17,24,39,0.12)] px-4 py-3">
        <p className="text-sm text-ink-soft">
          <span className="font-semibold text-ink">Ödeme:</span>{" "}
          {describePayment(initialPaymentType, initialPaymentAmount) ?? "Belirtilmedi"}
        </p>
        <button
          onClick={() => setEditing(true)}
          className="text-sm font-semibold text-coral-dark hover:underline"
        >
          Düzenle
        </button>
      </div>
    );
  }

  return (
    <div className="mt-4 flex flex-col items-start gap-3 rounded-lg border border-coral/30 bg-white p-4">
      <PaymentForm
        paymentType={paymentType}
        setPaymentType={setPaymentType}
        paymentAmount={paymentAmount}
        setPaymentAmount={setPaymentAmount}
      />
      <div className="flex gap-3">
        <button
          onClick={handleSave}
          disabled={saving}
          className="rounded-full bg-coral px-6 py-2 text-sm font-semibold text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.35),0_4px_0_0_var(--color-coral-dark),0_10px_20px_rgba(239,68,104,0.35)] transition-all hover:brightness-105 active:translate-y-1 active:shadow-[inset_0_1px_0_rgba(255,255,255,0.35),0_0px_0_0_var(--color-coral-dark),0_2px_6px_rgba(239,68,104,0.30)] disabled:opacity-50"
        >
          {saving ? "Kaydediliyor..." : "Kaydet"}
        </button>
        <button
          onClick={() => setEditing(false)}
          className="rounded-full bg-ink/5 shadow-[inset_0_1px_0_rgba(255,255,255,0.8),inset_0_-2px_0_rgba(17,24,39,0.06)] active:shadow-[inset_0_2px_4px_rgba(17,24,39,0.10)] active:translate-y-px px-6 py-2.5 text-sm font-semibold text-ink-soft hover:bg-ink/10 hover:text-ink"
        >
          Vazgeç
        </button>
      </div>
    </div>
  );
}
