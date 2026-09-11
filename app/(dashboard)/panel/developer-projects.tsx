"use client";

import { useEffect, useRef, useState } from "react";
import { Search } from "lucide-react";
import ProjectMatchCard from "@/app/components/project-match-card";

type ProjectWithMatch = {
  id: string;
  title: string;
  raw_idea: string;
  required_skills: string[] | null;
  founder_id: string;
  founderName: string | null;
  matchScore: number;
  payment_type: "fixed" | "equity" | "flexible" | null;
  payment_amount: number | null;
};

type TabId = "all" | "matched" | "budget" | "fixed";

const TABS: { id: TabId; label: string }[] = [
  { id: "all", label: "Tümü" },
  { id: "matched", label: "Benim İçin Eşleşenler" },
  { id: "budget", label: "Yüksek Bütçeli" },
  { id: "fixed", label: "Sabit Ücretli" },
];

export default function DeveloperProjects({ projects }: { projects: ProjectWithMatch[] }) {
  const [query, setQuery] = useState("");
  const [tab, setTab] = useState<TabId>("all");
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

  if (projects.length === 0) {
    return (
      <div className="mt-10 rounded-2xl border border-dashed border-ink/15 bg-white/60 p-10 text-center">
        <p className="text-2xl">🔭</p>
        <p className="mt-2 text-sm text-ink-soft">
          Şu an yayınlanmış bir proje yok. Daha sonra tekrar kontrol et!
        </p>
      </div>
    );
  }

  const searched = projects.filter((p) => p.title.toLowerCase().includes(query.trim().toLowerCase()));

  let visible = searched;
  if (tab === "matched") {
    visible = searched.filter((p) => p.matchScore > 0).sort((a, b) => b.matchScore - a.matchScore);
  } else if (tab === "budget") {
    visible = searched
      .filter((p) => p.payment_amount !== null)
      .sort((a, b) => (b.payment_amount ?? 0) - (a.payment_amount ?? 0));
  } else if (tab === "fixed") {
    visible = searched.filter((p) => p.payment_type === "fixed");
  }

  return (
    <div className="mt-10">
      <div className="relative">
        <Search size={16} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-soft" />
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Projelerde ara..."
          className="w-full rounded-full bg-petal py-2.5 pl-10 pr-14 text-sm text-ink shadow-[inset_0_2px_5px_rgba(17,24,39,0.08)] outline-none focus:ring-2 focus:ring-coral/30 sm:max-w-sm"
        />
        <kbd className="pointer-events-none absolute right-3.5 top-1/2 hidden -translate-y-1/2 rounded-md bg-white px-1.5 py-0.5 font-mono text-[10px] text-ink-soft sm:block">
          ⌘K
        </kbd>
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        {TABS.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`rounded-full px-4 py-1.5 text-sm font-semibold transition-all ${
              tab === t.id
                ? "bg-coral text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.35),0_3px_0_0_var(--color-coral-dark),0_6px_14px_rgba(239,68,104,0.30)] active:translate-y-0.5 active:shadow-[inset_0_1px_0_rgba(255,255,255,0.35),0_0px_0_0_var(--color-coral-dark),0_2px_6px_rgba(239,68,104,0.25)]"
                : "bg-ink/5 text-ink-soft shadow-[inset_0_1px_3px_rgba(17,24,39,0.06)] hover:text-ink"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {visible.length === 0 ? (
        <p className="mt-6 text-sm text-ink-soft">Bu kritere uyan bir proje yok.</p>
      ) : (
        <div className="mt-6 grid gap-3 sm:grid-cols-2">
          {visible.map((project) => (
            <ProjectMatchCard key={project.id} project={project} />
          ))}
        </div>
      )}
    </div>
  );
}
