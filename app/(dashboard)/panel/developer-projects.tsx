"use client";

import { useEffect, useRef, useState } from "react";
import ProjectMatchCard from "@/app/components/project-match-card";
import Avatar from "@/app/components/avatar";

type ProjectWithMatch = {
  id: string;
  title: string;
  raw_idea: string;
  required_skills: string[] | null;
  founder_id: string;
  founderName: string | null;
  founderAvatarUrl?: string | null;
  matchScore: number;
  payment_type: "fixed" | "equity" | "flexible" | null;
  payment_amount: number | null;
};

type FounderResult = {
  id: string;
  full_name: string | null;
  bio: string | null;
  avatar_url: string | null;
};

type TabId = "all" | "matched" | "budget" | "fixed";

const TABS: { id: TabId; label: string }[] = [
  { id: "all", label: "Tümü" },
  { id: "matched", label: "Benim İçin Eşleşenler" },
  { id: "budget", label: "Yüksek Bütçeli" },
  { id: "fixed", label: "Sabit Ücretli" },
];

type SemanticProjectResult = {
  project_id: string;
  title: string;
  required_skills: string[];
  ozet: string;
  uyum_skoru: number | null;
};

export default function DeveloperProjects({
  projects,
  founders = [],
}: {
  projects: ProjectWithMatch[];
  founders?: FounderResult[];
}) {
  const [query, setQuery] = useState("");
  const [tab, setTab] = useState<TabId>("all");
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const [searchStatus, setSearchStatus] = useState<"idle" | "loading" | "done" | "error">("idle");
  const [searchResults, setSearchResults] = useState<ProjectWithMatch[]>([]);
  const [submittedQuery, setSubmittedQuery] = useState("");

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

  async function handleSearch() {
    if (!query.trim()) return;
    setSearchStatus("loading");
    setSubmittedQuery(query);

    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_AI_SERVICE_URL}/eslestir/proje-top5`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sorgu_metni: query, top_k: 5 }),
      });

      if (!res.ok) {
        setSearchStatus("error");
        return;
      }

      const data: { projeler: SemanticProjectResult[] } = await res.json();
      const enriched: ProjectWithMatch[] = (data.projeler ?? []).flatMap((r) => {
        const local = projects.find((p) => p.id === r.project_id);
        if (!local) return []; // AI havuzunda var ama bu listede yoksa (ör. kendi projesi) atla
        return [{ ...local, matchScore: r.uyum_skoru ?? 0 }];
      });

      setSearchResults(enriched);
      setSearchStatus("done");
    } catch {
      setSearchStatus("error");
    }
  }

  const matchedFounders = submittedQuery.trim()
    ? founders.filter((f) => (f.full_name ?? "").toLowerCase().includes(submittedQuery.trim().toLowerCase()))
    : [];

  if (projects.length === 0 && founders.length === 0) {
    return (
      <div className="mt-10 rounded-2xl border border-dashed border-ink/15 bg-white/60 p-10 text-center">
        <p className="text-2xl">🔭</p>
        <p className="mt-2 text-sm text-ink-soft">
          Şu an yayınlanmış bir proje yok. Daha sonra tekrar kontrol et!
        </p>
      </div>
    );
  }

  let visible = projects;
  if (tab === "matched") {
    visible = projects.filter((p) => p.matchScore > 0).sort((a, b) => b.matchScore - a.matchScore);
  } else if (tab === "budget") {
    visible = projects
      .filter((p) => p.payment_amount !== null)
      .sort((a, b) => (b.payment_amount ?? 0) - (a.payment_amount ?? 0));
  } else if (tab === "fixed") {
    visible = projects.filter((p) => p.payment_type === "fixed");
  }

  return (
    <div className="mt-10">
      <div className="relative">
        <div
          className="pointer-events-none absolute -left-16 -top-16 -bottom-10 right-0 blur-2xl"
          style={{
            background:
              "linear-gradient(120deg, rgba(254,158,199,0.55) 0%, rgba(249,246,196,0.5) 30%, rgba(137,212,255,0.55) 55%, rgba(141,217,168,0.55) 100%)",
          }}
        />
        <div className="relative rounded-xl border border-black/[0.08] bg-white p-6 shadow-sm">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-[#1a7a52]">
            Doğrudan Arama
          </p>
          <p className="mt-2 text-sm text-ink">
            Ne tür bir projede çalışmak istediğini yaz, anlamsal aramayla yayınlanmış projeler arasından
            en uygunlarını bulalım. (Girişimci ismiyle de arayabilirsin.)
          </p>
          <textarea
            ref={inputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleSearch();
              }
            }}
            rows={3}
            placeholder="Örn: React Native bilen bir mobil geliştirici arıyorum, e-ticaret deneyimi olan biriyle çalışmak istiyorum..."
            className="mt-3 w-full resize-none rounded-lg border border-black/[0.08] bg-black/[0.02] px-4 py-2.5 text-sm text-ink outline-none focus:ring-2 focus:ring-[#8DD9A8]/40"
          />
          <button
            onClick={handleSearch}
            disabled={searchStatus === "loading"}
            className="mt-3 rounded-lg bg-[#1a7a52] px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-[#15633f] disabled:opacity-50"
          >
            {searchStatus === "loading" ? "Aranıyor..." : "Ara"}
          </button>
          {searchStatus === "error" && (
            <p className="mt-2 text-sm text-red-600">Arama sırasında bir şeyler ters gitti, tekrar dener misin?</p>
          )}
        </div>

        <div className="relative mt-4 flex flex-wrap gap-2">
          {TABS.map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`rounded-lg px-4 py-1.5 text-sm font-medium transition-colors ${
                tab === t.id
                  ? "bg-[#1a7a52] text-white"
                  : "bg-white text-ink-soft hover:bg-black/[0.05] hover:text-ink"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {matchedFounders.length > 0 && (
        <div className="mt-6">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-ink-soft">
            Girişimciler ({matchedFounders.length})
          </p>
          <div className="mt-2 grid gap-3 sm:grid-cols-2">
            {matchedFounders.map((founder) => (
              <a
                key={founder.id}
                href={`/profil/${founder.id}`}
                className="flex items-center gap-3 rounded-xl border border-black/[0.08] bg-white p-4 shadow-sm transition-all hover:shadow-md"
              >
                <Avatar name={founder.full_name} role="founder" avatarUrl={founder.avatar_url} />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-bold text-ink">{founder.full_name ?? "İsimsiz"}</p>
                  {founder.bio && (
                    <p className="line-clamp-1 text-xs text-ink-soft">{founder.bio}</p>
                  )}
                </div>
              </a>
            ))}
          </div>
        </div>
      )}

      {searchStatus === "done" && (
        <div className="mt-6">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-ink-soft">
            Arama Sonuçları ({searchResults.length})
          </p>
          {searchResults.length === 0 ? (
            <p className="mt-2 text-sm text-ink-soft">Bu aramayla eşleşen bir proje bulunamadı.</p>
          ) : (
            <div className="mt-2 grid gap-3 sm:grid-cols-2">
              {searchResults.map((project) => (
                <ProjectMatchCard key={project.id} project={project} />
              ))}
            </div>
          )}
        </div>
      )}

      <p className="mt-8 text-[11px] font-semibold uppercase tracking-wide text-ink-soft">
        Tüm Yayınlanmış Projeler
      </p>
      {visible.length === 0 ? (
        <p className="mt-2 text-sm text-ink-soft">Bu kritere uyan bir proje yok.</p>
      ) : (
        <div className="mt-2 grid gap-3 sm:grid-cols-2">
          {visible.map((project) => (
            <ProjectMatchCard key={project.id} project={project} />
          ))}
        </div>
      )}
    </div>
  );
}
