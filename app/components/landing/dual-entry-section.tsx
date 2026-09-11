import { ArrowRight, Terminal, Shuffle } from "lucide-react";

export default function DualEntrySection({ idSuffix = "" }: { idSuffix?: string }) {
  return (
    <section id={`basla${idSuffix}`} className="px-6 pb-20 sm:px-12">
      <div className="reveal mx-auto max-w-3xl text-center">
        <span className="badge-soft w-fit rounded-full bg-white px-4 py-1.5 font-mono text-[11px] font-semibold uppercase tracking-widest text-[#063ecc]">
          Sana uygun kapıyı seç
        </span>
        <h2 className="mt-4 font-[family-name:var(--font-clash-display)] text-3xl font-bold tracking-tight text-white sm:text-4xl">
          <span className="highlight-sweep">Nasıl Katılmak İstersin?</span>
        </h2>
      </div>

      <div className="mx-auto mt-10 grid max-w-6xl gap-6 lg:grid-cols-3">
        {/* Fikir Sahibi kartı */}
        <div className="reveal panel-3d panel-outline flex flex-col rounded-3xl bg-[#f70d19] p-8">
          <span className="w-fit rounded-full bg-black/15 px-3 py-1 text-xs font-semibold text-black">
            Fikir Sahibi
          </span>
          <h3 className="mt-4 font-[family-name:var(--font-clash-display)] text-2xl font-bold tracking-tight text-black">
            Ham Fikrini Projelendir
          </h3>
          <p className="mt-3 flex-1 text-sm leading-relaxed text-black/80">
            Teknik bilgiye ihtiyacın yok. Sadece fikrini anlat; yapay zeka senin için
            profesyonel bir teknik şartname (PRD) hazırlasın ve seni en doğru ekiple
            eşleştirsin.
          </p>
          <a
            href="/kayit-ol?tip=founder"
            className="mt-8 flex items-center justify-center gap-2 rounded-full bg-black px-6 py-3.5 text-base font-semibold text-white shadow-[0_10px_20px_rgba(0,0,0,0.4)] transition-all hover:-translate-y-0.5 active:translate-y-0"
          >
            Girişimci Olarak Başla
            <ArrowRight size={18} />
          </a>
        </div>

        {/* Yazılımcı kartı — terminal hissiyatı */}
        <div className="reveal panel-3d panel-outline flex flex-col rounded-3xl bg-[#1423f7] p-8 font-mono">
          <span className="flex w-fit items-center gap-1.5 rounded-full bg-black/15 px-3 py-1 text-xs font-semibold text-black">
            <Terminal size={12} />
            developer
          </span>
          <h3 className="mt-4 text-2xl font-bold tracking-tight text-black">
            {"<Developer_Login />"}
          </h3>
          <p className="mt-3 flex-1 text-sm leading-relaxed text-black/70">
            {"// Agentic RAG tarafından onaylanmış, teknik gereksinimleri net"}
            <br />
            {"// projelere katıl. Patentlerini sisteme tanıt, pgvector semantik"}
            <br />
            {"// aramada Top-5 listesine gir."}
          </p>
          <a
            href="/kayit-ol?tip=developer"
            className="mt-8 flex items-center justify-center gap-2 rounded-lg bg-black px-6 py-3.5 text-base font-semibold text-white shadow-[0_10px_20px_rgba(0,0,0,0.4)] transition-colors hover:bg-black/80"
          >
            [ execute_join() ]
          </a>
        </div>

        {/* Dual hesap kartı */}
        <div className="reveal panel-3d panel-outline flex flex-col rounded-3xl bg-[#5414f7] p-8">
          <span className="flex w-fit items-center gap-1.5 rounded-full bg-black/15 px-3 py-1 text-xs font-semibold text-black">
            <Shuffle size={12} />
            Hem fikir hem kod
          </span>
          <h3 className="mt-4 font-[family-name:var(--font-clash-display)] text-2xl font-bold tracking-tight text-black">
            İkisini Birden Yap
          </h3>
          <p className="mt-3 flex-1 text-sm leading-relaxed text-black/80">
            Hem fikrin var hem kod yazabiliyor musun? Tek hesapla hem fikrini geliştir hem
            kendine ortak yazılımcı ara — dilediğin an Fikir Sahibi / Yazılımcı modu
            arasında geçiş yaparsın.
          </p>
          <a
            href="/kayit-ol?tip=both"
            className="mt-8 flex items-center justify-center gap-2 rounded-full bg-black px-6 py-3.5 text-base font-semibold text-white shadow-[0_10px_20px_rgba(0,0,0,0.4)] transition-all hover:-translate-y-0.5 active:translate-y-0"
          >
            Dual Hesap Aç
            <ArrowRight size={18} />
          </a>
        </div>
      </div>
    </section>
  );
}
