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
    <div className="rounded-xl border border-stone-200 bg-white shadow-[inset_0_1px_0_rgba(255,255,255,0.8),0_4px_12px_rgba(17,24,39,0.12)] p-8">
      <h2 className="text-lg font-bold text-ink">Şifre Değiştir</h2>
      <div className="mt-4 flex flex-col gap-3 sm:max-w-sm">
        <input
          type="password"
          placeholder="Yeni şifre"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="rounded-lg bg-ink/5 shadow-[inset_0_2px_5px_rgba(17,24,39,0.08)] px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-coral/30"
        />
        <input
          type="password"
          placeholder="Yeni şifre (tekrar)"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          className="rounded-lg bg-ink/5 shadow-[inset_0_2px_5px_rgba(17,24,39,0.08)] px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-coral/30"
        />

        {message && (
          <p className={`text-sm ${message.type === "success" ? "text-periwinkle-dark" : "text-coral-dark"}`}>
            {message.text}
          </p>
        )}

        <button
          onClick={handleSubmit}
          disabled={saving}
          className="self-start rounded-full bg-coral px-6 py-2 text-sm font-semibold text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.35),0_4px_0_0_var(--color-coral-dark),0_10px_20px_rgba(239,68,104,0.35)] transition-all hover:brightness-105 active:translate-y-1 active:shadow-[inset_0_1px_0_rgba(255,255,255,0.35),0_0px_0_0_var(--color-coral-dark),0_2px_6px_rgba(239,68,104,0.30)] disabled:opacity-50"
        >
          {saving ? "Kaydediliyor..." : "Şifreyi Güncelle"}
        </button>
      </div>
    </div>
  );
}
