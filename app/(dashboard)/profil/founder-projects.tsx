"use client";

import { useState } from "react";
import { Search } from "lucide-react";
import ProjectProgressCard from "@/app/components/project-progress-card";

type ProjectWithProgress = {
  id: string;
  title: string;
  status: "draft" | "published";
  progress: number;
  offerCount: number;
  hasUnread?: boolean;
};

export default function FounderProjects({ projects }: { projects: ProjectWithProgress[] }) {
  const [query, setQuery] = useState("");

  const filtered = projects.filter((p) => p.title.toLowerCase().includes(query.trim().toLowerCase()));
  const published = filtered.filter((p) => p.status === "published");
  const drafts = filtered.filter((p) => p.status !== "published");

  if (projects.length === 0) {
    return (
      <div className="mt-10 rounded-xl border border-dashed border-ink/15 bg-white/60 p-10 text-center">
        <p className="text-2xl">💡</p>
        <p className="mt-2 text-sm text-ink-soft">Henüz bir fikir eklemedin.</p>
      </div>
    );
  }

  return (
    <div className="mt-10">
      <div className="relative">
        <Search size={16} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-soft" />
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Projelerinde ara..."
          className="w-full rounded-full border border-ink/15 bg-white py-2.5 pl-10 pr-4 text-sm outline-none focus:border-coral sm:max-w-xs"
        />
      </div>

      <div className="mt-8">
        <h2 className="font-mono text-xs font-semibold uppercase tracking-wide text-ink-soft">
          Yürürlükteki Projelerim ({published.length})
        </h2>
        {published.length === 0 ? (
          <p className="mt-3 text-sm text-ink-soft">Henüz yayınlanmış bir projen yok.</p>
        ) : (
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            {published.map((project) => (
              <ProjectProgressCard key={project.id} project={project} />
            ))}
          </div>
        )}
      </div>

      <div className="mt-8">
        <h2 className="font-mono text-xs font-semibold uppercase tracking-wide text-ink-soft">
          PRD Taslaklarım ({drafts.length})
        </h2>
        {drafts.length === 0 ? (
          <p className="mt-3 text-sm text-ink-soft">Taslak bir projen yok.</p>
        ) : (
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            {drafts.map((project) => (
              <ProjectProgressCard key={project.id} project={project} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
