import { redirect } from "next/navigation";
import { createClient } from "@/utils/supabase/server";
import StarredList from "./starred-list";
import { getActiveRole } from "@/app/lib/roles";

export default async function Yildizlarim() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/giris");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("user_type, active_role")
    .eq("id", user.id)
    .single();

  if (getActiveRole(profile?.user_type, profile?.active_role) !== "founder") {
    redirect("/panel");
  }

  const { data: starred } = await supabase
    .from("starred_developers")
    .select("developer_id, created_at")
    .eq("founder_id", user.id)
    .order("created_at", { ascending: false });

  const developerIds = (starred ?? []).map((s) => s.developer_id);

  let developers: {
    id: string;
    full_name: string | null;
    bio: string | null;
    skills: string[] | null;
    availability: string | null;
    ratingAvg: number | null;
    ratingCount: number;
  }[] = [];

  if (developerIds.length > 0) {
    const { data: profiles } = await supabase
      .from("profiles")
      .select("id, full_name, bio, skills, availability")
      .in("id", developerIds);

    const { data: ratingsData } = await supabase
      .from("ratings")
      .select("rated_user_id, score")
      .in("rated_user_id", developerIds);

    const ratingsByDev: Record<string, number[]> = {};
    for (const r of ratingsData ?? []) {
      (ratingsByDev[r.rated_user_id] ??= []).push(r.score);
    }

    const orderedIds = developerIds; // en son yıldızlanan en üstte
    developers = orderedIds
      .map((id) => profiles?.find((p) => p.id === id))
      .filter((p): p is NonNullable<typeof p> => !!p)
      .map((p) => {
        const scores = ratingsByDev[p.id] ?? [];
        return {
          ...p,
          ratingAvg: scores.length > 0 ? scores.reduce((a, b) => a + b, 0) / scores.length : null,
          ratingCount: scores.length,
        };
      });
  }

  return (
    <div>
      <h1 className="text-2xl font-extrabold tracking-tight text-ink">Yıldızlılarım</h1>
      <p className="mt-1 text-sm text-ink-soft">Beğenip işaretlediğin yazılımcılar.</p>
      <StarredList founderId={user.id} initialDevelopers={developers} />
    </div>
  );
}
