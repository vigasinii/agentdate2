export const dynamic = "force-dynamic";
import { getDates, getPeople } from "@/lib/store";
import Link from "next/link";

export default function DatesPage() {
  const dates = getDates();
  const people = getPeople();
  const getP = (id: string) => people.find((p) => p.id === id);

  return (
    <main className="min-h-screen bg-gradient-to-br from-rose-50 to-pink-100 p-8">
      <div className="max-w-4xl mx-auto">
        <Link href="/" className="text-rose-500 hover:underline mb-6 inline-block">← Back</Link>
        <h1 className="text-4xl font-bold text-rose-600 mb-2">💬 Agent Dates</h1>
        <p className="text-gray-500 mb-8">{dates.length} dates ran between agents</p>

        {dates.length === 0 && (
          <div className="bg-white rounded-2xl shadow p-8 text-center text-gray-400">
            No dates yet. <Link href="/" className="text-rose-500 underline">Run dates from the home page.</Link>
          </div>
        )}

        <div className="space-y-6">
          {dates.map((date, i) => {
            const pA = getP(date.personA);
            const pB = getP(date.personB);
            return (
              <div key={i} className="bg-white rounded-2xl shadow-lg p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2">
                      {pA?.profilePicture && <img src={pA.profilePicture} className="w-10 h-10 rounded-full object-cover" alt={pA.name} />}
                      <span className="font-semibold text-gray-800">{pA?.name ?? "Unknown"}</span>
                    </div>
                    <span className="text-rose-400 text-xl">💘</span>
                    <div className="flex items-center gap-2">
                      {pB?.profilePicture && <img src={pB.profilePicture} className="w-10 h-10 rounded-full object-cover" alt={pB.name} />}
                      <span className="font-semibold text-gray-800">{pB?.name ?? "Unknown"}</span>
                    </div>
                  </div>
                  <span className={`px-4 py-1 rounded-full font-bold text-sm ${date.compatibilityScore >= 70 ? "bg-green-100 text-green-700" : date.compatibilityScore >= 40 ? "bg-yellow-100 text-yellow-700" : "bg-red-100 text-red-700"}`}>
                    {date.compatibilityScore}% match
                  </span>
                </div>

                <div className="space-y-3 mb-4">
                  {date.messages.map((msg, j) => {
                    const speaker = msg.role === "A" ? pA : pB;
                    const isA = msg.role === "A";
                    return (
                      <div key={j} className={`flex gap-3 ${isA ? "" : "flex-row-reverse"}`}>
                        <div className="w-8 h-8 rounded-full bg-rose-200 flex-shrink-0 flex items-center justify-center text-xs font-bold text-rose-700">
                          {speaker?.name?.[0] ?? "?"}
                        </div>
                        <div className={`max-w-sm px-4 py-2 rounded-2xl text-sm ${isA ? "bg-rose-100 text-gray-800 rounded-tl-none" : "bg-gray-100 text-gray-800 rounded-tr-none"}`}>
                          <p className="font-semibold text-xs mb-1 text-gray-500">{speaker?.name}</p>
                          {msg.content}
                        </div>
                      </div>
                    );
                  })}
                </div>

                <div className="bg-gray-50 rounded-xl p-3 text-sm text-gray-600 italic">
                  {date.compatibilityReason}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </main>
  );
}
