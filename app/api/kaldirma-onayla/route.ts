import { NextResponse } from "next/server";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { createClient as createServerClient } from "@/utils/supabase/server";

export async function POST(request: Request) {
  const { offerId, action } = await request.json();

  if (!offerId || (action !== "approve" && action !== "reject")) {
    return NextResponse.json({ error: "Geçersiz istek." }, { status: 400 });
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

  // Bu teklif gerçekten bu geliştiriciye mi ait, kontrol ediliyor — RLS'e
  // güvenmek yerine burada elle doğruluyoruz çünkü işlem service role ile yapılıyor.
  const { data: offer } = await admin
    .from("offers")
    .select("id, project_id, developer_id, removal_requested_by_founder_at")
    .eq("id", offerId)
    .maybeSingle();

  if (!offer || offer.developer_id !== user.id) {
    return NextResponse.json({ error: "Bu teklif üzerinde yetkin yok." }, { status: 403 });
  }

  if (!offer.removal_requested_by_founder_at) {
    return NextResponse.json({ error: "Bekleyen bir kaldırma talebi yok." }, { status: 400 });
  }

  const { data: project } = await admin
    .from("projects")
    .select("id, founder_id, title")
    .eq("id", offer.project_id)
    .maybeSingle();

  if (!project) {
    return NextResponse.json({ error: "Proje bulunamadı." }, { status: 404 });
  }

  if (action === "approve") {
    const approvedAt = new Date().toISOString();
    await admin
      .from("offers")
      .update({ removal_approved_by_developer_at: approvedAt })
      .eq("id", offerId);
    await admin.from("projects").update({ status: "draft" }).eq("id", project.id);
    await admin.from("notifications").insert({
      user_id: project.founder_id,
      project_id: project.id,
      type: "removal_approved",
      message: `"${project.title}" projesini kaldırma talebini onayladı, proje taslağa alındı.`,
    });
  } else {
    await admin
      .from("offers")
      .update({ removal_requested_by_founder_at: null, removal_approved_by_developer_at: null })
      .eq("id", offerId);
    await admin.from("notifications").insert({
      user_id: project.founder_id,
      project_id: project.id,
      type: "removal_rejected",
      message: `"${project.title}" projesi için gönderdiğin kaldırma talebi yazılımcı tarafından reddedildi.`,
    });
  }

  return NextResponse.json({ success: true });
}
