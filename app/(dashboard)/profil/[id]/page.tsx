import { redirect, notFound } from "next/navigation";
import { createClient } from "@/utils/supabase/server";
import Avatar from "@/app/components/avatar";
import StatCircle from "@/app/components/stat-circle";
import RatingStars from "@/app/components/rating-stars";
import AvailabilityBadge from "@/app/components/availability-badge";
import BadgesSection, { type Badge } from "@/app/components/badges-section";
import PortfolioSection from "../portfolio-section";
import { canActAsDeveloper, canActAsFounder } from "@/app/lib/roles";

export default async function KullaniciProfili({
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

  // Kendi profiline bu yoldan gelinirse asıl "Profilim" (düzenlenebilir) sayfasına yönlendir
  if (id === user.id) {
    redirect("/profil");
  }

  const { data: viewedProfile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (!viewedProfile) {
    notFound();
  }

  const isDeveloper = canActAsDeveloper(viewedProfile.user_type);
  const isFounder = canActAsFounder(viewedProfile.user_type);

  const { data: ratingsData } = await supabase.from("ratings").select("score").eq("rated_user_id", id);
  const scores = ratingsData ?? [];
  const ratingAvg = scores.length > 0 ? scores.reduce((sum, r) => sum + r.score, 0) / scores.length : null;

  // --- Yazılımcı tarafı verileri ---
  let items: {
    id: string;
    title: string;
    description: string | null;
    file_url: string | null;
    item_type: "project" | "certificate";
    issuer: string | null;
    item_date: string | null;
  }[] = [];
  let pastWork: { id: string; projectTitle: string }[] = [];
  if (isDeveloper) {
    const { data: portfolioItems } = await supabase
      .from("portfolio_items")
      .select("*")
      .eq("developer_id", id)
      .order("created_at", { ascending: false });
    items = portfolioItems ?? [];

    // Geçmişte tamamladığı projeler — özet/undetaylı halde, sadece başlık ve
    // durum bilgisiyle. PRD gibi projeye özel gizli detaylar gösterilmiyor.
    const { data: completedOffers } = await supabase
      .from("offers")
      .select("id, project_id, completed_at")
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

    pastWork = (completedOffers ?? []).map((o) => ({
      ...o,
      projectTitle: completedProjects.find((p) => p.id === o.project_id)?.title ?? "Bilinmeyen Proje",
    }));
  }

  // --- Fikir sahibi tarafı verileri ---
  let publishedProjects: {
    id: string;
    title: string;
    raw_idea: string;
    required_skills: string[] | null;
    payment_type: "fixed" | "equity" | "flexible" | null;
    payment_amount: number | null;
  }[] = [];
  if (isFounder) {
    const { data } = await supabase
      .from("projects")
      .select("id, title, raw_idea, required_skills, payment_type, payment_amount")
      .eq("founder_id", id)
      .eq("status", "published")
      .order("created_at", { ascending: false });
    publishedProjects = data ?? [];
  }

  const badges: Badge[] = [
    ...(isFounder
      ? [
          { id: "first-idea", label: "İlk Fikrini Girdi", icon: "Lightbulb" as const, earned: true },
          {
            id: "first-publish",
            label: "İlk Yayın",
            icon: "Rocket" as const,
            earned: publishedProjects.length >= 1,
          },
        ]
      : []),
    ...(isDeveloper
      ? [
          { id: "first-offer-sent", label: "İlk Teklifini Verdi", icon: "Send" as const, earned: true },
          {
            id: "first-accepted",
            label: "İlk Kabul",
            icon: "CheckCircle" as const,
            earned: pastWork.length > 0 || scores.length > 0,
          },
          {
            id: "portfolio-started",
            label: "Portfolyo Kurdu",
            icon: "Briefcase" as const,
            earned: items.length >= 1,
          },
        ]
      : []),
  ];

  const roleLabel = isFounder && isDeveloper ? "Yazılımcı & Fikir Sahibi" : isFounder ? "Fikir Sahibi" : "Yazılımcı";

  return (
    <div>
      <div className="mx-auto max-w-3xl">
        <div className="flex flex-col items-center text-center">
          <Avatar
            name={viewedProfile.full_name}
            role={isDeveloper ? "developer" : "founder"}
            size="lg"
            avatarUrl={viewedProfile.avatar_url}
          />
          <div className="mt-4 flex items-center gap-2">
            <h1 className="text-3xl font-extrabold tracking-tight text-ink sm:text-4xl">
              {viewedProfile.full_name ?? "İsimsiz Kullanıcı"}
            </h1>
            {isDeveloper && <AvailabilityBadge availability={viewedProfile.availability} />}
          </div>
          <p className="mt-2 text-sm text-ink-soft">{roleLabel}</p>
          <div className="mt-2">
            <RatingStars average={ratingAvg} count={scores.length} />
          </div>

          <div className="mt-6 flex flex-wrap items-center justify-center gap-4">
            {isFounder && (
              <StatCircle value={publishedProjects.length} label="Yayında" tone="lime" size={110} />
            )}
            {isDeveloper && (
              <>
                <StatCircle value={items.length} label="Portfolyo Öğesi" tone="lime" size={110} />
                <StatCircle value={pastWork.length} label="Tamamlanan Proje" tone="pink" size={110} />
              </>
            )}
          </div>
        </div>

        <BadgesSection badges={badges} />

        {isDeveloper && (
          <div className="mt-8 rounded-xl border border-stone-200 bg-white shadow-[inset_0_1px_0_rgba(255,255,255,0.8),0_4px_12px_rgba(17,24,39,0.12)] p-8">
            <h2 className="text-lg font-bold text-ink">Hakkımda</h2>
            <p className="mt-3 text-sm leading-relaxed text-ink-soft">
              {viewedProfile.bio || "Henüz bir tanıtım yazısı eklenmedi."}
            </p>

            <div className="mt-4 flex flex-wrap gap-2">
              {viewedProfile.skills && viewedProfile.skills.length > 0 ? (
                viewedProfile.skills.map((skill: string) => (
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
              {viewedProfile.cv_url ? (
                <a
                  href={viewedProfile.cv_url}
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
        )}

        {isFounder && (
          <div className="mt-10">
            <h2 className="font-mono text-xs font-semibold uppercase tracking-wide text-ink-soft">
              Yayınladığı Projeler ({publishedProjects.length})
            </h2>
            {publishedProjects.length === 0 ? (
              <p className="mt-3 text-sm text-ink-soft">Henüz yayınlanmış bir projesi yok.</p>
            ) : (
              <div className="mt-3 flex flex-col gap-3">
                {publishedProjects.map((project) => (
                  <div
                    key={project.id}
                    className="rounded-lg border border-stone-200 bg-white shadow-[inset_0_1px_0_rgba(255,255,255,0.8),0_4px_12px_rgba(17,24,39,0.12)] p-5"
                  >
                    <p className="text-sm font-bold text-ink">{project.title}</p>
                    <p className="mt-1 line-clamp-2 text-xs text-ink-soft">{project.raw_idea}</p>
                    {project.required_skills && project.required_skills.length > 0 && (
                      <div className="mt-2 flex flex-wrap gap-1.5">
                        {project.required_skills.slice(0, 5).map((skill) => (
                          <span
                            key={skill}
                            className="rounded-full bg-petal px-2 py-0.5 font-mono text-[10px] text-coral-dark"
                          >
                            {skill}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {isDeveloper && <PortfolioSection userId={id} items={items} readOnly />}

        {isDeveloper && pastWork.length > 0 && (
          <div className="mt-10">
            <h2 className="font-mono text-xs font-semibold uppercase tracking-wide text-ink-soft">
              Geçmiş Projeleri
            </h2>
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
      </div>
    </div>
  );
}
