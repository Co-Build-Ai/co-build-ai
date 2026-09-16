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
                ? "bg-[#1a7a52] text-white transition-colors"
                : "bg-black/[0.04] text-ink-soft"
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
          className="mt-3 w-full rounded-lg border border-black/[0.08] bg-black/[0.02] px-4 py-2 text-center text-sm outline-none focus:ring-2 focus:ring-[#8DD9A8]/40"
        />
      )}
    </div>
  );
}

export function PublishForm({
  projectId,
  projectTitle,
  generatedPrd,
  requiredSkills,
  defaultPaymentType,
  defaultPaymentAmount,
}: {
  projectId: string;
  projectTitle: string;
  generatedPrd?: string | null;
  requiredSkills?: string[] | null;
  defaultPaymentType?: PaymentType | null;
  defaultPaymentAmount?: number | null;
}) {
  const router = useRouter();
  const supabase = createClient();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [paymentType, setPaymentType] = useState<PaymentType>(defaultPaymentType ?? "fixed");
  const [paymentAmount, setPaymentAmount] = useState(
    defaultPaymentAmount ? String(defaultPaymentAmount) : ""
  );

  async function handlePublish() {
    setLoading(true);
    setError(null);
    const { data, error: updateError } = await supabase
      .from("projects")
      .update({
        status: "published",
        payment_type: paymentType,
        payment_amount: paymentType === "flexible" ? null : paymentAmount ? Number(paymentAmount) : null,
      })
      .eq("id", projectId)
      .select();
    setLoading(false);
    if (updateError) {
      setError(updateError.message);
      return;
    }
    if (!data || data.length === 0) {
      setError(
        "Güncelleme yapılamadı (0 satır etkilendi) — büyük olasılıkla Supabase RLS politikası bu güncellemeyi engelliyor."
      );
      return;
    }

    // Yazılımcı tarafındaki "Doğrudan Arama"nın anlamsal aramada bu projeyi
    // bulabilmesi için AI sunucusunda vektörle (aynı project_id ile upsert)
    try {
      await fetch(`${process.env.NEXT_PUBLIC_AI_SERVICE_URL}/proje/vektorle`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          project_id: projectId,
          title: projectTitle,
          generated_prd: generatedPrd ?? "",
          required_skills: requiredSkills ?? [],
        }),
      });
    } catch {
      // AI sunucusuna ulaşılamazsa proje yine de yayınlanmış olur, sadece
      // eşleştirme motorunda anlamsal aramada görünmeyebilir
    }

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
        className="w-full max-w-sm rounded-full bg-[#1a7a52] px-8 py-3 text-base font-medium text-white transition-colors hover:bg-[#15633f] disabled:opacity-50"
      >
        {loading ? "Yayınlanıyor..." : "Projeyi Yayınla"}
      </button>
      {error && <p className="max-w-sm text-center text-sm text-red-600">{error}</p>}
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
      <div className="mt-4 flex items-center justify-between rounded-lg border border-black/[0.08] bg-white shadow-sm px-4 py-3">
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
          className="rounded-full bg-[#1a7a52] px-6 py-2 text-sm font-medium text-white transition-colors hover:bg-[#15633f] disabled:opacity-50"
        >
          {saving ? "Kaydediliyor..." : "Kaydet"}
        </button>
        <button
          onClick={() => setEditing(false)}
          className="rounded-full bg-black/[0.04] transition-colors px-6 py-2.5 text-sm font-semibold text-ink-soft hover:bg-ink/10 hover:text-ink"
        >
          Vazgeç
        </button>
      </div>
    </div>
  );
}
