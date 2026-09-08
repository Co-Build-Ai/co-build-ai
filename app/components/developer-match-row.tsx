"use client";

import { useState } from "react";
import { Star } from "lucide-react";
import { createClient } from "@/utils/supabase/client";
import Avatar from "./avatar";
import RatingStars from "./rating-stars";
import AvailabilityBadge from "./availability-badge";

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
    <div className="flex items-center gap-3 rounded-xl bg-blue-50 p-4">
      <Avatar name={developer.fullName} role="developer" size="sm" />
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <p className="truncate text-sm font-bold text-ink">{developer.fullName ?? "İsimsiz"}</p>
          {developer.availability !== undefined && (
            <AvailabilityBadge availability={developer.availability ?? null} />
          )}
        </div>
        <RatingStars average={developer.ratingAvg} count={developer.ratingCount} />
      </div>
      <span className="shrink-0 rounded-full bg-periwinkle/30 px-2.5 py-0.5 text-xs font-bold text-periwinkle-dark">
        %{developer.matchScore}
      </span>
      <button
        onClick={toggleStar}
        disabled={saving}
        title={starred ? "Yıldızı kaldır" : "Yıldızla"}
        className="shrink-0 disabled:opacity-50"
      >
        <Star size={18} className={starred ? "fill-coral text-coral" : "text-ink/25 hover:text-coral"} />
      </button>
    </div>
  );
}
