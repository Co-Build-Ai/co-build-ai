import { redirect } from "next/navigation";
import { createClient } from "@/utils/supabase/server";
import EditProfile from "./edit-profile";
import PortfolioSection from "./portfolio-section";
import FounderProjects from "./founder-projects";
import Avatar from "@/app/components/avatar";
import StatCircle from "@/app/components/stat-circle";
import ProfileIdentity from "./profile-identity";
import { getActiveRole } from "@/app/lib/roles";
import BadgesSection, { type Badge } from "@/app/components/badges-section";

const STATUS_LABELS: Record<string, string> = {
  pending: "Bekliyor",
  accepted: "Kabul Edildi",
  rejected: "Reddedildi",
};

export default async function Profil() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/giris");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  const activeRole = getActiveRole(profile?.user_type, profile?.active_role);

  let myProjects: any[] = [];
  let recentOffers: any[] = [];
  let totalOfferCount = 0;
  let badges: Badge[] = [];

  if (activeRole === "founder") {
    const { data } = await supabase
      .from("projects")
      .select("*")
      .eq("founder_id", user.id)
      .order("created_at", { ascending: false });
    const projectsRaw = data ?? [];
    const projectIds = projectsRaw.map((p) => p.id);

    const offersByProject: Record<string, { total: number; hasAccepted: boolean }> = {};

    if (projectIds.length > 0) {
      const { data: offersData } = await supabase
        .from("offers")
        .select("id, project_id, developer_id, status, created_at")
        .in("project_id", projectIds)
        .order("created_at", { ascending: false });

      totalOfferCount = offersData?.length ?? 0;

      for (const o of offersData ?? []) {
        if (!offersByProject[o.project_id]) {
          offersByProject[o.project_id] = { total: 0, hasAccepted: false };
        }
        offersByProject[o.project_id].total += 1;
        if (o.status === "accepted") offersByProject[o.project_id].hasAccepted = true;
      }

      const recentRaw = (offersData ?? []).slice(0, 5);
      const developerIds = [...new Set(recentRaw.map((o) => o.developer_id))];
      const { data: devProfiles } = await supabase
        .from("profiles")
        .select("id, full_name")
        .in("id", developerIds);

      recentOffers = recentRaw.map((o) => ({
        ...o,
        developerName: devProfiles?.find((d) => d.id === o.developer_id)?.full_name ?? null,
        projectTitle: projectsRaw.find((p) => p.id === o.project_id)?.title ?? null,
      }));
    }

    myProjects = projectsRaw.map((p) => {
      const stats = offersByProject[p.id] ?? { total: 0, hasAccepted: false };
      let progress = p.generated_prd ? 25 : 10;
      if (p.status === "published") progress = 50;
      if (stats.total > 0) progress = 75;
      if (stats.hasAccepted) progress = 100;
      return { ...p, offerCount: stats.total, progress };
    });

    const publishedCount = projectsRaw.filter((p) => p.status === "published").length;
    badges = [
      { id: "first-idea", label: "İlk Fikrini Girdi", icon: "Lightbulb", earned: projectsRaw.length >= 1 },
      { id: "first-publish", label: "İlk Yayın", icon: "Rocket", earned: publishedCount >= 1 },
      { id: "first-offer", label: "İlk Teklif Aldı", icon: "Inbox", earned: totalOfferCount >= 1 },
    ];
  }

  let portfolioItems: any[] = [];
  let myOffers: any[] = [];
  if (activeRole === "developer") {
    const { data } = await supabase
      .from("portfolio_items")
      .select("*")
      .eq("developer_id", user.id)
      .order("created_at", { ascending: false });
    portfolioItems = data ?? [];

    const { data: offersData } = await supabase
      .from("offers")
      .select("id, project_id, status, created_at")
      .eq("developer_id", user.id)
      .order("created_at", { ascending: false });

    const rawOffers = offersData ?? [];
    const offerProjectIds = [...new Set(rawOffers.map((o) => o.project_id))];
    const { data: offerProjects } =
      offerProjectIds.length > 0
        ? await supabase.from("projects").select("id, title").in("id", offerProjectIds)
        : { data: [] };

    myOffers = rawOffers.map((o) => ({
      ...o,
      projectTitle: offerProjects?.find((p) => p.id === o.project_id)?.title ?? null,
    }));

    const acceptedOffers = rawOffers.filter((o) => o.status === "accepted");
    badges = [
      { id: "first-offer-sent", label: "İlk Teklifini Verdi", icon: "Send", earned: rawOffers.length >= 1 },
      { id: "first-accepted", label: "İlk Kabul", icon: "CheckCircle", earned: acceptedOffers.length >= 1 },
      { id: "portfolio-started", label: "Portfolyo Kurdu", icon: "Briefcase", earned: portfolioItems.length >= 1 },
    ];
  }

  return (
    <div>
      <div className="mx-auto max-w-3xl">
        <div className="flex flex-col items-center text-center">
          <ProfileIdentity
            userId={user.id}
            role={activeRole === "founder" ? "founder" : "developer"}
            initialFullName={profile?.full_name ?? null}
            initialAvatarUrl={profile?.avatar_url ?? null}
          />
          <p className="mt-2 text-sm text-ink-soft">
            {activeRole === "founder" ? "Fikir Sahibi" : "Yazılımcı"}
          </p>

          <div className="mt-6 flex items-center gap-4">
            {activeRole === "founder" ? (
              <>
                <StatCircle
                  value={myProjects.filter((p) => p.status === "published").length}
                  label="Yayında"
                  tone="lime"
                  size={110}
                />
                <StatCircle value={totalOfferCount} label="Toplam Teklif" tone="pink" size={110} />
              </>
            ) : (
              <>
                <StatCircle value={portfolioItems.length} label="Portfolyo Öğesi" tone="lime" size={110} />
                <StatCircle value={myOffers.length} label="Gönderdiğim Teklif" tone="pink" size={110} />
              </>
            )}
          </div>

          {activeRole === "founder" && (
            <a href="/fikir-ekle" className="mt-6 inline-block rounded-full bg-coral px-8 py-3.5 text-base font-semibold text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.35),0_4px_0_0_var(--color-coral-dark),0_10px_20px_rgba(239,68,104,0.35)] transition-all hover:brightness-105 active:translate-y-1 active:shadow-[inset_0_1px_0_rgba(255,255,255,0.35),0_0px_0_0_var(--color-coral-dark),0_2px_6px_rgba(239,68,104,0.30)]">
              + Yeni Fikir Ekle
            </a>
          )}
        </div>

        <BadgesSection badges={badges} />

        {activeRole === "founder" && (
          <>
            <FounderProjects projects={myProjects} />

            {recentOffers.length > 0 && (
              <div className="mt-10">
                <h2 className="font-mono text-xs font-semibold uppercase tracking-wide text-ink-soft">
                  Son Teklifler
                </h2>
                <div className="mt-3 flex flex-col gap-2">
                  {recentOffers.map((offer) => (
                    <a
                      key={offer.id}
                      href={`/proje/${offer.project_id}`}
                      className="flex items-center gap-3 rounded-lg border border-stone-200 bg-white shadow-[inset_0_1px_0_rgba(255,255,255,0.8),0_4px_12px_rgba(17,24,39,0.12)] p-4 transition-all [transform-style:preserve-3d] hover:[transform:perspective(900px)_rotateX(2deg)_translateY(-4px)] hover:shadow-[inset_0_1px_0_rgba(255,255,255,0.8),0_8px_20px_rgba(17,24,39,0.16)]"
                    >
                      <Avatar name={offer.developerName} role="developer" size="sm" />
                      <p className="min-w-0 flex-1 truncate text-sm text-ink">
                        <strong>{offer.developerName ?? "İsimsiz Yazılımcı"}</strong>
                        <span className="text-ink-soft"> — {offer.projectTitle}</span>
                      </p>
                      <span
                        className={`shrink-0 rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                          offer.status === "accepted"
                            ? "bg-periwinkle-dark text-white"
                            : offer.status === "rejected"
                            ? "bg-coral/10 text-coral-dark"
                            : "bg-petal text-coral-dark"
                        }`}
                      >
                        {STATUS_LABELS[offer.status]}
                      </span>
                    </a>
                  ))}
                </div>
              </div>
            )}
          </>
        )}

        {activeRole === "developer" && (
          <EditProfile
            userId={user.id}
            fullName={profile?.full_name ?? null}
            initialBio={profile?.bio ?? null}
            initialSkills={profile?.skills ?? null}
            initialCvUrl={profile?.cv_url ?? null}
          />
        )}

        {activeRole === "developer" && (
          <PortfolioSection userId={user.id} items={portfolioItems} />
        )}

        {activeRole === "developer" && myOffers.length > 0 && (
          <div className="mt-10">
            <h2 className="font-mono text-xs font-semibold uppercase tracking-wide text-ink-soft">
              Son Tekliflerim
            </h2>
            <div className="mt-3 flex flex-col gap-2">
              {myOffers.slice(0, 5).map((offer) => (
                <a
                  key={offer.id}
                  href={`/proje/${offer.project_id}`}
                  className="flex items-center justify-between gap-3 rounded-lg border border-stone-200 bg-white shadow-[inset_0_1px_0_rgba(255,255,255,0.8),0_4px_12px_rgba(17,24,39,0.12)] p-4 transition-all [transform-style:preserve-3d] hover:[transform:perspective(900px)_rotateX(2deg)_translateY(-4px)] hover:shadow-[inset_0_1px_0_rgba(255,255,255,0.8),0_8px_20px_rgba(17,24,39,0.16)]"
                >
                  <p className="min-w-0 flex-1 truncate text-sm text-ink">
                    {offer.projectTitle ?? "Bilinmeyen Proje"}
                  </p>
                  <span
                    className={`shrink-0 rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                      offer.status === "accepted"
                        ? "bg-periwinkle-dark text-white"
                        : offer.status === "rejected"
                        ? "bg-coral/10 text-coral-dark"
                        : "bg-petal text-coral-dark"
                    }`}
                  >
                    {STATUS_LABELS[offer.status]}
                  </span>
                </a>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}