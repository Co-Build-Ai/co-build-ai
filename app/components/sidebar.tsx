"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Compass,
  User,
  Settings,
  PanelLeftClose,
  PanelLeftOpen,
  FolderKanban,
  ChevronDown,
  Star,
} from "lucide-react";
import LogoutButton from "./logout-button";
import Avatar from "./avatar";
import RatingStars from "./rating-stars";
import AvailabilityBadge from "./availability-badge";

const NAV_ITEMS = [{ href: "/panel", label: "Keşfet", icon: Compass }];

const SECONDARY_NAV_ITEMS = [{ href: "/profil", label: "Profilim", icon: User }];

const DEVELOPER_PROJECT_SUB_ITEMS = [
  { href: "/projelerim/aktif", label: "Üzerinde Çalıştıklarım" },
  { href: "/projelerim/teklifler", label: "Tekliflerim" },
];

const FOUNDER_PROJECT_SUB_ITEMS = [
  { href: "/projelerim/yururlukte", label: "Yürürlükteki Projelerim" },
  { href: "/projelerim/kabul-ettiklerim", label: "Kabul Ettiğim Teklifler" },
];

const SETTINGS_SUB_ITEMS = [
  { href: "/ayarlar/hesap", label: "Hesap" },
  { href: "/ayarlar/guvenlik", label: "Güvenlik" },
  { href: "/ayarlar/bildirimler", label: "Bildirimler" },
  { href: "/ayarlar/tercihler", label: "Tercihler" },
  { href: "/ayarlar/tehlikeli-bolge", label: "Tehlikeli Bölge" },
];

export default function Sidebar({
  userType,
  userName,
  miniStats,
  ratingAvg,
  ratingCount,
  availability,
}: {
  userType: "founder" | "developer" | null;
  userName: string | null;
  miniStats: { label: string; value: string | number; href?: string }[];
  ratingAvg: number | null;
  ratingCount: number;
  availability: string | null;
}) {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);
  const [projectsOpen, setProjectsOpen] = useState(true);
  const [settingsOpen, setSettingsOpen] = useState(false);

  useEffect(() => {
    try {
      setCollapsed(localStorage.getItem("sidebar-collapsed") === "true");
    } catch {
      // localStorage erişilemezse varsayılan (açık) kalır
    }
  }, []);

  function toggleCollapsed() {
    setCollapsed((prev) => {
      const next = !prev;
      try {
        localStorage.setItem("sidebar-collapsed", String(next));
      } catch {
        // sessizce yoksay
      }
      return next;
    });
  }

  const labelClass = collapsed ? "hidden" : "hidden md:inline";
  const blockClass = collapsed ? "hidden" : "hidden md:block";

  const groupLabelClass = collapsed ? "hidden" : "hidden px-3 md:block";

  return (
    <aside className={`flex shrink-0 flex-col overflow-y-auto border-r border-ink/10 bg-sidebar py-6 ${collapsed ? "w-16" : "w-16 md:w-64"}`}>
      <div className="mb-6 flex items-center justify-between px-3 md:px-5">
        <Link href="/panel" className={blockClass}>
          <span className="text-lg font-bold text-ink">Co-Build AI</span>
        </Link>
        <button
          onClick={toggleCollapsed}
          title={collapsed ? "Menüyü genişlet" : "Menüyü daralt"}
          className="hidden rounded-lg p-1.5 text-ink-soft hover:bg-ink/5 hover:text-ink md:block"
        >
          {collapsed ? <PanelLeftOpen size={18} /> : <PanelLeftClose size={18} />}
        </button>
      </div>

      <nav className="flex flex-col gap-4 px-2 md:px-3">
        <div className="flex flex-col gap-1">
          <p className={`mb-1 font-mono text-[10px] font-semibold uppercase tracking-wide text-ink/70 ${groupLabelClass}`}>
            Ana Menü
          </p>
          {NAV_ITEMS.map((item) => {
            const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                title={item.label}
                className={`flex items-center justify-center gap-3 rounded-full px-3.5 py-2.5 text-sm font-semibold transition-colors md:justify-start ${
                  active
                    ? "bg-coral text-white shadow-[0_6px_16px_rgba(239,68,104,0.35)]"
                    : "text-ink hover:bg-ink/5"
                }`}
              >
                <Icon size={20} className="shrink-0" />
                <span className={labelClass}>{item.label}</span>
              </Link>
            );
          })}

          {userType === "founder" && (
            <Link
              href="/yildizlarim"
              title="Yıldızlılarım"
              className={`flex items-center justify-center gap-3 rounded-full px-3.5 py-2.5 text-sm font-semibold transition-colors md:justify-start ${
                pathname === "/yildizlarim"
                  ? "bg-coral text-white shadow-[0_6px_16px_rgba(239,68,104,0.35)]"
                  : "text-ink hover:bg-ink/5"
              }`}
            >
              <Star size={20} className="shrink-0" />
              <span className={labelClass}>Yıldızlılarım</span>
            </Link>
          )}
        </div>

        {/* Mini istatistikler (Analiz Edilen Fikirler / Gelen Teklifler vb.) — üst kısımda */}
        <div className={`flex-col gap-4 px-1 md:px-3 ${collapsed ? "hidden" : "hidden md:flex"}`}>
          {miniStats.length > 0 && (
            <div className="flex flex-col gap-1">
              {miniStats.map((stat) => {
                const content = (
                  <>
                    <span className="text-xs font-semibold text-ink">{stat.label}</span>
                    <span className="text-base font-extrabold text-ink">{stat.value}</span>
                  </>
                );
                return stat.href ? (
                  <Link
                    key={stat.label}
                    href={stat.href}
                    className="flex items-center justify-between rounded-lg px-2 py-1.5 transition-colors hover:bg-ink/5"
                  >
                    {content}
                  </Link>
                ) : (
                  <div key={stat.label} className="flex items-center justify-between rounded-lg px-2 py-1.5">
                    {content}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {(userType === "developer" || userType === "founder") && (
          <div className="flex flex-col gap-1">
            <p className={`mb-1 font-mono text-[10px] font-semibold uppercase tracking-wide text-ink/70 ${groupLabelClass}`}>
              Projelerim
            </p>
            <div
              className={`flex items-center rounded-full transition-colors md:justify-start ${
                pathname.startsWith("/projelerim")
                  ? "bg-coral text-white shadow-[0_6px_16px_rgba(239,68,104,0.35)]"
                  : "text-ink hover:bg-ink/5"
              }`}
            >
              <Link
                href={userType === "developer" ? "/projelerim/aktif" : "/projelerim/yururlukte"}
                title="Projelerim"
                className="flex flex-1 items-center justify-center gap-3 px-3.5 py-2.5 text-sm font-semibold md:justify-start"
              >
                <FolderKanban size={20} className="shrink-0" />
                <span className={labelClass}>Projelerim</span>
              </Link>
              <button
                onClick={() => setProjectsOpen((o) => !o)}
                title={projectsOpen ? "Alt menüyü kapat" : "Alt menüyü aç"}
                className={`shrink-0 pr-3.5 ${labelClass}`}
              >
                <ChevronDown
                  size={16}
                  className={`transition-transform ${projectsOpen ? "rotate-180" : ""}`}
                />
              </button>
            </div>

            {projectsOpen && !collapsed && (
              <div className="ml-5 mt-1 hidden flex-col border-l border-ink/10 md:flex">
                {(userType === "developer" ? DEVELOPER_PROJECT_SUB_ITEMS : FOUNDER_PROJECT_SUB_ITEMS).map(
                  (sub) => {
                    const active = pathname === sub.href;
                    return (
                      <Link
                        key={sub.href}
                        href={sub.href}
                        className={`relative flex items-center gap-2 py-1.5 pl-4 pr-3 text-xs font-medium transition-colors before:absolute before:left-0 before:top-1/2 before:h-px before:w-3 before:bg-ink/15 ${
                          active ? "text-coral font-semibold" : "text-ink hover:text-coral"
                        }`}
                      >
                        {sub.label}
                      </Link>
                    );
                  }
                )}
              </div>
            )}
          </div>
        )}

        <div className="flex flex-col gap-1">
          <p className={`mb-1 font-mono text-[10px] font-semibold uppercase tracking-wide text-ink/70 ${groupLabelClass}`}>
            Hesap
          </p>
          {SECONDARY_NAV_ITEMS.map((item) => {
            const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                title={item.label}
                className={`flex items-center justify-center gap-3 rounded-full px-3.5 py-2.5 text-sm font-semibold transition-colors md:justify-start ${
                  active
                    ? "bg-coral text-white shadow-[0_6px_16px_rgba(239,68,104,0.35)]"
                    : "text-ink hover:bg-ink/5"
                }`}
              >
                <Icon size={20} className="shrink-0" />
                <span className={labelClass}>{item.label}</span>
              </Link>
            );
          })}

          <div>
            <div
              className={`flex items-center rounded-full transition-colors md:justify-start ${
                pathname.startsWith("/ayarlar")
                  ? "bg-coral text-white shadow-[0_6px_16px_rgba(239,68,104,0.35)]"
                  : "text-ink hover:bg-ink/5"
              }`}
            >
              <Link
                href="/ayarlar/hesap"
                title="Ayarlar"
                className="flex flex-1 items-center justify-center gap-3 px-3.5 py-2.5 text-sm font-semibold md:justify-start"
              >
                <Settings size={20} className="shrink-0" />
                <span className={labelClass}>Ayarlar</span>
              </Link>
              <button
                onClick={() => setSettingsOpen((o) => !o)}
                title={settingsOpen ? "Alt menüyü kapat" : "Alt menüyü aç"}
                className={`shrink-0 pr-3.5 ${labelClass}`}
              >
                <ChevronDown
                  size={16}
                  className={`transition-transform ${settingsOpen ? "rotate-180" : ""}`}
                />
              </button>
            </div>

            {settingsOpen && !collapsed && (
              <div className="ml-5 mt-1 hidden flex-col border-l border-ink/10 md:flex">
                {SETTINGS_SUB_ITEMS.map((sub) => {
                  const active = pathname === sub.href;
                  return (
                    <Link
                      key={sub.href}
                      href={sub.href}
                      className={`relative flex items-center gap-2 py-1.5 pl-4 pr-3 text-xs font-medium transition-colors before:absolute before:left-0 before:top-1/2 before:h-px before:w-3 before:bg-ink/15 ${
                        active ? "text-coral font-semibold" : "text-ink hover:text-coral"
                      }`}
                    >
                      {sub.label}
                    </Link>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </nav>

      <div className="flex-1" />

      <div className="border-t border-ink/10 px-2 pt-3 md:px-3">
        <LogoutButton collapsed={collapsed} />
        <Link
          href="/ayarlar"
          className="mt-1 flex items-center justify-center gap-2.5 rounded-lg px-1 py-2 transition-colors hover:bg-ink/5 md:justify-start"
        >
          <Avatar name={userName} role={userType === "founder" ? "founder" : "developer"} size="sm" />
          <div className={`min-w-0 ${blockClass}`}>
            <p className="truncate text-sm font-bold text-ink">{userName ?? "Kullanıcı"}</p>
            <p className="text-xs text-ink">
              {userType === "founder" ? "Fikir Sahibi" : "Yazılımcı"}
            </p>
            {userType === "developer" && (
              <div className="mt-1">
                <AvailabilityBadge availability={availability} />
              </div>
            )}
            <RatingStars average={ratingAvg} count={ratingCount} />
          </div>
        </Link>
      </div>
    </aside>
  );
}
