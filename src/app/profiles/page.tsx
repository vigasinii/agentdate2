export const dynamic = "force-dynamic";
import { getPeople } from "@/lib/store";
import Link from "next/link";

export default function ProfilesPage() {
  const people = getPeople();

  return (
    <div className="p-6 md:p-8 max-w-5xl">
      <div className="mb-8">
        <p className="text-xs font-semibold uppercase tracking-widest mb-2" style={{ color: "var(--accent)" }}>People</p>
        <h1 className="text-3xl font-bold mb-1" style={{ color: "var(--text)" }}>All Profiles</h1>
        <p className="text-sm" style={{ color: "var(--muted)" }}>{people.length} people analyzed by AI agents</p>
      </div>

      {people.length === 0 && (
        <div className="rounded-xl border p-12 text-center" style={{ background: "var(--surface1)", borderColor: "var(--border)" }}>
          <p className="text-sm mb-2" style={{ color: "var(--muted)" }}>No profiles yet.</p>
          <Link href="/" className="text-sm hover:underline" style={{ color: "var(--accent)" }}>Add people on the home page →</Link>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {people.map(person => (
          <Link key={person.id} href={`/profiles/${person.id}`}>
            <div
              className="rounded-xl border p-5 cursor-pointer transition-all hover:border-opacity-40 group"
              style={{ background: "var(--surface1)", borderColor: "var(--border)" }}
            >
              <div className="flex items-center gap-4 mb-4">
                {person.profilePicture ? (
                  <img src={person.profilePicture} alt={person.name} className="w-14 h-14 rounded-full object-cover" />
                ) : (
                  <div
                    className="w-14 h-14 rounded-full flex items-center justify-center text-xl font-bold"
                    style={{ background: "rgba(201,167,255,0.12)", color: "var(--accent)" }}
                  >
                    {person.name[0]}
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <h2 className="text-base font-bold truncate group-hover:text-purple-300 transition-colors" style={{ color: "var(--text)" }}>{person.name}</h2>
                  <p className="text-xs truncate" style={{ color: "var(--muted)" }}>{person.rawLinkedIn?.headline}</p>
                </div>
                <span className="text-xs px-2 py-1 rounded-full border shrink-0" style={{ borderColor: "var(--border)", color: "var(--muted)" }}>View →</span>
              </div>

              <p className="text-xs leading-relaxed mb-4 line-clamp-2" style={{ color: "var(--muted)" }}>{person.analysis.summary}</p>

              <div className="flex flex-wrap gap-1.5 mb-2">
                {(person.analysis.personality ?? []).map(t => (
                  <span key={t} className="text-xs px-2 py-0.5 rounded-full" style={{ background: "rgba(201,167,255,0.1)", color: "var(--accent)" }}>{t}</span>
                ))}
              </div>
              <div className="flex flex-wrap gap-1.5">
                {(person.analysis.hobbies ?? []).slice(0, 3).map(h => (
                  <span key={h} className="text-xs px-2 py-0.5 rounded-full" style={{ background: "rgba(242,166,184,0.1)", color: "var(--romantic)" }}>{h}</span>
                ))}
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
