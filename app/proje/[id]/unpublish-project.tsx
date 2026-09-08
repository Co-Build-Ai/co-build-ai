"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/utils/supabase/client";

type AcceptedOffer = {
  id: string;
  developerId: string;
  removalRequestedByFounderAt: string | null;
  removalApprovedByDeveloperAt: string | null;
};

export default function UnpublishProject({
  projectId,
  projectTitle,
  acceptedOffer,
}: {
  projectId: string;
  projectTitle: string;
  acceptedOffer: AcceptedOffer | null;
}) {
  const router = useRouter();
  const supabase = createClient();
  const [loading, setLoading] = useState(false);

  // Kabul edilmiş bir teklif yoksa (proje henüz sadece ilan halindeyse),
  // girişimci projeyi direkt taslağa alabilir.
  async function handleDirectUnpublish() {
    if (
      !confirm(
        "Bu projeyi yayından kaldırıp taslağa almak istediğine emin misin? Proje tekrar taslak olarak görünecek."
      )
    )
      return;
    setLoading(true);
    await supabase.from("projects").update({ status: "draft" }).eq("id", projectId);
    setLoading(false);
    router.refresh();
  }

  // Proje kabul edilmiş bir teklifle yürürlükteyse, kaldırma yazılımcının
  // onayını da gerektirir.
  async function handleRequestRemoval() {
    if (!acceptedOffer) return;
    if (
      !confirm(
        "Bu proje bir yazılımcıyla yürürlükte. Kaldırma talebi gönderilecek; yazılımcı da onaylarsa proje taslağa alınacak. Devam edilsin mi?"
      )
    )
      return;
    setLoading(true);
    await supabase
      .from("offers")
      .update({ removal_requested_by_founder_at: new Date().toISOString() })
      .eq("id", acceptedOffer.id);
    await supabase.from("notifications").insert({
      user_id: acceptedOffer.developerId,
      project_id: projectId,
      type: "removal_requested",
      message: `Fikir sahibi "${projectTitle}" projesini kaldırmak istiyor. Onayın bekleniyor.`,
    });
    setLoading(false);
    router.refresh();
  }

  async function handleCancelRequest() {
    if (!acceptedOffer) return;
    setLoading(true);
    await supabase
      .from("offers")
      .update({ removal_requested_by_founder_at: null })
      .eq("id", acceptedOffer.id);
    setLoading(false);
    router.refresh();
  }

  if (!acceptedOffer) {
    return (
      <div className="mt-4">
        <button
          onClick={handleDirectUnpublish}
          disabled={loading}
          className="rounded-full border border-coral/40 px-5 py-2 text-sm font-semibold text-coral-dark hover:bg-coral/10 disabled:opacity-50"
        >
          {loading ? "Kaldırılıyor..." : "Yayından Kaldır (Taslağa Al)"}
        </button>
      </div>
    );
  }

  if (acceptedOffer.removalRequestedByFounderAt && !acceptedOffer.removalApprovedByDeveloperAt) {
    return (
      <div className="mt-4 flex items-center justify-between gap-3 rounded-lg border border-stone-200 bg-white shadow-[inset_0_1px_0_rgba(255,255,255,0.8),0_4px_12px_rgba(17,24,39,0.12)] px-4 py-3">
        <p className="text-sm text-ink-soft">
          Kaldırma talebi gönderildi, yazılımcının onayı bekleniyor.
        </p>
        <button
          onClick={handleCancelRequest}
          disabled={loading}
          className="shrink-0 text-sm font-semibold text-coral-dark hover:underline disabled:opacity-50"
        >
          Talebi İptal Et
        </button>
      </div>
    );
  }

  return (
    <div className="mt-4">
      <button
        onClick={handleRequestRemoval}
        disabled={loading}
        className="rounded-full border border-coral/40 px-5 py-2 text-sm font-semibold text-coral-dark hover:bg-coral/10 disabled:opacity-50"
      >
        {loading ? "Gönderiliyor..." : "Projeyi Kaldırma Talebi Gönder"}
      </button>
      <p className="mt-2 text-xs text-ink-soft">
        Bu proje bir yazılımcıyla yürürlükte olduğu için kaldırmak, yazılımcının da onayını gerektirir.
      </p>
    </div>
  );
}
