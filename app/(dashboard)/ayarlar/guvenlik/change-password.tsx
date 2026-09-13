"use client";

import { useState } from "react";
import { createClient } from "@/utils/supabase/client";

export default function ChangePassword() {
  const supabase = createClient();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  async function handleSubmit() {
    setMessage(null);

    if (password.length < 6) {
      setMessage({ type: "error", text: "Şifre en az 6 karakter olmalı." });
      return;
    }
    if (password !== confirmPassword) {
      setMessage({ type: "error", text: "Şifreler birbiriyle eşleşmiyor." });
      return;
    }

    setSaving(true);
    const { error } = await supabase.auth.updateUser({ password });
    setSaving(false);

    if (error) {
      setMessage({ type: "error", text: error.message });
      return;
    }

    setPassword("");
    setConfirmPassword("");
    setMessage({ type: "success", text: "Şifren güncellendi." });
  }

  return (
    <div className="rounded-xl border border-black/[0.08] bg-white shadow-sm p-8">
      <h2 className="text-lg font-bold text-ink">Şifre Değiştir</h2>
      <div className="mt-4 flex flex-col gap-3 sm:max-w-sm">
        <input
          type="password"
          placeholder="Yeni şifre"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="rounded-lg border border-black/[0.08] bg-black/[0.02] px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-[#8DD9A8]/40"
        />
        <input
          type="password"
          placeholder="Yeni şifre (tekrar)"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          className="rounded-lg border border-black/[0.08] bg-black/[0.02] px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-[#8DD9A8]/40"
        />

        {message && (
          <p className={`text-sm ${message.type === "success" ? "text-periwinkle-dark" : "text-coral-dark"}`}>
            {message.text}
          </p>
        )}

        <button
          onClick={handleSubmit}
          disabled={saving}
          className="self-start rounded-full bg-[#1a7a52] px-6 py-2 text-sm font-medium text-white transition-colors hover:bg-[#15633f] disabled:opacity-50"
        >
          {saving ? "Kaydediliyor..." : "Şifreyi Güncelle"}
        </button>
      </div>
    </div>
  );
}
