import HeroSection from "./components/landing/hero-section";
import DualEntrySection from "./components/landing/dual-entry-section";
import ArchitectureSection from "./components/landing/architecture-section";

export default function Home() {
  return (
    <div className="flex flex-col flex-1 bg-background">
      <header className="flex items-center justify-between px-6 py-5 sm:px-12">
        <span className="text-xl font-extrabold tracking-tight text-ink">
          Co-Build AI
        </span>
        <nav className="hidden items-center gap-8 text-sm font-medium text-ink-soft sm:flex">
          <a href="#nasil-calisir" className="hover:text-ink">
            Nasıl Çalışır
          </a>
          <a href="#basla" className="hover:text-ink">
            Yazılımcılar İçin
          </a>
        </nav>
        <div className="flex items-center gap-4">
          <a href="/giris" className="text-sm font-semibold text-ink-soft hover:text-ink">
            Giriş Yap
          </a>
          <a
            href="#basla"
            className="rounded-full bg-coral px-5 py-2.5 text-sm font-semibold text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.35),0_4px_0_0_var(--color-coral-dark),0_10px_20px_rgba(239,68,104,0.35)] transition-all hover:brightness-105 active:translate-y-1 active:shadow-[inset_0_1px_0_rgba(255,255,255,0.35),0_0px_0_0_var(--color-coral-dark),0_2px_6px_rgba(239,68,104,0.30)]"
          >
            Ücretsiz Başla
          </a>
        </div>
      </header>

      <main className="flex flex-1 flex-col bg-gradient-to-b from-petal via-white to-white">
        <HeroSection />
        <DualEntrySection />
      </main>

      <ArchitectureSection />

      <footer className="px-6 py-8 text-center text-sm text-ink-soft sm:px-12">
        © 2026 Co-Build AI
      </footer>
    </div>
  );
}
