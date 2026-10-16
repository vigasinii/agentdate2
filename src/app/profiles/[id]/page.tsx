export const dynamic = "force-dynamic";
import { getPeople, getDates } from "@/lib/store";
import Link from "next/link";
import { ExternalLink, AlertTriangle, Info } from "lucide-react";

export default async function ProfilePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const people = getPeople();
  const person = people.find(p => p.id === id);

  if (!person) {
    return (
      <div className="max-w-3xl mx-auto px-6 py-10">
        <Link href="/profiles" className="text-[13px] hover:underline mb-6 block" style={{ color: "var(--muted)" }}>Back to People</Link>
        <p style={{ color: "var(--muted)" }}>Person not found.</p>
      </div>
    );
  }

  const allDates = getDates().filter(d => d.personA === id || d.personB === id);
  const topMatches = [...allDates].sort((a, b) => b.compatibilityScore - a.compatibilityScore).slice(0, 3);

  type Analysis = typeof person.analysis & {
    inferredFields?: string[];
    evidence?: Record<string, string>;
    dataQuality?: { linkedinAvailable: boolean; instagramAvailable: boolean; confidence: string; warnings?: string[] };
  };
  const analysis = person.analysis as Analysis;

  const scoreColor = (s: number) => s >= 70 ? "var(--success)" : s >= 40 ? "var(--warning)" : "var(--destructive)";

  function TagList({ items, label }: { items: string[]; label: string }) {
    return (
      <div className="mb-4">
        <p className="text-[12px] font-semibold uppercase tracking-wide mb-2" style={{ color: "var(--muted)" }}>{label}</p>
        {items.length === 0
          ? <p className="text-[13px]" style={{ color: "var(--muted)" }}>Unknown — insufficient public data</p>
          : <div className="flex flex-wrap gap-1.5">
              {items.map(t => (
                <span key={t} className="text-[12px] px-2 py-0.5 rounded-md border" style={{ borderColor: "var(--border)", color: "var(--muted)", background: "var(--surface)" }}>{t}</span>
              ))}
            </div>
        }
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-6 py-10">
      <Link href="/profiles" className="text-[13px] hover:underline mb-6 block" style={{ color: "var(--muted)" }}>Back to People</Link>

      {/* Data quality warnings */}
      {analysis.dataQuality?.warnings?.map((w, i) => (
        <div key={i} className="flex gap-2 p-3 rounded-lg border mb-4 text-[13px]"
          style={{ borderColor: "#fde68a", background: "#fffbeb", color: "var(--warning)" }}>
          <AlertTriangle size={14} className="shrink-0 mt-0.5" />
          {w}
        </div>
      ))}

      <div className="grid md:grid-cols-[280px_1fr] gap-6">
        {/* Left column */}
        <div className="space-y-4">
          <div className="rounded-xl border p-5" style={{ background: "var(--card)", borderColor: "var(--border)" }}>
            {person.profilePicture ? (
              <img src={person.profilePicture} alt={person.name} className="w-20 h-20 rounded-full object-cover mb-4" />
            ) : (
              <div className="w-20 h-20 rounded-full flex items-center justify-center text-2xl font-medium mb-4"
                style={{ background: "var(--surface2)", color: "var(--muted)" }}>{person.name[0]}</div>
            )}
            <h1 className="text-[20px] font-semibold mb-0.5" style={{ color: "var(--text)" }}>{person.name}</h1>
            {person.rawLinkedIn?.headline && (
              <p className="text-[13px] mb-3" style={{ color: "var(--muted)" }}>{person.rawLinkedIn.headline}</p>
            )}
            {person.rawLinkedIn?.location && (
              <p className="text-[12px] mb-3" style={{ color: "var(--muted)" }}>{person.rawLinkedIn.location}</p>
            )}
            <div className="space-y-2">
              <a href={person.linkedinUrl} target="_blank" rel="noreferrer"
                className="flex items-center gap-2 text-[12px] hover:underline"
                style={{ color: "var(--accent)" }}>
                <ExternalLink size={12} /> LinkedIn profile
              </a>
              <a href={person.instagramUrl} target="_blank" rel="noreferrer"
                className="flex items-center gap-2 text-[12px] hover:underline"
                style={{ color: "var(--accent)" }}>
                <ExternalLink size={12} /> Instagram profile
              </a>
            </div>
          </div>

          {/* Data quality */}
          {analysis.dataQuality && (
            <div className="rounded-xl border p-4 text-[12px]" style={{ background: "var(--card)", borderColor: "var(--border)" }}>
              <div className="flex items-center gap-1.5 mb-2 font-semibold" style={{ color: "var(--muted)" }}>
                <Info size={12} /> Source verification
              </div>
              <div className="space-y-1.5">
                <div className="flex justify-between">
                  <span style={{ color: "var(--muted)" }}>LinkedIn</span>
                  <span style={{ color: analysis.dataQuality.linkedinAvailable ? "var(--success)" : "var(--destructive)" }}>
                    {analysis.dataQuality.linkedinAvailable ? "available" : "unavailable"}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span style={{ color: "var(--muted)" }}>Instagram</span>
                  <span style={{ color: analysis.dataQuality.instagramAvailable ? "var(--success)" : "var(--destructive)" }}>
                    {analysis.dataQuality.instagramAvailable ? "available" : "unavailable"}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span style={{ color: "var(--muted)" }}>Confidence</span>
                  <span style={{ color: analysis.dataQuality.confidence === "high" ? "var(--success)" : analysis.dataQuality.confidence === "medium" ? "var(--warning)" : "var(--destructive)" }}>
                    {analysis.dataQuality.confidence}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Top Matches */}
          {topMatches.length > 0 && (
            <div className="rounded-xl border p-4" style={{ background: "var(--card)", borderColor: "var(--border)" }}>
              <p className="text-[12px] font-semibold uppercase tracking-wide mb-3" style={{ color: "var(--muted)" }}>Top Matches</p>
              <div className="space-y-2">
                {topMatches.map((d, i) => {
                  const otherId = d.personA === id ? d.personB : d.personA;
                  const other = people.find(p => p.id === otherId);
                  return (
                    <Link key={i} href={"/profiles/" + otherId}>
                      <div className="flex items-center gap-2 py-1 rounded hover:bg-[var(--surface)] px-1 -mx-1 transition-colors">
                        <span className="text-[11px] w-4" style={{ color: "var(--muted)" }}>#{i + 1}</span>
                        <div className="w-7 h-7 rounded-full flex items-center justify-center text-[11px] font-medium" style={{ background: "var(--surface2)", color: "var(--muted)" }}>
                          {other?.name[0] ?? "?"}
                        </div>
                        <span className="text-[12px] flex-1 truncate font-medium" style={{ color: "var(--text)" }}>{other?.name}</span>
                        <span className="text-[12px] font-semibold" style={{ color: scoreColor(d.compatibilityScore) }}>{d.compatibilityScore}%</span>
                      </div>
                    </Link>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Right column */}
        <div>
          {/* Summary */}
          <div className="rounded-xl border p-5 mb-4" style={{ background: "var(--card)", borderColor: "var(--border)" }}>
            <p className="text-[12px] font-semibold uppercase tracking-wide mb-2" style={{ color: "var(--muted)" }}>Profile Summary</p>
            <p className="text-[14px] leading-relaxed" style={{ color: "var(--text)" }}>{person.analysis.summary}</p>
            {analysis.evidence?.summary && (
              <p className="text-[12px] mt-2 italic" style={{ color: "var(--muted)" }}>Source: {analysis.evidence.summary}</p>
            )}
          </div>

          {/* Traits */}
          <div className="rounded-xl border p-5 mb-4" style={{ background: "var(--card)", borderColor: "var(--border)" }}>
            <p className="text-[12px] font-semibold uppercase tracking-wide mb-4" style={{ color: "var(--muted)" }}>Analysis</p>
            <TagList items={person.analysis.personality ?? []} label="Personality traits" />
            <TagList items={person.analysis.interests ?? []} label="Interests" />
            <TagList items={person.analysis.hobbies ?? []} label="Hobbies" />
            {(person.analysis.needs ?? []).length > 0 && <TagList items={person.analysis.needs} label="Relationship needs" />}
            {analysis.inferredFields && analysis.inferredFields.length > 0 && (
              <p className="text-[11px] mt-2" style={{ color: "var(--muted)" }}>
                Inferred (not directly stated): {analysis.inferredFields.join(", ")}
              </p>
            )}
          </div>

          {/* Looking for / Dealbreakers */}
          <div className="rounded-xl border p-5 mb-4" style={{ background: "var(--card)", borderColor: "var(--border)" }}>
            <p className="text-[12px] font-semibold uppercase tracking-wide mb-2" style={{ color: "var(--muted)" }}>Looking for</p>
            <p className="text-[13px]" style={{ color: "var(--text)" }}>{person.analysis.lookingFor}</p>
            {(person.analysis as { dealbreakers?: string[] }).dealbreakers?.length ? (
              <>
                <div className="border-t my-3" style={{ borderColor: "var(--border)" }} />
                <p className="text-[12px] font-semibold uppercase tracking-wide mb-2" style={{ color: "var(--muted)" }}>Dealbreakers</p>
                <ul className="space-y-1">
                  {((person.analysis as { dealbreakers?: string[] }).dealbreakers ?? []).map(d => (
                    <li key={d} className="text-[13px]" style={{ color: "var(--text)" }}>• {d}</li>
                  ))}
                </ul>
              </>
            ) : null}
          </div>

          {/* Agent dates */}
          {allDates.length > 0 && (
            <div className="rounded-xl border p-5" style={{ background: "var(--card)", borderColor: "var(--border)" }}>
              <p className="text-[12px] font-semibold uppercase tracking-wide mb-4" style={{ color: "var(--muted)" }}>Agent Dates · {allDates.length}</p>
              <div className="space-y-4">
                {allDates.map((date, i) => {
                  const otherId = date.personA === id ? date.personB : date.personA;
                  const other = people.find(p => p.id === otherId);
                  return (
                    <div key={i} className="border-t pt-4 first:border-0 first:pt-0" style={{ borderColor: "var(--border)" }}>
                      <div className="flex items-center justify-between mb-3">
                        <span className="text-[13px] font-medium" style={{ color: "var(--text)" }}>with {other?.name ?? "Unknown"}</span>
                        <span className="text-[13px] font-semibold" style={{ color: scoreColor(date.compatibilityScore) }}>{date.compatibilityScore}%</span>
                      </div>
                      <div className="space-y-2">
                        {date.messages.slice(0, 4).map((msg, j) => {
                          const isMe = (msg.role === "A" && date.personA === id) || (msg.role === "B" && date.personB === id);
                          return (
                            <div key={j} className={"flex gap-2 " + (isMe ? "flex-row-reverse" : "")}>
                              <div className="w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-medium flex-shrink-0"
                                style={{ background: "var(--surface2)", color: "var(--muted)" }}>
                                {isMe ? person.name[0] : (other?.name[0] ?? "?")}
                              </div>
                              <div className="max-w-[75%] px-3 py-2 rounded-xl text-[12px] leading-relaxed"
                                style={{ background: isMe ? "var(--surface)" : "var(--surface2)", color: "var(--text)", borderRadius: "12px" }}>
                                {msg.content}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                      <p className="text-[12px] italic mt-2" style={{ color: "var(--muted)" }}>{date.compatibilityReason}</p>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
