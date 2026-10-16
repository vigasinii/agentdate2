export const dynamic = "force-dynamic";
import { getPeople, getDates } from "@/lib/store";
import Link from "next/link";
import { ExternalLink, AlertTriangle, Info, ArrowLeft } from "lucide-react";

export default async function ProfilePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const people = getPeople();
  const person = people.find(p => p.id === id);

  if (!person) {
    return (
      <div style={{ maxWidth: 600, margin: "0 auto", padding: "40px 32px" }}>
        <Link href="/profiles" style={{ fontSize: 13, color: "var(--muted)", display: "flex", alignItems: "center", gap: 6, marginBottom: 24 }}>
          <ArrowLeft size={13} /> Back to People
        </Link>
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
    dealbreakers?: string[];
  };
  const analysis = person.analysis as Analysis;
  const scoreColor = (s: number) => s >= 70 ? "var(--success)" : s >= 40 ? "var(--warning)" : "var(--destructive)";

  const avatarColors: [string, string][] = [
    ["#E8F0EC","#456B59"],["#EBE8F0","#5B4592"],["#F0E8E8","#924545"],["#E8EDF0","#456789"],["#F0EDE8","#896745"],
  ];
  const [avatarBg, avatarFg] = avatarColors[person.name.charCodeAt(0) % avatarColors.length];

  function TagGroup({ label, items }: { label: string; items?: string[] }) {
    if (!items || items.length === 0) return null;
    return (
      <div style={{ marginBottom: 20 }}>
        <p style={{ fontSize: 11, fontWeight: 600, letterSpacing: "0.06em", textTransform: "uppercase", color: "var(--muted)", marginBottom: 8 }}>
          {label}
        </p>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
          {items.map(t => (
            <span key={t} style={{ fontSize: 12, padding: "3px 10px", borderRadius: 20, border: "1px solid var(--border)", color: "var(--muted)", background: "var(--surface)" }}>
              {t}
            </span>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 1000, margin: "0 auto", padding: "32px 32px 80px" }}>
      {/* Back nav */}
      <Link href="/profiles"
        style={{ fontSize: 12, color: "var(--muted)", display: "inline-flex", alignItems: "center", gap: 6, marginBottom: 28, transition: "color 0.12s" }}
        className="hover:text-[var(--text)]"
      >
        <ArrowLeft size={13} /> All people
      </Link>

      {/* Warnings */}
      {analysis.dataQuality?.warnings?.map((w, i) => (
        <div key={i} style={{ display: "flex", gap: 10, padding: "10px 14px", borderRadius: 10, border: "1px solid #fde68a", background: "#fffbeb", color: "var(--warning)", fontSize: 13, marginBottom: 12 }}>
          <AlertTriangle size={14} style={{ flexShrink: 0, marginTop: 1 }} />
          {w}
        </div>
      ))}

      <div style={{ display: "grid", gridTemplateColumns: "260px 1fr", gap: 24 }}>
        {/* Left panel */}
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {/* Identity card */}
          <div style={{ border: "1px solid var(--border)", borderRadius: 12, background: "var(--card)", overflow: "hidden" }}>
            {/* Portrait */}
            <div style={{ height: 200, background: avatarBg, overflow: "hidden", position: "relative" }}>
              {person.profilePicture ? (
                <img src={person.profilePicture} alt={person.name}
                  style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: "top" }} />
              ) : (
                <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <span style={{ fontSize: 72, fontWeight: 700, color: avatarFg, letterSpacing: "-0.03em" }}>
                    {person.name[0].toUpperCase()}
                  </span>
                </div>
              )}
            </div>

            {/* Info */}
            <div style={{ padding: "16px 18px 18px" }}>
              <h1 style={{ fontSize: 20, fontWeight: 700, color: "var(--text)", letterSpacing: "-0.02em", marginBottom: 4 }}>
                {person.name}
              </h1>
              {person.rawLinkedIn?.headline && (
                <p style={{ fontSize: 13, color: "var(--muted)", lineHeight: 1.5, marginBottom: 8 }}>
                  {person.rawLinkedIn.headline}
                </p>
              )}
              {person.rawLinkedIn?.location && (
                <p style={{ fontSize: 12, color: "var(--muted)", marginBottom: 12 }}>
                  {person.rawLinkedIn.location}
                </p>
              )}
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                {person.linkedinUrl && (
                  <a href={person.linkedinUrl} target="_blank" rel="noreferrer"
                    style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, color: "var(--accent)" }}
                    className="hover:underline">
                    <ExternalLink size={12} /> LinkedIn profile
                  </a>
                )}
                {person.instagramUrl && (
                  <a href={person.instagramUrl} target="_blank" rel="noreferrer"
                    style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, color: "var(--accent)" }}
                    className="hover:underline">
                    <ExternalLink size={12} /> Instagram profile
                  </a>
                )}
              </div>
            </div>
          </div>

          {/* Data quality */}
          {analysis.dataQuality && (
            <div style={{ border: "1px solid var(--border)", borderRadius: 12, background: "var(--card)", padding: "14px 16px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 10, fontSize: 11, fontWeight: 600, color: "var(--muted)", textTransform: "uppercase", letterSpacing: "0.06em" }}>
                <Info size={12} /> Source confidence
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                {[
                  { label: "LinkedIn", ok: analysis.dataQuality.linkedinAvailable },
                  { label: "Instagram", ok: analysis.dataQuality.instagramAvailable },
                ].map(({ label, ok }) => (
                  <div key={label} style={{ display: "flex", justifyContent: "space-between", fontSize: 12 }}>
                    <span style={{ color: "var(--muted)" }}>{label}</span>
                    <span style={{ color: ok ? "var(--success)" : "var(--destructive)", fontWeight: 500 }}>
                      {ok ? "available" : "unavailable"}
                    </span>
                  </div>
                ))}
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12 }}>
                  <span style={{ color: "var(--muted)" }}>Confidence</span>
                  <span style={{ fontWeight: 500, color: analysis.dataQuality.confidence === "high" ? "var(--success)" : analysis.dataQuality.confidence === "medium" ? "var(--warning)" : "var(--destructive)" }}>
                    {analysis.dataQuality.confidence}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Top matches */}
          {topMatches.length > 0 && (
            <div style={{ border: "1px solid var(--border)", borderRadius: 12, background: "var(--card)", padding: "14px 16px" }}>
              <p style={{ fontSize: 11, fontWeight: 600, letterSpacing: "0.06em", textTransform: "uppercase", color: "var(--muted)", marginBottom: 12 }}>
                Top Matches
              </p>
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {topMatches.map((d, i) => {
                  const otherId = d.personA === id ? d.personB : d.personA;
                  const other = people.find(p => p.id === otherId);
                  const [bg, fg] = avatarColors[(other?.name.charCodeAt(0) ?? 0) % 5];
                  return (
                    <Link key={i} href={"/profiles/" + otherId}>
                      <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "4px 0", transition: "opacity 0.12s" }} className="hover:opacity-70">
                        <span style={{ fontSize: 11, fontWeight: 600, width: 20, color: "var(--muted)" }}>#{i + 1}</span>
                        <div style={{ width: 26, height: 26, borderRadius: "50%", background: bg, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 600, color: fg, flexShrink: 0 }}>
                          {other?.name[0] ?? "?"}
                        </div>
                        <span style={{ fontSize: 12, fontWeight: 500, color: "var(--text)", flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                          {other?.name}
                        </span>
                        <span style={{ fontSize: 12, fontWeight: 700, color: scoreColor(d.compatibilityScore), flexShrink: 0 }}>
                          {d.compatibilityScore}%
                        </span>
                      </div>
                    </Link>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Right column */}
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          {/* Summary */}
          <div style={{ border: "1px solid var(--border)", borderRadius: 12, background: "var(--card)", padding: "20px 22px" }}>
            <p style={{ fontSize: 11, fontWeight: 600, letterSpacing: "0.06em", textTransform: "uppercase", color: "var(--muted)", marginBottom: 10 }}>
              Profile Summary
            </p>
            <p style={{ fontSize: 14, lineHeight: 1.7, color: "var(--text)" }}>{person.analysis.summary}</p>
            {analysis.evidence?.summary && (
              <p style={{ fontSize: 12, marginTop: 10, color: "var(--muted)", fontStyle: "italic" }}>
                Source: {analysis.evidence.summary}
              </p>
            )}
          </div>

          {/* Analysis traits */}
          <div style={{ border: "1px solid var(--border)", borderRadius: 12, background: "var(--card)", padding: "20px 22px" }}>
            <p style={{ fontSize: 11, fontWeight: 600, letterSpacing: "0.06em", textTransform: "uppercase", color: "var(--muted)", marginBottom: 16 }}>
              AI Analysis
            </p>
            <TagGroup label="Personality traits" items={person.analysis.personality} />
            <TagGroup label="Interests" items={person.analysis.interests} />
            <TagGroup label="Hobbies" items={person.analysis.hobbies} />
            <TagGroup label="Relationship needs" items={person.analysis.needs} />
            {analysis.inferredFields && analysis.inferredFields.length > 0 && (
              <p style={{ fontSize: 11, color: "var(--muted)", marginTop: 4 }}>
                Inferred (not directly stated): {analysis.inferredFields.join(", ")}
              </p>
            )}
          </div>

          {/* Looking for */}
          {(person.analysis.lookingFor || analysis.dealbreakers?.length) && (
            <div style={{ border: "1px solid var(--border)", borderRadius: 12, background: "var(--card)", padding: "20px 22px" }}>
              {person.analysis.lookingFor && (
                <>
                  <p style={{ fontSize: 11, fontWeight: 600, letterSpacing: "0.06em", textTransform: "uppercase", color: "var(--muted)", marginBottom: 8 }}>
                    Looking for
                  </p>
                  <p style={{ fontSize: 13, lineHeight: 1.6, color: "var(--text)", marginBottom: analysis.dealbreakers?.length ? 16 : 0 }}>
                    {person.analysis.lookingFor}
                  </p>
                </>
              )}
              {analysis.dealbreakers?.length ? (
                <>
                  <div style={{ height: 1, background: "var(--border)", marginBottom: 16 }} />
                  <p style={{ fontSize: 11, fontWeight: 600, letterSpacing: "0.06em", textTransform: "uppercase", color: "var(--muted)", marginBottom: 8 }}>
                    Dealbreakers
                  </p>
                  <ul style={{ listStyle: "none", display: "flex", flexDirection: "column", gap: 4 }}>
                    {analysis.dealbreakers.map(d => (
                      <li key={d} style={{ fontSize: 13, color: "var(--text)" }}>• {d}</li>
                    ))}
                  </ul>
                </>
              ) : null}
            </div>
          )}

          {/* Agent dates */}
          {allDates.length > 0 && (
            <div style={{ border: "1px solid var(--border)", borderRadius: 12, background: "var(--card)", padding: "20px 22px" }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
                <p style={{ fontSize: 11, fontWeight: 600, letterSpacing: "0.06em", textTransform: "uppercase", color: "var(--muted)" }}>
                  Agent Dates
                </p>
                <Link href="/dates" style={{ fontSize: 12, color: "var(--accent)" }}>View in Studio →</Link>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                {allDates.slice(0, 3).map((date, i) => {
                  const otherId = date.personA === id ? date.personB : date.personA;
                  const other = people.find(p => p.id === otherId);
                  return (
                    <div key={i} style={{ paddingTop: i > 0 ? 16 : 0, borderTop: i > 0 ? "1px solid var(--border)" : "none" }}>
                      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
                        <span style={{ fontSize: 13, fontWeight: 500, color: "var(--text)" }}>with {other?.name ?? "Unknown"}</span>
                        <span style={{ fontSize: 13, fontWeight: 700, color: scoreColor(date.compatibilityScore) }}>{date.compatibilityScore}%</span>
                      </div>
                      <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                        {date.messages.slice(0, 3).map((msg, j) => {
                          const isMe = (msg.role === "A" && date.personA === id) || (msg.role === "B" && date.personB === id);
                          return (
                            <div key={j} style={{ display: "flex", gap: 8, flexDirection: isMe ? "row-reverse" : "row" }}>
                              <div style={{ padding: "6px 12px", borderRadius: 10, fontSize: 12, lineHeight: 1.5, maxWidth: "75%", background: isMe ? "var(--surface2)" : "var(--surface)", color: "var(--text)" }}>
                                {msg.content}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                      <p style={{ fontSize: 12, color: "var(--muted)", fontStyle: "italic", marginTop: 8 }}>{date.compatibilityReason}</p>
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
