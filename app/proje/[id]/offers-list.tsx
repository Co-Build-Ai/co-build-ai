"use client";

import { useState } from "react";
import { createClient } from "@/utils/supabase/client";
import ChatBox from "@/app/components/chat-box";
import Avatar from "@/app/components/avatar";
import RatingStars from "@/app/components/rating-stars";
import RateOfferForm from "@/app/components/rate-offer-form";
import AvailabilityBadge from "@/app/components/availability-badge";
import GithubRepoBadge from "@/app/components/github-repo-badge";

type Offer = {
  id: string;
  developer_id: string;
  message: string;
  proposed_amount: number | null;
  proof_link: string | null;
  payment_type: "fixed" | "equity" | null;
  status: "pending" | "accepted" | "rejected";
  completed_at: string | null;
  github_repo_url: string | null;
  developer: {
    full_name: string | null;
    bio: string | null;
    skills: string[] | null;
    availability: string | null;
  } | null;
  developerRatingAvg: number | null;
  developerRatingCount: number;
  alreadyRatedByMe: boolean;
};

const STATUS_LABELS: Record<Offer["status"], string> = {
  pending: "Bekliyor",
  accepted: "Kabul Edildi",
  rejected: "Reddedildi",
};

function describeOfferPayment(paymentType: Offer["payment_type"], amount: number | null) {
  if (!paymentType) return amount ? `${amount}` : null;
  const label = paymentType === "fixed" ? "Sabit Ücret" : "Ortaklık";
  const unit = paymentType === "fixed" ? "₺" : "%";
  return amount ? `${label} — ${amount}${unit}` : label;
}

export default function OffersList({
  projectId,
  projectTitle,
  founderId,
  initialOffers,
}: {
  projectId: string;
  projectTitle: string;
  founderId: string;
  initialOffers: Offer[];
}) {
  const supabase = createClient();
  const [offers, setOffers] = useState(initialOffers);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  async function handleUpdateStatus(offer: Offer, status: "accepted" | "rejected") {
    setUpdatingId(offer.id);
    await supabase.from("offers").update({ status }).eq("id", offer.id);
    await supabase.from("notifications").insert({
      user_id: offer.developer_id,
      project_id: projectId,
      type: status === "accepted" ? "offer_accepted" : "offer_rejected",
      message: `"${projectTitle}" projesi için verdiğin teklif ${
        status === "accepted" ? "kabul edildi 🎉" : "reddedildi"
      }.`,
    });
    setOffers((prev) => prev.map((o) => (o.id === offer.id ? { ...o, status } : o)));
    setUpdatingId(null);
  }

  async function handleMarkCompleted(offer: Offer) {
    setUpdatingId(offer.id);
    const completedAt = new Date().toISOString();
    await supabase.from("offers").update({ completed_at: completedAt }).eq("id", offer.id);
    await supabase.from("notifications").insert({
      user_id: offer.developer_id,
      project_id: projectId,
      type: "project_completed",
      message: `"${projectTitle}" projesi tamamlandı olarak işaretlendi. Artık değerlendirme yapabilirsin.`,
    });
    setOffers((prev) => prev.map((o) => (o.id === offer.id ? { ...o, completed_at: completedAt } : o)));
    setUpdatingId(null);
  }

  if (offers.length === 0) {
    return (
      <div className="mt-8 rounded-xl border border-dashed border-ink/15 bg-white/60 p-8 text-center">
        <p className="text-2xl">📭</p>
        <p className="mt-2 text-sm text-ink-soft">
          Henüz gelen bir teklif yok. Yazılımcılar projeni gördükçe teklifler burada birikecek.
        </p>
      </div>
    );
  }

  return (
    <div className="mt-8">
      <p className="font-mono text-xs font-semibold uppercase tracking-wide text-ink-soft">
        Gelen Teklifler ({offers.length})
      </p>
      <div className="mt-3 flex flex-col gap-4">
        {offers.map((offer) => (
          <div key={offer.id} className="rounded-xl bg-white shadow-[inset_0_1px_0_rgba(255,255,255,0.9),inset_0_-1px_0_rgba(17,24,39,0.05),0_2px_8px_rgba(17,24,39,0.05),0_16px_40px_rgba(17,24,39,0.10)] p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Avatar name={offer.developer?.full_name ?? null} role="developer" size="sm" />
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-base font-bold text-ink">
                      {offer.developer?.full_name ?? "İsimsiz Yazılımcı"}
                    </h3>
                    <AvailabilityBadge availability={offer.developer?.availability ?? null} />
                  </div>
                  <RatingStars average={offer.developerRatingAvg} count={offer.developerRatingCount} />
                </div>
              </div>
              <span
                className={`rounded-full px-3 py-1 text-xs font-semibold ${
                  offer.completed_at
                    ? "bg-periwinkle-dark text-white"
                    : offer.status === "accepted"
                    ? "bg-petal text-coral-dark"
                    : offer.status === "rejected"
                    ? "bg-coral/10 text-coral-dark"
                    : "bg-petal text-coral-dark"
                }`}
              >
                {offer.completed_at ? "Tamamlandı" : STATUS_LABELS[offer.status]}
              </span>
            </div>

            {offer.developer?.skills && offer.developer.skills.length > 0 && (
              <div className="mt-2 flex flex-wrap gap-2">
                {offer.developer.skills.map((skill) => (
                  <span key={skill} className="rounded-full bg-periwinkle/20 px-3 py-1 font-mono text-xs text-ink">
                    {skill}
                  </span>
                ))}
              </div>
            )}

            <p className="mt-3 whitespace-pre-wrap text-sm text-ink-soft">{offer.message}</p>

            {(offer.payment_type || offer.proposed_amount) && (
              <p className="mt-2 text-sm text-ink-soft">
                <span className="font-semibold text-ink">Teklifi:</span>{" "}
                {describeOfferPayment(offer.payment_type, offer.proposed_amount)}
              </p>
            )}

            {offer.proof_link && (
              <a
                href={offer.proof_link}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-2 block text-sm text-coral-dark hover:underline"
              >
                Kanıt linki →
              </a>
            )}

            {offer.status === "pending" && (
              <div className="mt-4 flex gap-3">
                <button
                  onClick={() => handleUpdateStatus(offer, "accepted")}
                  disabled={updatingId === offer.id}
                  className="rounded-full bg-coral px-5 py-2 text-sm font-semibold text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.35),0_4px_0_0_var(--color-coral-dark),0_10px_20px_rgba(239,68,104,0.35)] transition-all hover:brightness-105 active:translate-y-1 active:shadow-[inset_0_1px_0_rgba(255,255,255,0.35),0_0px_0_0_var(--color-coral-dark),0_2px_6px_rgba(239,68,104,0.30)] disabled:opacity-50"
                >
                  Kabul Et
                </button>
                <button
                  onClick={() => handleUpdateStatus(offer, "rejected")}
                  disabled={updatingId === offer.id}
                  className="rounded-full bg-ink/5 shadow-[inset_0_1px_0_rgba(255,255,255,0.8),inset_0_-2px_0_rgba(17,24,39,0.06)] active:shadow-[inset_0_2px_4px_rgba(17,24,39,0.10)] active:translate-y-px px-5 py-2.5 text-sm font-semibold text-ink-soft hover:bg-ink/10 hover:text-ink disabled:opacity-50"
                >
                  Reddet
                </button>
              </div>
            )}

            {offer.status === "accepted" && (
              <div className="mt-4 rounded-lg bg-ink/5 p-4">
                <p className="text-sm font-semibold text-ink">GitHub Reposu</p>
                {offer.github_repo_url ? (
                  <GithubRepoBadge repoUrl={offer.github_repo_url} />
                ) : (
                  <p className="mt-1 text-xs text-ink-soft">
                    Yazılımcı henüz bir repo bağlamadı.
                  </p>
                )}
              </div>
            )}

            {offer.status === "accepted" && !offer.completed_at && (
              <div className="mt-4">
                <button
                  onClick={() => handleMarkCompleted(offer)}
                  disabled={updatingId === offer.id}
                  className="rounded-full border border-periwinkle-dark/40 px-5 py-2 text-sm font-semibold text-periwinkle-dark hover:bg-periwinkle/10 disabled:opacity-50"
                >
                  Projeyi Tamamlandı Olarak İşaretle
                </button>
              </div>
            )}

            {offer.completed_at && (
              <RateOfferForm
                offerId={offer.id}
                raterId={founderId}
                ratedUserId={offer.developer_id}
                ratedUserLabel={offer.developer?.full_name ?? "İsimsiz Yazılımcı"}
                alreadyRated={offer.alreadyRatedByMe}
              />
            )}

            <ChatBox
              offerId={offer.id}
              userId={founderId}
              otherUserId={offer.developer_id}
              otherUserName={offer.developer?.full_name ?? "İsimsiz Yazılımcı"}
              projectId={projectId}
            />
          </div>
        ))}
      </div>
    </div>
  );
}
