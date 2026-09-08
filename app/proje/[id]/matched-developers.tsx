import Avatar from "@/app/components/avatar";
import ProgressRing from "@/app/components/progress-ring";

export type MatchedDeveloper = {
  developerId: string;
  fullName: string | null;
  bio: string | null;
  skills: string[];
  matchScore: number;
};

export default function MatchedDevelopers({ developers }: { developers: MatchedDeveloper[] }) {
  if (!developers || developers.length === 0) {
    return null;
  }

  return (
    <div>
      <div className="mb-3 flex items-center justify-between">
        <p className="font-mono text-xs font-semibold uppercase tracking-wide text-ink-soft">
          Eşleşen Yazılımcılar ({developers.length})
        </p>
        <span className="rounded-full bg-petal px-3 py-1 font-mono text-[10px] font-medium text-coral-dark">
          Beceri Uyumu
        </span>
      </div>

      <div className="flex flex-col gap-4">
        {developers.map((dev) => (
          <div key={dev.developerId} className="rounded-xl border border-stone-200 bg-white shadow-[inset_0_1px_0_rgba(255,255,255,0.8),0_4px_12px_rgba(17,24,39,0.12)] p-6">
            <div className="flex items-start gap-3">
              <Avatar name={dev.fullName} role="developer" size="md" />

              <div className="min-w-0 flex-1">
                <h3 className="truncate text-base font-bold text-ink">
                  {dev.fullName ?? "İsimsiz Yazılımcı"}
                </h3>
                {dev.bio && (
                  <p className="mt-0.5 line-clamp-2 text-xs leading-relaxed text-ink-soft">{dev.bio}</p>
                )}
              </div>

              <ProgressRing value={dev.matchScore} size={44} strokeWidth={4} />
            </div>

            {dev.skills.length > 0 && (
              <div className="mt-3 flex flex-wrap gap-1.5">
                {dev.skills.map((skill) => (
                  <span
                    key={skill}
                    className="rounded-full bg-periwinkle/20 px-2.5 py-0.5 font-mono text-[11px] text-ink"
                  >
                    {skill}
                  </span>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>

      <a href="/panel" className="mt-3 inline-block text-xs font-semibold text-coral-dark hover:underline">
        Keşfet&apos;te tüm yazılımcıları gör →
      </a>
    </div>
  );
}
