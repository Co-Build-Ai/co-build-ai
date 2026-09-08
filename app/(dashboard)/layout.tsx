import { redirect } from "next/navigation";
import { createClient } from "@/utils/supabase/server";
import Sidebar from "@/app/components/sidebar";
import Topbar from "@/app/components/topbar";
import { getActiveRole } from "@/app/lib/roles";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/giris");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("user_type, active_role, full_name, notifications_enabled, availability")
    .eq("id", user.id)
    .single();

  const rawUserType = profile?.user_type ?? null;
  const userType = getActiveRole(rawUserType, profile?.active_role);

  let miniStats: { label: string; value: string | number; href?: string }[] = [];

  const { data: myRatings } = await supabase.from("ratings").select("score").eq("rated_user_id", user.id);
  const ratingScores = myRatings ?? [];
  const ratingCount = ratingScores.length;
  const ratingAvg =
    ratingCount > 0 ? ratingScores.reduce((sum, r) => sum + r.score, 0) / ratingCount : null;

  if (userType === "founder") {
    const { data: projects } = await supabase
      .from("projects")
      .select("id, status")
      .eq("founder_id", user.id);

    const projectCount = projects?.length ?? 0;
    const projectIds = (projects ?? []).map((p) => p.id);

    let offersReceived = 0;
    if (projectIds.length > 0) {
      const { count } = await supabase
        .from("offers")
        .select("id", { count: "exact", head: true })
        .in("project_id", projectIds);
      offersReceived = count ?? 0;
    }

    miniStats = [
      { label: "Analiz Edilen Fikirler", value: projectCount, href: "/profil" },
      { label: "Gelen Teklifler", value: offersReceived, href: "/profil" },
    ];
  } else if (userType === "developer") {
    const { data: offers } = await supabase
      .from("offers")
      .select("status, payment_type, proposed_amount")
      .eq("developer_id", user.id);

    const acceptedOffers = offers?.filter((o) => o.status === "accepted") ?? [];
    const equityShare = acceptedOffers
      .filter((o) => o.payment_type === "equity" && o.proposed_amount)
      .reduce((sum, o) => sum + (o.proposed_amount ?? 0), 0);

    miniStats = [
      { label: "Kabul Edilen Teklifler", value: acceptedOffers.length },
      { label: "Kazanılan Tahmini Pay", value: `%${equityShare}` },
    ];
  }

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <Sidebar
        userId={user.id}
        userType={userType}
        isDual={rawUserType === "both"}
        userName={profile?.full_name ?? null}
        miniStats={miniStats}
        ratingAvg={ratingAvg}
        ratingCount={ratingCount}
        availability={profile?.availability ?? null}
      />
      <div className="flex flex-1 flex-col overflow-hidden">
        <Topbar
          userId={user.id}
          userName={profile?.full_name ?? null}
          userType={userType}
          notificationsEnabled={profile?.notifications_enabled ?? true}
        />
        <main className="flex-1 overflow-y-auto px-6 py-8 sm:px-10">{children}</main>
      </div>
    </div>
  );
}
