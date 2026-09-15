"use client";

import { useState } from "react";
import DeveloperMatchRow from "@/app/components/developer-match-row";

type Developer = {
  id: string;
  availability: string | null;
  has_verified_patent?: boolean | null;
  avatar_url?: string | null;
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
  hasVerifiedPatent?: boolean | null;
  avatarUrl?: string | null;
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
  const [searchedQuery, setSearchedQuery] = useState("");
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
          hasVerifiedPatent: local?.has_verified_patent ?? false,
          avatarUrl: local?.avatar_url ?? null,
        };
      });

      setResults(enriched);
      setSearchedQuery(query);
      setStatus("done");
    } catch {
      setStatus("error");
    }
  }

  return (
    <div className="flex h-full flex-col rounded-xl border border-black/[0.08] bg-white p-6 shadow-sm">
      <p className="text-[11px] font-semibold uppercase tracking-wide text-[#1a7a52]">
        Doğrudan Arama
      </p>
      <p className="mt-2 min-h-[2.75rem] text-sm text-ink">
        Pozisyonunuza uygun çalışan mı arıyorsunuz? Ne aradığını yaz, anlamsal aramayla
        kayıtlı yazılımcılar arasından en uygunlarını bulalım.
      </p>
      <textarea
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        rows={3}
        placeholder="Örn: React ve Node.js bilen, e-ticaret deneyimi olan bir backend geliştirici arıyorum..."
        className="mt-3 w-full flex-1 resize-none rounded-lg border border-black/[0.08] bg-black/[0.02] px-4 py-2.5 text-sm text-ink outline-none focus:ring-2 focus:ring-[#8DD9A8]/40"
      />
      <button
        onClick={handleSearch}
        disabled={status === "loading"}
        className="mt-3 self-start rounded-lg bg-[#1a7a52] px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-[#15633f] disabled:opacity-50"
      >
        {status === "loading" ? "Aranıyor..." : "Ara"}
      </button>

      {status === "error" && (
        <p className="mt-3 text-sm text-red-600">Arama sırasında bir şeyler ters gitti, tekrar dener misin?</p>
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
                  searchContext={searchedQuery}
                />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
