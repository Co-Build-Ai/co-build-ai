"use client";

import { useState } from "react";
import { createClient } from "@/utils/supabase/client";
import DeveloperMatchRow from "@/app/components/developer-match-row";

type Developer = {
  id: string;
  full_name: string | null;
  skills: string[] | null;
  availability: string | null;
  ratingAvg: number | null;
  ratingCount: number;
};

type HybridSearchResult = {
  developer_id: string;
  ad_soyad: string;
  skills: string[];
  bio: string;
  uyum_skoru: number | null;
};

export default function QuickMatch({
  userId,
  developers,
  starredIds,
}: {
  userId: string;
  developers: Developer[];
  starredIds: string[];
}) {
  const supabase = createClient();
  const [idea, setIdea] = useState("");
  const [status, setStatus] = useState<"idle" | "generating" | "done" | "error">("idle");
  const [matches, setMatches] = useState<(Developer & { matchScore: number })[]>([]);
  const [projectId, setProjectId] = useState<string | null>(null);

  async function fetchMatches(prdText: string, requiredSkills: string[]) {
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_AI_SERVICE_URL}/eslestir/hibrit`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prd_metni: prdText,
          gerekli_diller: requiredSkills.length > 0 ? requiredSkills : null,
          top_k: 5,
        }),
      });
      if (!res.ok) return [];

      const data: { yazilimcilar: HybridSearchResult[] } = await res.json();
      return (data.yazilimcilar ?? []).map((r) => {
        const local = developers.find((d) => d.id === r.developer_id);
        return {
          id: r.developer_id,
          full_name: r.ad_soyad,
          skills: r.skills,
          availability: local?.availability ?? null,
          ratingAvg: local?.ratingAvg ?? null,
          ratingCount: local?.ratingCount ?? 0,
          matchScore: r.uyum_skoru ?? 0,
        };
      });
    } catch {
      return [];
    }
  }

  function pollForResult(id: string) {
    const interval = setInterval(async () => {
      try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_AI_SERVICE_URL}/prd-durum/${id}`);
        const data = await res.json();

        if (data.status === "done") {
          clearInterval(interval);
          const requiredSkills: string[] = data.skills ?? [];
          const matched = await fetchMatches(data.prd, requiredSkills);

          await supabase
            .from("projects")
            .update({
              generated_prd: data.prd,
              required_skills: requiredSkills,
              matched_developers: matched.map((m) => ({
                developerId: m.id,
                fullName: m.full_name,
                bio: "",
                skills: m.skills ?? [],
                matchScore: m.matchScore,
              })),
            })
            .eq("id", id);

          setMatches(matched);
          setStatus("done");
        } else if (data.status === "error") {
          clearInterval(interval);
          setStatus("error");
        }
      } catch {
        // Sunucuya anlık ulaşılamazsa sessizce tekrar dener
      }
    }, 4000);
  }

  async function handleSubmit() {
    if (!idea.trim()) return;
    setStatus("generating");

    const title = idea.trim().slice(0, 60);
    const ideaText = `${title}|${idea}|${userId}`;
    const encoder = new TextEncoder();
    const hashBuffer = await crypto.subtle.digest("SHA-256", encoder.encode(ideaText));
    const ideaHash = Array.from(new Uint8Array(hashBuffer))
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("");

    const { data: newProject, error } = await supabase
      .from("projects")
      .insert({
        founder_id: userId,
        title,
        raw_idea: idea,
        status: "draft",
        idea_hash: ideaHash,
        idea_created_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error || !newProject) {
      setStatus("error");
      return;
    }
    setProjectId(newProject.id);

    try {
      await fetch(`${process.env.NEXT_PUBLIC_AI_SERVICE_URL}/prd-uret-baslat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ project_id: newProject.id, title, raw_idea: idea }),
      });
    } catch {
      // Başlatma isteği başarısız olsa bile polling devam eder
    }

    pollForResult(newProject.id);
  }

  if (status === "idle") {
    return (
      <div className="rounded-2xl border border-blue-300/60 bg-blue-200 p-6 shadow-[inset_0_1px_0_rgba(255,255,255,0.8),inset_0_-2px_0_rgba(96,165,250,0.6),0_4px_14px_rgba(59,130,246,0.15),0_28px_55px_rgba(59,130,246,0.25)] transition-all [transform-style:preserve-3d] hover:[transform:perspective(900px)_rotateX(2deg)_translateY(-4px)] hover:shadow-[inset_0_1px_0_rgba(255,255,255,0.8),inset_0_-2px_0_rgba(96,165,250,0.6),0_6px_18px_rgba(59,130,246,0.2),0_36px_70px_rgba(59,130,246,0.3)]">
        <p className="inline-flex items-center rounded-full bg-ink px-3 py-1 text-xs font-extrabold uppercase tracking-wide text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.25),0_3px_0_0_#000000,0_8px_16px_rgba(0,0,0,0.35)]">
          Hızlı Eşleştirme
        </p>
        <p className="mt-1 text-sm text-ink">
          Aklındaki projeyi kısaca anlat, AI PRD&apos;ye çevirsin ve sana en uygun kayıtlı
          yazılımcıları puanlarına göre sıralasın.
        </p>
        <textarea
          value={idea}
          onChange={(e) => setIdea(e.target.value)}
          rows={3}
          placeholder="Örn: Komşular arası eşya paylaşım uygulaması, React Native ile mobil..."
          className="mt-3 w-full resize-none rounded-xl bg-petal px-4 py-2.5 text-sm text-ink shadow-[inset_0_2px_5px_rgba(17,24,39,0.08)] outline-none focus:ring-2 focus:ring-coral/30"
        />
        <button
          onClick={handleSubmit}
          className="mt-3 rounded-full bg-coral px-6 py-2 text-sm font-semibold text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.35),0_4px_0_0_var(--color-coral-dark),0_10px_20px_rgba(239,68,104,0.35)] transition-all hover:brightness-105 active:translate-y-1 active:shadow-[inset_0_1px_0_rgba(255,255,255,0.35),0_0px_0_0_var(--color-coral-dark),0_2px_6px_rgba(239,68,104,0.30)]"
        >
          Eşleştir
        </button>
      </div>
    );
  }

  if (status === "generating") {
    return (
      <div className="flex items-center gap-3 rounded-2xl border border-blue-300/60 bg-blue-200 p-6 shadow-[inset_0_1px_0_rgba(255,255,255,0.8),inset_0_-2px_0_rgba(96,165,250,0.6),0_4px_14px_rgba(59,130,246,0.15),0_28px_55px_rgba(59,130,246,0.25)]">
        <span className="h-4 w-4 shrink-0 animate-spin rounded-full border-2 border-blue-900 border-t-transparent" />
        <p className="text-sm text-ink">
          AI fikrini analiz ediyor, bu birkaç dakika sürebilir...
        </p>
      </div>
    );
  }

  if (status === "error") {
    return (
      <div className="rounded-2xl border border-blue-300/60 bg-blue-200 p-6 text-sm text-ink shadow-[inset_0_1px_0_rgba(255,255,255,0.8),inset_0_-2px_0_rgba(96,165,250,0.6),0_4px_14px_rgba(59,130,246,0.15),0_28px_55px_rgba(59,130,246,0.25)]">
        Bir şeyler ters gitti, tekrar dener misin?
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-blue-300/60 bg-blue-200 p-6 shadow-[inset_0_1px_0_rgba(255,255,255,0.8),inset_0_-2px_0_rgba(96,165,250,0.6),0_4px_14px_rgba(59,130,246,0.15),0_28px_55px_rgba(59,130,246,0.25)] transition-all [transform-style:preserve-3d] hover:[transform:perspective(900px)_rotateX(2deg)_translateY(-4px)] hover:shadow-[inset_0_1px_0_rgba(255,255,255,0.8),inset_0_-2px_0_rgba(96,165,250,0.6),0_6px_18px_rgba(59,130,246,0.2),0_36px_70px_rgba(59,130,246,0.3)]">
      <div className="flex items-center justify-between">
        <p className="inline-flex items-center rounded-full bg-ink px-3 py-1 text-xs font-extrabold uppercase tracking-wide text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.25),0_3px_0_0_#000000,0_8px_16px_rgba(0,0,0,0.35)]">
          Sana Uygun Yazılımcılar
        </p>
        {projectId && (
          <a href={`/proje/${projectId}`} className="text-xs font-semibold text-ink hover:underline">
            PRD&apos;yi Gör →
          </a>
        )}
      </div>

      {matches.length === 0 ? (
        <p className="mt-3 text-sm text-ink">Şu an eşleşen kayıtlı bir yazılımcı yok.</p>
      ) : (
        <div className="mt-4 flex flex-col gap-4">
          {matches.map((d) => (
            <DeveloperMatchRow
              key={d.id}
              founderId={userId}
              initiallyStarred={starredIds.includes(d.id)}
              developer={{
                id: d.id,
                fullName: d.full_name,
                matchScore: d.matchScore,
                ratingAvg: d.ratingAvg,
                ratingCount: d.ratingCount,
                availability: d.availability,
              }}
            />
          ))}
        </div>
      )}
    </div>
  );
}
