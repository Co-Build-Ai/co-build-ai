import { redirect, notFound } from "next/navigation";
import { createClient } from "@/utils/supabase/server";
import Avatar from "@/app/components/avatar";
import RatingStars from "@/app/components/rating-stars";
import AvailabilityBadge from "@/app/components/availability-badge";

export default async function YazilimciProfil({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/giris");
  }

  const { data: devProfile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (!devProfile || (devProfile.user_type !== "developer" && devProfile.user_type !== "both")) {
    notFound();
  }

  const { data: ratingsData } = await supabase.from("ratings").select("score").eq("rated_user_id", id);
  const scores = ratingsData ?? [];
  const ratingAvg = scores.length > 0 ? scores.reduce((sum, r) => sum + r.score, 0) / scores.length : null;

  const { data: portfolioItems } = await supabase
    .from("portfolio_items")
    .select("*")
    .eq("developer_id", id)
    .order("created_at", { ascending: false });

  // Geçmişte tamamladığı projeler — özet/undetaylı halde, sadece başlık ve
  // anlaşma bilgisiyle. PRD gibi projeye özel gizli detaylar gösterilmiyor.
  const { data: completedOffers } = await supabase
    .from("offers")
    .select("id, project_id, payment_type, proposed_amount, completed_at")
    .eq("developer_id", id)
    .eq("status", "accepted")
    .not("completed_at", "is", null)
    .order("completed_at", { ascending: false });

  const completedProjectIds = [...new Set((completedOffers ?? []).map((o) => o.project_id))];
  let completedProjects: { id: string; title: string }[] = [];
  if (completedProjectIds.length > 0) {
    const { data } = await supabase.from("projects").select("id, title").in("id", completedProjectIds);
    completedProjects = data ?? [];
  }

  const pastWork = (completedOffers ?? []).map((o) => ({
    ...o,
    projectTitle: completedProjects.find((p) => p.id === o.project_id)?.title ?? "Bilinmeyen Proje",
  }));

  return (
    <div className="min-h-screen bg-background px-6 py-10 sm:px-12">
      <div className="mx-auto max-w-2xl">
        <a href="/panel" className="text-sm font-medium text-ink-soft hover:text-ink">
          ← Panele Dön
        </a>

        <div className="mt-6 flex flex-col items-center text-center">
          <Avatar
            name={devProfile.full_name}
            role="developer"
            size="lg"
            avatarUrl={devProfile.avatar_url}
          />
          <div className="mt-4 flex items-center gap-2">
            <h1 className="text-3xl font-extrabold tracking-tight text-ink sm:text-4xl">
              {devProfile.full_name ?? "İsimsiz Yazılımcı"}
            </h1>
            <AvailabilityBadge availability={devProfile.availability} />
          </div>
          <p className="mt-1 text-sm text-ink-soft">Yazılımcı</p>
          <div className="mt-2">
            <RatingStars average={ratingAvg} count={scores.length} />
          </div>
        </div>

        <div className="mt-8 rounded-xl border border-stone-200 bg-white shadow-[inset_0_1px_0_rgba(255,255,255,0.8),0_4px_12px_rgba(17,24,39,0.12)] p-8">
          <h2 className="text-lg font-bold text-ink">Hakkında</h2>
          <p className="mt-3 text-sm leading-relaxed text-ink-soft">
            {devProfile.bio || "Henüz bir tanıtım yazısı eklenmedi."}
          </p>

          <div className="mt-4 flex flex-wrap gap-2">
            {devProfile.skills && devProfile.skills.length > 0 ? (
              devProfile.skills.map((skill: string) => (
                <span
                  key={skill}
                  className="rounded-full bg-periwinkle/20 px-3 py-1 font-mono text-xs text-ink"
                >
                  {skill}
                </span>
              ))
            ) : (
              <p className="text-xs text-ink-soft">Henüz beceri etiketi eklenmedi.</p>
            )}
          </div>

          <div className="mt-4">
            {devProfile.cv_url ? (
              <a
                href={devProfile.cv_url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm font-semibold text-coral-dark hover:underline"
              >
                CV&apos;yi Görüntüle →
              </a>
            ) : (
              <p className="text-xs text-ink-soft">Henüz CV yüklenmedi.</p>
            )}
          </div>
        </div>

        {pastWork.length > 0 && (
          <div className="mt-8">
            <h2 className="text-lg font-bold text-ink">Geçmiş Projeleri</h2>
            <div className="mt-3 flex flex-col gap-2">
              {pastWork.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center justify-between gap-3 rounded-lg border border-stone-200 bg-white shadow-[inset_0_1px_0_rgba(255,255,255,0.8),0_4px_12px_rgba(17,24,39,0.12)] px-4 py-3"
                >
                  <p className="min-w-0 flex-1 truncate text-sm font-medium text-ink">
                    {item.projectTitle}
                  </p>
                  <span className="shrink-0 rounded-full bg-periwinkle-dark px-2.5 py-0.5 text-xs font-semibold text-white">
                    Tamamlandı
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {portfolioItems && portfolioItems.length > 0 && (
          <div className="mt-8">
            <h2 className="text-lg font-bold text-ink">Projeler ve Sertifikalar</h2>
            <div className="mt-3 flex flex-col gap-3">
              {portfolioItems.map((item) => (
                <div
                  key={item.id}
                  className="rounded-lg border border-stone-200 bg-white shadow-[inset_0_1px_0_rgba(255,255,255,0.8),0_4px_12px_rgba(17,24,39,0.12)] p-5"
                >
                  <p className="text-sm font-bold text-ink">{item.title}</p>
                  {item.issuer && <p className="text-xs text-ink-soft">{item.issuer}</p>}
                  {item.description && (
                    <p className="mt-1 text-xs text-ink-soft">{item.description}</p>
                  )}
                  {item.file_url && (
                    <a
                      href={item.file_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-2 block text-xs font-semibold text-coral-dark hover:underline"
                    >
                      Linki gör →
                    </a>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
