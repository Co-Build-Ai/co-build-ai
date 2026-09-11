import { redirect, notFound } from "next/navigation";
import { createClient } from "@/utils/supabase/server";
import Avatar from "@/app/components/avatar";
import StatCircle from "@/app/components/stat-circle";
import RatingStars from "@/app/components/rating-stars";
import AvailabilityBadge from "@/app/components/availability-badge";
import BadgesSection, { type Badge } from "@/app/components/badges-section";
import PortfolioSection from "../portfolio-section";
import { canActAsDeveloper, canActAsFounder } from "@/app/lib/roles";

const CARD = "rounded-xl border border-stone-200 bg-white p-6 shadow-[inset_0_1px_0_rgba(255,255,255,0.8),0_4px_12px_rgba(17,24,39,0.12)]";
const SECTION_LABEL = "font-mono text-xs font-semibold uppercase tracking-wide text-ink-soft";

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
  const pastWork: { id: string; projectTitle: string }[] = [];
  const activeWork: { id: string; projectTitle: string; projectId: string }[] = [];
  if (isDeveloper) {
    const { data: portfolioItems } = await supabase
      .from("portfolio_items")
      .select("*")
      .eq("developer_id", id)
      .order("created_at", { ascending: false });
    items = portfolioItems ?? [];

    // Şu an üzerinde çalıştığı + geçmişte tamamladığı projeler — özet/undetaylı
    // halde, sadece başlık ve durum bilgisiyle. PRD gibi projeye özel gizli
    // detaylar gösterilmiyor.
    const { data: acceptedOffers } = await supabase
      .from("offers")
      .select("id, project_id, completed_at")
      .eq("developer_id", id)
      .eq("status", "accepted")
      .order("completed_at", { ascending: false, nullsFirst: true });

    const projectIds = [...new Set((acceptedOffers ?? []).map((o) => o.project_id))];
    let relatedProjects: { id: string; title: string }[] = [];
    if (projectIds.length > 0) {
      const { data } = await supabase.from("projects").select("id, title").in("id", projectIds);
      relatedProjects = data ?? [];
    }

    for (const o of acceptedOffers ?? []) {
      const projectTitle = relatedProjects.find((p) => p.id === o.project_id)?.title ?? "Bilinmeyen Proje";
      if (o.completed_at) {
        pastWork.push({ id: o.id, projectTitle });
      } else {
        activeWork.push({ id: o.id, projectTitle, projectId: o.project_id });
      }
    }
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

  // --- Sağ sidebar: benzer profiller + yeni katılanlar + öne çıkan projeler +
  // popüler beceriler (hepsi gerçek veriden, LinkedIn'deki "öneriler" bölümüne
  // benzer şekilde birden çok modül) ---
  let similarProfiles: { id: string; full_name: string | null; skills: string[] | null; avatar_url: string | null }[] = [];
  let popularSkills: string[] = [];
  const excludeIds = [id, user.id];

  if (isDeveloper && viewedProfile.skills && viewedProfile.skills.length > 0) {
    const { data: overlapping } = await supabase
      .from("profiles")
      .select("id, full_name, skills, avatar_url")
      .overlaps("skills", viewedProfile.skills)
      .not("id", "in", `(${excludeIds.join(",")})`)
      .in("user_type", ["developer", "both"])
      .limit(8);
    similarProfiles = overlapping ?? [];
  }

  const similarIds = similarProfiles.map((p) => p.id);
  const { data: recentProfilesData } = await supabase
    .from("profiles")
    .select("id, full_name, user_type, avatar_url, created_at")
    .not("id", "in", `(${[...excludeIds, ...similarIds].join(",")})`)
    .order("created_at", { ascending: false })
    .limit(5);
  const recentProfiles = recentProfilesData ?? [];

  const { data: publishedForTrend } = await supabase
    .from("projects")
    .select("id, title")
    .eq("status", "published");
  const publishedTrendIds = (publishedForTrend ?? []).map((p) => p.id);
  let trendingProjects: { id: string; title: string; offerCount: number }[] = [];
  if (publishedTrendIds.length > 0) {
    const { data: allOffersForTrend } = await supabase
      .from("offers")
      .select("project_id")
      .in("project_id", publishedTrendIds);
    const offerCountByProject: Record<string, number> = {};
    for (const o of allOffersForTrend ?? []) {
      offerCountByProject[o.project_id] = (offerCountByProject[o.project_id] ?? 0) + 1;
    }
    trendingProjects = (publishedForTrend ?? [])
      .map((p) => ({ ...p, offerCount: offerCountByProject[p.id] ?? 0 }))
      .filter((p) => p.offerCount > 0)
      .sort((a, b) => b.offerCount - a.offerCount)
      .slice(0, 4);
  }

  {
    const { data: allDevProfiles } = await supabase
      .from("profiles")
      .select("skills")
      .in("user_type", ["developer", "both"]);
    const counts: Record<string, number> = {};
    for (const p of allDevProfiles ?? []) {
      for (const skill of p.skills ?? []) {
        counts[skill] = (counts[skill] ?? 0) + 1;
      }
    }
    popularSkills = Object.entries(counts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 8)
      .map(([skill]) => skill);
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
            earned: pastWork.length > 0 || activeWork.length > 0 || scores.length > 0,
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
    <div className="mx-auto max-w-6xl">
      {/* Profil başlığı */}
      <div className="overflow-hidden rounded-xl border border-stone-200 bg-white shadow-[inset_0_1px_0_rgba(255,255,255,0.8),0_4px_12px_rgba(17,24,39,0.12)]">
        <div
          className={`h-28 sm:h-36 ${
            isDeveloper
              ? "bg-gradient-to-r from-periwinkle/40 via-petal to-coral/20"
              : "bg-gradient-to-r from-coral/25 via-petal to-coral/10"
          }`}
        />
        <div className="flex flex-col items-center px-6 pb-6 text-center sm:flex-row sm:items-end sm:gap-5 sm:text-left">
          <div className="-mt-12 shrink-0 rounded-full ring-4 ring-white sm:-mt-14">
            <Avatar
              name={viewedProfile.full_name}
              role={isDeveloper ? "developer" : "founder"}
              size="lg"
              avatarUrl={viewedProfile.avatar_url}
            />
          </div>
          <div className="mt-3 min-w-0 flex-1 sm:mt-0 sm:pb-1">
            <div className="flex flex-wrap items-center justify-center gap-2 sm:justify-start">
              <h1 className="text-2xl font-extrabold tracking-tight text-ink sm:text-3xl">
                {viewedProfile.full_name ?? "İsimsiz Kullanıcı"}
              </h1>
              {isDeveloper && <AvailabilityBadge availability={viewedProfile.availability} />}
            </div>
            <p className="mt-1 text-sm text-ink-soft">{roleLabel}</p>
            <div className="mt-1.5 flex justify-center sm:justify-start">
              <RatingStars average={ratingAvg} count={scores.length} />
            </div>
          </div>
        </div>
      </div>

      {/* İki sütunlu düzen: sol ana içerik + sağ sabit (sticky) sidebar */}
      <div className="mt-8 grid grid-cols-1 gap-8 lg:grid-cols-[minmax(0,1fr)_320px]">
        <div className="min-w-0">
          <div className="flex flex-wrap justify-center gap-4 sm:justify-start">
            {isFounder && <StatCircle value={publishedProjects.length} label="Yayında" tone="lime" size={100} />}
            {isDeveloper && (
              <>
                <StatCircle value={items.length} label="Portfolyo Öğesi" tone="lime" size={100} />
                <StatCircle value={pastWork.length} label="Tamamlanan Proje" tone="pink" size={100} />
              </>
            )}
          </div>

          <BadgesSection badges={badges} />

          {isDeveloper && (
            <div className={`mt-8 ${CARD}`}>
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

          {isDeveloper && activeWork.length > 0 && (
            <div className="mt-10">
              <h2 className={SECTION_LABEL}>Şu An Üzerinde Çalıştığı ({activeWork.length})</h2>
              <div className="mt-3 flex flex-col gap-2">
                {activeWork.map((item) => (
                  <div
                    key={item.id}
                    className={`flex items-center justify-between gap-3 px-4 py-3 ${CARD}`}
                  >
                    <p className="min-w-0 flex-1 truncate text-sm font-medium text-ink">{item.projectTitle}</p>
                    <span className="shrink-0 rounded-full bg-petal px-2.5 py-0.5 text-xs font-semibold text-coral-dark">
                      Devam Ediyor
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {isFounder && (
            <div className="mt-10">
              <h2 className={SECTION_LABEL}>Yayınladığı Projeler ({publishedProjects.length})</h2>
              {publishedProjects.length === 0 ? (
                <p className="mt-3 text-sm text-ink-soft">Henüz yayınlanmış bir projesi yok.</p>
              ) : (
                <div className="mt-3 flex flex-col gap-3">
                  {publishedProjects.map((project) => (
                    <div key={project.id} className={CARD}>
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
              <h2 className={SECTION_LABEL}>Tamamlanan Projeleri</h2>
              <div className="mt-3 flex flex-col gap-2">
                {pastWork.map((item) => (
                  <div key={item.id} className={`flex items-center justify-between gap-3 px-4 py-3 ${CARD}`}>
                    <p className="min-w-0 flex-1 truncate text-sm font-medium text-ink">{item.projectTitle}</p>
                    <span className="shrink-0 rounded-full bg-periwinkle-dark px-2.5 py-0.5 text-xs font-semibold text-white">
                      Tamamlandı
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Sağ sidebar — büyük ekranda sayfa kaydırılırken sabit kalır (sticky);
            içeriği viewport'tan uzunsa kendi içinde kayar, sayfayla birlikte
            aşağı inmez. */}
        <div className="flex flex-col gap-6 lg:sticky lg:top-24 lg:max-h-[calc(100vh-7rem)] lg:self-start lg:overflow-y-auto lg:pb-4 lg:pr-1">
          {similarProfiles.length > 0 && (
            <div className={CARD}>
              <h2 className={SECTION_LABEL}>Benzer Profiller</h2>
              <div className="mt-3 flex flex-col gap-3">
                {similarProfiles.map((p) => (
                  <a
                    key={p.id}
                    href={`/profil/${p.id}`}
                    className="flex items-center gap-2.5 transition-opacity hover:opacity-70"
                  >
                    <Avatar name={p.full_name} role="developer" size="sm" avatarUrl={p.avatar_url} />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold text-ink">{p.full_name ?? "İsimsiz"}</p>
                      {p.skills && p.skills.length > 0 && (
                        <p className="truncate text-xs text-ink-soft">{p.skills.slice(0, 3).join(", ")}</p>
                      )}
                    </div>
                  </a>
                ))}
              </div>
            </div>
          )}

          {trendingProjects.length > 0 && (
            <div className={CARD}>
              <h2 className={SECTION_LABEL}>Öne Çıkan Projeler</h2>
              <div className="mt-3 flex flex-col gap-3">
                {trendingProjects.map((p, i) => (
                  <a
                    key={p.id}
                    href={`/proje/${p.id}`}
                    className="flex items-center gap-2 text-sm transition-colors hover:text-coral-dark"
                  >
                    <span className="font-bold text-ink-soft">{i + 1}</span>
                    <span className="min-w-0 flex-1 truncate text-ink">{p.title}</span>
                    <span className="shrink-0 text-xs text-ink-soft">{p.offerCount} teklif</span>
                  </a>
                ))}
              </div>
            </div>
          )}

          {recentProfiles.length > 0 && (
            <div className={CARD}>
              <h2 className={SECTION_LABEL}>Platforma Yeni Katılanlar</h2>
              <div className="mt-3 flex flex-col gap-3">
                {recentProfiles.map((p) => (
                  <a
                    key={p.id}
                    href={`/profil/${p.id}`}
                    className="flex items-center gap-2.5 transition-opacity hover:opacity-70"
                  >
                    <Avatar
                      name={p.full_name}
                      role={canActAsFounder(p.user_type) && !canActAsDeveloper(p.user_type) ? "founder" : "developer"}
                      size="sm"
                      avatarUrl={p.avatar_url}
                    />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold text-ink">{p.full_name ?? "İsimsiz"}</p>
                      <p className="truncate text-xs text-ink-soft">
                        {p.user_type === "both" ? "Yazılımcı & Fikir Sahibi" : p.user_type === "founder" ? "Fikir Sahibi" : "Yazılımcı"}
                      </p>
                    </div>
                  </a>
                ))}
              </div>
            </div>
          )}

          {popularSkills.length > 0 && (
            <div className={CARD}>
              <h2 className={SECTION_LABEL}>Platformda Popüler Beceriler</h2>
              <div className="mt-3 flex flex-wrap gap-1.5">
                {popularSkills.map((skill) => (
                  <span
                    key={skill}
                    className="rounded-full bg-periwinkle/20 px-2.5 py-1 font-mono text-[11px] text-ink"
                  >
                    #{skill}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
