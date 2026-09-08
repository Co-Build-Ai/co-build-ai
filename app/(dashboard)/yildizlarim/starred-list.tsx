"use client";

import { useState } from "react";
import { Star } from "lucide-react";
import { createClient } from "@/utils/supabase/client";
import Avatar from "@/app/components/avatar";
import RatingStars from "@/app/components/rating-stars";
import AvailabilityBadge from "@/app/components/availability-badge";

type StarredDeveloper = {
  id: string;
  full_name: string | null;
  bio: string | null;
  skills: string[] | null;
  availability: string | null;
  ratingAvg: number | null;
  ratingCount: number;
};

export default function StarredList({
  founderId,
  initialDevelopers,
}: {
  founderId: string;
  initialDevelopers: StarredDeveloper[];
}) {
  const supabase = createClient();
  const [developers, setDevelopers] = useState(initialDevelopers);

  async function handleUnstar(developerId: string) {
    setDevelopers((prev) => prev.filter((d) => d.id !== developerId));
    await supabase
      .from("starred_developers")
      .delete()
      .eq("founder_id", founderId)
      .eq("developer_id", developerId);
  }

  if (developers.length === 0) {
    return (
      <div className="mt-6 rounded-xl border border-dashed border-ink/15 bg-white/60 p-10 text-center">
        <p className="text-2xl">⭐</p>
        <p className="mt-2 text-sm text-ink-soft">
          Henüz yıldızladığın bir yazılımcı yok — Hızlı Eşleştirme veya Doğrudan Arama
          sonuçlarında yıldız ikonuna tıklayarak ekleyebilirsin.
        </p>
      </div>
    );
  }

  return (
    <div className="mt-6 flex flex-col gap-4">
      {developers.map((dev) => (
        <div key={dev.id} className="rounded-xl border border-stone-200 bg-white shadow-[inset_0_1px_0_rgba(255,255,255,0.8),0_4px_12px_rgba(17,24,39,0.12)] p-6">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <Avatar name={dev.full_name} role="developer" />
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-lg font-bold text-ink">
                    {dev.full_name ?? "İsimsiz Yazılımcı"}
                  </h3>
                  <AvailabilityBadge availability={dev.availability} />
                </div>
                <RatingStars average={dev.ratingAvg} count={dev.ratingCount} />
              </div>
            </div>
            <button
              onClick={() => handleUnstar(dev.id)}
              title="Yıldızı kaldır"
              className="shrink-0"
            >
              <Star size={18} className="fill-coral text-coral hover:opacity-60" />
            </button>
          </div>

          {dev.bio && <p className="mt-3 text-sm text-ink-soft">{dev.bio}</p>}

          {dev.skills && dev.skills.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-2">
              {dev.skills.map((skill) => (
                <span
                  key={skill}
                  className="rounded-full bg-periwinkle/20 px-3 py-1 font-mono text-xs text-ink"
                >
                  {skill}
                </span>
              ))}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
