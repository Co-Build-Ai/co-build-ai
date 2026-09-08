import { redirect } from "next/navigation";
import { createClient } from "@/utils/supabase/server";
import FounderDefaults from "./founder-defaults";
import DeveloperAvailability from "./developer-availability";

export default async function TercihAyarlari() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/giris");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("user_type, default_payment_type, default_payment_amount, availability")
    .eq("id", user.id)
    .maybeSingle();

  const showFounder = profile?.user_type === "founder" || profile?.user_type === "both";
  const showDeveloper = profile?.user_type === "developer" || profile?.user_type === "both";

  if (!showFounder && !showDeveloper) {
    return null;
  }

  return (
    <div className="flex flex-col gap-8">
      {showFounder && (
        <FounderDefaults
          userId={user.id}
          initialType={profile?.default_payment_type ?? null}
          initialAmount={profile?.default_payment_amount ?? null}
        />
      )}
      {showDeveloper && (
        <DeveloperAvailability userId={user.id} initialValue={profile?.availability ?? null} />
      )}
    </div>
  );
}
