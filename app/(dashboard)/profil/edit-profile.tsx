"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/utils/supabase/client";

export default function EditProfile({
  userId,
  fullName,
  initialBio,
  initialSkills,
  initialCvUrl,
  initialPatentUrl,
}: {
  userId: string;
  fullName: string | null;
  initialBio: string | null;
  initialSkills: string[] | null;
  initialCvUrl: string | null;
  initialPatentUrl?: string | null;
}) {
  const router = useRouter();
  const supabase = createClient();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const patentFileInputRef = useRef<HTMLInputElement>(null);
  const [editing, setEditing] = useState(false);
  const [bio, setBio] = useState(initialBio ?? "");
  const [skillsText, setSkillsText] = useState((initialSkills ?? []).join(", "));
  const [cvUrl, setCvUrl] = useState(initialCvUrl ?? "");
  const [cvFileName, setCvFileName] = useState<string | null>(null);
  const [uploadingCv, setUploadingCv] = useState(false);
  const [cvError, setCvError] = useState<string | null>(null);
  const [patentUrl, setPatentUrl] = useState(initialPatentUrl ?? "");
  const [patentFileName, setPatentFileName] = useState<string | null>(null);
  const [uploadingPatent, setUploadingPatent] = useState(false);
  const [patentError, setPatentError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  async function handleCvFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingCv(true);
    setCvError(null);

    const ext = file.name.split(".").pop() ?? "pdf";
    const path = `${userId}/cv.${ext}`;

    const { error: uploadError } = await supabase.storage
      .from("cvs")
      .upload(path, file, { upsert: true, cacheControl: "3600" });

    if (uploadError) {
      setCvError("CV yüklenemedi, tekrar dener misin?");
      setUploadingCv(false);
      return;
    }

    const { data } = supabase.storage.from("cvs").getPublicUrl(path);
    setCvUrl(`${data.publicUrl}?t=${Date.now()}`);
    setCvFileName(file.name);
    setUploadingCv(false);
  }

  async function handlePatentFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingPatent(true);
    setPatentError(null);

    const ext = file.name.split(".").pop() ?? "pdf";
    const path = `${userId}/patent.${ext}`;

    const { error: uploadError } = await supabase.storage
      .from("patent-belgeleri")
      .upload(path, file, { upsert: true, cacheControl: "3600" });

    if (uploadError) {
      setPatentError("Patent belgesi yüklenemedi, tekrar dener misin?");
      setUploadingPatent(false);
      return;
    }

    const { data } = supabase.storage.from("patent-belgeleri").getPublicUrl(path);
    setPatentUrl(`${data.publicUrl}?t=${Date.now()}`);
    setPatentFileName(file.name);
    setUploadingPatent(false);
  }

  async function handleSave() {
    setSaving(true);
    const skillsArray = skillsText
      .split(",")
      .map((s) => s.trim())
      .filter((s) => s.length > 0);

    await supabase
      .from("profiles")
      .update({
        bio,
        skills: skillsArray,
        cv_url: cvUrl.trim() || null,
        patent_url: patentUrl.trim() || null,
        has_verified_patent: !!patentUrl.trim(),
      })
      .eq("id", userId);

    // Eşleştirme motorunun anlamsal aramada bulabilmesi için profili
    // AI sunucusunda yeniden vektörle (aynı developer_id ile upsert)
    try {
      await fetch(`${process.env.NEXT_PUBLIC_AI_SERVICE_URL}/gelistirici/vektorle`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          developer_id: userId,
          ad_soyad: fullName ?? "",
          uzmanlik_alanlari: [],
          bildigi_diller: skillsArray,
          bio,
        }),
      });
    } catch {
      // AI sunucusuna ulaşılamazsa profil yine de kaydedilmiş olur,
      // sadece eşleştirme motorunda güncel görünmeyebilir
    }

    setSaving(false);
    setEditing(false);
    router.refresh();
  }

  if (!editing) {
    return (
      <div className="mt-8 rounded-xl border border-black/[0.08] bg-white shadow-sm p-8">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-ink">
            Hakkımda
          </h2>
          <button
            onClick={() => setEditing(true)}
            className="text-sm font-semibold text-coral-dark hover:underline"
          >
            Düzenle
          </button>
        </div>

        <p className="mt-3 text-sm leading-relaxed text-ink-soft">
          {initialBio || "Henüz bir tanıtım yazısı eklenmedi."}
        </p>

        <div className="mt-4 flex flex-wrap gap-2">
          {initialSkills && initialSkills.length > 0 ? (
            initialSkills.map((skill) => (
              <span key={skill} className="rounded-md bg-black/[0.04] px-3 py-1 font-mono text-xs text-ink-soft">
                {skill}
              </span>
            ))
          ) : (
            <p className="text-xs text-ink-soft">Henüz beceri etiketi eklenmedi.</p>
          )}
        </div>

        <div className="mt-4">
          {initialCvUrl ? (
            <a
              href={initialCvUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm font-semibold text-coral-dark hover:underline"
            >
              CV&apos;yi Görüntüle →
            </a>
          ) : (
            <p className="text-xs text-ink-soft">Henüz CV yüklenmedi.</p>
          )}
        </div>

        <div className="mt-2">
          {initialPatentUrl ? (
            <a
              href={initialPatentUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm font-semibold text-coral-dark hover:underline"
            >
              Patent Belgesini Görüntüle →
            </a>
          ) : (
            <p className="text-xs text-ink-soft">Henüz patent belgesi yüklenmedi.</p>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="mt-8 rounded-xl border border-coral/30 bg-white p-6">
      <h2 className="text-lg font-bold text-ink">
        Profilini Düzenle
      </h2>

      <div className="mt-4 flex flex-col gap-4">
        <div>
          <label className="block text-sm font-medium text-ink">Hakkımda</label>
          <textarea
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            rows={4}
            placeholder="Kendini kısaca tanıt: hangi alanlarda deneyimlisin, ne tür projelerde çalıştın..."
            className="mt-1 w-full resize-none rounded-lg border border-black/[0.08] bg-black/[0.02] px-4 py-2.5 text-sm text-ink outline-none focus:ring-2 focus:ring-[#8DD9A8]/40"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-ink">Beceriler</label>
          <input
            type="text"
            value={skillsText}
            onChange={(e) => setSkillsText(e.target.value)}
            placeholder="örn. React, Node.js, PostgreSQL (virgülle ayır)"
            className="mt-1 w-full rounded-lg border border-black/[0.08] bg-black/[0.02] px-4 py-2.5 text-sm text-ink outline-none focus:ring-2 focus:ring-[#8DD9A8]/40"
          />
          <p className="mt-1 text-xs text-ink-soft">Becerileri virgülle ayırarak yaz.</p>
        </div>

        <div>
          <label className="block text-sm font-medium text-ink">CV Yükle</label>
          <div className="mt-1 flex items-center gap-3">
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploadingCv}
              className="rounded-full bg-black/[0.04] transition-colors px-5 py-2 text-sm font-semibold text-ink-soft hover:bg-ink/10 hover:text-ink disabled:opacity-50"
            >
              {uploadingCv ? "Yükleniyor..." : "Dosya Seç"}
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf,.doc,.docx"
              onChange={handleCvFileChange}
              className="hidden"
            />
            {cvFileName ? (
              <span className="truncate text-xs text-ink-soft">{cvFileName}</span>
            ) : cvUrl ? (
              <a
                href={cvUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="truncate text-xs font-semibold text-coral-dark hover:underline"
              >
                Mevcut CV&apos;yi görüntüle →
              </a>
            ) : (
              <span className="text-xs text-ink-soft">PDF, DOC veya DOCX</span>
            )}
          </div>
          {cvError && <p className="mt-1 text-xs text-coral-dark">{cvError}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium text-ink">Patent Belgesi Yükle</label>
          <p className="mt-0.5 text-xs text-ink-soft">
            Tescilli bir patentin varsa belgeni yükle ya da patent sicil linkini yapıştır — kaydettiğinde
            profilinde &quot;Tescilli Mucit&quot; rozeti otomatik görünür.
          </p>
          <div className="mt-1 flex items-center gap-3">
            <button
              type="button"
              onClick={() => patentFileInputRef.current?.click()}
              disabled={uploadingPatent}
              className="rounded-full bg-black/[0.04] transition-colors px-5 py-2 text-sm font-semibold text-ink-soft hover:bg-ink/10 hover:text-ink disabled:opacity-50"
            >
              {uploadingPatent ? "Yükleniyor..." : "Dosya Seç"}
            </button>
            <input
              ref={patentFileInputRef}
              type="file"
              accept=".pdf,.jpg,.jpeg,.png"
              onChange={handlePatentFileChange}
              className="hidden"
            />
            {patentFileName ? (
              <span className="truncate text-xs text-ink-soft">{patentFileName}</span>
            ) : patentUrl ? (
              <a
                href={patentUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="truncate text-xs font-semibold text-coral-dark hover:underline"
              >
                Mevcut belgeyi görüntüle →
              </a>
            ) : (
              <span className="text-xs text-ink-soft">PDF, JPG veya PNG</span>
            )}
          </div>
          <input
            type="text"
            value={patentFileName ? "" : patentUrl}
            onChange={(e) => {
              setPatentUrl(e.target.value);
              setPatentFileName(null);
            }}
            placeholder="ya da patent sicil linki yapıştır (örn. TÜRKPATENT sayfası)"
            className="mt-2 w-full rounded-lg border border-black/[0.08] bg-black/[0.02] px-4 py-2 text-sm outline-none focus:ring-2 focus:ring-[#8DD9A8]/40"
          />
          {patentError && <p className="mt-1 text-xs text-coral-dark">{patentError}</p>}
        </div>

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
    </div>
  );
}