import HeroSection from "./components/landing/hero-section";
import DualEntrySection from "./components/landing/dual-entry-section";
import HowItWorksSection from "./components/landing/how-it-works-section";
import BenefitsSection from "./components/landing/benefits-section";
import ArchitectureSection from "./components/landing/architecture-section";
import ScrollEffects from "./components/landing/scroll-effects";

function LoopBody({ idSuffix = "" }: { idSuffix?: string }) {
  return (
    <>
      <main className="flex flex-1 flex-col">
        <HeroSection />
        <DualEntrySection idSuffix={idSuffix} />
        <HowItWorksSection />
      </main>

      <BenefitsSection />
      <ArchitectureSection idSuffix={idSuffix} />

      <footer className="bg-white/10 px-6 py-10 shadow-[0_-16px_30px_-20px_rgba(15,23,42,0.35)] backdrop-blur-md sm:px-12">
        <div className="mx-auto flex max-w-5xl flex-col items-center justify-between gap-6 sm:flex-row">
          <div className="text-center sm:text-left">
            <span className="font-[family-name:var(--font-clash-display)] text-base font-bold text-white">
              Co-Build AI
            </span>
            <p className="mt-1 max-w-xs text-xs text-white/70">
              Fikir sahiplerini ve yazılımcıları, kendi GPU sunucumuzda çalışan açık
              kaynak yapay zekayla buluşturan kuluçka merkezi.
            </p>
          </div>
          <nav className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-sm text-white/75">
            <a href="#nasil-calisir" className="hover:text-white">
              Nasıl Çalışır
            </a>
            <a href="#basla" className="hover:text-white">
              Katıl
            </a>
            <a href="/giris" className="hover:text-white">
              Giriş Yap
            </a>
          </nav>
        </div>
        <p className="mt-8 text-center text-xs text-white/60">© 2026 Co-Build AI</p>
      </footer>
    </>
  );
}

export default function Home() {
  return (
    <div className="flex flex-1 flex-col font-[family-name:var(--font-satoshi)]">
      <div className="landing-bg" />
      <ScrollEffects />

      <header className="sticky top-0 z-40 flex items-center justify-between bg-white/10 px-6 py-5 shadow-[0_8px_24px_-14px_rgba(15,23,42,0.4)] backdrop-blur-md sm:px-12">
        <span className="font-[family-name:var(--font-clash-display)] text-lg font-bold text-white">
          Co-Build AI
        </span>
        <nav className="hidden items-center gap-8 text-sm font-medium text-white/80 sm:flex">
          <a href="#nasil-calisir" className="hover:text-white">
            Nasıl Çalışır
          </a>
          <a href="#basla" className="hover:text-white">
            Yazılımcılar İçin
          </a>
        </nav>
        <div className="flex items-center gap-4">
          <a href="/giris" className="text-sm font-semibold text-white/80 hover:text-white">
            Giriş Yap
          </a>
          <a
            href="#basla"
            className="rounded-full bg-black px-5 py-2.5 text-sm font-semibold text-white shadow-[0_10px_22px_rgba(0,0,0,0.5)] transition-all hover:-translate-y-0.5 hover:shadow-[0_14px_28px_rgba(0,0,0,0.6)] active:translate-y-0"
          >
            Ücretsiz Başla
          </a>
        </div>
      </header>

      <div id="loop-copy-0">
        <LoopBody />
      </div>
      <div id="loop-copy-1" aria-hidden="true">
        <LoopBody idSuffix="-2" />
      </div>
    </div>
  );
}
