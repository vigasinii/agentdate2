"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, Users, MessageSquareHeart, Trophy, ChevronRight } from "lucide-react";

const navItems = [
  { href: "/", label: "Overview", icon: LayoutDashboard },
  { href: "/profiles", label: "People", icon: Users },
  { href: "/dates", label: "Agent Dates", icon: MessageSquareHeart },
  { href: "/rankings", label: "Rankings", icon: Trophy },
];

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <>
      {/* Desktop sidebar */}
      <aside
        className="hidden md:flex flex-col w-56 shrink-0 border-r h-screen sticky top-0"
        style={{ background: "var(--surface1)", borderColor: "var(--border)" }}
      >
        {/* Logo */}
        <div className="px-5 pt-6 pb-5 border-b" style={{ borderColor: "var(--border)" }}>
          <div className="flex items-center gap-2 mb-2">
            <span className="text-xl font-bold tracking-tight" style={{ color: "var(--accent)" }}>AgentDate</span>
          </div>
          <span
            className="text-xs font-semibold px-2 py-0.5 rounded uppercase tracking-widest"
            style={{ background: "rgba(242,166,184,0.15)", color: "var(--romantic)" }}
          >
            Demo Mode
          </span>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-4 space-y-1">
          {navItems.map(({ href, label, icon: Icon }) => {
            const active = pathname === href;
            return (
              <Link
                key={href}
                href={href}
                className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all group"
                style={{
                  background: active ? "rgba(201,167,255,0.1)" : "transparent",
                  color: active ? "var(--accent)" : "var(--muted)",
                }}
              >
                <Icon size={16} className="shrink-0" />
                {label}
                {active && <ChevronRight size={14} className="ml-auto" style={{ color: "var(--accent)" }} />}
              </Link>
            );
          })}
        </nav>

        {/* Footer */}
        <div className="px-5 py-4 border-t" style={{ borderColor: "var(--border)" }}>
          <p className="text-xs" style={{ color: "var(--muted)" }}>25 profiles · 300 dates</p>
          <p className="text-xs mt-0.5" style={{ color: "var(--muted)", opacity: 0.6 }}>System online</p>
        </div>
      </aside>

      {/* Mobile bottom nav */}
      <nav
        className="md:hidden fixed bottom-0 left-0 right-0 z-50 flex border-t"
        style={{ background: "var(--surface1)", borderColor: "var(--border)" }}
      >
        {navItems.map(({ href, label, icon: Icon }) => {
          const active = pathname === href;
          return (
            <Link
              key={href}
              href={href}
              className="flex-1 flex flex-col items-center py-3 gap-1 text-xs font-medium transition-colors"
              style={{ color: active ? "var(--accent)" : "var(--muted)" }}
            >
              <Icon size={18} />
              <span>{label}</span>
            </Link>
          );
        })}
      </nav>
    </>
  );
}
