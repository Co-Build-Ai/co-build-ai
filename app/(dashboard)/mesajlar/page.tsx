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

  // Doğrudan mesajlaşmalar (bir teklife bağlı olmayan, profil/doğrudan arama
  // üzerinden başlatılan konuşmalar)
  const { data: directRaw } = await supabase
    .from("direct_messages")
    .select("id, sender_id, recipient_id, content, created_at, read_at")
    .or(`sender_id.eq.${user.id},recipient_id.eq.${user.id}`)
    .order("created_at", { ascending: false });

  const directOtherIds = [
    ...new Set(
      (directRaw ?? []).map((m) => (m.sender_id === user.id ? m.recipient_id : m.sender_id))
    ),
  ];

  const { data: directProfiles } =
    directOtherIds.length > 0
      ? await supabase.from("profiles").select("id, full_name, user_type, avatar_url").in("id", directOtherIds)
      : { data: [] };

  const directConversations = directOtherIds.map((otherId) => {
    const otherProfile = directProfiles?.find((p) => p.id === otherId);
    const msgs = (directRaw ?? []).filter(
      (m) => m.sender_id === otherId || m.recipient_id === otherId
    );
    const last = msgs[0] ?? null;
    const unread = msgs.filter((m) => m.sender_id === otherId && !m.read_at).length;

    return {
      kind: "direct" as const,
      otherId,
      otherName: otherProfile?.full_name ?? "İsimsiz",
      otherRole: (canActAsDeveloper(otherProfile?.user_type) ? "developer" : "founder") as
        | "founder"
        | "developer",
      otherAvatarUrl: otherProfile?.avatar_url ?? null,
      lastMessage: last?.content ?? null,
      lastAt: last?.created_at ?? null,
      unread,
    };
  });

  if (offers.length === 0 && directConversations.length === 0) {
    return (
      <div>
        <h1 className="text-2xl font-extrabold tracking-tight text-ink">Mesajlar</h1>
        <div className="mt-6 rounded-xl border border-dashed border-ink/15 bg-white/60 p-10 text-center">
          <p className="text-2xl">💬</p>
          <p className="mt-2 text-sm text-ink-soft">
            Henüz bir konuşman yok — bir profilden ya da tekliften mesaj gönderdiğinde burada görünecek.
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
    .select("id, full_name, avatar_url")
    .in("id", otherPartyIds);

  const offerIds = offers.map((o) => o.id);
  const { data: allMessages } = await supabase
    .from("messages")
    .select("offer_id, content, sender_id, created_at, read_at")
    .in("offer_id", offerIds)
    .order("created_at", { ascending: false });

  const offerConversations = offers.map((o) => {
    const project = projects?.find((p) => p.id === o.project_id);
    const otherId = o.viewerRole === "developer" ? project?.founder_id : o.developer_id;
    const otherProfile = otherProfiles?.find((p) => p.id === otherId);
    const offerMessages = (allMessages ?? []).filter((m) => m.offer_id === o.id);
    const last = offerMessages[0] ?? null;
    const unread = offerMessages.filter((m) => m.sender_id !== user.id && !m.read_at).length;

    return {
      kind: "offer" as const,
      offerId: o.id,
      projectId: o.project_id,
      projectTitle: project?.title ?? "Bilinmeyen Proje",
      otherName: otherProfile?.full_name ?? "İsimsiz",
      otherRole: (o.viewerRole === "developer" ? "founder" : "developer") as "founder" | "developer",
      otherAvatarUrl: otherProfile?.avatar_url ?? null,
      lastMessage: last?.content ?? null,
      lastAt: last?.created_at ?? null,
      unread,
    };
  });

  const conversations = [...offerConversations, ...directConversations].sort((a, b) => {
      if (!a.lastAt && !b.lastAt) return 0;
      if (!a.lastAt) return 1;
      if (!b.lastAt) return -1;
      return new Date(b.lastAt).getTime() - new Date(a.lastAt).getTime();
    });

  return (
    <div>
      <h1 className="text-2xl font-extrabold tracking-tight text-ink">Mesajlar</h1>
      <p className="mt-1 text-sm text-ink-soft">
        Teklife bağlı ve doğrudan tüm konuşmaların tek yerde.
      </p>

      <div className="mt-6 flex flex-col gap-3">
        {conversations.map((c) => (
          <a
            key={c.kind === "offer" ? `offer-${c.offerId}` : `direct-${c.otherId}`}
            href={c.kind === "offer" ? `/proje/${c.projectId}#chat-${c.offerId}` : `/mesajlar/${c.otherId}`}
            className="flex items-center gap-3 rounded-lg border border-black/[0.08] bg-white shadow-sm p-6 transition-all hover:shadow-md"
          >
            <Avatar name={c.otherName} role={c.otherRole} avatarUrl={c.otherAvatarUrl} />
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
              <p className="truncate text-xs text-ink-soft">
                {c.kind === "offer" ? c.projectTitle : "Doğrudan mesaj"}
              </p>
              {c.lastMessage && (
                <p className="mt-0.5 truncate text-xs text-ink-soft">{c.lastMessage}</p>
              )}
            </div>
            {c.unread > 0 && (
              <span className="shrink-0 rounded-full bg-coral px-2 py-0.5 text-[10px] font-bold text-white shadow-[0_2px_6px_rgba(68,172,255,0.5)]">
                {c.unread}
              </span>
            )}
          </a>
        ))}
      </div>
    </div>
  );
}
