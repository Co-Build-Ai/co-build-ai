import { Cpu, RefreshCw, ShieldCheck, Network } from "lucide-react";

const ITEMS = [
  {
    icon: Cpu,
    title: "vLLM & Qwen",
    description:
      "Qwen2.5-32B, kendi GPU sunucumuzda vLLM ile çalışıyor. Fikrin hiçbir zaman OpenAI/Gemini gibi dış API'lere gitmiyor.",
    status: "live" as const,
  },
  {
    icon: RefreshCw,
    title: "Agentic RAG",
    description:
      "Teknik şartnameyi tek seferde değil, kendi çıktısını denetleyip revize eden bir agent döngüsüyle üretiyor.",
    status: "live" as const,
  },
  {
    icon: ShieldCheck,
    title: "Patent Doğrulama",
    description:
      "Fikrini mevcut patentlerle kıyaslayan ön kontrol ve tescilli mucitlere eşleştirmede öncelik veren çarpan sistemi.",
    status: "soon" as const,
  },
  {
    icon: Network,
    title: "Semantik Eşleştirme",
    description:
      "Supabase pgvector ile embedding tabanlı arama; anahtar kelimeye değil anlama göre en uygun yazılımcıları buluyor.",
    status: "live" as const,
  },
];

export default function ArchitectureSection() {
  return (
    <section id="nasil-calisir" className="border-t border-ink/10 bg-petal/40 px-6 py-20 sm:px-12">
      <h2 className="text-center text-3xl font-extrabold tracking-tight text-ink">
        Arka Planda Ne Çalışıyor?
      </h2>
      <p className="mx-auto mt-3 max-w-xl text-center text-sm text-ink-soft">
        Fikrini yazdığın andan yazılımcıyla eşleştiğin ana kadar devrede olan teknoloji.
      </p>

      <div className="mx-auto mt-14 grid max-w-5xl gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {ITEMS.map((item) => {
          const Icon = item.icon;
          return (
            <div
              key={item.title}
              className="flex flex-col rounded-2xl bg-white p-6 shadow-[inset_0_1px_0_rgba(255,255,255,0.9),0_2px_8px_rgba(17,24,39,0.05),0_16px_40px_rgba(17,24,39,0.08)]"
            >
              <div className="flex items-center justify-between">
                <span className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-coral to-periwinkle-dark text-white">
                  <Icon size={18} />
                </span>
                {item.status === "soon" && (
                  <span className="rounded-full bg-ink/5 px-2.5 py-1 font-mono text-[10px] font-semibold uppercase tracking-wide text-ink-soft">
                    Yakında
                  </span>
                )}
              </div>
              <h3 className="mt-4 text-base font-bold text-ink">{item.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-ink-soft">{item.description}</p>
            </div>
          );
        })}
      </div>
    </section>
  );
}
