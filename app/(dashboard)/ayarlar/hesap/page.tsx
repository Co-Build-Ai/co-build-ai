import { redirect } from "next/navigation";
import { createClient } from "@/utils/supabase/server";
import DeleteAccount from "./delete-account";

export default async function HesapAyarlari() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/giris");
  }

  return (
    <div>
      <div className="rounded-xl border border-stone-200 bg-white shadow-[inset_0_1px_0_rgba(255,255,255,0.8),0_4px_12px_rgba(17,24,39,0.12)] p-8">
        <h2 className="text-lg font-bold text-ink">Hesap Bilgileri</h2>
        <p className="mt-3 text-sm text-ink-soft">
          <span className="font-semibold text-ink">E-posta:</span> {user.email}
        </p>
      </div>

      <DeleteAccount userEmail={user.email ?? ""} />
    </div>
  );
}
