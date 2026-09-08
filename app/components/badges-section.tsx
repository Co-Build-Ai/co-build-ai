import { Lightbulb, Rocket, Inbox, Send, CheckCircle, Briefcase } from "lucide-react";

const BADGE_ICONS = {
  Lightbulb,
  Rocket,
  Inbox,
  Send,
  CheckCircle,
  Briefcase,
};

export type Badge = {
  id: string;
  label: string;
  icon: keyof typeof BADGE_ICONS;
  earned: boolean;
};

export default function BadgesSection({ badges }: { badges: Badge[] }) {
  if (badges.length === 0) return null;

  return (
    <div className="mt-10">
      <h2 className="font-mono text-xs font-semibold uppercase tracking-wide text-ink-soft">
        Rozetlerim
      </h2>
      <div className="mt-3 flex flex-wrap gap-3">
        {badges.map((badge) => {
          const Icon = BADGE_ICONS[badge.icon];
          return (
            <div
              key={badge.id}
              title={badge.label}
              className={`flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold ${
                badge.earned ? "bg-periwinkle/30 text-periwinkle-dark" : "bg-ink/5 text-ink-soft/40"
              }`}
            >
              <Icon size={16} />
              {badge.label}
            </div>
          );
        })}
      </div>
    </div>
  );
}
