export const dynamic = "force-dynamic";
import { getPeople, getDates } from "@/lib/store";
import Link from "next/link";
import { MapPin, ExternalLink, Heart, AlertTriangle } from "lucide-react";

export default async function ProfilePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const people = getPeople();
  const person = people.find(p => p.id === id);

  if (!person) {
    return (
      <div className="p-8 text-center" style={{ color: "var(--muted)" }}>
        <p>Person not found.</p>
        <Link href="/profiles" className="text-sm hover:underline mt-2 block" style={{ color: "var(--accent)" }}>Back to profiles</Link>
      </div>
    );
  }

  const allDates = getDates().filter(d => d.personA === id || d.personB === id);
  const topMatches = [...allDates].sort((a, b) => b.compatibilityScore - a.compatibilityScore).slice(0, 3);
  const scoreColor = (s: number) => s >= 70 ? "#4ade80" : s >= 40 ? "#facc15" : "#f87171";

  type Analysis = typeof person.analysis & { dealbreakers?: string[] };
  const analysis = person.analysis as Analysis;

  return (
    <div className="p-6 md:p-8 max-w-3xl">
      <Link href="/profiles" className="inline-flex items-center gap-1.5 text-xs mb-6 hover:underline" style={{ color: "var(--muted)" }}>
        Back to Profiles
      </Link>

      <div className="rounded-xl border p-6 mb-5" style={{ background: "var(--surface1)", borderColor: "var(--border)" }}>
        <div className="flex items-start gap-5 mb-5">
          {person.profilePicture ? (
            <img src={person.profilePicture} alt={person.name} className="w-20 h-20 rounded-full object-cover shrink-0" />
          ) : (
            <div className="w-20 h-20 rounded-full flex items-center justify-center text-2xl font-bold shrink-0"
              style={{ background: "rgba(201,167,255,0.12)", color: "var(--accent)" }}>
              {person.name[0]}
            </div>
          )}
          <div className="flex-1 min-w-0">
            <h1 className="text-2xl font-bold mb-0.5" style={{ color: "var(--text)" }}>{person.name}</h1>
            <p className="text-sm mb-1" style={{ color: "var(--muted)" }}>{person.rawLinkedIn?.headline}</p>
            {person.rawLinkedIn?.location && (
              <p className="text-xs flex items-center gap-1 mb-3" style={{ color: "var(--muted)" }}>
                <MapPin size={12} /> {person.rawLinkedIn.location}
              </p>
            )}
            <div className="flex gap-3">
              <a href={person.linkedinUrl} target="_blank" rel="noreferrer"
                className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg border"
                style={{ borderColor: "var(--border)", color: "var(--muted)" }}>
                <ExternalLink size={13} /> LinkedIn
              </a>
              <a href={person.instagramUrl} target="_blank" rel="noreferrer"
                className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg border"
                style={{ borderColor: "var(--border)", color: "var(--muted)" }}>
                <ExternalLink size={13} /> Instagram
              </a>
            </div>
          </div>
        </div>
        <p className="text-sm leading-relaxed" style={{ color: "var(--text)", opacity: 0.85 }}>{person.analysis.summary}</p>
      </div>

      <div className="grid grid-cols-2 gap-4 mb-5">
        <TraitSection title="Personality" items={person.analysis.personality ?? []} accent="var(--accent)" bg="rgba(201,167,255,0.08)" />
        <TraitSection title="Interests" items={person.analysis.interests ?? []} accent="#818cf8" bg="rgba(129,140,248,0.08)" />
        <TraitSection title="Hobbies" items={person.analysis.hobbies ?? []} accent="var(--romantic)" bg="rgba(242,166,184,0.08)" />
        <TraitSection title="Needs" items={person.analysis.needs ?? []} accent="#34d399" bg="rgba(52,211,153,0.08)" />
      </div>

      <div className="rounded-xl border p-4 mb-4 flex gap-3" style={{ background: "var(--surface1)", borderColor: "var(--border)" }}>
        <Heart size={16} className="shrink-0 mt-0.5" style={{ color: "var(--romantic)" }} />
        <div>
          <p className="text-xs font-semibold mb-1" style={{ color: "var(--romantic)" }}>Looking For</p>
          <p className="text-sm" style={{ color: "var(--text)" }}>{person.analysis.lookingFor}</p>
        </div>
      </div>

      {analysis.dealbreakers && analysis.dealbreakers.length > 0 && (
        <div className="rounded-xl border p-4 mb-6 flex gap-3" style={{ background: "var(--surface1)", borderColor: "rgba(248,113,113,0.2)" }}>
          <AlertTriangle size={16} className="shrink-0 mt-0.5" style={{ color: "#f87171" }} />
          <div>
            <p className="text-xs font-semibold mb-1" style={{ color: "#f87171" }}>Dealbreakers</p>
            <ul className="space-y-1">
              {analysis.dealbreakers.map(d => (
                <li key={d} className="text-sm" style={{ color: "var(--text)" }}>{d}</li>
              ))}
            </ul>
          </div>
        </div>
      )}

      {topMatches.length > 0 && (
        <div className="mb-6">
          <h2 className="text-sm font-semibold uppercase tracking-widest mb-3" style={{ color: "var(--muted)" }}>Top Matches</h2>
          <div className="space-y-2">
            {topMatches.map((d, i) => {
              const otherId = d.personA === id ? d.personB : d.personA;
              const other = people.find(p => p.id === otherId);
              return (
                <div key={i} className="flex items-center gap-3 rounded-xl border p-3" style={{ background: "var(--surface1)", borderColor: "var(--border)" }}>
                  <span className="text-xs w-4 font-bold" style={{ color: "var(--muted)" }}>#{i + 1}</span>
                  <div className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold"
                    style={{ background: "rgba(201,167,255,0.12)", color: "var(--accent)" }}>
                    {other?.name[0] ?? "?"}
                  </div>
                  <div className="flex-1 min-w-0">
                    <Link href={"/profiles/" + otherId} className="text-sm font-medium hover:underline" style={{ color: "var(--text)" }}>
                      {other?.name ?? "Unknown"}
                    </Link>
                    <p className="text-xs line-clamp-1" style={{ color: "var(--muted)" }}>{d.compatibilityReason}</p>
                  </div>
                  <span className="text-sm font-bold" style={{ color: scoreColor(d.compatibilityScore) }}>{d.compatibilityScore}%</span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {allDates.length > 0 && (
        <div>
          <h2 className="text-sm font-semibold uppercase tracking-widest mb-3" style={{ color: "var(--muted)" }}>Agent Dates ({allDates.length})</h2>
          <div className="space-y-4">
            {allDates.map((date, i) => {
              const otherId = date.personA === id ? date.personB : date.personA;
              const other = people.find(p => p.id === otherId);
              return (
                <div key={i} className="rounded-xl border p-4" style={{ background: "var(--surface1)", borderColor: "var(--border)" }}>
                  <div className="flex justify-between items-center mb-4">
                    <p className="text-sm font-medium" style={{ color: "var(--text)" }}>Date with {other?.name ?? "Unknown"}</p>
                    <span className="text-sm font-bold" style={{ color: scoreColor(date.compatibilityScore) }}>{date.compatibilityScore}%</span>
                  </div>
                  <div className="space-y-2 mb-3">
                    {date.messages.map((msg, j) => {
                      const isMe = (msg.role === "A" && date.personA === id) || (msg.role === "B" && date.personB === id);
                      return (
                        <div key={j} className={"flex gap-2 " + (isMe ? "flex-row-reverse" : "")}>
                          <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0"
                            style={{ background: isMe ? "rgba(201,167,255,0.15)" : "rgba(242,166,184,0.15)", color: isMe ? "var(--accent)" : "var(--romantic)" }}>
                            {isMe ? person.name[0] : (other?.name[0] ?? "?")}
                          </div>
                          <div className="max-w-xs px-3 py-2 rounded-xl text-xs leading-relaxed"
                            style={{ background: isMe ? "rgba(201,167,255,0.1)" : "var(--surface2)", color: "var(--text)" }}>
                            {msg.content}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                  <p className="text-xs italic" style={{ color: "var(--muted)" }}>{date.compatibilityReason}</p>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

function TraitSection({ title, items, accent, bg }: { title: string; items: string[]; accent: string; bg: string }) {
  if (!items.length) return null;
  return (
    <div className="rounded-xl border p-4" style={{ background: "var(--surface1)", borderColor: "var(--border)" }}>
      <p className="text-xs font-semibold mb-2" style={{ color: accent }}>{title}</p>
      <div className="flex flex-wrap gap-1.5">
        {items.map(item => (
          <span key={item} className="text-xs px-2 py-0.5 rounded-full" style={{ background: bg, color: accent }}>{item}</span>
        ))}
      </div>
    </div>
  );
}
