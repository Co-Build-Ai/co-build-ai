import { redirect } from "next/navigation";
import { createClient } from "@/utils/supabase/server";
import Avatar from "@/app/components/avatar";
import { canActAsDeveloper, canActAsFounder } from "@/app/lib/roles";

export default async function Mesajlar() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/giris");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("user_type")
    .eq("id", user.id)
    .single();

  // viewerRole: bu teklifte kullanıcının kendisi hangi taraf (dual hesaplarda
  // her teklif kendi bağlamına göre developer ya da founder olabilir)
  let offers: { id: string; project_id: string; developer_id: string; viewerRole: "developer" | "founder" }[] = [];

  if (canActAsDeveloper(profile?.user_type)) {
    const { data } = await supabase
      .from("offers")
      .select("id, project_id, developer_id")
      .eq("developer_id", user.id);
    offers = offers.concat((data ?? []).map((o) => ({ ...o, viewerRole: "developer" as const })));
  }

  if (canActAsFounder(profile?.user_type)) {
    const { data: myProjects } = await supabase
      .from("projects")
      .select("id")
      .eq("founder_id", user.id);
    const projectIds = (myProjects ?? []).map((p) => p.id);

    if (projectIds.length > 0) {
      const { data } = await supabase
        .from("offers")
        .select("id, project_id, developer_id")
        .in("project_id", projectIds);
      offers = offers.concat((data ?? []).map((o) => ({ ...o, viewerRole: "founder" as const })));
    }
  }

  if (offers.length === 0) {
    return (
      <div>
        <h1 className="text-2xl font-extrabold tracking-tight text-ink">Mesajlar</h1>
        <div className="mt-6 rounded-xl border border-dashed border-ink/15 bg-white/60 p-10 text-center">
          <p className="text-2xl">💬</p>
          <p className="mt-2 text-sm text-ink-soft">
            Henüz bir teklif ilişkin yok — bir teklif verildiğinde/alındığında konuşmalar burada görünecek.
          </p>
        </div>
      </div>
    );
  }

  const projectIds = [...new Set(offers.map((o) => o.project_id))];
  const { data: projects } = await supabase
    .from("projects")
    .select("id, title, founder_id")
    .in("id", projectIds);

  const otherPartyIds = [
    ...new Set(
      offers.map((o) =>
        o.viewerRole === "developer"
          ? projects?.find((p) => p.id === o.project_id)?.founder_id
          : o.developer_id
      )
    ),
  ].filter((id): id is string => !!id);

  const { data: otherProfiles } = await supabase
    .from("profiles")
    .select("id, full_name")
    .in("id", otherPartyIds);

  const offerIds = offers.map((o) => o.id);
  const { data: allMessages } = await supabase
    .from("messages")
    .select("offer_id, content, sender_id, created_at, read_at")
    .in("offer_id", offerIds)
    .order("created_at", { ascending: false });

  const conversations = offers
    .map((o) => {
      const project = projects?.find((p) => p.id === o.project_id);
      const otherId = o.viewerRole === "developer" ? project?.founder_id : o.developer_id;
      const otherProfile = otherProfiles?.find((p) => p.id === otherId);
      const offerMessages = (allMessages ?? []).filter((m) => m.offer_id === o.id);
      const last = offerMessages[0] ?? null;
      const unread = offerMessages.filter((m) => m.sender_id !== user.id && !m.read_at).length;

      return {
        offerId: o.id,
        projectId: o.project_id,
        projectTitle: project?.title ?? "Bilinmeyen Proje",
        otherName: otherProfile?.full_name ?? "İsimsiz",
        otherRole: (o.viewerRole === "developer" ? "founder" : "developer") as "founder" | "developer",
        lastMessage: last?.content ?? null,
        lastAt: last?.created_at ?? null,
        unread,
      };
    })
    .sort((a, b) => {
      if (!a.lastAt && !b.lastAt) return 0;
      if (!a.lastAt) return 1;
      if (!b.lastAt) return -1;
      return new Date(b.lastAt).getTime() - new Date(a.lastAt).getTime();
    });

  return (
    <div>
      <h1 className="text-2xl font-extrabold tracking-tight text-ink">Mesajlar</h1>
      <p className="mt-1 text-sm text-ink-soft">
        Teklif verdiğin/aldığın projelerdeki tüm konuşmaların tek yerde.
      </p>

      <div className="mt-6 flex flex-col gap-3">
        {conversations.map((c) => (
          <a
            key={c.offerId}
            href={`/proje/${c.projectId}#chat-${c.offerId}`}
            className="flex items-center gap-3 rounded-lg bg-white shadow-[inset_0_1px_0_rgba(255,255,255,0.9),inset_0_-1px_0_rgba(17,24,39,0.05),0_2px_8px_rgba(17,24,39,0.05),0_16px_40px_rgba(17,24,39,0.10)] p-6 transition-all [transform-style:preserve-3d] hover:[transform:perspective(900px)_rotateX(2deg)_translateY(-4px)] hover:shadow-[inset_0_1px_0_rgba(255,255,255,0.9),inset_0_-1px_0_rgba(17,24,39,0.05),0_4px_14px_rgba(17,24,39,0.08),0_28px_60px_rgba(17,24,39,0.16)]"
          >
            <Avatar name={c.otherName} role={c.otherRole} />
            <div className="min-w-0 flex-1">
              <div className="flex items-center justify-between gap-2">
                <p className={`truncate text-sm text-ink ${c.unread > 0 ? "font-bold" : "font-semibold"}`}>
                  {c.otherName}
                </p>
                {c.lastAt && (
                  <span className="shrink-0 text-xs text-ink-soft">
                    {new Date(c.lastAt).toLocaleDateString("tr-TR")}
                  </span>
                )}
              </div>
              <p className="truncate text-xs text-ink-soft">{c.projectTitle}</p>
              {c.lastMessage && (
                <p className="mt-0.5 truncate text-xs text-ink-soft">{c.lastMessage}</p>
              )}
            </div>
            {c.unread > 0 && (
              <span className="shrink-0 rounded-full bg-coral px-2 py-0.5 text-[10px] font-bold text-white shadow-[0_2px_6px_rgba(239,68,104,0.5)]">
                {c.unread}
              </span>
            )}
          </a>
        ))}
      </div>
    </div>
  );
}
