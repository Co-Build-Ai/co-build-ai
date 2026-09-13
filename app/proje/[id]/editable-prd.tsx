"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/utils/supabase/client";

export default function EditablePrd({
  projectId,
  initialPrd,
}: {
  projectId: string;
  initialPrd: string;
}) {
  const router = useRouter();
  const supabase = createClient();
  const [editing, setEditing] = useState(false);
  const [text, setText] = useState(initialPrd);
  const [saving, setSaving] = useState(false);

  async function handleSave() {
    setSaving(true);
    await supabase
      .from("projects")
      .update({ generated_prd: text })
      .eq("id", projectId);
    setSaving(false);
    setEditing(false);
    router.refresh();
  }

  return (
    <div className="mt-8 rounded-xl border border-black/[0.08] bg-white p-6 shadow-sm">
      <span className="inline-flex items-center rounded-md bg-black/[0.04] px-3 py-1 font-mono text-xs font-medium text-ink-soft">
        AI Tarafından Üretildi
      </span>
      <div className="mt-3 flex items-center justify-between">
        <h2 className="text-xl font-bold text-ink">
          Ürün Gereksinim Dokümanı (PRD)
        </h2>
        {!editing && (
          <button
            onClick={() => setEditing(true)}
            className="text-sm font-semibold text-coral-dark hover:underline"
          >
            Düzenle
          </button>
        )}
      </div>

      {editing ? (
        <div className="mt-4 flex flex-col gap-3">
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            rows={16}
            className="w-full resize-none rounded-lg border border-ink/15 p-4 font-mono text-sm text-ink outline-none focus:border-coral"
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
              onClick={() => {
                setText(initialPrd);
                setEditing(false);
              }}
              className="rounded-full bg-black/[0.04] transition-colors px-6 py-2.5 text-sm font-semibold text-ink-soft hover:bg-ink/10 hover:text-ink"
            >
              Vazgeç
            </button>
          </div>
        </div>
      ) : (
        <div className="mt-4 whitespace-pre-wrap text-sm leading-relaxed text-ink-soft">
          {text}
        </div>
      )}
    </div>
  );
}