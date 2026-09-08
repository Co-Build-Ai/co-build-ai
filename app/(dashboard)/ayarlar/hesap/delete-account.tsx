"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/utils/supabase/client";

export default function DeleteAccount({ userEmail }: { userEmail: string }) {
  const router = useRouter();
  const supabase = createClient();
  const [expanded, setExpanded] = useState(false);
  const [confirmText, setConfirmText] = useState("");
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const canDelete = confirmText.trim().toLowerCase() === userEmail.toLowerCase();

  async function handleDelete() {
    if (!canDelete) return;
    setDeleting(true);
    setError(null);

    const res = await fetch("/api/hesap-sil", { method: "POST" });

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error ?? "Hesap silinirken bir hata oluştu.");
      setDeleting(false);
      return;
    }

    await supabase.auth.signOut();
    router.push("/");
    router.refresh();
  }

  return (
    <div className="mt-6 rounded-xl border border-stone-200 bg-white shadow-[inset_0_1px_0_rgba(255,255,255,0.8),0_4px_12px_rgba(17,24,39,0.12)] p-8">
      <h2 className="text-lg font-bold text-ink">Hesabı Sil</h2>
      <p className="mt-2 text-sm text-ink-soft">
        Hesabını sildiğinde profilin, projelerin, tekliflerin, mesajların ve tüm diğer
        verilerin kalıcı olarak silinir. Bu işlem geri alınamaz.
      </p>

      {!expanded ? (
        <button
          onClick={() => setExpanded(true)}
          className="mt-4 rounded-full bg-ink/5 shadow-[inset_0_1px_0_rgba(255,255,255,0.8),inset_0_-2px_0_rgba(17,24,39,0.06)] active:shadow-[inset_0_2px_4px_rgba(17,24,39,0.10)] active:translate-y-px px-6 py-2.5 text-sm font-semibold text-ink-soft hover:bg-ink/10 hover:text-ink"
        >
          Hesabımı Sil
        </button>
      ) : (
        <div className="mt-4 flex flex-col gap-3 sm:max-w-sm">
          <label className="text-sm text-ink-soft">
            Onaylamak için e-posta adresini (<strong>{userEmail}</strong>) yaz:
          </label>
          <input
            type="text"
            value={confirmText}
            onChange={(e) => setConfirmText(e.target.value)}
            placeholder={userEmail}
            className="rounded-lg bg-ink/5 shadow-[inset_0_2px_5px_rgba(17,24,39,0.08)] px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-coral/30"
          />

          {error && <p className="text-sm text-coral-dark">{error}</p>}

          <div className="flex gap-3">
            <button
              onClick={handleDelete}
              disabled={!canDelete || deleting}
              className="rounded-full bg-coral px-6 py-2 text-sm font-semibold text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.35),0_4px_0_0_var(--color-coral-dark),0_10px_20px_rgba(239,68,104,0.35)] transition-all hover:brightness-105 active:translate-y-1 active:shadow-[inset_0_1px_0_rgba(255,255,255,0.35),0_0px_0_0_var(--color-coral-dark),0_2px_6px_rgba(239,68,104,0.30)] disabled:cursor-not-allowed disabled:opacity-40"
            >
              {deleting ? "Siliniyor..." : "Kalıcı Olarak Sil"}
            </button>
            <button
              onClick={() => {
                setExpanded(false);
                setConfirmText("");
                setError(null);
              }}
              className="rounded-full bg-ink/5 shadow-[inset_0_1px_0_rgba(255,255,255,0.8),inset_0_-2px_0_rgba(17,24,39,0.06)] active:shadow-[inset_0_2px_4px_rgba(17,24,39,0.10)] active:translate-y-px px-6 py-2.5 text-sm font-semibold text-ink-soft hover:bg-ink/10 hover:text-ink"
            >
              Vazgeç
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
