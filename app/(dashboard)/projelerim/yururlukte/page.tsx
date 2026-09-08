import { redirect } from "next/navigation";
import { createClient } from "@/utils/supabase/server";
import Avatar from "@/app/components/avatar";
import { getActiveRole } from "@/app/lib/roles";
import GithubRepoBadge from "@/app/components/github-repo-badge";

export default async function YururluktekiProjelerim() {
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

  // Sadece şu an founder modunda olanlar bu sayfayı görebilir
  if (getActiveRole(profile?.user_type, profile?.active_role) !== "founder") {
    redirect("/panel");
  }

  // Sadece hala yayında olan projeler "yürürlükte" sayılır — bir proje
  // taslağa geri alındığında (kaldırma akışı) burada görünmemeli.
  const { data: myProjects } = await supabase
    .from("projects")
    .select("id, title")
    .eq("founder_id", user.id)
    .eq("status", "published");

  const projectIds = (myProjects ?? []).map((p) => p.id);

  let offers: {
    id: string;
    project_id: string;
    developer_id: string;
    payment_type: "fixed" | "equity" | null;
    proposed_amount: number | null;
    github_repo_url: string | null;
  }[] = [];

  if (projectIds.length > 0) {
    const { data } = await supabase
      .from("offers")
      .select("id, project_id, developer_id, payment_type, proposed_amount, github_repo_url")
      .in("project_id", projectIds)
      .eq("status", "accepted")
      .is("completed_at", null);
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
    project: myProjects?.find((p) => p.id === o.project_id),
    developer: developers.find((d) => d.id === o.developer_id),
  }));

  return (
    <div>
      <h1 className="text-2xl font-extrabold tracking-tight text-ink">Yürürlükteki Projelerim</h1>
      <p className="mt-1 text-sm text-ink-soft">
        Bir teklifi kabul ettiğin, şu an aktif olarak devam eden projelerin.
      </p>

      {items.length === 0 ? (
        <div className="mt-6 rounded-xl border border-dashed border-ink/15 bg-white/60 p-10 text-center">
          <p className="text-2xl">🛠️</p>
          <p className="mt-2 text-sm text-ink-soft">
            Şu an yürürlükte bir proje yok — bir teklif kabul ettiğinde burada görünecek.
          </p>
        </div>
      ) : (
        <div className="mt-6 flex flex-col gap-4">
          {items.map((item) => (
            <div
              key={item.id}
              className="rounded-xl border border-stone-200 bg-white shadow-[inset_0_1px_0_rgba(255,255,255,0.8),0_4px_12px_rgba(17,24,39,0.12)] p-6 transition-all [transform-style:preserve-3d] hover:[transform:perspective(900px)_rotateX(2deg)_translateY(-4px)] hover:shadow-[inset_0_1px_0_rgba(255,255,255,0.8),0_8px_20px_rgba(17,24,39,0.16)]"
            >
              <a
                href={item.project ? `/proje/${item.project.id}` : "#"}
                className="block text-lg font-bold text-ink hover:text-coral-dark"
              >
                {item.project?.title ?? "Bilinmeyen Proje"}
              </a>
              <div className="mt-2 flex items-center gap-2">
                <Avatar name={item.developer?.full_name ?? null} role="developer" size="sm" />
                <span className="text-xs text-ink-soft">
                  {item.developer?.full_name ?? "İsimsiz Yazılımcı"}
                </span>
              </div>
              {item.payment_type && (
                <p className="mt-2 text-sm text-ink-soft">
                  <span className="font-semibold text-ink">Anlaşma:</span>{" "}
                  {item.payment_type === "fixed" ? "Sabit Ücret" : "Ortaklık"}
                  {item.proposed_amount
                    ? ` — ${item.proposed_amount}${item.payment_type === "fixed" ? "₺" : "%"}`
                    : ""}
                </p>
              )}
              {item.github_repo_url && <GithubRepoBadge repoUrl={item.github_repo_url} />}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
