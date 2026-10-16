export const dynamic = "force-dynamic";
import { getPeople, getDates } from "@/lib/store";
import { computeRankings } from "@/lib/groq";
import Link from "next/link";

export default function RankingsPage() {
  const people = getPeople();
  const dates = getDates();
  const rankings = computeRankings(people, dates);

  const getPersonById = (id: string) => people.find((p) => p.id === id);

  return (
    <main className="min-h-screen bg-gradient-to-br from-rose-50 to-pink-100 p-8">
      <div className="max-w-4xl mx-auto">
        <Link href="/" className="text-rose-500 hover:underline mb-6 inline-block">← Back</Link>
        <h1 className="text-4xl font-bold text-rose-600 mb-2">💘 Match Rankings</h1>
        <p className="text-gray-500 mb-8">Who fits each person best, ranked by compatibility</p>

        {rankings.length === 0 && (
          <div className="bg-white rounded-2xl shadow p-8 text-center text-gray-400">
            No dates have run yet. <Link href="/" className="text-rose-500 underline">Add people and run dates first.</Link>
          </div>
        )}

        <div className="space-y-8">
          {rankings.map(({ personId, rankings: r }) => {
            const person = getPersonById(personId);
            if (!person) return null;
            return (
              <div key={personId} className="bg-white rounded-2xl shadow-lg p-6">
                <div className="flex items-center gap-4 mb-5">
                  {person.profilePicture ? (
                    <img src={person.profilePicture} alt={person.name} className="w-14 h-14 rounded-full object-cover" />
                  ) : (
                    <div className="w-14 h-14 rounded-full bg-rose-200 flex items-center justify-center text-2xl">💘</div>
                  )}
                  <div>
                    <h2 className="text-xl font-bold text-gray-800">{person.name}</h2>
                    <p className="text-gray-500 text-sm">{person.rawLinkedIn?.headline}</p>
                  </div>
                </div>

                <div className="space-y-3">
                  {r.map(({ personId: matchId, score, reason }, rank) => {
                    const match = getPersonById(matchId);
                    if (!match) return null;
                    const medal = rank === 0 ? "🥇" : rank === 1 ? "🥈" : rank === 2 ? "🥉" : `#${rank + 1}`;
                    return (
                      <div key={matchId} className="flex items-center gap-4 p-3 rounded-xl border border-gray-100 hover:bg-rose-50 transition">
                        <span className="text-xl w-8">{medal}</span>
                        {match.profilePicture ? (
                          <img src={match.profilePicture} alt={match.name} className="w-10 h-10 rounded-full object-cover" />
                        ) : (
                          <div className="w-10 h-10 rounded-full bg-pink-200 flex items-center justify-center font-bold text-pink-600">
                            {match.name[0]}
                          </div>
                        )}
                        <div className="flex-1">
                          <Link href={`/profiles/${matchId}`} className="font-semibold text-gray-800 hover:text-rose-600">{match.name}</Link>
                          <p className="text-xs text-gray-500 line-clamp-1">{reason}</p>
                        </div>
                        <div className={`px-3 py-1 rounded-full text-sm font-bold ${score >= 70 ? "bg-green-100 text-green-700" : score >= 40 ? "bg-yellow-100 text-yellow-700" : "bg-red-100 text-red-700"}`}>
                          {score}%
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </main>
  );
}
