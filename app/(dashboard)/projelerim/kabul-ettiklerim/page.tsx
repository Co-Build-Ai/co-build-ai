import { redirect } from "next/navigation";
import { createClient } from "@/utils/supabase/server";
import { getActiveRole } from "@/app/lib/roles";

export default async function KabulEttiklerim() {
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

  const { data: myProjects } = await supabase
    .from("projects")
    .select("id, title")
    .eq("founder_id", user.id);

  const projectIds = (myProjects ?? []).map((p) => p.id);

  let offers: {
    id: string;
    project_id: string;
    developer_id: string;
    completed_at: string | null;
    created_at: string;
  }[] = [];

  if (projectIds.length > 0) {
    const { data } = await supabase
      .from("offers")
      .select("id, project_id, developer_id, completed_at, created_at")
      .in("project_id", projectIds)
      .eq("status", "accepted")
      .order("created_at", { ascending: false });
    offers = data ?? [];
  }

  const developerIds = [...new Set(offers.map((o) => o.developer_id))];
  let developers: { id: string; full_name: string | null }[] = [];
  if (developerIds.length > 0) {
    const { data } = await supabase.from("profiles").select("id, full_name").in("id", developerIds);
    developers = data ?? [];
  }

  const items = offers.map((o) => ({
    ...o,
    projectTitle: myProjects?.find((p) => p.id === o.project_id)?.title ?? "Bilinmeyen Proje",
    developerName: developers.find((d) => d.id === o.developer_id)?.full_name ?? "İsimsiz Yazılımcı",
  }));

  return (
    <div>
      <h1 className="text-2xl font-extrabold tracking-tight text-ink">Kabul Ettiğim Teklifler</h1>
      <p className="mt-1 text-sm text-ink-soft">Bugüne kadar kabul ettiğin tüm teklifler.</p>

      {items.length === 0 ? (
        <div className="mt-6 rounded-xl border border-dashed border-ink/15 bg-white/60 p-10 text-center">
          <p className="text-2xl">🤝</p>
          <p className="mt-2 text-sm text-ink-soft">Henüz kabul ettiğin bir teklif yok.</p>
        </div>
      ) : (
        <div className="mt-6 flex flex-col gap-3">
          {items.map((item) => (
            <a
              key={item.id}
              href={`/proje/${item.project_id}`}
              className="flex items-center justify-between gap-3 rounded-lg bg-white shadow-[inset_0_1px_0_rgba(255,255,255,0.9),inset_0_-1px_0_rgba(17,24,39,0.05),0_2px_8px_rgba(17,24,39,0.05),0_16px_40px_rgba(17,24,39,0.10)] p-6 transition-all [transform-style:preserve-3d] hover:[transform:perspective(900px)_rotateX(2deg)_translateY(-4px)] hover:shadow-[inset_0_1px_0_rgba(255,255,255,0.9),inset_0_-1px_0_rgba(17,24,39,0.05),0_4px_14px_rgba(17,24,39,0.08),0_28px_60px_rgba(17,24,39,0.16)]"
            >
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-bold text-ink">{item.developerName}</p>
                <p className="truncate text-xs text-ink-soft">{item.projectTitle}</p>
              </div>
              <span
                className={`shrink-0 rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                  item.completed_at
                    ? "bg-periwinkle-dark text-white"
                    : "bg-petal text-coral-dark"
                }`}
              >
                {item.completed_at ? "Tamamlandı" : "Devam Ediyor"}
              </span>
            </a>
          ))}
        </div>
      )}
    </div>
  );
}
