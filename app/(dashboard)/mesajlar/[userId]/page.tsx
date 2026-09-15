import Link from "next/link";
import { redirect, notFound } from "next/navigation";
import { createClient } from "@/utils/supabase/server";
import Avatar from "@/app/components/avatar";
import DirectMessageBox from "@/app/components/direct-message-box";
import { canActAsDeveloper } from "@/app/lib/roles";

export default async function DirectMessagePage({
  params,
}: {
  params: Promise<{ userId: string }>;
}) {
  const { userId: otherUserId } = await params;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/giris");
  }

  if (otherUserId === user.id) {
    redirect("/mesajlar");
  }

  const { data: otherProfile } = await supabase
    .from("profiles")
    .select("id, full_name, avatar_url, user_type")
    .eq("id", otherUserId)
    .maybeSingle();

  if (!otherProfile) {
    notFound();
  }

  const { data: initialMessages } = await supabase
    .from("direct_messages")
    .select("id, sender_id, content, created_at, read_at")
    .or(
      `and(sender_id.eq.${user.id},recipient_id.eq.${otherUserId}),and(sender_id.eq.${otherUserId},recipient_id.eq.${user.id})`
    )
    .order("created_at", { ascending: true });

  const otherName = otherProfile.full_name ?? "İsimsiz";
  const otherRole = canActAsDeveloper(otherProfile.user_type) ? "developer" : "founder";

  return (
    <div className="mx-auto max-w-2xl">
      <Link href="/mesajlar" className="text-sm font-medium text-ink-soft hover:text-ink">
        ← Mesajlara Dön
      </Link>

      <a
        href={`/profil/${otherUserId}`}
        className="mt-4 flex items-center gap-3 hover:underline"
      >
        <Avatar name={otherName} role={otherRole} avatarUrl={otherProfile.avatar_url} />
        <span className="text-lg font-bold text-ink">{otherName}</span>
      </a>

      <div className="mt-4">
        <DirectMessageBox
          userId={user.id}
          otherUserId={otherUserId}
          otherUserName={otherName}
          initialMessages={initialMessages ?? []}
        />
      </div>
    </div>
  );
}
