import Avatar from "./avatar";
import RatingStars from "./rating-stars";

type Founder = {
  id: string;
  full_name: string | null;
  bio: string | null;
  avatar_url: string | null;
  ratingAvg: number | null;
  ratingCount: number;
  projectCount: number;
};

export default function FounderFeed({ founders }: { founders: Founder[] }) {
  if (founders.length === 0) return null;

  return (
    <div className="rounded-xl border border-black/[0.08] bg-white p-5 shadow-sm">
      <p className="text-[11px] font-semibold uppercase tracking-wide text-ink-soft">
        Girişimciler Akışı
      </p>
      <div className="mt-3 flex flex-col gap-2">
        {founders.map((founder) => (
          <a
            key={founder.id}
            href={`/profil/${founder.id}`}
            className="block rounded-lg border border-transparent p-3 transition-colors hover:border-black/[0.06] hover:bg-black/[0.02]"
          >
            <div className="flex items-center gap-2">
              <Avatar name={founder.full_name} role="founder" size="sm" avatarUrl={founder.avatar_url} />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-bold text-ink">{founder.full_name ?? "İsimsiz"}</p>
                <RatingStars average={founder.ratingAvg} count={founder.ratingCount} />
              </div>
            </div>
            {founder.bio && <p className="mt-2 line-clamp-2 text-xs text-ink-soft">{founder.bio}</p>}
            {founder.projectCount > 0 && (
              <p className="mt-2 text-[11px] text-ink-soft">
                {founder.projectCount} yayınlanmış proje
              </p>
            )}
          </a>
        ))}
      </div>
    </div>
  );
}
