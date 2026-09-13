import { Lock, Zap, Target, MessageCircle } from "lucide-react";

const BENEFITS = [
  {
    icon: Lock,
    title: "Verilerin Güvende",
    description:
      "PRD üretimi kendi GPU sunucumuzda, açık kaynak bir modelle çalışır, dış API'lere bağımlı kalmaz.",
  },
  {
    icon: Zap,
    title: "Dakikalar İçinde Şartname",
    description:
      "Birkaç cümlelik fikrin, kendi kendini denetleyip düzelten bir agent döngüsüyle profesyonel bir PRD'ye dönüşür.",
  },
  {
    icon: Target,
    title: "Anlam Bazlı Eşleştirme",
    description:
      "Anahtar kelime eşleşmesi değil, embedding tabanlı semantik arama ileprojenin gerçekten ihtiyaç duyduğu beceriler öne çıkar.",
  },
  {
    icon: MessageCircle,
    title: "Süreç Boyunca Şeffaflık",
    description:
      "Teklif, anlık sohbet ve bildirimlerle fikir sahibi ve yazılımcı, projenin her adımında aynı sayfada kalır.",
  },
];

export default function BenefitsSection() {
  return (
    <section className="px-6 py-20 sm:px-12">
      <div className="reveal mx-auto max-w-2xl text-center">
        <span className="w-fit text-sm font-semibold uppercase tracking-widest text-[#44ACFF]">
          Neden Co-Build AI?
        </span>
        <h2 className="mt-4 font-[family-name:var(--font-jakarta)] text-3xl font-semibold tracking-tight text-slate-800 sm:text-4xl">
          Fikirle Yetenek Arasındaki Mesafeyi Kısaltıyoruz
        </h2>
      </div>

      <div className="mx-auto mt-14 grid max-w-5xl gap-6 sm:grid-cols-2">
        {BENEFITS.map((benefit) => {
          const Icon = benefit.icon;
          return (
            <div
              key={benefit.title}
              className="reveal flex gap-4 rounded-2xl bg-white/80 p-8 shadow-sm transition-shadow hover:shadow-md"
            >
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[#44ACFF] text-white shadow-sm">
                <Icon size={18} />
              </span>
              <div>
                <h3 className="text-base font-bold text-slate-800">{benefit.title}</h3>
                <p className="mt-1.5 text-sm leading-relaxed text-slate-600">{benefit.description}</p>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
