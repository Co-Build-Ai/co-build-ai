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
  initialBannerUrl,
}: {
  userId: string;
  role: "founder" | "developer";
  initialFullName: string | null;
  initialAvatarUrl: string | null;
  initialBannerUrl?: string | null;
}) {
  const router = useRouter();
  const supabase = createClient();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const bannerInputRef = useRef<HTMLInputElement>(null);
  const [editingName, setEditingName] = useState(false);
  const [fullName, setFullName] = useState(initialFullName ?? "");
  const [avatarUrl, setAvatarUrl] = useState(initialAvatarUrl);
  const [bannerUrl, setBannerUrl] = useState(initialBannerUrl ?? null);
  const [uploading, setUploading] = useState(false);
  const [uploadingBanner, setUploadingBanner] = useState(false);
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

  async function handleBannerChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingBanner(true);
    setError(null);

    const ext = file.name.split(".").pop() ?? "jpg";
    const path = `${userId}/banner.${ext}`;

    const { error: uploadError } = await supabase.storage
      .from("banners")
      .upload(path, file, { upsert: true, cacheControl: "3600" });

    if (uploadError) {
      setError("Banner yüklenemedi, tekrar dener misin?");
      setUploadingBanner(false);
      return;
    }

    const { data } = supabase.storage.from("banners").getPublicUrl(path);
    const freshUrl = `${data.publicUrl}?t=${Date.now()}`;

    await supabase.from("profiles").update({ banner_url: freshUrl }).eq("id", userId);
    setBannerUrl(freshUrl);
    setUploadingBanner(false);
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
    <div className="flex w-full flex-col items-center">
      <div
        className={`group relative mb-[-2.5rem] h-28 w-full overflow-hidden rounded-xl sm:h-36 ${
          bannerUrl
            ? ""
            : role === "developer"
              ? "bg-gradient-to-r from-periwinkle/40 via-petal to-coral/20"
              : "bg-gradient-to-r from-coral/25 via-petal to-coral/10"
        }`}
      >
        {bannerUrl && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={bannerUrl} alt="" className="h-full w-full object-cover" />
        )}
        <button
          onClick={() => bannerInputRef.current?.click()}
          disabled={uploadingBanner}
          title="Banner değiştir"
          className="absolute bottom-2 right-2 flex h-8 w-8 items-center justify-center rounded-full bg-black/40 text-white opacity-0 shadow-sm backdrop-blur transition-opacity hover:bg-black/55 group-hover:opacity-100 disabled:opacity-50"
        >
          {uploadingBanner ? (
            <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white border-t-transparent" />
          ) : (
            <Camera size={16} />
          )}
        </button>
        <input
          ref={bannerInputRef}
          type="file"
          accept="image/*"
          onChange={handleBannerChange}
          className="hidden"
        />
      </div>

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
