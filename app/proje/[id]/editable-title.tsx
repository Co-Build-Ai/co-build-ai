"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Pencil, Check, X } from "lucide-react";
import { createClient } from "@/utils/supabase/client";

export default function EditableTitle({
  projectId,
  initialTitle,
}: {
  projectId: string;
  initialTitle: string;
}) {
  const router = useRouter();
  const supabase = createClient();
  const [editing, setEditing] = useState(false);
  const [title, setTitle] = useState(initialTitle);
  const [saving, setSaving] = useState(false);

  async function handleSave() {
    const trimmed = title.trim();
    if (!trimmed) {
      setTitle(initialTitle);
      setEditing(false);
      return;
    }
    setSaving(true);
    await supabase.from("projects").update({ title: trimmed }).eq("id", projectId);
    setSaving(false);
    setEditing(false);
    router.refresh();
  }

  function handleCancel() {
    setTitle(initialTitle);
    setEditing(false);
  }

  if (editing) {
    return (
      <div className="flex min-w-0 flex-1 items-center gap-2">
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") handleSave();
            if (e.key === "Escape") handleCancel();
          }}
          autoFocus
          disabled={saving}
          className="min-w-0 flex-1 rounded-lg bg-ink/5 px-3 py-1.5 text-2xl font-extrabold tracking-tight text-ink outline-none focus:ring-2 focus:ring-coral/30"
        />
        <button
          onClick={handleSave}
          disabled={saving}
          title="Kaydet"
          className="shrink-0 flex h-8 w-8 items-center justify-center rounded-full bg-coral text-white hover:brightness-105 disabled:opacity-50"
        >
          <Check size={16} />
        </button>
        <button
          onClick={handleCancel}
          disabled={saving}
          title="Vazgeç"
          className="shrink-0 flex h-8 w-8 items-center justify-center rounded-full bg-ink/5 text-ink-soft hover:bg-ink/10 hover:text-ink disabled:opacity-50"
        >
          <X size={16} />
        </button>
      </div>
    );
  }

  return (
    <div className="group flex min-w-0 flex-1 items-center gap-2">
      <h1 className="min-w-0 truncate text-2xl font-extrabold tracking-tight text-ink">{title}</h1>
      <button
        onClick={() => setEditing(true)}
        title="Başlığı düzenle"
        className="shrink-0 text-ink-soft opacity-0 transition-opacity hover:text-coral-dark group-hover:opacity-100"
      >
        <Pencil size={16} />
      </button>
    </div>
  );
}
