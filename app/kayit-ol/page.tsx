"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/utils/supabase/client";

export default function KayitOl() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const supabase = createClient();
  

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [userType, setUserType] = useState<"founder" | "developer" | "both">("founder");
    const [termsAccepted, setTermsAccepted] = useState(false);
  
  useEffect(() => {
    const tip = searchParams.get("tip");
    if (tip === "developer" || tip === "founder" || tip === "both") {
      setUserType(tip);
    }
  }, [searchParams]);
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!termsAccepted) {
      setError("Devam etmek için aydınlatma metnini onaylaman gerekiyor.");
      return;
    }
    
    setLoading(true);
    setError(null);

    // 1. Adım: Supabase Authentication ile kullanıcıyı oluştur
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
    });

    if (authError) {
      setError(authError.message);
      setLoading(false);
      return;
    }

    if (!authData.user) {
      setError("Kayıt sırasında beklenmeyen bir hata oluştu.");
      setLoading(false);
      return;
    }

    // 2. Adım: profiles tablosuna ek bilgileri kaydet
        const { error: profileError } = await supabase.from("profiles").insert({
      id: authData.user.id,
      user_type: userType,
      active_role: userType === "both" ? "founder" : null,
      full_name: fullName,
      terms_accepted_at: new Date().toISOString(),
    });

    if (profileError) {
      setError(profileError.message);
      setLoading(false);
      return;
    }

    setLoading(false);
    router.push("/panel");
  }

  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden px-6 py-16">
      <div className="landing-bg" />
      <div className="relative w-full max-w-md rounded-3xl border border-white/60 bg-white/80 p-8 shadow-xl shadow-slate-200/50 backdrop-blur-md sm:p-10">
        <h1 className="text-center text-3xl font-extrabold tracking-tight text-ink">
          Co-Build AI&apos;a Katıl
        </h1>
        <p className="mt-2 text-center text-sm text-ink-soft">
          Fikrini hayata geçirmeye ilk adımı at.
        </p>

        <form onSubmit={handleSubmit} className="mt-8 flex flex-col gap-4">
          <div>
            <label className="block text-sm font-medium text-ink">
              Ben bir...
            </label>
            <div className="mt-2 grid grid-cols-1 gap-3 sm:grid-cols-3">
              <button
                type="button"
                onClick={() => setUserType("founder")}
                className={`rounded-xl border-2 px-4 py-3 text-sm font-semibold transition-colors ${
                  userType === "founder"
                    ? "border-[#FE9EC7] bg-[#FE9EC7]/15 text-[#c23570]"
                    : "border-ink/10 text-ink-soft"
                }`}
              >
                Fikir Sahibiyim
              </button>
              <button
                type="button"
                onClick={() => setUserType("developer")}
                className={`rounded-xl border-2 px-4 py-3 text-sm font-semibold transition-colors ${
                  userType === "developer"
                    ? "border-[#8DD9A8] bg-[#8DD9A8]/20 text-[#1a7a52]"
                    : "border-ink/10 text-ink-soft"
                }`}
              >
                Yazılımcıyım
              </button>
              <button
                type="button"
                onClick={() => setUserType("both")}
                className={`rounded-xl border-2 px-4 py-3 text-sm font-semibold transition-colors ${
                  userType === "both"
                    ? "border-[#44ACFF] bg-[#44ACFF]/15 text-[#1666a8]"
                    : "border-ink/10 text-ink-soft"
                }`}
              >
                İkisi de — Ortak Arıyorum
              </button>
            </div>
          </div>

          <div>
            <label htmlFor="fullName" className="block text-sm font-medium text-ink">
              Ad Soyad
            </label>
            <input
              id="fullName"
              type="text"
              required
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className="mt-1 w-full rounded-lg border border-black/[0.08] bg-black/[0.02] px-4 py-2.5 text-ink outline-none focus:ring-2 focus:ring-[#8DD9A8]/40"
            />
          </div>

          <div>
            <label htmlFor="email" className="block text-sm font-medium text-ink">
              E-posta
            </label>
            <input
              id="email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mt-1 w-full rounded-lg border border-black/[0.08] bg-black/[0.02] px-4 py-2.5 text-ink outline-none focus:ring-2 focus:ring-[#8DD9A8]/40"
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium text-ink">
              Şifre
            </label>
            <input
              id="password"
              type="password"
              required
              minLength={6}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="mt-1 w-full rounded-lg border border-black/[0.08] bg-black/[0.02] px-4 py-2.5 text-ink outline-none focus:ring-2 focus:ring-[#8DD9A8]/40"
            />
          </div>

          <label className="flex items-start gap-3 text-sm text-ink-soft">
            <input
              type="checkbox"
              checked={termsAccepted}
              onChange={(e) => setTermsAccepted(e.target.checked)}
              className="mt-1 h-4 w-4 shrink-0 accent-[#8DD9A8]"
            />
            <span>
              Platforma girdiğim proje bilgilerinin ve hesap verilerimin
              veritabanında saklandığını, olası bir anlaşmazlık durumunda
              taraflar arasındaki süreci netleştirmek amacıyla referans
              olarak kullanılabileceğini okudum, kabul ediyorum.
            </span>
          </label>

          
          {error && (
            <p className="text-sm text-red-600">{error}</p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="mt-2 rounded-full bg-gradient-to-r from-[#8DD9A8] to-[#FE9EC7] px-6 py-3.5 text-base font-semibold text-white shadow-[0_10px_24px_rgba(141,217,168,0.35)] transition-all hover:-translate-y-0.5 hover:shadow-[0_14px_30px_rgba(141,217,168,0.45)] active:translate-y-0 disabled:opacity-50"
          >
            {loading ? "Kaydediliyor..." : "Hesap Oluştur"}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-ink-soft">
          Zaten hesabın var mı?{" "}
          <a href="/giris" className="font-semibold text-[#1a7a52]">
            Giriş yap
          </a>
        </p>
      </div>
    </div>
  );
}