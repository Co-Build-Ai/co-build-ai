import { redirect } from "next/navigation";
import { createClient } from "@/utils/supabase/server";
import DeleteAccount from "./delete-account";

const USER_TYPE_LABELS: Record<string, string> = {
  founder: "Fikir Sahibi",
  developer: "Yazılımcı",
  both: "Fikir Sahibi & Yazılımcı",
};

export default async function HesapAyarlari() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/giris");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name, user_type")
    .eq("id", user.id)
    .maybeSingle();

  const joinedAt = user.created_at
    ? new Date(user.created_at).toLocaleDateString("tr-TR", { day: "numeric", month: "long", year: "numeric" })
    : null;

  return (
    <div>
      <div className="rounded-xl border border-black/[0.08] bg-white shadow-sm p-8">
        <h2 className="text-lg font-bold text-ink">Hesap Bilgileri</h2>
        <dl className="mt-4 flex flex-col gap-3 text-sm">
          <div className="flex items-center justify-between gap-4 border-b border-black/[0.06] pb-3">
            <dt className="text-ink-soft">Ad Soyad</dt>
            <dd className="font-medium text-ink">{profile?.full_name ?? "Belirtilmedi"}</dd>
          </div>
          <div className="flex items-center justify-between gap-4 border-b border-black/[0.06] pb-3">
            <dt className="text-ink-soft">E-posta</dt>
            <dd className="font-medium text-ink">{user.email}</dd>
          </div>
          <div className="flex items-center justify-between gap-4 border-b border-black/[0.06] pb-3">
            <dt className="text-ink-soft">Hesap Türü</dt>
            <dd className="font-medium text-ink">
              {profile?.user_type ? USER_TYPE_LABELS[profile.user_type] ?? profile.user_type : "Belirtilmedi"}
            </dd>
          </div>
          {joinedAt && (
            <div className="flex items-center justify-between gap-4">
              <dt className="text-ink-soft">Üyelik Tarihi</dt>
              <dd className="font-medium text-ink">{joinedAt}</dd>
            </div>
          )}
        </dl>
      </div>

      <DeleteAccount userEmail={user.email ?? ""} />
    </div>
  );
}
