"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, Users, MessageSquare, Trophy } from "lucide-react";

const nav = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard },
  { href: "/profiles", label: "People", icon: Users },
  { href: "/dates", label: "Agent Dates", icon: MessageSquare },
  { href: "/rankings", label: "Rankings", icon: Trophy },
];

export default function Sidebar() {
  const pathname = usePathname();
  return (
    <>
      {/* Desktop */}
      <aside
        className="hidden md:flex flex-col w-60 shrink-0 h-screen sticky top-0 border-r"
        style={{ background: "var(--card)", borderColor: "var(--border)" }}
      >
        <div className="px-5 py-5 border-b" style={{ borderColor: "var(--border)" }}>
          <span className="text-[15px] font-semibold tracking-tight" style={{ color: "var(--text)" }}>AgentDate</span>
          <span className="ml-2 text-[10px] font-medium px-1.5 py-0.5 rounded" style={{ background: "var(--surface)", color: "var(--muted)" }}>demo</span>
        </div>
        <nav className="flex-1 px-2 py-3 space-y-0.5">
          {nav.map(({ href, label, icon: Icon }) => {
            const active = pathname === href;
            return (
              <Link key={href} href={href}
                className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-[13px] font-medium transition-colors"
                style={{
                  background: active ? "var(--surface)" : "transparent",
                  color: active ? "var(--accent)" : "var(--muted)",
                }}>
                <Icon size={15} />
                {label}
              </Link>
            );
          })}
        </nav>
        <div className="px-5 py-4 border-t text-[12px]" style={{ borderColor: "var(--border)", color: "var(--muted)" }}>
          25 profiles · 52 dates
        </div>
      </aside>
      {/* Mobile bottom */}
      <nav className="md:hidden fixed bottom-0 inset-x-0 z-50 border-t flex"
        style={{ background: "var(--card)", borderColor: "var(--border)" }}>
        {nav.map(({ href, label, icon: Icon }) => {
          const active = pathname === href;
          return (
            <Link key={href} href={href}
              className="flex-1 flex flex-col items-center py-3 gap-0.5 text-[11px] font-medium transition-colors"
              style={{ color: active ? "var(--accent)" : "var(--muted)" }}>
              <Icon size={17} />
              {label}
            </Link>
          );
        })}
      </nav>
    </>
  );
}
