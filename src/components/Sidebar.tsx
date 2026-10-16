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
      {/* Desktop sidebar */}
      <aside
        className="hidden md:flex flex-col shrink-0 h-screen sticky top-0 border-r"
        style={{ width: 200, background: "var(--card)", borderColor: "var(--border)" }}
      >
        {/* Brand */}
        <div className="flex items-center gap-2 px-4 py-4">
          <div
            className="w-5 h-5 rounded-md flex items-center justify-center"
            style={{ background: "var(--accent)" }}
          >
            <span style={{ color: "#fff", fontSize: 10, fontWeight: 700, lineHeight: 1 }}>A</span>
          </div>
          <span style={{ fontSize: 13, fontWeight: 600, color: "var(--text)", letterSpacing: "-0.01em" }}>
            AgentDate
          </span>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-2 py-1 space-y-0.5">
          {nav.map(({ href, label, icon: Icon }) => {
            const active = pathname === href;
            return (
              <Link
                key={href}
                href={href}
                className="flex items-center gap-2.5 px-3 py-2 rounded-lg transition-colors"
                style={{
                  fontSize: 13,
                  fontWeight: active ? 500 : 400,
                  background: active ? "var(--surface)" : "transparent",
                  color: active ? "var(--accent)" : "var(--muted)",
                }}
              >
                <Icon size={14} strokeWidth={active ? 2 : 1.5} />
                {label}
              </Link>
            );
          })}
        </nav>

        {/* Footer */}
        <div
          className="px-4 py-3 border-t"
          style={{ borderColor: "var(--border)", fontSize: 11, color: "var(--muted)" }}
        >
          25 profiles · 52 dates
        </div>
      </aside>

      {/* Mobile bottom nav */}
      <nav
        className="md:hidden fixed bottom-0 inset-x-0 z-50 border-t flex"
        style={{ background: "var(--card)", borderColor: "var(--border)" }}
      >
        {nav.map(({ href, label, icon: Icon }) => {
          const active = pathname === href;
          return (
            <Link
              key={href}
              href={href}
              className="flex-1 flex flex-col items-center py-3 gap-0.5 transition-colors"
              style={{ fontSize: 10, fontWeight: 500, color: active ? "var(--accent)" : "var(--muted)" }}
            >
              <Icon size={16} strokeWidth={active ? 2 : 1.5} />
              {label}
            </Link>
          );
        })}
      </nav>
    </>
  );
}
