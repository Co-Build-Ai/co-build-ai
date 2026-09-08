"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/utils/supabase/client";
import ChatBox from "@/app/components/chat-box";
import Avatar from "@/app/components/avatar";
import RatingStars from "@/app/components/rating-stars";
import RateOfferForm from "@/app/components/rate-offer-form";
import GithubRepoBadge from "@/app/components/github-repo-badge";

type PaymentType = "fixed" | "equity";
type ProjectPaymentType = PaymentType | "flexible";

type Offer = {
  id: string;
  message: string;
  proposed_amount: number | null;
  proof_link: string | null;
  payment_type: PaymentType | null;
  status: "pending" | "accepted" | "rejected";
  completed_at: string | null;
  alreadyRatedByMe: boolean;
  removal_requested_by_founder_at: string | null;
  removal_approved_by_developer_at: string | null;
  github_repo_url: string | null;
};

export default function DeveloperProjectView({
  projectId,
  userId,
  founderId,
  founderName,
  founderRatingAvg,
  founderRatingCount,
  requiredSkills,
  prd,
  alreadyAccepted,
  paymentType,
  paymentAmount,
  initialOffer,
}: {
  projectId: string;
  userId: string;
  founderId: string;
  founderName: string | null;
  founderRatingAvg: number | null;
  founderRatingCount: number;
  requiredSkills: string[] | null;
  prd: string;
  alreadyAccepted: boolean;
  paymentType: ProjectPaymentType | null;
  paymentAmount: number | null;
  initialOffer: Offer | null;
}) {
  const supabase = createClient();
  const [accepted, setAccepted] = useState(alreadyAccepted);
  const [loading, setLoading] = useState(false);
  const hasLoggedView = useRef(false);

  // Kullanıcı NDA'yı daha önce kabul etmişse, bu görüntülemeyi de logla
  useEffect(() => {
    if (alreadyAccepted && !hasLoggedView.current) {
      hasLoggedView.current = true;
      supabase
        .from("project_views")
        .insert({ project_id: projectId, viewer_id: userId })
        .then();
    }
  }, [alreadyAccepted, projectId, userId, supabase]);

  async function handleAccept() {
    setLoading(true);
    await supabase
      .from("project_nda_acceptances")
      .insert({ project_id: projectId, developer_id: userId });
    await supabase
      .from("project_views")
      .insert({ project_id: projectId, viewer_id: userId });
    setLoading(false);
    setAccepted(true);
  }

  if (!accepted) {
    return (
      <div className="mt-8 flex flex-col items-center gap-4 rounded-xl bg-white shadow-[inset_0_1px_0_rgba(255,255,255,0.9),inset_0_-1px_0_rgba(17,24,39,0.05),0_2px_8px_rgba(17,24,39,0.05),0_16px_40px_rgba(17,24,39,0.10)] p-8 text-center">
        <h2 className="text-lg font-bold text-ink">
          Gizlilik Onayı
        </h2>
        <p className="max-w-md text-sm text-ink-soft">
          Bu projenin detaylarını (PRD) görüntülemeden önce, burada
          paylaşılan bilgileri gizli tutmayı ve fikir sahibinin izni
          olmadan üçüncü kişilerle paylaşmamayı kabul etmen gerekiyor.
        </p>
        <button
          onClick={handleAccept}
          disabled={loading}
          className="rounded-full bg-coral px-8 py-3 text-base font-semibold text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.35),0_4px_0_0_var(--color-coral-dark),0_10px_20px_rgba(239,68,104,0.35)] transition-all hover:brightness-105 active:translate-y-1 active:shadow-[inset_0_1px_0_rgba(255,255,255,0.35),0_0px_0_0_var(--color-coral-dark),0_2px_6px_rgba(239,68,104,0.30)] disabled:opacity-50"
        >
          {loading ? "Kaydediliyor..." : "Onaylıyorum, PRD'yi Görüntüle"}
        </button>
      </div>
    );
  }

  return (
    <>
      <div className="mt-4 flex items-center gap-2">
        <Avatar name={founderName} role="founder" size="sm" />
        <div>
          <p className="text-sm text-ink-soft">
            <span className="font-semibold text-ink">Fikir Sahibi:</span>{" "}
            {founderName ?? "İsimsiz"}
          </p>
          <RatingStars average={founderRatingAvg} count={founderRatingCount} />
        </div>
      </div>

      {requiredSkills && requiredSkills.length > 0 && (
        <div className="mt-4 flex flex-wrap gap-2">
          {requiredSkills.map((skill) => (
            <span
              key={skill}
              className="rounded-full bg-periwinkle/20 px-3 py-1 font-mono text-xs text-ink"
            >
              {skill}
            </span>
          ))}
        </div>
      )}

      {paymentType && (
        <p className="mt-4 text-sm text-ink-soft">
          <span className="font-semibold text-ink">Ödeme:</span>{" "}
          {paymentType === "flexible"
            ? "Esnek — sabit ücret veya ortaklık, teklifinde sen belirtebilirsin"
            : paymentType === "fixed"
            ? `Sabit ücret${paymentAmount ? ` — ${paymentAmount}₺` : ""}`
            : `Ortaklık${paymentAmount ? ` — %${paymentAmount}` : ""}`}
        </p>
      )}

      <div className="mt-8 rounded-xl bg-white p-6 shadow-[inset_0_1px_0_rgba(255,255,255,0.9),inset_0_-1px_0_rgba(17,24,39,0.05),0_2px_8px_rgba(17,24,39,0.05),0_16px_40px_rgba(17,24,39,0.10)]">
        <span className="inline-flex items-center rounded-full bg-petal px-3 py-1 font-mono text-xs font-medium text-coral-dark">
          AI Tarafından Üretildi
        </span>
        <h2 className="mt-3 text-xl font-bold text-ink">
          Ürün Gereksinim Dokümanı (PRD)
        </h2>
        <div className="mt-4 whitespace-pre-wrap text-sm leading-relaxed text-ink-soft">
          {prd}
        </div>
      </div>

      <OfferSection
        projectId={projectId}
        userId={userId}
        founderId={founderId}
        founderName={founderName}
        projectPaymentType={paymentType}
        initialOffer={initialOffer}
      />
    </>
  );
}

const STATUS_LABELS: Record<Offer["status"], string> = {
  pending: "Bekliyor",
  accepted: "Kabul Edildi",
  rejected: "Reddedildi",
};

function describeOfferPayment(paymentType: PaymentType | null, amount: number | null) {
  if (!paymentType) return amount ? `${amount}` : null;
  const label = paymentType === "fixed" ? "Sabit Ücret" : "Ortaklık";
  const unit = paymentType === "fixed" ? "₺" : "%";
  return amount ? `${label} — ${amount}${unit}` : label;
}

function OfferSection({
  projectId,
  userId,
  founderId,
  founderName,
  projectPaymentType,
  initialOffer,
}: {
  projectId: string;
  userId: string;
  founderId: string;
  founderName: string | null;
  projectPaymentType: ProjectPaymentType | null;
  initialOffer: Offer | null;
}) {
  const router = useRouter();
  const supabase = createClient();
  const [offer, setOffer] = useState(initialOffer);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [offerPaymentType, setOfferPaymentType] = useState<PaymentType>(
    projectPaymentType === "equity" ? "equity" : "fixed"
  );
  const [proposedAmount, setProposedAmount] = useState("");
  const [proofLink, setProofLink] = useState("");
  const [repoUrl, setRepoUrl] = useState(initialOffer?.github_repo_url ?? "");
  const [editingRepo, setEditingRepo] = useState(false);
  const [savingRepo, setSavingRepo] = useState(false);
  const [repoError, setRepoError] = useState<string | null>(null);

  // Founder tek bir tipe sabitlediyse, teklifin tipi de onu takip eder
  const typeIsChoosable = projectPaymentType === "flexible" || !projectPaymentType;

  async function handleSubmit() {
    if (!message.trim()) return;
    setSaving(true);

    const { data } = await supabase
      .from("offers")
      .insert({
        project_id: projectId,
        developer_id: userId,
        message,
        proposed_amount: proposedAmount ? Number(proposedAmount) : null,
        proof_link: proofLink || null,
        payment_type: offerPaymentType,
        status: "pending",
      })
      .select()
      .single();

    setSaving(false);
    if (data) setOffer(data as Offer);
  }

  // offers/projects üzerindeki RLS politikaları bu güncellemeleri sadece proje
  // sahibine (founder) izin veriyor; geliştirici tarafından yapılan onay/red bu
  // yüzden service role ile çalışan bir API route üzerinden yürütülüyor.
  async function handleApproveRemoval() {
    if (!offer) return;
    setSaving(true);
    const res = await fetch("/api/kaldirma-onayla", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ offerId: offer.id, action: "approve" }),
    });
    if (res.ok) {
      setOffer((prev) =>
        prev ? { ...prev, removal_approved_by_developer_at: new Date().toISOString() } : prev
      );
      router.refresh();
    }
    setSaving(false);
  }

  async function handleRejectRemoval() {
    if (!offer) return;
    setSaving(true);
    const res = await fetch("/api/kaldirma-onayla", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ offerId: offer.id, action: "reject" }),
    });
    if (res.ok) {
      setOffer((prev) => (prev ? { ...prev, removal_requested_by_founder_at: null } : prev));
    }
    setSaving(false);
  }

  // offers üzerinde UPDATE yalnızca founder'a açık olduğu için, bu da service
  // role ile çalışan API route üzerinden yürütülüyor (bkz. kaldirma-onayla).
  async function handleSaveRepo() {
    if (!offer) return;
    setSavingRepo(true);
    setRepoError(null);
    const res = await fetch("/api/repo-baglama", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ offerId: offer.id, repoUrl }),
    });
    if (res.ok) {
      setOffer((prev) => (prev ? { ...prev, github_repo_url: repoUrl.trim() || null } : prev));
      setEditingRepo(false);
    } else {
      const data = await res.json().catch(() => null);
      setRepoError(data?.error ?? "Repo kaydedilemedi.");
    }
    setSavingRepo(false);
  }

  if (offer) {
    return (
      <div className="mt-8 rounded-xl bg-white shadow-[inset_0_1px_0_rgba(255,255,255,0.9),inset_0_-1px_0_rgba(17,24,39,0.05),0_2px_8px_rgba(17,24,39,0.05),0_16px_40px_rgba(17,24,39,0.10)] p-8">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-ink">
            Teklifin
          </h2>
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
        <p className="mt-3 whitespace-pre-wrap text-sm text-ink-soft">{offer.message}</p>
        {(offer.payment_type || offer.proposed_amount) && (
          <p className="mt-2 text-sm text-ink-soft">
            <span className="font-semibold text-ink">Teklifin:</span>{" "}
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

        {offer.status === "accepted" && (
          <div className="mt-4 rounded-lg bg-ink/5 p-4">
            <div className="flex items-center justify-between">
              <p className="text-sm font-semibold text-ink">GitHub Reposu</p>
              {!editingRepo && (
                <button
                  onClick={() => setEditingRepo(true)}
                  className="text-xs font-semibold text-coral-dark hover:underline"
                >
                  {offer.github_repo_url ? "Düzenle" : "+ Bağla"}
                </button>
              )}
            </div>

            {editingRepo ? (
              <div className="mt-2 flex flex-col gap-2">
                <input
                  type="text"
                  placeholder="https://github.com/kullanici/repo"
                  value={repoUrl}
                  onChange={(e) => setRepoUrl(e.target.value)}
                  className="rounded-lg bg-white shadow-[inset_0_2px_5px_rgba(17,24,39,0.08)] px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-coral/30"
                />
                {repoError && <p className="text-xs text-coral-dark">{repoError}</p>}
                <div className="flex gap-3">
                  <button
                    onClick={handleSaveRepo}
                    disabled={savingRepo}
                    className="rounded-full bg-coral px-4 py-1.5 text-xs font-semibold text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.35),0_3px_0_0_var(--color-coral-dark),0_6px_14px_rgba(239,68,104,0.30)] disabled:opacity-50"
                  >
                    {savingRepo ? "Kaydediliyor..." : "Kaydet"}
                  </button>
                  <button
                    onClick={() => {
                      setEditingRepo(false);
                      setRepoUrl(offer.github_repo_url ?? "");
                      setRepoError(null);
                    }}
                    className="text-xs font-semibold text-ink-soft hover:text-ink"
                  >
                    Vazgeç
                  </button>
                </div>
              </div>
            ) : offer.github_repo_url ? (
              <GithubRepoBadge repoUrl={offer.github_repo_url} />
            ) : (
              <p className="mt-1 text-xs text-ink-soft">
                Projeye başladığında reponu buraya bağlayarak ilerlemeni fikir sahibiyle paylaşabilirsin.
              </p>
            )}
          </div>
        )}

        {offer.completed_at && (
          <RateOfferForm
            offerId={offer.id}
            raterId={userId}
            ratedUserId={founderId}
            ratedUserLabel={founderName ?? "Fikir Sahibi"}
            alreadyRated={offer.alreadyRatedByMe}
          />
        )}

        {offer.status === "accepted" &&
          offer.removal_requested_by_founder_at &&
          !offer.removal_approved_by_developer_at && (
            <div className="mt-4 rounded-lg border border-coral/30 bg-coral/5 p-4">
              <p className="text-sm text-ink">
                Fikir sahibi bu projeyi kaldırmak istiyor. Onaylarsan proje taslağa alınacak.
              </p>
              <div className="mt-3 flex gap-3">
                <button
                  onClick={handleApproveRemoval}
                  disabled={saving}
                  className="rounded-full bg-coral px-5 py-2 text-sm font-semibold text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.35),0_4px_0_0_var(--color-coral-dark),0_10px_20px_rgba(239,68,104,0.35)] transition-all hover:brightness-105 active:translate-y-1 active:shadow-[inset_0_1px_0_rgba(255,255,255,0.35),0_0px_0_0_var(--color-coral-dark),0_2px_6px_rgba(239,68,104,0.30)] disabled:opacity-50"
                >
                  Onayla
                </button>
                <button
                  onClick={handleRejectRemoval}
                  disabled={saving}
                  className="rounded-full bg-ink/5 shadow-[inset_0_1px_0_rgba(255,255,255,0.8),inset_0_-2px_0_rgba(17,24,39,0.06)] active:shadow-[inset_0_2px_4px_rgba(17,24,39,0.10)] active:translate-y-px px-5 py-2.5 text-sm font-semibold text-ink-soft hover:bg-ink/10 hover:text-ink disabled:opacity-50"
                >
                  Reddet
                </button>
              </div>
            </div>
          )}

        <ChatBox
          offerId={offer.id}
          userId={userId}
          otherUserId={founderId}
          otherUserName={founderName ?? "Fikir Sahibi"}
          projectId={projectId}
        />
      </div>
    );
  }

  return (
    <div className="mt-8 rounded-xl bg-white shadow-[inset_0_1px_0_rgba(255,255,255,0.9),inset_0_-1px_0_rgba(17,24,39,0.05),0_2px_8px_rgba(17,24,39,0.05),0_16px_40px_rgba(17,24,39,0.10)] p-8">
      <h2 className="text-lg font-bold text-ink">Teklif Ver</h2>
      <div className="mt-4 flex flex-col gap-3">
        {typeIsChoosable && (
          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => setOfferPaymentType("fixed")}
              className={`flex-1 rounded-full px-4 py-1.5 text-sm font-semibold transition-all ${
                offerPaymentType === "fixed"
                  ? "bg-coral text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.35),0_3px_0_0_var(--color-coral-dark),0_6px_14px_rgba(239,68,104,0.30)] active:translate-y-0.5 active:shadow-[inset_0_1px_0_rgba(255,255,255,0.35),0_0px_0_0_var(--color-coral-dark),0_2px_6px_rgba(239,68,104,0.25)]"
                  : "bg-ink/5 text-ink-soft shadow-[inset_0_1px_3px_rgba(17,24,39,0.06)]"
              }`}
            >
              Sabit Ücret
            </button>
            <button
              type="button"
              onClick={() => setOfferPaymentType("equity")}
              className={`flex-1 rounded-full px-4 py-1.5 text-sm font-semibold transition-all ${
                offerPaymentType === "equity"
                  ? "bg-periwinkle-dark text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.35),0_3px_0_0_#5b21b6,0_6px_14px_rgba(109,40,217,0.30)] active:translate-y-0.5 active:shadow-[inset_0_1px_0_rgba(255,255,255,0.35),0_0px_0_0_#5b21b6,0_2px_6px_rgba(109,40,217,0.25)]"
                  : "bg-ink/5 text-ink-soft shadow-[inset_0_1px_3px_rgba(17,24,39,0.06)]"
              }`}
            >
              Ortaklık
            </button>
          </div>
        )}
        <textarea
          placeholder="Bu proje için neden doğru kişi olduğunu anlat..."
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          rows={4}
          className="resize-none rounded-lg bg-ink/5 shadow-[inset_0_2px_5px_rgba(17,24,39,0.08)] px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-coral/30"
        />
        <input
          type="number"
          min="0"
          placeholder={
            offerPaymentType === "fixed" ? "Teklif ettiğin tutar, ₺ (isteğe bağlı)" : "Teklif ettiğin pay, % (isteğe bağlı)"
          }
          value={proposedAmount}
          onChange={(e) => setProposedAmount(e.target.value)}
          className="rounded-lg bg-ink/5 shadow-[inset_0_2px_5px_rgba(17,24,39,0.08)] px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-coral/30"
        />
        <input
          type="text"
          placeholder="Kanıt linki: portfolyo, GitHub, vb. (isteğe bağlı)"
          value={proofLink}
          onChange={(e) => setProofLink(e.target.value)}
          className="rounded-lg bg-ink/5 shadow-[inset_0_2px_5px_rgba(17,24,39,0.08)] px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-coral/30"
        />
        <button
          onClick={handleSubmit}
          disabled={saving}
          className="self-start rounded-full bg-coral px-6 py-2 text-sm font-semibold text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.35),0_4px_0_0_var(--color-coral-dark),0_10px_20px_rgba(239,68,104,0.35)] transition-all hover:brightness-105 active:translate-y-1 active:shadow-[inset_0_1px_0_rgba(255,255,255,0.35),0_0px_0_0_var(--color-coral-dark),0_2px_6px_rgba(239,68,104,0.30)] disabled:opacity-50"
        >
          {saving ? "Gönderiliyor..." : "Teklifi Gönder"}
        </button>
      </div>
    </div>
  );
}
