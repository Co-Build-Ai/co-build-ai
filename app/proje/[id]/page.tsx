import PrdStatus from "./prd-status";
import EditablePrd from "./editable-prd";
import MatchedDevelopers, { type MatchedDeveloper } from "./matched-developers";
import { redirect, notFound } from "next/navigation";
import { createClient } from "@/utils/supabase/server";
import { PublishForm, PaymentEditor } from "./payment-section";
import DeveloperProjectView from "./developer-project-view";
import OffersList from "./offers-list";
import { canActAsDeveloper } from "@/app/lib/roles";
import UnpublishProject from "./unpublish-project";

type OfferRow = {
  id: string;
  message: string;
  proposed_amount: number | null;
  proof_link: string | null;
  payment_type: "fixed" | "equity" | null;
  status: "pending" | "accepted" | "rejected";
  completed_at: string | null;
  developer_id: string;
  removal_requested_by_founder_at: string | null;
  removal_approved_by_developer_at: string | null;
  github_repo_url: string | null;
};

async function fetchRatingSummary(
  supabase: Awaited<ReturnType<typeof createClient>>,
  ratedUserId: string
) {
  const { data } = await supabase.from("ratings").select("score").eq("rated_user_id", ratedUserId);
  const scores = data ?? [];
  const count = scores.length;
  const avg = count > 0 ? scores.reduce((sum, r) => sum + r.score, 0) / count : null;
  return { avg, count };
}

async function hasRated(
  supabase: Awaited<ReturnType<typeof createClient>>,
  offerId: string,
  raterId: string
) {
  const { data } = await supabase
    .from("ratings")
    .select("id")
    .eq("offer_id", offerId)
    .eq("rater_id", raterId)
    .maybeSingle();
  return !!data;
}

export default async function ProjeDetay({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/giris");
  }

  const { data: project } = await supabase
    .from("projects")
    .select("*")
    .eq("id", id)
    .single();

  if (!project) {
    notFound();
  }

  const isFounder = project.founder_id === user.id;
  let developerView:
    | {
        alreadyAccepted: boolean;
        offer: (OfferRow & { alreadyRatedByMe: boolean }) | null;
        founderName: string | null;
        founderRatingAvg: number | null;
        founderRatingCount: number;
      }
    | null = null;
  let offers: (OfferRow & {
    developer: {
      full_name: string | null;
      bio: string | null;
      skills: string[] | null;
      availability: string | null;
    } | null;
    developerRatingAvg: number | null;
    developerRatingCount: number;
    alreadyRatedByMe: boolean;
  })[] = [];
  let founderDefaults: { paymentType: "fixed" | "equity" | "flexible" | null; paymentAmount: number | null } = {
    paymentType: null,
    paymentAmount: null,
  };

  if (!isFounder) {
    // Sadece yayınlanmış projeler başka kullanıcılara açık
    if (project.status !== "published") {
      redirect("/panel");
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("user_type")
      .eq("id", user.id)
      .single();

    // Sadece yazılımcılar (veya dual hesaplar) başkasının projesini görüntüleyebilir
    if (!canActAsDeveloper(profile?.user_type)) {
      redirect("/panel");
    }

    const { data: ndaAcceptance } = await supabase
      .from("project_nda_acceptances")
      .select("id")
      .eq("project_id", project.id)
      .eq("developer_id", user.id)
      .maybeSingle();

    const { data: myOffer } = await supabase
      .from("offers")
      .select("*")
      .eq("project_id", project.id)
      .eq("developer_id", user.id)
      .maybeSingle();

    const { data: founderProfile } = await supabase
      .from("profiles")
      .select("full_name")
      .eq("id", project.founder_id)
      .maybeSingle();

    const founderRating = await fetchRatingSummary(supabase, project.founder_id);
    const alreadyRatedByMe =
      myOffer && myOffer.completed_at ? await hasRated(supabase, myOffer.id, user.id) : false;

    developerView = {
      alreadyAccepted: !!ndaAcceptance,
      offer: myOffer ? { ...myOffer, alreadyRatedByMe } : null,
      founderName: founderProfile?.full_name ?? null,
      founderRatingAvg: founderRating.avg,
      founderRatingCount: founderRating.count,
    };
  } else if (project.status === "draft") {
    const { data: founderProfile } = await supabase
      .from("profiles")
      .select("default_payment_type, default_payment_amount")
      .eq("id", user.id)
      .maybeSingle();

    founderDefaults = {
      paymentType: founderProfile?.default_payment_type ?? null,
      paymentAmount: founderProfile?.default_payment_amount ?? null,
    };
  }

  if (isFounder && project.status === "published") {
    const { data: offersData } = await supabase
      .from("offers")
      .select("*")
      .eq("project_id", project.id)
      .order("created_at", { ascending: false });

    if (offersData && offersData.length > 0) {
      const developerIds = offersData.map((o) => o.developer_id);
      const { data: devProfiles } = await supabase
        .from("profiles")
        .select("id, full_name, bio, skills, availability")
        .in("id", developerIds);

      offers = await Promise.all(
        offersData.map(async (o) => {
          const rating = await fetchRatingSummary(supabase, o.developer_id);
          const alreadyRatedByMe = o.completed_at ? await hasRated(supabase, o.id, user.id) : false;
          return {
            ...o,
            developer: devProfiles?.find((p) => p.id === o.developer_id) ?? null,
            developerRatingAvg: rating.avg,
            developerRatingCount: rating.count,
            alreadyRatedByMe,
          };
        })
      );
    }
  }

  // PRD üretimi bitince beceri uyumuna göre hesaplanan top-5 yazılımcı listesi
  // (bkz. prd-status.tsx). Boşsa MatchedDevelopers zaten hiçbir şey render etmiyor.
  const matchedDevelopers = (project.matched_developers ?? []) as MatchedDeveloper[];

  // PRD + eşleşen yazılımcılar iki sütun halinde gösterileceği için (sadece
  // founder, PRD zaten üretilmişken) bu durumda sayfayı biraz genişletiyoruz.
  // Diğer tüm durumlarda (developer görünümü, PRD henüz yok vb.) mevcut dar
  // okuma genişliği (max-w-2xl) aynen korunuyor.
  const twoColumnLayout = !developerView && !!project.generated_prd;

  return (
    <div className="min-h-screen bg-background px-6 py-10 sm:px-12">
      <div className={`mx-auto ${twoColumnLayout ? "max-w-5xl" : "max-w-2xl"}`}>
        <a href="/panel" className="text-sm font-medium text-ink-soft hover:text-ink">
          ← Panele Dön
        </a>

        <div className="mt-6 flex items-center justify-between">
          <h1 className="text-2xl font-extrabold tracking-tight text-ink">
            {project.title}
          </h1>
          <span
            className={`rounded-full px-3 py-1 text-xs font-semibold ${
              project.status === "published"
                ? "bg-periwinkle-dark text-white"
                : "bg-petal text-coral-dark"
            }`}
          >
            {project.status === "published" ? "Yayında" : "Taslak"}
          </span>
        </div>

        {developerView ? (
          <DeveloperProjectView
            projectId={project.id}
            userId={user.id}
            founderId={project.founder_id}
            founderName={developerView.founderName}
            founderRatingAvg={developerView.founderRatingAvg}
            founderRatingCount={developerView.founderRatingCount}
            requiredSkills={project.required_skills}
            prd={project.generated_prd}
            alreadyAccepted={developerView.alreadyAccepted}
            paymentType={project.payment_type}
            paymentAmount={project.payment_amount}
            initialOffer={developerView.offer}
          />
        ) : (
          <>
            {project.required_skills && project.required_skills.length > 0 && (
              <div className="mt-4 flex flex-wrap gap-2">
                {project.required_skills.map((skill: string) => (
                  <span
                    key={skill}
                    className="rounded-full bg-periwinkle/20 px-3 py-1 font-mono text-xs text-ink"
                  >
                    {skill}
                  </span>
                ))}
              </div>
            )}

            {!project.generated_prd ? (
              <PrdStatus projectId={project.id} />
            ) : (
              <>
                {/* PRD (sol) ve AI'nin eşleştirdiği yazılımcılar (sağ) yan yana */}
                <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,0.85fr)] lg:items-start">
                  <EditablePrd projectId={project.id} initialPrd={project.generated_prd} />
                  <MatchedDevelopers developers={matchedDevelopers} />
                </div>

                {project.status === "draft" && (
                  <div className="mt-8 flex flex-col items-center gap-3 rounded-xl bg-white shadow-[inset_0_1px_0_rgba(255,255,255,0.9),inset_0_-1px_0_rgba(17,24,39,0.05),0_2px_8px_rgba(17,24,39,0.05),0_16px_40px_rgba(17,24,39,0.10)] p-6 text-center">
                    <p className="text-sm text-ink-soft">
                      PRD&apos;yi inceledin mi? Her şey doğru görünüyorsa, ödeme
                      tipini seçip projeni yazılımcılara açabilirsin.
                    </p>
                    <PublishForm
                      projectId={project.id}
                      defaultPaymentType={founderDefaults.paymentType}
                      defaultPaymentAmount={founderDefaults.paymentAmount}
                    />
                  </div>
                )}

                {project.status === "published" && (
                  <>
                    <PaymentEditor
                      projectId={project.id}
                      initialPaymentType={project.payment_type}
                      initialPaymentAmount={project.payment_amount}
                    />
                    <UnpublishProject
                      projectId={project.id}
                      projectTitle={project.title}
                      acceptedOffer={
                        (() => {
                          const accepted = offers.find((o) => o.status === "accepted");
                          return accepted
                            ? {
                                id: accepted.id,
                                developerId: accepted.developer_id,
                                removalRequestedByFounderAt: accepted.removal_requested_by_founder_at,
                                removalApprovedByDeveloperAt: accepted.removal_approved_by_developer_at,
                              }
                            : null;
                        })()
                      }
                    />
                    <OffersList
                      projectId={project.id}
                      projectTitle={project.title}
                      founderId={user.id}
                      initialOffers={offers}
                    />
                  </>
                )}
              </>
            )}
          </>
        )}
      </div>
    </div>
  );
}
