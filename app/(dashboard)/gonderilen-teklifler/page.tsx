import { redirect } from "next/navigation";
import { createClient } from "@/utils/supabase/server";
import Avatar from "@/app/components/avatar";
import { getActiveRole } from "@/app/lib/roles";

export default async function GonderilenTeklifler() {
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

  const { data: gonderilenler } = await supabase
    .from("notifications")
    .select("id, user_id, project_id, message, created_at")
    .eq("sender_id", user.id)
    .eq("type", "project_invite")
    .order("created_at", { ascending: false });

  const davetler = gonderilenler ?? [];

  const aliciIds = [...new Set(davetler.map((d) => d.user_id))];
  const { data: aliciProfilleri } =
    aliciIds.length > 0
      ? await supabase.from("profiles").select("id, full_name, avatar_url").in("id", aliciIds)
      : { data: [] };

  const projeIds = [...new Set(davetler.map((d) => d.project_id).filter((id): id is string => !!id))];
  const { data: projeler } =
    projeIds.length > 0 ? await supabase.from("projects").select("id, title").in("id", projeIds) : { data: [] };

  function baglamCikar(mesaj: string): string {
    // Mesajlar hep tirnak icinde bir baglamla basliyor: "X" ...
    const eslesme = mesaj.match(/^"([^"]+)"/);
    return eslesme ? eslesme[1] : "Aradığın pozisyon";
  }

  const satirlar = davetler.map((d) => {
    const alici = aliciProfilleri?.find((p) => p.id === d.user_id);
    const proje = d.project_id ? projeler?.find((p) => p.id === d.project_id) : null;
    const baglam = proje?.title ?? baglamCikar(d.message);
    return {
      id: d.id,
      createdAt: d.created_at,
      recipientId: d.user_id,
      recipientName: alici?.full_name ?? "İsimsiz Yazılımcı",
      recipientAvatarUrl: alici?.avatar_url ?? null,
      context: baglam,
      projectId: d.project_id as string | null,
    };
  });

  return (
    <div>
      <h1 className="text-2xl font-extrabold tracking-tight text-ink">Gönderilen Teklifler</h1>
      <p className="mt-1 text-sm text-ink-soft">
        Doğrudan Arama ve PRD sonrası önerilen yazılımcılara gönderdiğin davetler.
      </p>

      {satirlar.length === 0 ? (
        <div className="mt-8 rounded-xl border border-dashed border-black/15 bg-white/60 p-10 text-center">
          <p className="text-2xl">📨</p>
          <p className="mt-2 text-sm text-ink-soft">Henüz kimseye teklif göndermedin.</p>
        </div>
      ) : (
        <div className="mt-6 flex flex-col gap-3">
          {satirlar.map((satir) => (
            <div
              key={satir.id}
              className="flex items-center gap-3 rounded-xl border border-black/[0.08] bg-white p-4 shadow-sm"
            >
              <a href={`/profil/${satir.recipientId}`} className="shrink-0">
                <Avatar name={satir.recipientName} role="developer" size="sm" avatarUrl={satir.recipientAvatarUrl} />
              </a>
              <p className="min-w-0 flex-1 text-sm text-ink">
                {satir.projectId ? (
                  <a href={`/proje/${satir.projectId}`} className="font-semibold hover:underline">
                    {satir.context}
                  </a>
                ) : (
                  <span className="font-semibold">{satir.context}</span>
                )}{" "}
                —{" "}
                <a href={`/profil/${satir.recipientId}`} className="font-semibold text-coral-dark hover:underline">
                  {satir.recipientName}
                </a>
                &apos;a teklif gönderildi.
              </p>
              <span className="shrink-0 text-xs text-ink-soft">
                {new Date(satir.createdAt).toLocaleDateString("tr-TR")}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
