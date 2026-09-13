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
    <div className="mt-6 rounded-xl border border-black/[0.08] bg-white shadow-sm p-8">
      <h2 className="text-lg font-bold text-ink">Hesabı Sil</h2>
      <p className="mt-2 text-sm text-ink-soft">
        Hesabını sildiğinde profilin, projelerin, tekliflerin, mesajların ve tüm diğer
        verilerin kalıcı olarak silinir. Bu işlem geri alınamaz.
      </p>

      {!expanded ? (
        <button
          onClick={() => setExpanded(true)}
          className="mt-4 rounded-full bg-black/[0.04] transition-colors px-6 py-2.5 text-sm font-semibold text-ink-soft hover:bg-ink/10 hover:text-ink"
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
            className="rounded-lg border border-black/[0.08] bg-black/[0.02] px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-red-500/30"
          />

          {error && <p className="text-sm text-red-600">{error}</p>}

          <div className="flex gap-3">
            <button
              onClick={handleDelete}
              disabled={!canDelete || deleting}
              className="rounded-full bg-red-600 px-6 py-2 text-sm font-medium text-white transition-colors hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-40"
            >
              {deleting ? "Siliniyor..." : "Kalıcı Olarak Sil"}
            </button>
            <button
              onClick={() => {
                setExpanded(false);
                setConfirmText("");
                setError(null);
              }}
              className="rounded-full bg-black/[0.04] transition-colors px-6 py-2.5 text-sm font-semibold text-ink-soft hover:bg-ink/10 hover:text-ink"
            >
              Vazgeç
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
