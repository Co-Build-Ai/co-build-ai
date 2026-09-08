import Avatar from "./avatar";
import RatingStars from "./rating-stars";
import AvailabilityBadge from "./availability-badge";

type Developer = {
  id: string;
  full_name: string | null;
  bio: string | null;
  skills: string[] | null;
  availability: string | null;
  ratingAvg: number | null;
  ratingCount: number;
};

export default function DeveloperFeed({ developers }: { developers: Developer[] }) {
  if (developers.length === 0) return null;

  return (
    <div className="rounded-2xl border border-blue-300/60 bg-blue-200 p-5 shadow-[inset_0_1px_0_rgba(255,255,255,0.8),inset_0_-2px_0_rgba(96,165,250,0.6),0_4px_14px_rgba(59,130,246,0.15),0_28px_55px_rgba(59,130,246,0.25)]">
      <p className="inline-flex items-center rounded-full bg-ink px-3 py-1 text-[11px] font-extrabold uppercase tracking-wide text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.25),0_3px_0_0_#000000,0_8px_16px_rgba(0,0,0,0.35)]">
        Yazılımcılar Akışı
      </p>
      <div className="mt-3 flex max-h-[520px] flex-col gap-2 overflow-y-auto pr-1">
        {developers.map((dev) => (
          <div key={dev.id} className="rounded-xl bg-petal/60 p-3">
            <div className="flex items-center gap-2">
              <Avatar name={dev.full_name} role="developer" size="sm" />
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5">
                  <p className="truncate text-sm font-bold text-ink">{dev.full_name ?? "İsimsiz"}</p>
                  <AvailabilityBadge availability={dev.availability} />
                </div>
                <RatingStars average={dev.ratingAvg} count={dev.ratingCount} />
              </div>
            </div>
            {dev.bio && <p className="mt-2 line-clamp-2 text-xs text-ink-soft">{dev.bio}</p>}
            {dev.skills && dev.skills.length > 0 && (
              <div className="mt-2 flex flex-wrap gap-1">
                {dev.skills.slice(0, 4).map((skill) => (
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
