import { NextResponse } from "next/server";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { createClient as createServerClient } from "@/utils/supabase/server";

const GITHUB_REPO_REGEX =
  /^https?:\/\/(?:www\.)?github\.com\/[^\/\s]+\/[^\/\s]+?(?:\.git)?(?:[\/?#].*)?$/i;

export async function POST(request: Request) {
  const { offerId, repoUrl } = await request.json();

  if (!offerId) {
    return NextResponse.json({ error: "Geçersiz istek." }, { status: 400 });
  }

  const trimmedUrl = typeof repoUrl === "string" ? repoUrl.trim() : "";
  if (trimmedUrl && !GITHUB_REPO_REGEX.test(trimmedUrl)) {
    return NextResponse.json({ error: "Geçerli bir GitHub repo linki gir (github.com/kullanici/repo)." }, { status: 400 });
  }

  const supabase = await createServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Oturum bulunamadı." }, { status: 401 });
  }

  const admin = createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  // offers tablosunda UPDATE yalnızca proje sahibine (founder) açık olduğu için
  // geliştiricinin kendi teklifine repo bağlaması service role ile, burada elle
  // doğrulanarak yapılıyor.
  const { data: offer } = await admin
    .from("offers")
    .select("id, project_id, developer_id, status, github_repo_url")
    .eq("id", offerId)
    .maybeSingle();

  if (!offer || offer.developer_id !== user.id) {
    return NextResponse.json({ error: "Bu teklif üzerinde yetkin yok." }, { status: 403 });
  }

  if (offer.status !== "accepted") {
    return NextResponse.json(
      { error: "Repo yalnızca kabul edilmiş bir teklife bağlanabilir." },
      { status: 400 }
    );
  }

  await admin
    .from("offers")
    .update({ github_repo_url: trimmedUrl || null })
    .eq("id", offerId);

  // Yeni bir repo bağlandığında (boş bırakma/silme değil) fikir sahibine haber ver.
  if (trimmedUrl && trimmedUrl !== offer.github_repo_url) {
    const { data: project } = await admin
      .from("projects")
      .select("founder_id, title")
      .eq("id", offer.project_id)
      .maybeSingle();

    if (project) {
      await admin.from("notifications").insert({
        user_id: project.founder_id,
        project_id: offer.project_id,
        type: "repo_linked",
        message: `"${project.title}" projesi için bir GitHub reposu bağlandı.`,
      });
    }
  }

  return NextResponse.json({ success: true });
}
