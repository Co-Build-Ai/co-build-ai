import { redirect } from "next/navigation";
import { createClient } from "@/utils/supabase/server";
import { StatPill } from "@/app/components/stat-circle";
import DeveloperProjects from "./developer-projects";
import TrendingWidget from "@/app/components/trending-widget";
import QuickMatch from "./quick-match";
import DirectSearch from "./direct-search";
import FounderDevelopers from "./founder-developers";
import CancelProcessingProject from "./cancel-processing-project";
import DeveloperFeed from "@/app/components/developer-feed";
import ProjectFeed from "@/app/components/project-feed";
import { getActiveRole } from "@/app/lib/roles";

function getGreeting() {
  const hour = new Date().getHours();
  if (hour < 6) return "İyi geceler";
  if (hour < 12) return "Günaydın";
  if (hour < 18) return "İyi günler";
  return "İyi akşamlar";
}

export default async function Panel() {
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

  let projects: any[] = [];
  let developers: any[] = [];

  if (activeRole === "developer") {
    const { data } = await supabase
      .from("projects")
      .select("*")
      .eq("status", "published")
      .neq("founder_id", user.id)
      .order("created_at", { ascending: false });

    if (data && data.length > 0) {
      const founderIds = [...new Set(data.map((p) => p.founder_id))];
      const { data: founderProfiles } = await supabase
        .from("profiles")
        .select("id, full_name")
        .in("id", founderIds);

      const mySkills = new Set((profile?.skills ?? []).map((s: string) => s.toLowerCase()));

      projects = data.map((p) => {
        const required: string[] = p.required_skills ?? [];
        const matchScore =
          required.length > 0 && mySkills.size > 0
            ? Math.round(
                (required.filter((s) => mySkills.has(s.toLowerCase())).length / required.length) * 100
              )
            : 0;

        return {
          ...p,
          founderName: founderProfiles?.find((f) => f.id === p.founder_id)?.full_name ?? null,
          matchScore,
        };
      });
    }
  } else if (activeRole === "founder") {
    const { data } = await supabase
      .from("profiles")
      .select("*")
      .in("user_type", ["developer", "both"])
      .neq("id", user.id)
      .order("created_at", { ascending: false });
    const devsRaw = data ?? [];

    if (devsRaw.length > 0) {
      const { data: ratingsData } = await supabase
        .from("ratings")
        .select("rated_user_id, score")
        .in(
          "rated_user_id",
          devsRaw.map((d) => d.id)
        );

      const ratingsByDev: Record<string, number[]> = {};
      for (const r of ratingsData ?? []) {
        (ratingsByDev[r.rated_user_id] ??= []).push(r.score);
      }

      developers = devsRaw.map((d) => {
        const scores = ratingsByDev[d.id] ?? [];
        return {
          ...d,
          ratingAvg: scores.length > 0 ? scores.reduce((a, b) => a + b, 0) / scores.length : null,
          ratingCount: scores.length,
        };
      });
    } else {
      developers = [];
    }
  }

  let starredIds: string[] = [];
  if (activeRole === "founder") {
    const { data: starredData } = await supabase
      .from("starred_developers")
      .select("developer_id")
      .eq("founder_id", user.id);
    starredIds = (starredData ?? []).map((s) => s.developer_id);
  }

  let processingProjects: any[] = [];
  if (activeRole === "founder") {
    const { data } = await supabase
      .from("projects")
      .select("id, title")
      .eq("founder_id", user.id)
      .is("generated_prd", null)
      .order("created_at", { ascending: false });
    processingProjects = data ?? [];
  }

  // Trendler: platform genelinde öne çıkan projeler ve en aktif yazılımcılar
  const { data: publishedForTrends } = await supabase
    .from("projects")
    .select("id, title")
    .eq("status", "published");

  const publishedIds = (publishedForTrends ?? []).map((p) => p.id);

  let trendingProjects: { id: string; title: string; offerCount: number }[] = [];
  let trendingDevelopers: { id: string; full_name: string | null; acceptedCount: number }[] = [];

  if (publishedIds.length > 0) {
    const { data: allOffers } = await supabase
      .from("offers")
      .select("project_id, developer_id, status")
      .in("project_id", publishedIds);

    const offerCountByProject: Record<string, number> = {};
    const acceptedCountByDeveloper: Record<string, number> = {};

    for (const o of allOffers ?? []) {
      offerCountByProject[o.project_id] = (offerCountByProject[o.project_id] ?? 0) + 1;
      if (o.status === "accepted") {
        acceptedCountByDeveloper[o.developer_id] = (acceptedCountByDeveloper[o.developer_id] ?? 0) + 1;
      }
    }

    trendingProjects = (publishedForTrends ?? [])
      .map((p) => ({ ...p, offerCount: offerCountByProject[p.id] ?? 0 }))
      .filter((p) => p.offerCount > 0)
      .sort((a, b) => b.offerCount - a.offerCount)
      .slice(0, 3);

    const topDevIds = Object.entries(acceptedCountByDeveloper)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([id]) => id);

    if (topDevIds.length > 0) {
      const { data: topDevProfiles } = await supabase
        .from("profiles")
        .select("id, full_name")
        .in("id", topDevIds);

      trendingDevelopers = topDevIds.map((id) => ({
        id,
        full_name: topDevProfiles?.find((d) => d.id === id)?.full_name ?? null,
        acceptedCount: acceptedCountByDeveloper[id],
      }));
    }
  }

  const profileIncomplete =
    activeRole === "developer" &&
    (!profile?.bio || !profile?.skills || profile.skills.length === 0 || !profile?.cv_url);

  return (
    <div>
      {profileIncomplete && (
        <div className="mb-8 flex items-center gap-3 rounded-lg border border-periwinkle-dark/30 bg-periwinkle/10 px-4 py-3 text-sm text-ink">
          <span className="text-lg">✨</span>
          <span className="flex-1">
            Profilini tamamla — biyografi, beceri ve CV eklemek, eşleştirme motorunun seni doğru projelerle
            eşleştirmesini kolaylaştırır.
          </span>
          <a href="/profil" className="shrink-0 font-semibold text-coral-dark hover:underline">
            Profili Tamamla →
          </a>
        </div>
      )}

      {processingProjects.length > 0 && (
        <div className="mb-8 flex flex-col gap-2">
          {processingProjects.map((p) => (
            <a key={p.id} href={`/proje/${p.id}`} className="flex items-center gap-3 rounded-lg border border-coral/30 bg-petal/30 px-4 py-3 text-sm text-ink transition-colors hover:bg-petal/50">
              <span className="h-3 w-3 shrink-0 animate-spin rounded-full border-2 border-coral border-t-transparent" />
              <span className="flex-1">
                <strong>{p.title}</strong> için PRD hazırlanıyor, görmek için tıkla →
              </span>
              <CancelProcessingProject projectId={p.id} />
            </a>
          ))}
        </div>
      )}

      <div className="mx-auto flex max-w-6xl items-start gap-8">
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-extrabold tracking-tight text-ink">
              {getGreeting()}
              {profile?.full_name ? (
                <>
                  ,{" "}
                  <span className="bg-gradient-to-r from-coral to-periwinkle-dark bg-clip-text text-transparent">
                    {profile.full_name.split(" ")[0]}
                  </span>
                </>
              ) : (
                ""
              )}
              !
            </h1>
            <p className="mt-1 text-sm text-ink-soft">
              {activeRole === "founder"
                ? "Projene uygun yazılımcıları keşfet."
                : "Sana uygun yayınlanmış projeleri keşfet."}
            </p>
          </div>

          {activeRole === "developer" ? (
            <StatPill value={projects.length} label="Yayınlanmış Proje" tone="lime" />
          ) : (
            <StatPill value={developers.length} label="Kayıtlı Yazılımcı" tone="lime" />
          )}
        </div>

        {activeRole === "developer" && <DeveloperProjects projects={projects} />}

        {activeRole === "founder" && (
          <div className="mt-8">
            <div className="grid gap-4 sm:grid-cols-2">
              <QuickMatch userId={user.id} developers={developers} starredIds={starredIds} />
              <DirectSearch founderId={user.id} developers={developers} starredIds={starredIds} />
            </div>
            <FounderDevelopers developers={developers} />
          </div>
        )}
      </div>

      <div className="hidden w-72 shrink-0 flex-col gap-6 lg:flex">
        <TrendingWidget trendingProjects={trendingProjects} trendingDevelopers={trendingDevelopers} />
        {activeRole === "founder" ? (
          <DeveloperFeed developers={developers} />
        ) : (
          <ProjectFeed projects={projects} />
        )}
      </div>
      </div>
    </div>
  );
}