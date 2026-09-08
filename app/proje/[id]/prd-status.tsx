"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/utils/supabase/client";

const MAX_WAIT_SECONDS = 300; // 5 dakika

type HybridSearchResult = {
  developer_id: string;
  ad_soyad: string;
  skills: string[];
  bio: string;
  uyum_skoru: number | null;
};

async function fetchMatchedDevelopers(prdText: string, requiredSkills: string[]) {
  try {
    const res = await fetch(`${process.env.NEXT_PUBLIC_AI_SERVICE_URL}/eslestir/hibrit`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        prd_metni: prdText,
        gerekli_diller: requiredSkills.length > 0 ? requiredSkills : null,
        top_k: 5,
      }),
    });
    if (!res.ok) return [];

    const data: { yazilimcilar: HybridSearchResult[] } = await res.json();
    return (data.yazilimcilar ?? []).map((d) => ({
      developerId: d.developer_id,
      fullName: d.ad_soyad,
      bio: d.bio,
      skills: d.skills,
      matchScore: d.uyum_skoru ?? 0,
    }));
  } catch {
    // Eşleştirme motoruna ulaşılamazsa PRD yine de kaydedilsin,
    // sadece "Eşleşen Yazılımcılar" boş kalır
    return [];
  }
}

type Phase = "waiting" | "cancelled" | "error";

export default function PrdStatus({ projectId }: { projectId: string }) {
  const router = useRouter();
  const supabase = createClient();
  const [statusText, setStatusText] = useState("PRD hazırlanıyor...");
  const [phase, setPhase] = useState<Phase>("waiting");
  const [retryKey, setRetryKey] = useState(0);

  useEffect(() => {
    if (phase !== "waiting") return;

    const startTime = Date.now();

    const interval = setInterval(async () => {
      const elapsedSeconds = (Date.now() - startTime) / 1000;

      if (elapsedSeconds > MAX_WAIT_SECONDS) {
        clearInterval(interval);
        setPhase("error");
        setStatusText(
          "İşlem 5 dakikayı aştı, sunucuya ulaşılamıyor olabilir. Tekrar deneyebilir ya da iptal edebilirsin."
        );
        return;
      }

      try {
        const res = await fetch(
          `${process.env.NEXT_PUBLIC_AI_SERVICE_URL}/prd-durum/${projectId}`
        );
        const data = await res.json();

        if (data.status === "done") {
          clearInterval(interval);
          setStatusText("PRD hazır, eşleşen yazılımcılar aranıyor...");

          const requiredSkills: string[] = data.skills ?? [];
          const matchedDevelopers = await fetchMatchedDevelopers(data.prd, requiredSkills);

          setStatusText("Kaydediliyor...");

          const { error } = await supabase
            .from("projects")
            .update({
              generated_prd: data.prd,
              required_skills: requiredSkills,
              matched_developers: matchedDevelopers,
            })
            .eq("id", projectId);

          if (error) {
            console.error("PRD kaydedilirken hata:", error);
            setPhase("error");
            setStatusText("PRD üretildi ama kaydedilirken bir hata oluştu: " + error.message);
            return;
          }

          router.refresh();
        } else if (data.status === "error") {
          clearInterval(interval);
          setPhase("error");
          setStatusText("Bir hata oluştu: " + data.message);
        }
      } catch (err) {
        // Sunucuya anlık ulaşılamazsa sessizce tekrar dener, 5 dakikalık
        // genel zaman aşımı yine de geçerli olur.
        console.warn("AI sunucusuna ulaşılamadı, tekrar denenecek:", err);
      }
    }, 4000);

    return () => clearInterval(interval);
  }, [projectId, router, supabase, phase, retryKey]);

  function handleCancel() {
    setPhase("cancelled");
    setStatusText("Bekleme iptal edildi. İstersen tekrar deneyebilirsin.");
  }

  function handleRetry() {
    setStatusText("PRD hazırlanıyor...");
    setPhase("waiting");
    setRetryKey((k) => k + 1);
  }

  const stopped = phase !== "waiting";

  return (
    <div className="mt-8 flex flex-col items-center gap-3 rounded-xl border border-stone-200 bg-white shadow-[inset_0_1px_0_rgba(255,255,255,0.8),0_4px_12px_rgba(17,24,39,0.12)] p-8 text-center">
      {!stopped ? (
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-coral border-t-transparent" />
      ) : (
        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-coral/10 font-bold text-coral-dark">
          !
        </div>
      )}
      <p className={`text-sm ${stopped ? "text-coral-dark" : "text-ink-soft"}`}>{statusText}</p>
      {!stopped && (
        <p className="text-xs text-ink-soft/70">
          Bu işlem birkaç dakika sürebilir. Sayfadan ayrılabilirsin, PRD hazır
          olduğunda burada görünecek.
        </p>
      )}

      <div className="mt-2 flex gap-3">
        {!stopped && (
          <button
            onClick={handleCancel}
            className="rounded-full bg-ink/5 shadow-[inset_0_1px_0_rgba(255,255,255,0.8),inset_0_-2px_0_rgba(17,24,39,0.06)] active:shadow-[inset_0_2px_4px_rgba(17,24,39,0.10)] active:translate-y-px px-5 py-2.5 text-sm font-semibold text-ink-soft hover:bg-ink/10 hover:text-ink"
          >
            İptal Et
          </button>
        )}
        {stopped && (
          <button
            onClick={handleRetry}
            className="rounded-full bg-coral px-5 py-2 text-sm font-semibold text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.35),0_4px_0_0_var(--color-coral-dark),0_10px_20px_rgba(239,68,104,0.35)] transition-all hover:brightness-105 active:translate-y-1 active:shadow-[inset_0_1px_0_rgba(255,255,255,0.35),0_0px_0_0_var(--color-coral-dark),0_2px_6px_rgba(239,68,104,0.30)]"
          >
            Tekrar Dene
          </button>
        )}
      </div>
    </div>
  );
}
