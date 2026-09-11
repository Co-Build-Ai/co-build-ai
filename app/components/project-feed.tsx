import Avatar from "./avatar";

type Project = {
  id: string;
  title: string;
  raw_idea: string;
  required_skills: string[] | null;
  founder_id: string;
  founderName: string | null;
};

export default function ProjectFeed({ projects }: { projects: Project[] }) {
  if (projects.length === 0) return null;

  return (
    <div className="rounded-2xl border border-stone-200 bg-white p-5 shadow-[inset_0_1px_0_rgba(255,255,255,0.8),0_4px_12px_rgba(17,24,39,0.12)]">
      <p className="font-mono text-[11px] font-semibold uppercase tracking-wide text-ink-soft">
        🌊 Fikirler Akışı
      </p>
      <div className="mt-3 flex max-h-[520px] flex-col gap-2 overflow-y-auto pr-1">
        {projects.map((p) => (
          <div key={p.id} className="rounded-xl bg-petal/60 p-3 transition-colors hover:bg-petal">
            <a href={`/proje/${p.id}`} className="block text-sm font-bold text-ink hover:underline">
              {p.title}
            </a>
            <a
              href={`/profil/${p.founder_id}`}
              className="mt-1 flex w-fit items-center gap-1.5 hover:underline"
            >
              <Avatar name={p.founderName} role="founder" size="sm" />
              <span className="text-xs text-ink-soft">{p.founderName ?? "İsimsiz"}</span>
            </a>
            <a href={`/proje/${p.id}`} className="mt-2 block line-clamp-2 text-xs text-ink-soft">
              {p.raw_idea}
            </a>
            {p.required_skills && p.required_skills.length > 0 && (
              <div className="mt-2 flex flex-wrap gap-1">
                {p.required_skills.slice(0, 4).map((skill) => (
                  <span
                    key={skill}
                    className="rounded-full bg-white px-2 py-0.5 font-mono text-[10px] text-ink-soft"
                  >
                    {skill}
                  </span>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
