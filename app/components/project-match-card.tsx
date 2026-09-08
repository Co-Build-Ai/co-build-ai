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
    founderName: string | null;
    matchScore: number;
  };
}) {
  return (
    <div className="group relative overflow-hidden rounded-xl border border-stone-200 bg-white shadow-[inset_0_1px_0_rgba(255,255,255,0.8),0_4px_12px_rgba(17,24,39,0.12)] p-6 transition-all [transform-style:preserve-3d] hover:[transform:perspective(900px)_rotateX(2deg)_translateY(-4px)] hover:shadow-[inset_0_1px_0_rgba(255,255,255,0.8),0_8px_20px_rgba(17,24,39,0.16)]">
      <div className="flex items-start justify-between gap-3">
        <h3 className="truncate text-sm font-bold text-ink">{project.title}</h3>
        {project.matchScore > 0 && <ProgressRing value={project.matchScore} size={40} strokeWidth={4} />}
      </div>

      <div className="mt-3 flex items-center gap-2">
        <Avatar name={project.founderName} role="founder" size="sm" />
        <span className="text-xs text-ink-soft">{project.founderName ?? "İsimsiz Fikir Sahibi"}</span>
      </div>

      <p className="mt-2 line-clamp-2 text-xs text-ink-soft">{project.raw_idea}</p>

      {project.required_skills && project.required_skills.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-1.5">
          {project.required_skills.slice(0, 4).map((skill) => (
            <span
              key={skill}
              className="rounded-full bg-petal px-2 py-0.5 font-mono text-[10px] text-coral-dark"
            >
              {skill}
            </span>
          ))}
        </div>
      )}

      <div className="pointer-events-none absolute inset-x-0 bottom-0 flex translate-y-full justify-end bg-gradient-to-t from-white via-white/95 to-transparent p-3 pt-6 transition-transform duration-200 group-hover:translate-y-0 group-hover:pointer-events-auto">
        <a
          href={`/proje/${project.id}`}
          className="rounded-full bg-coral px-4 py-1.5 text-xs font-semibold text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.35),0_4px_0_0_var(--color-coral-dark),0_10px_20px_rgba(239,68,104,0.35)] transition-all hover:brightness-105 active:translate-y-1 active:shadow-[inset_0_1px_0_rgba(255,255,255,0.35),0_0px_0_0_var(--color-coral-dark),0_2px_6px_rgba(239,68,104,0.30)]"
        >
          Detayları Gör →
        </a>
      </div>
    </div>
  );
}
