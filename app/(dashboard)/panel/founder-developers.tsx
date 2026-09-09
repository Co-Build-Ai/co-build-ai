"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Search } from "lucide-react";
import Avatar from "@/app/components/avatar";
import RatingStars from "@/app/components/rating-stars";
import AvailabilityBadge from "@/app/components/availability-badge";

type Developer = {
  id: string;
  full_name: string | null;
  bio: string | null;
  skills: string[] | null;
  availability: string | null;
  ratingAvg: number | null;
  ratingCount: number;
};

export default function FounderDevelopers({ developers }: { developers: Developer[] }) {
  const [query, setQuery] = useState("");
  const [activeSkill, setActiveSkill] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    function handleKeydown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        inputRef.current?.focus();
      }
    }
    window.addEventListener("keydown", handleKeydown);
    return () => window.removeEventListener("keydown", handleKeydown);
  }, []);

  const topSkills = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const d of developers) {
      for (const skill of d.skills ?? []) {
        counts[skill] = (counts[skill] ?? 0) + 1;
      }
    }
    return Object.entries(counts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 6)
      .map(([skill]) => skill);
  }, [developers]);

  if (developers.length === 0) {
    return (
      <div className="mt-10 rounded-2xl border border-dashed border-ink/15 bg-white/60 p-10 text-center">
        <p className="text-2xl">🧑‍💻</p>
        <p className="mt-2 text-sm text-ink-soft">Henüz kayıtlı bir yazılımcı yok.</p>
      </div>
    );
  }

  const q = query.trim().toLowerCase();
  const filtered = developers.filter((d) => {
    const nameMatch = !q || d.full_name?.toLowerCase().includes(q);
    const queryMatch = !q || nameMatch || d.skills?.some((s) => s.toLowerCase().includes(q));
    const skillMatch = !activeSkill || d.skills?.includes(activeSkill);
    return queryMatch && skillMatch;
  });

  return (
    <div className="mt-10">
      <div className="relative">
        <Search size={16} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-soft" />
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="İsim veya beceriye göre ara..."
          className="w-full rounded-full bg-petal py-2.5 pl-10 pr-14 text-sm text-ink shadow-[inset_0_2px_5px_rgba(17,24,39,0.08)] outline-none focus:ring-2 focus:ring-coral/30 sm:max-w-sm"
        />
        <kbd className="pointer-events-none absolute right-3.5 top-1/2 hidden -translate-y-1/2 rounded-md bg-white px-1.5 py-0.5 font-mono text-[10px] text-ink-soft sm:block">
          ⌘K
        </kbd>
      </div>

      {topSkills.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-2">
          {topSkills.map((skill) => (
            <button
              key={skill}
              onClick={() => setActiveSkill((prev) => (prev === skill ? null : skill))}
              className={`rounded-full px-3 py-1 font-mono text-xs font-medium transition-colors ${
                activeSkill === skill
                  ? "bg-coral text-white"
                  : "bg-periwinkle/25 text-periwinkle-dark hover:bg-periwinkle/40"
              }`}
            >
              #{skill}
            </button>
          ))}
        </div>
      )}

      {filtered.length === 0 ? (
        <p className="mt-6 text-sm text-ink-soft">Bu kritere uyan bir yazılımcı yok.</p>
      ) : (
        <div className="mt-6 flex flex-col gap-3">
          {filtered.map((dev) => (
            <a
              key={dev.id}
              href={`/yazilimci/${dev.id}`}
              className="block rounded-xl border border-stone-200 bg-white p-6 shadow-[inset_0_1px_0_rgba(255,255,255,0.8),0_4px_12px_rgba(17,24,39,0.12)] transition-all [transform-style:preserve-3d] hover:[transform:perspective(900px)_rotateX(2deg)_translateY(-4px)] hover:shadow-[inset_0_1px_0_rgba(255,255,255,0.8),0_8px_20px_rgba(17,24,39,0.16)]"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <Avatar name={dev.full_name} role="developer" />
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-base font-bold text-ink">
                        {dev.full_name ?? "İsimsiz Yazılımcı"}
                      </h3>
                      <AvailabilityBadge availability={dev.availability} />
                    </div>
                    <RatingStars average={dev.ratingAvg} count={dev.ratingCount} />
                  </div>
                </div>
              </div>
              {dev.bio && <p className="mt-3 text-sm text-ink">{dev.bio}</p>}
              {dev.skills && dev.skills.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {dev.skills.map((skill) => (
                    <span
                      key={skill}
                      className="rounded-full bg-petal px-2.5 py-1 font-mono text-xs text-ink-soft"
                    >
                      {skill}
                    </span>
                  ))}
                </div>
              )}
            </a>
          ))}
        </div>
      )}
    </div>
  );
}
