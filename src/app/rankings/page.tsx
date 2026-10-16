export const dynamic = "force-dynamic";
import { getPeople, getDates } from "@/lib/store";
import { computeRankings } from "@/lib/groq";
import Link from "next/link";

export default function RankingsPage() {
  const people = getPeople();
  const dates = getDates();
  const rankings = computeRankings(people, dates);

  const getP = (id: string) => people.find(p => p.id === id);
  const scoreColor = (s: number) => s >= 70 ? "#4ade80" : s >= 40 ? "#facc15" : "#f87171";
  const medals = ["#FFD700", "#C0C0C0", "#CD7F32"];

  return (
    <div className="p-6 md:p-8 max-w-4xl">
      <div className="mb-8">
        <p className="text-xs font-semibold uppercase tracking-widest mb-2" style={{ color: "var(--accent)" }}>Rankings</p>
        <h1 className="text-3xl font-bold mb-1" style={{ color: "var(--text)" }}>Matchmaking Leaderboard</h1>
        <p className="text-sm" style={{ color: "var(--muted)" }}>Who fits each person best, ranked by AI compatibility score</p>
      </div>

      {rankings.length === 0 && (
        <div className="rounded-xl border p-12 text-center" style={{ background: "var(--surface1)", borderColor: "var(--border)" }}>
          <p className="text-sm mb-2" style={{ color: "var(--muted)" }}>No dates have run yet.</p>
          <Link href="/" className="text-sm hover:underline" style={{ color: "var(--accent)" }}>Add people and run dates first ?</Link>
        </div>
      )}

      <div className="space-y-6">
        {rankings.map(({ personId, rankings: r }) => {
          const person = getP(personId);
          if (!person) return null;
          return (
            <div key={personId} className="rounded-xl border overflow-hidden" style={{ background: "var(--surface1)", borderColor: "var(--border)" }}>
              {/* Person header */}
              <div className="flex items-center gap-4 p-5 border-b" style={{ borderColor: "var(--border)" }}>
                {person.profilePicture ? (
                  <img src={person.profilePicture} alt={person.name} className="w-12 h-12 rounded-full object-cover" />
                ) : (
                  <div className="w-12 h-12 rounded-full flex items-center justify-center text-lg font-bold"
                    style={{ background: "rgba(201,167,255,0.12)", color: "var(--accent)" }}>
                    {person.name[0]}
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <h2 className="text-base font-bold" style={{ color: "var(--text)" }}>{person.name}</h2>
                  <p className="text-xs truncate" style={{ color: "var(--muted)" }}>{person.rawLinkedIn?.headline}</p>
                </div>
                <Link href={`/profiles/${personId}`} className="text-xs px-3 py-1.5 rounded-lg border transition-colors hover:border-purple-400"
                  style={{ borderColor: "var(--border)", color: "var(--muted)" }}>Profile ?</Link>
              </div>

              {/* Match list */}
              <div className="divide-y" style={{ borderColor: "var(--border)" }}>
                {r.map(({ personId: matchId, score, reason }, rank) => {
                  const match = getP(matchId);
                  if (!match) return null;
                  return (
                    <div key={matchId} className="flex items-center gap-4 px-5 py-3 hover:bg-white/[0.02] transition-colors">
                      <span className="text-xs font-bold w-5" style={{ color: rank < 3 ? medals[rank] : "var(--muted)" }}>
                        {rank < 3 ? ["1st", "2nd", "3rd"][rank] : `#${rank + 1}`}
                      </span>
                      {match.profilePicture ? (
                        <img src={match.profilePicture} alt={match.name} className="w-9 h-9 rounded-full object-cover" />
                      ) : (
                        <div className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold"
                          style={{ background: "rgba(242,166,184,0.12)", color: "var(--romantic)" }}>
                          {match.name[0]}
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-0.5">
                          <Link href={`/profiles/${matchId}`} className="text-sm font-medium hover:underline" style={{ color: "var(--text)" }}>
                            {match.name}
                          </Link>
                          <Link href={`/dates`} className="text-xs hover:underline" style={{ color: "var(--accent)", opacity: 0.7 }}>
                            View date ?
                          </Link>
                        </div>
                        <p className="text-xs line-clamp-1" style={{ color: "var(--muted)" }}>{reason}</p>
                      </div>
                      <span className="text-sm font-bold shrink-0" style={{ color: scoreColor(score) }}>{score}%</span>
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
