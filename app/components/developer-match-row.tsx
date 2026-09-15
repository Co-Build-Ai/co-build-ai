"use client";

import { useState } from "react";
import { Star, Send, Check, MessageCircle } from "lucide-react";
import { createClient } from "@/utils/supabase/client";
import Avatar from "./avatar";
import RatingStars from "./rating-stars";
import AvailabilityBadge from "./availability-badge";
import PatentBadge from "./patent-badge";

export default function DeveloperMatchRow({
  developer,
  founderId,
  initiallyStarred = false,
  initiallyInvited = false,
  searchContext,
}: {
  developer: {
    id: string;
    fullName: string | null;
    matchScore: number;
    ratingAvg: number | null;
    ratingCount: number;
    availability?: string | null;
    hasVerifiedPatent?: boolean | null;
    avatarUrl?: string | null;
  };
  founderId: string;
  initiallyStarred?: boolean;
  /** Bildirim mesajına eklenecek bağlam (örn. arama sorgusu ya da proje adı) */
  initiallyInvited?: boolean;
  searchContext?: string;
}) {
  const supabase = createClient();
  const [starred, setStarred] = useState(initiallyStarred);
  const [saving, setSaving] = useState(false);
  const [invited, setInvited] = useState(initiallyInvited);
  const [inviting, setInviting] = useState(false);

  async function toggleStar() {
    setSaving(true);
    if (starred) {
      await supabase
        .from("starred_developers")
        .delete()
        .eq("founder_id", founderId)
        .eq("developer_id", developer.id);
    } else {
      await supabase
        .from("starred_developers")
        .insert({ founder_id: founderId, developer_id: developer.id });
    }
    setStarred((s) => !s);
    setSaving(false);
  }

  async function handleInvite() {
    if (inviting || invited) return;
    setInviting(true);

    const baglam = searchContext?.trim() ? `"${searchContext.trim()}"` : "aradığın pozisyon";
    const { error } = await supabase.from("notifications").insert({
      user_id: developer.id,
      sender_id: founderId,
      project_id: null,
      type: "project_invite",
      message: `${baglam} için seninle çalışmak istiyorlar — profilini inceleyip dilersen teklifini gönder.`,
    });

    if (!error) {
      setInvited(true);
    }
    setInviting(false);
  }

  return (
    <div className="rounded-lg border border-black/[0.06] bg-black/[0.015] p-4 transition-colors hover:bg-black/[0.03]">
      <div className="flex items-start gap-3">
        <a href={`/profil/${developer.id}`} className="flex min-w-0 flex-1 items-start gap-3">
          <Avatar name={developer.fullName} role="developer" size="sm" avatarUrl={developer.avatarUrl} />
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium text-ink hover:underline">{developer.fullName ?? "İsimsiz"}</p>
            <RatingStars average={developer.ratingAvg} count={developer.ratingCount} />
            {(developer.availability !== undefined || developer.hasVerifiedPatent) && (
              <div className="mt-1 flex flex-wrap gap-1">
                {developer.availability !== undefined && (
                  <AvailabilityBadge availability={developer.availability ?? null} />
                )}
                <PatentBadge hasPatent={developer.hasVerifiedPatent} />
              </div>
            )}
          </div>
        </a>

        <div className="flex shrink-0 items-center gap-2">
          <span className="rounded-md bg-[#8DD9A8]/25 px-2 py-0.5 text-xs font-semibold text-[#1a7a52]">
            %{developer.matchScore}
          </span>
          <button
            onClick={toggleStar}
            disabled={saving}
            title={starred ? "Yıldızı kaldır" : "Yıldızla"}
            className="disabled:opacity-50"
          >
            <Star size={18} className={starred ? "fill-[#1a7a52] text-[#1a7a52]" : "text-ink/25 hover:text-[#1a7a52]"} />
          </button>
        </div>
      </div>

      <div className="mt-3 flex gap-2">
        <button
          onClick={handleInvite}
          disabled={inviting || invited}
          className={`flex flex-1 items-center justify-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-semibold transition-all disabled:opacity-70 ${
            invited
              ? "bg-[#8DD9A8]/20 text-[#1a7a52]"
              : "bg-[#1a7a52] text-white hover:bg-[#15633f]"
          }`}
        >
          {invited ? (
            <>
              <Check size={13} /> Teklif Gönderildi
            </>
          ) : (
            <>
              <Send size={13} /> {inviting ? "Gönderiliyor..." : "Teklif Gönder"}
            </>
          )}
        </button>
        {invited && (
          <a
            href={`/mesajlar/${developer.id}`}
            title="Mesaj Gönder"
            className="flex shrink-0 items-center justify-center gap-1.5 rounded-md border border-black/[0.08] px-3 py-1.5 text-xs font-medium text-ink-soft transition-colors hover:bg-black/[0.04] hover:text-ink"
          >
            <MessageCircle size={13} />
            <span className="hidden sm:inline">Mesaj Gönder</span>
          </a>
        )}
      </div>
    </div>
  );
}
