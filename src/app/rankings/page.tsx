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
  const scoreBg = (s: number) => s >= 70 ? "#f0fdf4" : s >= 40 ? "#fffbeb" : "#fef2f2";
  const totalSynthetic = dates.filter(d => (d as { synthetic?: boolean }).synthetic).length;
  const totalLive = dates.length - totalSynthetic;

  return (
    <div className="max-w-4xl mx-auto px-6 py-10">
      <div className="mb-6">
        <h1 className="text-[30px] font-semibold mb-1" style={{ color: "var(--text)" }}>Rankings</h1>
        <p className="text-[14px]" style={{ color: "var(--muted)" }}>Ranked by AI compatibility score from agent date simulations</p>
      </div>

      <div className="flex items-start gap-2 p-3 rounded-lg border mb-6 text-[13px]" style={{ borderColor: "var(--border)", background: "var(--surface)", color: "var(--muted)" }}>
        <Info size={14} className="shrink-0 mt-0.5" style={{ color: "var(--accent)" }} />
        <span>Scores combine shared interests, personality fit, and value alignment — all based on limited public data and carry uncertainty.
        {totalSynthetic > 0 && <span> <strong style={{ color: "var(--text)" }}>{totalSynthetic}</strong> demo dates · <strong style={{ color: "var(--text)" }}>{totalLive}</strong> live agent runs.</span>}</span>
      </div>

      {rankings.length === 0 && (
        <div className="rounded-xl border p-12 text-center text-[14px]" style={{ borderColor: "var(--border)", color: "var(--muted)" }}>
          No dates yet. <Link href="/" className="underline" style={{ color: "var(--accent)" }}>Run dates from the dashboard.</Link>
        </div>
      )}

      <div className="space-y-5">
        {rankings.map(({ personId, rankings: r, unevaluatedCount }) => {
          const person = getP(personId);
          if (!person || r.length === 0) return null;
          return (
            <div key={personId} className="rounded-xl border overflow-hidden" style={{ background: "var(--card)", borderColor: "var(--border)" }}>
              <div className="flex items-center gap-3 px-5 py-4 border-b" style={{ borderColor: "var(--border)" }}>
                {person.profilePicture
                  ? <img src={person.profilePicture} alt={person.name} className="w-9 h-9 rounded-full object-cover" />
                  : <div className="w-9 h-9 rounded-full flex items-center justify-center text-[13px] font-medium" style={{ background: "var(--surface2)", color: "var(--muted)" }}>{person.name[0]}</div>}
                <div className="flex-1 min-w-0">
                  <p className="text-[14px] font-semibold truncate" style={{ color: "var(--text)" }}>{person.name}</p>
                  <p className="text-[12px] truncate" style={{ color: "var(--muted)" }}>{person.rawLinkedIn?.headline}</p>
                </div>
                <div className="text-right text-[12px]" style={{ color: "var(--muted)" }}>
                  <p>{r.length} evaluated</p>
                  {unevaluatedCount > 0 && <p>{unevaluatedCount} pending</p>}
                </div>
              </div>
              <div>
                {r.map(({ personId: matchId, score, reason, synthetic: isSyn }, rank) => {
                  const match = getP(matchId);
                  if (!match) return null;
                  return (
                    <div key={matchId} className="flex items-center gap-3 px-5 py-3 border-b last:border-0 hover:bg-[var(--surface)] transition-colors"
                      style={{ borderColor: "var(--border)" }}>
                      <span className="text-[12px] font-medium w-6 text-center" style={{ color: "var(--muted)" }}>
                        {rank === 0 ? "1st" : rank === 1 ? "2nd" : rank === 2 ? "3rd" : "#" + (rank + 1)}
                      </span>
                      {match.profilePicture
                        ? <img src={match.profilePicture} alt={match.name} className="w-8 h-8 rounded-full object-cover" />
                        : <div className="w-8 h-8 rounded-full flex items-center justify-center text-[12px] font-medium" style={{ background: "var(--surface2)", color: "var(--muted)" }}>{match.name[0]}</div>}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-0.5">
                          <Link href={"/profiles/" + matchId} className="text-[13px] font-medium hover:underline" style={{ color: "var(--text)" }}>{match.name}</Link>
                          {isSyn && <span className="text-[10px] px-1 rounded border" style={{ borderColor: "var(--border)", color: "var(--muted)" }}>demo</span>}
                        </div>
                        <p className="text-[12px] line-clamp-1" style={{ color: "var(--muted)" }}>{reason}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="h-1.5 w-16 rounded-full overflow-hidden" style={{ background: "var(--surface2)" }}>
                          <div className="h-full rounded-full" style={{ width: score + "%", background: scoreColor(score) }} />
                        </div>
                        <span className="text-[13px] font-semibold w-9 text-right" style={{ color: scoreColor(score) }}>{score}%</span>
                      </div>
                      <Link href="/dates" className="text-[11px] px-2 py-1 rounded border hover:border-[var(--accent)] transition-colors"
                        style={{ borderColor: "var(--border)", color: "var(--muted)" }}>Watch</Link>
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
