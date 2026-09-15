import Avatar from "./avatar";
import ProgressRing from "./progress-ring";

export default function ProjectMatchCard({
  project,
}: {
  project: {
    id: string;
    title: string;
    raw_idea: string;
    required_skills: string[] | null;
    founder_id: string;
    founderName: string | null;
    founderAvatarUrl?: string | null;
    matchScore: number;
  };
}) {
  return (
    <div className="group relative overflow-hidden rounded-xl border border-black/[0.08] bg-white p-6 shadow-sm transition-shadow hover:shadow-md">
      <div className="flex items-start justify-between gap-3">
        <h3 className="truncate text-sm font-semibold text-ink">{project.title}</h3>
        {project.matchScore > 0 && <ProgressRing value={project.matchScore} size={40} strokeWidth={4} />}
      </div>

      <a
        href={`/profil/${project.founder_id}`}
        className="relative z-10 mt-3 flex w-fit items-center gap-2 hover:underline"
      >
        <Avatar name={project.founderName} role="founder" size="sm" avatarUrl={project.founderAvatarUrl} />
        <span className="text-xs text-ink-soft">{project.founderName ?? "İsimsiz Fikir Sahibi"}</span>
      </a>

      <p className="mt-2 line-clamp-2 text-xs text-ink-soft">{project.raw_idea}</p>

      {project.required_skills && project.required_skills.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-1.5">
          {project.required_skills.slice(0, 4).map((skill) => (
            <span
              key={skill}
              className="rounded-md bg-black/[0.04] px-2 py-0.5 font-mono text-[10px] text-ink-soft"
            >
              {skill}
            </span>
          ))}
        </div>
      )}

      <div className="pointer-events-none absolute inset-x-0 bottom-0 flex translate-y-full justify-end bg-gradient-to-t from-white via-white/95 to-transparent p-3 pt-6 transition-transform duration-200 group-hover:translate-y-0 group-hover:pointer-events-auto">
        <a
          href={`/proje/${project.id}`}
          className="rounded-lg bg-[#1a7a52] px-4 py-1.5 text-xs font-medium text-white transition-colors hover:bg-[#15633f]"
        >
          Detayları Gör →
        </a>
      </div>
    </div>
  );
}
