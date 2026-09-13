"use client";

import { useState } from "react";
import { Star, Send, Check } from "lucide-react";
import { createClient } from "@/utils/supabase/client";
import Avatar from "@/app/components/avatar";
import ProgressRing from "@/app/components/progress-ring";

export type MatchedDeveloper = {
  developerId: string;
  fullName: string | null;
  bio: string | null;
  skills: string[];
  matchScore: number;
};

export default function MatchedDevelopers({
  developers,
  founderId,
  projectId,
  projectTitle,
  starredIds = [],
  invitedIds = [],
}: {
  developers: MatchedDeveloper[];
  founderId: string;
  projectId: string;
  projectTitle: string;
  starredIds?: string[];
  invitedIds?: string[];
}) {
  if (!developers || developers.length === 0) {
    return null;
  }

  return (
    <div>
      <div className="mb-3 flex items-center justify-between">
        <p className="font-mono text-xs font-semibold uppercase tracking-wide text-ink-soft">
          Eşleşen Yazılımcılar ({developers.length})
        </p>
        <span className="rounded-md bg-black/[0.04] px-3 py-1 font-mono text-[10px] font-medium text-ink-soft">
          Beceri Uyumu
        </span>
      </div>

      <div className="flex flex-col gap-4">
        {developers.map((dev) => (
          <MatchedDeveloperCard
            key={dev.developerId}
            developer={dev}
            founderId={founderId}
            projectId={projectId}
            projectTitle={projectTitle}
            initiallyStarred={starredIds.includes(dev.developerId)}
            initiallyInvited={invitedIds.includes(dev.developerId)}
          />
        ))}
      </div>

      <a href="/panel" className="mt-3 inline-block text-xs font-semibold text-coral-dark hover:underline">
        Keşfet&apos;te tüm yazılımcıları gör →
      </a>
    </div>
  );
}

function MatchedDeveloperCard({
  developer,
  founderId,
  projectId,
  projectTitle,
  initiallyStarred,
  initiallyInvited,
}: {
  developer: MatchedDeveloper;
  founderId: string;
  projectId: string;
  projectTitle: string;
  initiallyStarred: boolean;
  initiallyInvited: boolean;
}) {
  const supabase = createClient();
  const [starred, setStarred] = useState(initiallyStarred);
  const [saving, setSaving] = useState(false);
  const [invited, setInvited] = useState(initiallyInvited);
  const [inviting, setInviting] = useState(false);

  async function toggleStar() {
    if (saving) return;
    setSaving(true);

    if (starred) {
      await supabase
        .from("starred_developers")
        .delete()
        .eq("founder_id", founderId)
        .eq("developer_id", developer.developerId);
    } else {
      await supabase
        .from("starred_developers")
        .insert({ founder_id: founderId, developer_id: developer.developerId });
    }

    setStarred((s) => !s);
    setSaving(false);
  }

  async function handleInvite() {
    if (inviting || invited) return;
    setInviting(true);

    await supabase.from("notifications").insert({
      user_id: developer.developerId,
      project_id: projectId,
      type: "project_invite",
      message: `"${projectTitle}" projesi için seninle çalışmak istiyorlar — PRD'yi incele ve dilersen teklifini gönder.`,
    });

    setInvited(true);
    setInviting(false);
  }

  return (
    <div className="rounded-xl border border-black/[0.08] bg-white p-6 shadow-sm transition-all hover:shadow-md">
      <div className="flex items-start gap-3">
        <a href={`/profil/${developer.developerId}`} className="flex min-w-0 flex-1 items-start gap-3">
          <Avatar name={developer.fullName} role="developer" size="md" />

          <div className="min-w-0 flex-1">
            <h3 className="truncate text-base font-bold text-ink hover:underline">
              {developer.fullName ?? "İsimsiz Yazılımcı"}
            </h3>
            {developer.bio && (
              <p className="mt-0.5 line-clamp-2 text-xs leading-relaxed text-ink-soft">{developer.bio}</p>
            )}
          </div>
        </a>

        <button
          onClick={toggleStar}
          disabled={saving}
          title={starred ? "Yıldızı kaldır" : "Yıldızla"}
          className="shrink-0 disabled:opacity-50"
        >
          <Star size={18} className={starred ? "fill-coral text-coral" : "text-ink/25 hover:text-coral"} />
        </button>

        <ProgressRing value={developer.matchScore} size={44} strokeWidth={4} />
      </div>

      {developer.skills.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-1.5">
          {developer.skills.map((skill) => (
            <span
              key={skill}
              className="rounded-md bg-black/[0.04] px-2.5 py-0.5 font-mono text-[11px] text-ink-soft"
            >
              {skill}
            </span>
          ))}
        </div>
      )}

      <button
        onClick={handleInvite}
        disabled={inviting || invited}
        className={`mt-3 flex w-full items-center justify-center gap-1.5 rounded-full px-4 py-2 text-xs font-semibold transition-all disabled:opacity-70 ${
          invited
            ? "bg-periwinkle/20 text-periwinkle-dark"
            : "bg-[#1a7a52] text-white transition-colors"
        }`}
      >
        {invited ? (
          <>
            <Check size={14} /> Davet Gönderildi
          </>
        ) : (
          <>
            <Send size={14} /> {inviting ? "Gönderiliyor..." : "Projeye Davet Et"}
          </>
        )}
      </button>
    </div>
  );
}
