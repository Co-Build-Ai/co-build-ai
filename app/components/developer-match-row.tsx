"use client";

import { useState } from "react";
import { Star, MessageCircle } from "lucide-react";
import { createClient } from "@/utils/supabase/client";
import Avatar from "./avatar";
import RatingStars from "./rating-stars";
import AvailabilityBadge from "./availability-badge";
import PatentBadge from "./patent-badge";

export default function DeveloperMatchRow({
  developer,
  founderId,
  initiallyStarred = false,
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
}) {
  const supabase = createClient();
  const [starred, setStarred] = useState(initiallyStarred);
  const [saving, setSaving] = useState(false);

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

  return (
    <div className="flex items-center gap-3 rounded-lg border border-black/[0.06] bg-black/[0.015] p-4 transition-colors hover:bg-black/[0.03]">
      <a href={`/profil/${developer.id}`} className="flex min-w-0 flex-1 items-center gap-3">
        <Avatar name={developer.fullName} role="developer" size="sm" avatarUrl={developer.avatarUrl} />
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <p className="truncate text-sm font-medium text-ink hover:underline">{developer.fullName ?? "İsimsiz"}</p>
            {developer.availability !== undefined && (
              <AvailabilityBadge availability={developer.availability ?? null} />
            )}
            <PatentBadge hasPatent={developer.hasVerifiedPatent} />
          </div>
          <RatingStars average={developer.ratingAvg} count={developer.ratingCount} />
        </div>
      </a>
      <span className="shrink-0 rounded-md bg-[#8DD9A8]/25 px-2.5 py-0.5 text-xs font-semibold text-[#1a7a52]">
        %{developer.matchScore}
      </span>
      <a
        href={`/mesajlar/${developer.id}`}
        title="Mesaj Gönder"
        className="shrink-0 rounded-lg border border-black/[0.08] px-3 py-1.5 text-xs font-medium text-ink-soft transition-colors hover:bg-black/[0.04] hover:text-ink"
      >
        <span className="flex items-center gap-1.5">
          <MessageCircle size={14} />
          <span className="hidden sm:inline">Mesaj Gönder</span>
        </span>
      </a>
      <button
        onClick={toggleStar}
        disabled={saving}
        title={starred ? "Yıldızı kaldır" : "Yıldızla"}
        className="shrink-0 disabled:opacity-50"
      >
        <Star size={18} className={starred ? "fill-[#1a7a52] text-[#1a7a52]" : "text-ink/25 hover:text-[#1a7a52]"} />
      </button>
    </div>
  );
}
