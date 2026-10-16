export const dynamic = "force-dynamic";
import { getPeople, getDates } from "@/lib/store";
import { computeRankings } from "@/lib/groq";
import Link from "next/link";
import { Info } from "lucide-react";

export default function RankingsPage() {
  const people = getPeople();
  const dates = getDates();
  const rankings = computeRankings(people, dates);
  const getP = (id: string) => people.find(p => p.id === id);
  const scoreColor = (s: number) => s >= 70 ? "var(--success)" : s >= 40 ? "var(--warning)" : "var(--destructive)";
  const totalSynthetic = dates.filter(d => (d as { synthetic?: boolean }).synthetic).length;
  const totalLive = dates.length - totalSynthetic;

  function Avatar({ name, src, size = 32 }: { name: string; src?: string; size?: number }) {
    const colors = [["#E8F0EC","#456B59"],["#EBE8F0","#5B4592"],["#F0E8E8","#924545"],["#E8EDF0","#456789"],["#F0EDE8","#896745"]];
    const [bg, fg] = colors[name.charCodeAt(0) % colors.length];
    if (src) return <img src={src} alt={name} className="rounded-full object-cover flex-shrink-0" style={{ width: size, height: size }} />;
    return (
      <div className="rounded-full flex items-center justify-center font-semibold flex-shrink-0"
        style={{ width: size, height: size, background: bg, color: fg, fontSize: size * 0.38 }}>
        {name[0].toUpperCase()}
      </div>
    );
  }

  const rankLabel = (i: number) => i === 0 ? "1st" : i === 1 ? "2nd" : i === 2 ? "3rd" : `#${i + 1}`;
  const rankColor = (i: number) => i === 0 ? "#B8860B" : i === 1 ? "#707070" : i === 2 ? "#8B5E3C" : "var(--muted)";

  return (
    <div style={{ maxWidth: 900, margin: "0 auto", padding: "40px 32px 80px" }}>
      <div style={{ marginBottom: 32 }}>
        <p style={{ fontSize: 11, fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase", color: "var(--accent)", marginBottom: 8 }}>
          Results
        </p>
        <h1 style={{ fontSize: 30, fontWeight: 700, color: "var(--text)", letterSpacing: "-0.02em", lineHeight: 1.2, marginBottom: 8 }}>
          Matchmaking Rankings
        </h1>
        <p style={{ fontSize: 14, color: "var(--muted)" }}>
          Ranked by AI compatibility score from agent date simulations.
        </p>
      </div>

      <div style={{ display: "flex", alignItems: "flex-start", gap: 10, padding: "12px 14px", borderRadius: 10, border: "1px solid var(--border)", background: "var(--surface)", marginBottom: 28, fontSize: 13, color: "var(--muted)" }}>
        <Info size={14} style={{ color: "var(--accent)", flexShrink: 0, marginTop: 1 }} />
        <span style={{ lineHeight: 1.6 }}>
          Scores combine shared interests, personality fit, and value alignment — all based on limited public data and carry uncertainty.
          {totalSynthetic > 0 && (
            <> &nbsp;<strong style={{ color: "var(--text)" }}>{totalSynthetic}</strong> demo dates · <strong style={{ color: "var(--text)" }}>{totalLive}</strong> live agent runs.</>
          )}
        </span>
      </div>

      {rankings.length === 0 && (
        <div style={{ border: "1px solid var(--border)", borderRadius: 12, padding: 64, textAlign: "center", fontSize: 14, color: "var(--muted)" }}>
          No dates yet. <Link href="/" style={{ color: "var(--accent)", textDecoration: "underline" }}>Run dates from the dashboard.</Link>
        </div>
      )}

      <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        {rankings.map(({ personId, rankings: r, unevaluatedCount }) => {
          const person = getP(personId);
          if (!person || r.length === 0) return null;
          return (
            <div key={personId} style={{ border: "1px solid var(--border)", borderRadius: 12, background: "var(--card)", overflow: "hidden" }}>
              {/* Person header */}
              <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "14px 20px", borderBottom: "1px solid var(--border)" }}>
                <Avatar name={person.name} src={person.profilePicture} size={36} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ fontSize: 14, fontWeight: 600, color: "var(--text)" }}>{person.name}</p>
                  <p style={{ fontSize: 12, color: "var(--muted)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {person.rawLinkedIn?.headline}
                  </p>
                </div>
                <div style={{ textAlign: "right", fontSize: 12, color: "var(--muted)", lineHeight: 1.6 }}>
                  <p>{r.length} evaluated</p>
                  {unevaluatedCount > 0 && <p style={{ opacity: 0.7 }}>{unevaluatedCount} pending</p>}
                </div>
                <Link href={"/profiles/" + personId}
                  style={{ fontSize: 12, padding: "6px 12px", borderRadius: 7, border: "1px solid var(--border)", color: "var(--muted)", marginLeft: 8, flexShrink: 0 }}>
                  Profile
                </Link>
              </div>

              {/* Matches */}
              <div>
                {r.map(({ personId: matchId, score, reason, synthetic: isSyn }, rank) => {
                  const match = getP(matchId);
                  if (!match) return null;
                  return (
                    <div key={matchId}
                      style={{ display: "flex", alignItems: "center", gap: 12, padding: "11px 20px", borderBottom: rank < r.length - 1 ? "1px solid var(--border)" : "none", transition: "background 0.12s" }}
                      className="hover:bg-[var(--surface)]"
                    >
                      <span style={{ fontSize: 12, fontWeight: 600, width: 28, color: rankColor(rank), flexShrink: 0 }}>
                        {rankLabel(rank)}
                      </span>
                      <Avatar name={match.name} src={match.profilePicture} size={30} />
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 2 }}>
                          <Link href={"/profiles/" + matchId} style={{ fontSize: 13, fontWeight: 500, color: "var(--text)" }}
                            className="hover:underline">
                            {match.name}
                          </Link>
                          {isSyn && (
                            <span style={{ fontSize: 10, padding: "1px 6px", borderRadius: 4, border: "1px solid var(--border)", color: "var(--muted)" }}>
                              demo
                            </span>
                          )}
                        </div>
                        <p style={{ fontSize: 12, color: "var(--muted)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                          {reason}
                        </p>
                      </div>
                      <div style={{ display: "flex", alignItems: "center", gap: 10, flexShrink: 0 }}>
                        <div style={{ width: 60, height: 4, borderRadius: 2, background: "var(--surface2)", overflow: "hidden" }}>
                          <div style={{ height: "100%", width: score + "%", background: scoreColor(score), borderRadius: 2 }} />
                        </div>
                        <span style={{ fontSize: 13, fontWeight: 700, color: scoreColor(score), width: 36, textAlign: "right" }}>
                          {score}%
                        </span>
                      </div>
                      <Link href="/dates"
                        style={{ fontSize: 11, padding: "5px 10px", borderRadius: 6, border: "1px solid var(--border)", color: "var(--muted)", flexShrink: 0, marginLeft: 4 }}
                        className="hover:border-[var(--accent)] transition-colors">
                        Watch
                      </Link>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
