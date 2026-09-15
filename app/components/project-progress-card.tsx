export default function ProjectProgressCard({
  project,
}: {
  project: {
    id: string;
    title: string;
    progress: number;
    offerCount: number;
    hasUnread?: boolean;
  };
}) {
  return (
    <a
      href={`/proje/${project.id}`}
      className="relative block rounded-xl border border-black/[0.08] bg-white shadow-sm p-6 transition-all hover:shadow-md"
    >
      {project.hasUnread && (
        <span
          className="absolute right-3 top-3 h-2.5 w-2.5 rounded-full bg-green-500"
          title="Yeni bir bildirimin var"
        />
      )}
      <div className="flex items-center justify-between gap-3">
        <h3 className="truncate text-sm font-bold text-ink">{project.title}</h3>
        <span className="shrink-0 rounded-full bg-petal px-2.5 py-0.5 text-xs font-bold text-coral-dark">
          {project.progress}%
        </span>
      </div>
      <div className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-ink/10">
        <div
          className="h-full rounded-full bg-coral transition-all"
          style={{ width: `${project.progress}%` }}
        />
      </div>
      <p className="mt-2 text-xs text-ink-soft">
        {project.offerCount > 0 ? `${project.offerCount} teklif` : "Henüz teklif yok"}
      </p>
    </a>
  );
}
