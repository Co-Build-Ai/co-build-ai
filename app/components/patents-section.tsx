import { Award } from "lucide-react";

export type Patent = {
  id: string;
  title: string;
  issuer: string | null;
  item_date: string | null;
  file_url: string | null;
};

export default function PatentsSection({ patents }: { patents: Patent[] }) {
  if (patents.length === 0) return null;

  return (
    <div className="mt-10">
      <h2 className="text-lg font-bold text-ink">Patentler</h2>
      <div className="mt-3 flex flex-col gap-3">
        {patents.map((patent) => (
          <div
            key={patent.id}
            className="rounded-xl border border-amber-200 bg-amber-50/60 p-5"
          >
            <div className="flex items-start gap-3">
              <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-amber-100 text-amber-700">
                <Award size={16} />
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-bold text-ink">{patent.title}</p>
                {patent.issuer && <p className="text-xs text-ink-soft">{patent.issuer}</p>}
                <div className="mt-1 flex gap-3 text-xs text-ink-soft">
                  {patent.item_date && <span>{patent.item_date}</span>}
                  {patent.file_url && (
                    <a
                      href={patent.file_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-coral-dark hover:underline"
                    >
                      Belgeyi gör →
                    </a>
                  )}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
