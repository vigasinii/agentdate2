export const dynamic = "force-dynamic";
import { getPeople } from "@/lib/store";
import Link from "next/link";

export default function ProfilesPage() {
  const people = getPeople();
  return (
    <div className="max-w-5xl mx-auto px-6 py-10">
      <div className="mb-6">
        <h1 className="text-[30px] font-semibold mb-1" style={{ color: "var(--text)" }}>People</h1>
        <p className="text-[14px]" style={{ color: "var(--muted)" }}>{people.length} profiles analyzed by AI agents</p>
      </div>

      {people.length === 0 && (
        <div className="rounded-xl border p-12 text-center" style={{ borderColor: "var(--border)" }}>
          <p className="text-[14px]" style={{ color: "var(--muted)" }}>No profiles yet. <Link href="/" className="underline" style={{ color: "var(--accent)" }}>Add someone from the dashboard.</Link></p>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {people.map(p => (
          <Link key={p.id} href={"/profiles/" + p.id}>
            <div className="rounded-xl border p-4 hover:border-[var(--accent)] transition-colors cursor-pointer h-full"
              style={{ background: "var(--card)", borderColor: "var(--border)" }}>
              <div className="flex items-center gap-3 mb-3">
                {p.profilePicture ? (
                  <img src={p.profilePicture} alt={p.name} className="w-10 h-10 rounded-full object-cover flex-shrink-0" />
                ) : (
                  <div className="w-10 h-10 rounded-full flex items-center justify-center text-[15px] font-medium flex-shrink-0"
                    style={{ background: "var(--surface2)", color: "var(--muted)" }}>{p.name[0]}</div>
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-[14px] font-medium truncate" style={{ color: "var(--text)" }}>{p.name}</p>
                  <p className="text-[12px] truncate" style={{ color: "var(--muted)" }}>{p.rawLinkedIn?.headline}</p>
                </div>
              </div>
              <p className="text-[13px] leading-relaxed mb-3 line-clamp-2" style={{ color: "var(--muted)" }}>{p.analysis.summary}</p>
              <div className="flex flex-wrap gap-1">
                {(p.analysis.personality ?? []).slice(0, 3).map(t => (
                  <span key={t} className="text-[11px] px-2 py-0.5 rounded-md border" style={{ borderColor: "var(--border)", color: "var(--muted)" }}>{t}</span>
                ))}
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
