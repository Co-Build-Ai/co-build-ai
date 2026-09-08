"use client";

import { useState } from "react";
import DeveloperMatchRow from "@/app/components/developer-match-row";

type Developer = {
  id: string;
  availability: string | null;
  ratingAvg: number | null;
  ratingCount: number;
};

type SemanticSearchResult = {
  developer_id: string;
  ad_soyad: string;
  uyum_skoru: number | null;
};

type MatchedDeveloper = {
  id: string;
  fullName: string | null;
  matchScore: number;
  ratingAvg: number | null;
  ratingCount: number;
  availability: string | null;
};

export default function DirectSearch({
  founderId,
  developers,
  starredIds,
}: {
  founderId: string;
  developers: Developer[];
  starredIds: string[];
}) {
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "done" | "error">("idle");
  const [results, setResults] = useState<MatchedDeveloper[]>([]);

  async function handleSearch() {
    if (!query.trim()) return;
    setStatus("loading");

    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_AI_SERVICE_URL}/eslestir/semantik-top5`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prd_metni: query, top_k: 5 }),
      });

      if (!res.ok) {
        setStatus("error");
        return;
      }

      const data: { yazilimcilar: SemanticSearchResult[] } = await res.json();
      const enriched = (data.yazilimcilar ?? []).map((r) => {
        const local = developers.find((d) => d.id === r.developer_id);
        return {
          id: r.developer_id,
          fullName: r.ad_soyad,
          matchScore: r.uyum_skoru ?? 0,
          ratingAvg: local?.ratingAvg ?? null,
          ratingCount: local?.ratingCount ?? 0,
          availability: local?.availability ?? null,
        };
      });

      setResults(enriched);
      setStatus("done");
    } catch {
      setStatus("error");
    }
  }

  return (
    <div className="rounded-2xl border border-blue-300/60 bg-blue-200 p-6 shadow-[inset_0_1px_0_rgba(255,255,255,0.8),inset_0_-2px_0_rgba(96,165,250,0.6),0_4px_14px_rgba(59,130,246,0.15),0_28px_55px_rgba(59,130,246,0.25)] transition-all [transform-style:preserve-3d] hover:[transform:perspective(900px)_rotateX(2deg)_translateY(-4px)] hover:shadow-[inset_0_1px_0_rgba(255,255,255,0.8),inset_0_-2px_0_rgba(96,165,250,0.6),0_6px_18px_rgba(59,130,246,0.2),0_36px_70px_rgba(59,130,246,0.3)]">
      <p className="inline-flex items-center rounded-full bg-ink px-3 py-1 text-xs font-extrabold uppercase tracking-wide text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.25),0_3px_0_0_#000000,0_8px_16px_rgba(0,0,0,0.35)]">
        Doğrudan Arama
      </p>
      <p className="mt-1 text-sm text-ink">
        Pozisyonunuza uygun çalışan mı arıyorsunuz? Ne aradığını yaz, anlamsal aramayla
        kayıtlı yazılımcılar arasından en uygunlarını bulalım.
      </p>
      <textarea
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        rows={3}
        placeholder="Örn: React ve Node.js bilen, e-ticaret deneyimi olan bir backend geliştirici arıyorum..."
        className="mt-3 w-full resize-none rounded-xl bg-petal px-4 py-2.5 text-sm text-ink outline-none focus:ring-2 focus:ring-periwinkle-dark/30"
      />
      <button
        onClick={handleSearch}
        disabled={status === "loading"}
        className="mt-3 rounded-full bg-periwinkle-dark px-6 py-2 text-sm font-semibold text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.35),0_4px_0_0_#5b21b6,0_10px_20px_rgba(109,40,217,0.30)] transition-all hover:brightness-105 active:translate-y-1 active:shadow-[inset_0_1px_0_rgba(255,255,255,0.35),0_0px_0_0_#5b21b6,0_2px_6px_rgba(109,40,217,0.25)] disabled:opacity-50"
      >
        {status === "loading" ? "Aranıyor..." : "Ara"}
      </button>

      {status === "error" && (
        <p className="mt-3 text-sm text-coral">Arama sırasında bir şeyler ters gitti, tekrar dener misin?</p>
      )}

      {status === "done" && (
        <div className="mt-4">
          {results.length === 0 ? (
            <p className="text-sm text-ink">Bu aramayla eşleşen bir yazılımcı bulunamadı.</p>
          ) : (
            <div className="flex flex-col gap-3">
              {results.map((d) => (
                <DeveloperMatchRow
                  key={d.id}
                  developer={d}
                  founderId={founderId}
                  initiallyStarred={starredIds.includes(d.id)}
                />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
