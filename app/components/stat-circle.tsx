const TONES = {
  pink: "bg-[#FE9EC7]/25 text-[#c23570]",
  lime: "bg-[#8DD9A8]/30 text-[#1a7a52]",
  dark: "bg-ink text-white",
};

export default function StatCircle({
  value,
  label,
  tone = "pink",
  size = 140,
}: {
  value: string | number;
  label: string;
  tone?: keyof typeof TONES;
  size?: number;
}) {
  return (
    <div
      style={{ width: size, height: size }}
      className={`flex shrink-0 flex-col items-center justify-center rounded-full text-center ${TONES[tone]}`}
    >
      <span className="font-display text-3xl font-bold leading-none">{value}</span>
      <span className="mt-1.5 max-w-[80%] text-[10px] font-semibold uppercase leading-tight tracking-wide opacity-80">
        {label}
      </span>
    </div>
  );
}

export function StatPill({
  value,
  label,
}: {
  value: string | number;
  label: string;
  tone?: keyof typeof TONES;
}) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-lg border border-black/[0.08] bg-white px-3.5 py-1.5 text-xs font-medium text-ink-soft">
      <span className="text-sm font-semibold text-ink">{value}</span>
      {label}
    </span>
  );
}
