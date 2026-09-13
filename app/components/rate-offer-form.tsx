"use client";

import { useState } from "react";
import { Star } from "lucide-react";
import { createClient } from "@/utils/supabase/client";

export default function RateOfferForm({
  offerId,
  raterId,
  ratedUserId,
  ratedUserLabel,
  alreadyRated,
}: {
  offerId: string;
  raterId: string;
  ratedUserId: string;
  ratedUserLabel: string;
  alreadyRated: boolean;
}) {
  const supabase = createClient();
  const [rated, setRated] = useState(alreadyRated);
  const [score, setScore] = useState(0);
  const [hoverScore, setHoverScore] = useState(0);
  const [comment, setComment] = useState("");
  const [saving, setSaving] = useState(false);

  async function handleSubmit() {
    if (score === 0) return;
    setSaving(true);
    const { error } = await supabase.from("ratings").insert({
      offer_id: offerId,
      rater_id: raterId,
      rated_user_id: ratedUserId,
      score,
      comment: comment || null,
    });
    setSaving(false);
    if (!error) setRated(true);
  }

  if (rated) {
    return (
      <p className="mt-3 text-xs text-ink-soft">
        {ratedUserLabel} için değerlendirmeni gönderdin, teşekkürler.
      </p>
    );
  }

  return (
    <div className="mt-3 rounded-lg bg-ink/5 p-3">
      <p className="text-xs font-semibold text-ink">{ratedUserLabel}&apos;ı değerlendir</p>
      <div className="mt-2 flex gap-1">
        {[1, 2, 3, 4, 5].map((n) => (
          <button
            key={n}
            type="button"
            onMouseEnter={() => setHoverScore(n)}
            onMouseLeave={() => setHoverScore(0)}
            onClick={() => setScore(n)}
          >
            <Star
              size={20}
              className={
                n <= (hoverScore || score) ? "fill-coral text-coral" : "text-ink/20"
              }
            />
          </button>
        ))}
      </div>
      <textarea
        value={comment}
        onChange={(e) => setComment(e.target.value)}
        placeholder="Kısa bir yorum (isteğe bağlı)"
        rows={2}
        className="mt-2 w-full resize-none rounded-lg border border-black/[0.08] bg-black/[0.02] px-3 py-2 text-xs outline-none focus:ring-2 focus:ring-[#8DD9A8]/40"
      />
      <button
        onClick={handleSubmit}
        disabled={score === 0 || saving}
        className="mt-2 rounded-full bg-[#1a7a52] px-4 py-1.5 text-xs font-medium text-white transition-colors hover:bg-[#15633f] disabled:opacity-50"
      >
        {saving ? "Gönderiliyor..." : "Değerlendirmeyi Gönder"}
      </button>
    </div>
  );
}
