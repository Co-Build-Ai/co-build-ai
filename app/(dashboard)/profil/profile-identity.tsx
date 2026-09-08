"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Camera, Pencil } from "lucide-react";
import { createClient } from "@/utils/supabase/client";
import Avatar from "@/app/components/avatar";

export default function ProfileIdentity({
  userId,
  role,
  initialFullName,
  initialAvatarUrl,
}: {
  userId: string;
  role: "founder" | "developer";
  initialFullName: string | null;
  initialAvatarUrl: string | null;
}) {
  const router = useRouter();
  const supabase = createClient();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [editingName, setEditingName] = useState(false);
  const [fullName, setFullName] = useState(initialFullName ?? "");
  const [avatarUrl, setAvatarUrl] = useState(initialAvatarUrl);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    setError(null);

    const ext = file.name.split(".").pop() ?? "jpg";
    const path = `${userId}/avatar.${ext}`;

    const { error: uploadError } = await supabase.storage
      .from("avatars")
      .upload(path, file, { upsert: true, cacheControl: "3600" });

    if (uploadError) {
      setError("Fotoğraf yüklenemedi, tekrar dener misin?");
      setUploading(false);
      return;
    }

    const { data } = supabase.storage.from("avatars").getPublicUrl(path);
    // Aynı dosya adı üzerine yeniden yüklense de tarayıcı eski önbelleğe
    // düşmesin diye URL'e bir zaman damgası ekleniyor.
    const freshUrl = `${data.publicUrl}?t=${Date.now()}`;

    await supabase.from("profiles").update({ avatar_url: freshUrl }).eq("id", userId);
    setAvatarUrl(freshUrl);
    setUploading(false);
    router.refresh();
  }

  async function handleSaveName() {
    if (!fullName.trim()) return;
    setSaving(true);
    await supabase.from("profiles").update({ full_name: fullName.trim() }).eq("id", userId);
    setSaving(false);
    setEditingName(false);
    router.refresh();
  }

  return (
    <div className="flex flex-col items-center">
      <div className="group relative">
        <Avatar name={fullName} role={role} size="lg" avatarUrl={avatarUrl} />
        <button
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading}
          title="Fotoğraf değiştir"
          className="absolute -bottom-1 -right-1 flex h-7 w-7 items-center justify-center rounded-full bg-coral text-white shadow-sm hover:brightness-105 disabled:opacity-50"
        >
          {uploading ? (
            <span className="h-3 w-3 animate-spin rounded-full border-2 border-white border-t-transparent" />
          ) : (
            <Camera size={14} />
          )}
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleFileChange}
          className="hidden"
        />
      </div>

      {error && <p className="mt-2 text-xs text-coral-dark">{error}</p>}

      {editingName ? (
        <div className="mt-4 flex flex-wrap items-center justify-center gap-2">
          <input
            type="text"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            placeholder="Ad Soyad"
            className="rounded-lg bg-ink/5 shadow-[inset_0_2px_5px_rgba(17,24,39,0.08)] px-4 py-2 text-center text-lg font-extrabold text-ink outline-none focus:ring-2 focus:ring-coral/30"
          />
          <button
            onClick={handleSaveName}
            disabled={saving}
            className="rounded-full bg-coral px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
          >
            {saving ? "..." : "Kaydet"}
          </button>
          <button
            onClick={() => {
              setEditingName(false);
              setFullName(initialFullName ?? "");
            }}
            className="text-sm font-semibold text-ink-soft hover:text-ink"
          >
            Vazgeç
          </button>
        </div>
      ) : (
        <div className="mt-4 flex items-center gap-2">
          <h1 className="text-3xl font-extrabold tracking-tight text-ink sm:text-4xl">
            {fullName || "Profilim"}
          </h1>
          <button
            onClick={() => setEditingName(true)}
            title="Adını düzenle"
            className="text-ink-soft hover:text-coral-dark"
          >
            <Pencil size={18} />
          </button>
        </div>
      )}
    </div>
  );
}
