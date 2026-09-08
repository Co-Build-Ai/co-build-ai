import { redirect } from "next/navigation";
import { createClient } from "@/utils/supabase/server";
import { getActiveRole } from "@/app/lib/roles";

const STATUS_LABELS: Record<string, string> = {
  pending: "Bekliyor",
  accepted: "Kabul Edildi",
  rejected: "Reddedildi",
};

export default async function Tekliflerim() {
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

  // Sadece şu an developer modunda olanlar bu sayfayı görebilir
  if (getActiveRole(profile?.user_type, profile?.active_role) !== "developer") {
    redirect("/panel");
  }

  const { data: offers } = await supabase
    .from("offers")
    .select("id, project_id, status, created_at")
    .eq("developer_id", user.id)
    .order("created_at", { ascending: false });

  const projectIds = [...new Set((offers ?? []).map((o) => o.project_id))];

  let projects: { id: string; title: string }[] = [];
  if (projectIds.length > 0) {
    const { data } = await supabase.from("projects").select("id, title").in("id", projectIds);
    projects = data ?? [];
  }

  const items = (offers ?? []).map((o) => ({
    ...o,
    projectTitle: projects.find((p) => p.id === o.project_id)?.title ?? "Bilinmeyen Proje",
  }));

  return (
    <div>
      <h1 className="text-2xl font-extrabold tracking-tight text-ink">Tekliflerim</h1>
      <p className="mt-1 text-sm text-ink-soft">Bugüne kadar verdiğin tüm teklifler.</p>

      {items.length === 0 ? (
        <div className="mt-6 rounded-xl border border-dashed border-ink/15 bg-white/60 p-10 text-center">
          <p className="text-2xl">📨</p>
          <p className="mt-2 text-sm text-ink-soft">Henüz bir teklif vermedin.</p>
        </div>
      ) : (
        <div className="mt-6 flex flex-col gap-3">
          {items.map((item) => (
            <a
              key={item.id}
              href={`/proje/${item.project_id}`}
              className="flex items-center justify-between gap-3 rounded-lg bg-white shadow-[inset_0_1px_0_rgba(255,255,255,0.9),inset_0_-1px_0_rgba(17,24,39,0.05),0_2px_8px_rgba(17,24,39,0.05),0_16px_40px_rgba(17,24,39,0.10)] p-6 transition-all [transform-style:preserve-3d] hover:[transform:perspective(900px)_rotateX(2deg)_translateY(-4px)] hover:shadow-[inset_0_1px_0_rgba(255,255,255,0.9),inset_0_-1px_0_rgba(17,24,39,0.05),0_4px_14px_rgba(17,24,39,0.08),0_28px_60px_rgba(17,24,39,0.16)]"
            >
              <p className="min-w-0 flex-1 truncate text-sm font-medium text-ink">{item.projectTitle}</p>
              <span
                className={`shrink-0 rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                  item.status === "accepted"
                    ? "bg-periwinkle-dark text-white"
                    : item.status === "rejected"
                    ? "bg-coral/10 text-coral-dark"
                    : "bg-petal text-coral-dark"
                }`}
              >
                {STATUS_LABELS[item.status]}
              </span>
            </a>
          ))}
        </div>
      )}
    </div>
  );
}
