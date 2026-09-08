import Avatar from "./avatar";

export default function TrendingWidget({
  trendingProjects,
  trendingDevelopers,
}: {
  trendingProjects: { id: string; title: string; offerCount: number }[];
  trendingDevelopers: { id: string; full_name: string | null; acceptedCount: number }[];
}) {
  if (trendingProjects.length === 0 && trendingDevelopers.length === 0) {
    return null;
  }

  return (
    <div className="flex flex-col gap-6">
      {trendingProjects.length > 0 && (
        <div className="rounded-xl border border-stone-200 bg-white p-5 shadow-[inset_0_1px_0_rgba(255,255,255,0.8),0_4px_12px_rgba(17,24,39,0.12)]">
          <p className="text-[11px] font-extrabold uppercase tracking-wide text-ink">
            Öne Çıkan Projeler
          </p>
          <div className="mt-4 flex flex-col gap-4">
            {trendingProjects.map((p, i) => (
              <a
                key={p.id}
                href={`/proje/${p.id}`}
                className="flex items-center gap-2 text-sm text-ink transition-opacity hover:opacity-70"
              >
                <span className="font-bold text-ink-soft">{i + 1}</span>
                <span className="min-w-0 flex-1 truncate">{p.title}</span>
                <span className="shrink-0 text-xs text-ink-soft">{p.offerCount} teklif</span>
              </a>
            ))}
          </div>
        </div>
      )}

      {trendingDevelopers.length > 0 && (
        <div className="rounded-xl border border-stone-200 bg-white p-5 shadow-[inset_0_1px_0_rgba(255,255,255,0.8),0_4px_12px_rgba(17,24,39,0.12)]">
          <p className="text-[11px] font-extrabold uppercase tracking-wide text-ink">
            En Aktif Yazılımcılar
          </p>
          <div className="mt-4 flex flex-col gap-4">
            {trendingDevelopers.map((d) => (
              <div key={d.id} className="flex items-center gap-2">
                <Avatar name={d.full_name} role="developer" size="sm" />
                <span className="min-w-0 flex-1 truncate text-sm text-ink">{d.full_name ?? "İsimsiz"}</span>
                <span className="shrink-0 text-xs text-ink-soft">{d.acceptedCount} kabul</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
