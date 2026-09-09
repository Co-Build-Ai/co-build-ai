import { ArrowRight, Terminal } from "lucide-react";

export default function DualEntrySection() {
  return (
    <section id="basla" className="px-6 pb-20 sm:px-12">
      <div className="mx-auto grid max-w-5xl gap-6 sm:grid-cols-2">
        {/* Fikir Sahibi kartı — yumuşak, davetkar, yuvarlak hatlı (Inter) */}
        <div className="flex flex-col rounded-3xl bg-gradient-to-br from-petal to-white p-8 shadow-[inset_0_1px_0_rgba(255,255,255,0.9),0_2px_8px_rgba(17,24,39,0.05),0_16px_40px_rgba(17,24,39,0.10)] sm:p-10">
          <span className="w-fit rounded-full bg-coral/10 px-3 py-1 text-xs font-semibold text-coral-dark">
            Fikir Sahibi
          </span>
          <h2 className="mt-4 text-2xl font-extrabold tracking-tight text-ink sm:text-3xl">
            Ham Fikrini Projelendir
          </h2>
          <p className="mt-3 flex-1 text-sm leading-relaxed text-ink-soft sm:text-base">
            Teknik bilgiye ihtiyacın yok. Sadece fikrini anlat; yapay zeka senin için
            profesyonel bir teknik şartname (PRD) hazırlasın ve seni en doğru ekiple
            eşleştirsin.
          </p>
          <a
            href="/kayit-ol?tip=founder"
            className="mt-8 flex items-center justify-center gap-2 rounded-full bg-coral px-6 py-3.5 text-base font-semibold text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.35),0_4px_0_0_var(--color-coral-dark),0_10px_20px_rgba(239,68,104,0.35)] transition-all hover:brightness-105 active:translate-y-1 active:shadow-[inset_0_1px_0_rgba(255,255,255,0.35),0_0px_0_0_var(--color-coral-dark),0_2px_6px_rgba(239,68,104,0.30)]"
          >
            Girişimci Olarak Başla
            <ArrowRight size={18} />
          </a>
        </div>

        {/* Yazılımcı kartı — terminal/kod editörü hissiyatı (JetBrains Mono) */}
        <div className="flex flex-col rounded-3xl bg-ink p-8 font-mono shadow-[0_2px_8px_rgba(17,24,39,0.05),0_16px_40px_rgba(17,24,39,0.25)] sm:p-10">
          <span className="flex w-fit items-center gap-1.5 rounded-full bg-periwinkle/20 px-3 py-1 text-xs font-semibold text-periwinkle">
            <Terminal size={12} />
            developer
          </span>
          <h2 className="mt-4 text-2xl font-bold tracking-tight text-white sm:text-3xl">
            {"<Developer_Login />"}
          </h2>
          <p className="mt-3 flex-1 text-sm leading-relaxed text-white/60 sm:text-base">
            {"// Agentic RAG tarafından onaylanmış, teknik gereksinimleri net"}
            <br />
            {"// projelere katıl. Patentlerini sisteme tanıt, pgvector semantik"}
            <br />
            {"// aramada Top-5 listesine gir."}
          </p>
          <a
            href="/kayit-ol?tip=developer"
            className="mt-8 flex items-center justify-center gap-2 rounded-lg border border-periwinkle/40 bg-white/5 px-6 py-3.5 text-base font-semibold text-periwinkle transition-colors hover:bg-periwinkle/10"
          >
            [ execute_join() ]
          </a>
        </div>
      </div>

      {/* Dual hesap — ikisini de yapmak isteyenler için düşük vurgulu, tek satırlık üçüncü giriş */}
      <div className="mx-auto mt-6 flex max-w-5xl flex-col items-center justify-between gap-3 rounded-2xl border border-ink/10 bg-white/60 px-6 py-4 text-center sm:flex-row sm:text-left">
        <p className="text-sm text-ink-soft">
          <span className="font-semibold text-ink">Hem fikrin var hem kod yazabiliyor musun?</span>{" "}
          Tek hesapla hem fikrini geliştir hem kendine ortak yazılımcı ara — dilediğin an
          Fikir Sahibi / Yazılımcı modu arasında geçiş yaparsın.
        </p>
        <a
          href="/kayit-ol?tip=both"
          className="shrink-0 rounded-full border border-ink/15 px-5 py-2 text-sm font-semibold text-ink transition-colors hover:bg-ink/5"
        >
          İkisi de — Ortak Arıyorum
        </a>
      </div>
    </section>
  );
}
