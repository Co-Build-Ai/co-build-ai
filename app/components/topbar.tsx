"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import NotificationBell from "./notification-bell";
import MessageBell from "./message-bell";
import Avatar from "./avatar";

const PAGE_TITLES: Record<string, string> = {
  "/panel": "Keşfet",
  "/profil": "Profilim",
  "/mesajlar": "Mesajlar",
  "/ayarlar/hesap": "Ayarlar — Hesap",
  "/ayarlar/guvenlik": "Ayarlar — Güvenlik",
  "/ayarlar/bildirimler": "Ayarlar — Bildirimler",
  "/ayarlar/tercihler": "Ayarlar — Tercihler",
};

export default function Topbar({
  userId,
  userName,
  userType,
  avatarUrl,
  notificationsEnabled,
}: {
  userId: string;
  userName: string | null;
  userType: "founder" | "developer" | null;
  avatarUrl?: string | null;
  notificationsEnabled: boolean;
}) {
  const pathname = usePathname();
  const title = PAGE_TITLES[pathname] ?? "Co-Build AI";

  return (
    <header className="sticky top-0 z-30 flex items-center justify-between border-b border-black/[0.07] bg-white px-6 py-4 sm:px-10">
      <div className="flex items-center gap-2.5">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/logo-icon.png" alt="Co-Build AI" className="h-8 w-8 object-contain" />
        <h1 className="text-lg font-semibold tracking-tight text-ink">{title}</h1>
      </div>

      <div className="flex items-center gap-4">
        <MessageBell userId={userId} />
        <NotificationBell userId={userId} enabled={notificationsEnabled} />
        <Link href="/ayarlar" className="flex items-center gap-2 rounded-lg px-1.5 py-1 transition-colors hover:bg-black/[0.04]">
          <Avatar name={userName} role={userType === "founder" ? "founder" : "developer"} size="sm" avatarUrl={avatarUrl} />
          <span className="hidden text-sm font-medium text-ink sm:inline">
            {userName ?? "Profilim"}
          </span>
        </Link>
      </div>
    </header>
  );
}
