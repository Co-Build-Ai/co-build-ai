"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/utils/supabase/client";

type Developer = {
  id: string;
  full_name: string | null;
  skills: string[] | null;
  availability: string | null;
  has_verified_patent?: boolean | null;
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
  const router = useRouter();
  const supabase = createClient();
  const [idea, setIdea] = useState("");
  const [status, setStatus] = useState<"idle" | "generating" | "done" | "error">("idle");
  const [matches, setMatches] = useState<(Developer & { matchScore: number })[]>([]);
  const [projectId, setProjectId] = useState<string | null>(null);

  // Dönüş: null => istek başarısız oldu (DB'ye yazılmamalı, tekrar denenmeli).
  // [] => istek başarılı ama gerçekten hiç eşleşme yok.
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
      if (!res.ok) return null;

      const data: { yazilimcilar: HybridSearchResult[] } = await res.json();
      return (data.yazilimcilar ?? []).map((r) => {
        const local = developers.find((d) => d.id === r.developer_id);
        return {
          id: r.developer_id,
          full_name: r.ad_soyad,
          skills: r.skills,
          availability: local?.availability ?? null,
          has_verified_patent: local?.has_verified_patent ?? false,
          ratingAvg: local?.ratingAvg ?? null,
          ratingCount: local?.ratingCount ?? 0,
          matchScore: r.uyum_skoru ?? 0,
        };
      });
    } catch {
      return null;
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

          // matched null ise (eşleştirme isteği başarısız oldu) matched_developers
          // alanını hiç güncellemiyoruz — kalıcı olarak boş dizi yazıp veriyi
          // kaybetmeyelim, bir sonraki denemede tekrar hesaplanabilsin.
          await supabase
            .from("projects")
            .update({
              generated_prd: data.prd,
              required_skills: requiredSkills,
              ...(matched !== null
                ? {
                    matched_developers: matched.map((m) => ({
                      developerId: m.id,
                      fullName: m.full_name,
                      bio: "",
                      skills: m.skills ?? [],
                      matchScore: m.matchScore,
                    })),
                  }
                : {}),
            })
            .eq("id", id);

          setMatches(matched ?? []);
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

    // Aynı fikir daha önce eklenmişse (idea_hash eşleşiyorsa) ikinci bir
    // proje satırı oluşturmak yerine mevcut olana yönlendir.
    const { data: existingProject } = await supabase
      .from("projects")
      .select("id")
      .eq("founder_id", userId)
      .eq("idea_hash", ideaHash)
      .maybeSingle();

    if (existingProject) {
      router.push(`/proje/${existingProject.id}`);
      return;
    }

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
      <div className="rounded-xl border border-stone-200 bg-white p-6 shadow-[inset_0_1px_0_rgba(255,255,255,0.8),0_4px_12px_rgba(17,24,39,0.12)]">
        <p className="inline-flex items-center rounded-full bg-coral px-3 py-1 text-xs font-extrabold uppercase tracking-wide text-white shadow-sm">
          Hızlı Eşleştirme
        </p>
        <p className="mt-2 text-sm text-ink-soft">
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
          className="mt-3 rounded-full bg-coral px-6 py-2 text-sm font-semibold text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.35),0_4px_0_0_var(--color-coral-dark),0_10px_20px_rgba(68,172,255,0.35)] transition-all hover:brightness-105 active:translate-y-1 active:shadow-[inset_0_1px_0_rgba(255,255,255,0.35),0_0px_0_0_var(--color-coral-dark),0_2px_6px_rgba(68,172,255,0.30)]"
        >
          Eşleştir
        </button>
      </div>
    );
  }

  if (status === "generating") {
    return (
      <div className="flex items-center gap-3 rounded-xl border border-stone-200 bg-white p-6 shadow-[inset_0_1px_0_rgba(255,255,255,0.8),0_4px_12px_rgba(17,24,39,0.12)]">
        <span className="h-4 w-4 shrink-0 animate-spin rounded-full border-2 border-coral border-t-transparent" />
        <p className="text-sm text-ink-soft">
          AI fikrini analiz ediyor, bu birkaç dakika sürebilir...
        </p>
      </div>
    );
  }

  if (status === "error") {
    return (
      <div className="rounded-xl border border-stone-200 bg-white p-6 text-sm text-ink-soft shadow-[inset_0_1px_0_rgba(255,255,255,0.8),0_4px_12px_rgba(17,24,39,0.12)]">
        Bir şeyler ters gitti, tekrar dener misin?
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center gap-3 rounded-xl border border-stone-200 bg-white p-8 text-center shadow-[inset_0_1px_0_rgba(255,255,255,0.8),0_4px_12px_rgba(17,24,39,0.12)]">
      <p className="inline-flex items-center rounded-full bg-periwinkle-dark px-3 py-1 text-xs font-extrabold uppercase tracking-wide text-white shadow-sm">
        Hazır
      </p>
      <p className="text-sm text-ink-soft">
        PRD üretildi{matches.length > 0 ? ` ve ${matches.length} yazılımcı eşleşti` : ""} — detayları ve
        önerilen yazılımcıları taslak sayfasında incele.
      </p>
      {projectId && (
        <a
          href={`/proje/${projectId}`}
          className="mt-1 rounded-full bg-coral px-6 py-2.5 text-sm font-semibold text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.35),0_4px_0_0_var(--color-coral-dark),0_10px_20px_rgba(68,172,255,0.35)] transition-all hover:brightness-105 active:translate-y-1 active:shadow-[inset_0_1px_0_rgba(255,255,255,0.35),0_0px_0_0_var(--color-coral-dark),0_2px_6px_rgba(68,172,255,0.30)]"
        >
          PRD ve Eşleşmeleri İncele →
        </a>
      )}
    </div>
  );
}
