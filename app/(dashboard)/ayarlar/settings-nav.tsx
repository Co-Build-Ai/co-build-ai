"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { User, Shield, Bell, SlidersHorizontal } from "lucide-react";

const NAV_ITEMS = [
  { href: "/ayarlar/hesap", label: "Hesap", icon: User },
  { href: "/ayarlar/guvenlik", label: "Güvenlik", icon: Shield },
  { href: "/ayarlar/bildirimler", label: "Bildirimler", icon: Bell },
  { href: "/ayarlar/tercihler", label: "Tercihler", icon: SlidersHorizontal },
];

export default function SettingsNav() {
  const pathname = usePathname();

  return (
    <nav className="flex w-full shrink-0 flex-row gap-1 overflow-x-auto pb-2 sm:w-48 sm:flex-col sm:overflow-visible sm:pb-0">
      {NAV_ITEMS.map((item) => {
        const active = pathname === item.href;
        const Icon = item.icon;
        return (
          <Link
            key={item.href}
            href={item.href}
            className={`flex shrink-0 items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
              active
                ? "bg-coral/10 text-coral-dark"
                : "text-ink-soft hover:bg-white/60 hover:text-ink"
            }`}
          >
            <Icon size={16} className="shrink-0" />
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
