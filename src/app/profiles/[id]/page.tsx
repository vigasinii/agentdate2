export const dynamic = "force-dynamic";
import { getPeople } from "@/lib/store";
import { getDates } from "@/lib/store";
import Link from "next/link";

export default async function ProfilePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const people = getPeople();
  const person = people.find((p) => p.id === id);

  if (!person) {
    return <div className="p-8 text-center text-gray-500">Person not found.</div>;
  }

  const dates = getDates().filter((d) => d.personA === id || d.personB === id);

  return (
    <main className="min-h-screen bg-gradient-to-br from-rose-50 to-pink-100 p-8">
      <div className="max-w-3xl mx-auto">
        <Link href="/" className="text-rose-500 hover:underline mb-6 inline-block">← Back</Link>

        {/* Profile Header */}
        <div className="bg-white rounded-2xl shadow-lg p-8 mb-6">
          <div className="flex items-center gap-6 mb-6">
            {person.profilePicture ? (
              <img src={person.profilePicture} alt={person.name} className="w-24 h-24 rounded-full object-cover" />
            ) : (
              <div className="w-24 h-24 rounded-full bg-rose-200 flex items-center justify-center text-3xl">💘</div>
            )}
            <div>
              <h1 className="text-3xl font-bold text-gray-800">{person.name}</h1>
              <p className="text-gray-500">{person.rawLinkedIn.headline}</p>
              <p className="text-gray-400 text-sm">{person.rawLinkedIn.location}</p>
              <div className="flex gap-2 mt-2">
                <a href={person.linkedinUrl} target="_blank" className="text-blue-500 text-sm hover:underline">LinkedIn</a>
                <a href={person.instagramUrl} target="_blank" className="text-pink-500 text-sm hover:underline">Instagram</a>
              </div>
            </div>
          </div>

          <p className="text-gray-700 text-lg leading-relaxed mb-6">{person.analysis.summary}</p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Section title="💝 Needs" items={person.analysis.needs ?? []} color="rose" />
            <Section title="🎯 Hobbies" items={person.analysis.hobbies ?? []} color="pink" />
            <Section title="✨ Interests" items={person.analysis.interests ?? []} color="purple" />
            <Section title="🧠 Personality" items={person.analysis.personality ?? []} color="indigo" />
          </div>

          <div className="mt-6 bg-rose-50 rounded-xl p-4">
            <h3 className="font-semibold text-rose-700 mb-1">💑 Looking For</h3>
            <p className="text-gray-700">{person.analysis.lookingFor}</p>
          </div>

          {person.analysis.dealbreakers?.length > 0 && (
            <div className="mt-4 bg-red-50 rounded-xl p-4">
              <h3 className="font-semibold text-red-600 mb-1">🚫 Dealbreakers</h3>
              <ul className="list-disc list-inside text-gray-700">
                {person.analysis.dealbreakers.map((d) => <li key={d}>{d}</li>)}
              </ul>
            </div>
          )}
        </div>

        {/* Dates */}
        {dates.length > 0 && (
          <div className="bg-white rounded-2xl shadow-lg p-8">
            <h2 className="text-2xl font-bold text-gray-800 mb-4">💬 Agent Dates</h2>
            {dates.map((date, i) => {
              const otherId = date.personA === id ? date.personB : date.personA;
              const other = people.find((p) => p.id === otherId);
              return (
                <div key={i} className="border border-gray-200 rounded-xl p-4 mb-4">
                  <div className="flex justify-between items-center mb-3">
                    <h3 className="font-semibold text-gray-800">Date with {other?.name ?? "Unknown"}</h3>
                    <span className={`px-3 py-1 rounded-full text-sm font-bold ${date.compatibilityScore >= 70 ? "bg-green-100 text-green-700" : date.compatibilityScore >= 40 ? "bg-yellow-100 text-yellow-700" : "bg-red-100 text-red-700"}`}>
                      {date.compatibilityScore}% match
                    </span>
                  </div>
                  <div className="space-y-2">
                    {date.messages.map((msg, j) => {
                      const speaker = msg.role === "A" ? (date.personA === id ? person : other) : (date.personB === id ? person : other);
                      return (
                        <div key={j} className={`flex gap-2 ${msg.role === "A" ? "" : "flex-row-reverse"}`}>
                          <div className="w-8 h-8 rounded-full bg-rose-200 flex-shrink-0 flex items-center justify-center text-xs font-bold">
                            {speaker?.name?.[0] ?? "?"}
                          </div>
                          <div className={`max-w-xs px-3 py-2 rounded-xl text-sm ${msg.role === "A" ? "bg-rose-100 text-gray-800" : "bg-gray-100 text-gray-800"}`}>
                            {msg.content}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                  <p className="text-xs text-gray-500 mt-3 italic">{date.compatibilityReason}</p>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </main>
  );
}

function Section({ title, items, color }: { title: string; items: string[]; color: string }) {
  const colors: Record<string, string> = {
    rose: "bg-rose-100 text-rose-700",
    pink: "bg-pink-100 text-pink-700",
    purple: "bg-purple-100 text-purple-700",
    indigo: "bg-indigo-100 text-indigo-700",
  };
  return (
    <div>
      <h3 className="font-semibold text-gray-700 mb-2">{title}</h3>
      <div className="flex flex-wrap gap-2">
        {items.map((item) => (
          <span key={item} className={`px-3 py-1 rounded-full text-sm ${colors[color] ?? "bg-gray-100 text-gray-700"}`}>{item}</span>
        ))}
      </div>
    </div>
  );
}
