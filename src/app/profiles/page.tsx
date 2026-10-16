export const dynamic = "force-dynamic";
import { getPeople } from "@/lib/store";
import Link from "next/link";

export default function ProfilesPage() {
  const people = getPeople();

  return (
    <main className="min-h-screen bg-gradient-to-br from-rose-50 to-pink-100 p-8">
      <div className="max-w-4xl mx-auto">
        <Link href="/" className="text-rose-500 hover:underline mb-6 inline-block">← Back</Link>
        <h1 className="text-4xl font-bold text-rose-600 mb-2">👥 All Profiles</h1>
        <p className="text-gray-500 mb-8">{people.length} people analyzed by their agents</p>

        {people.length === 0 && (
          <div className="bg-white rounded-2xl shadow p-8 text-center text-gray-400">
            No profiles yet. <Link href="/" className="text-rose-500 underline">Add people on the home page.</Link>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {people.map((person) => (
            <Link href={`/profiles/${person.id}`} key={person.id}>
              <div className="bg-white rounded-2xl shadow-lg p-6 hover:shadow-xl transition cursor-pointer">
                <div className="flex items-center gap-4 mb-4">
                  {person.profilePicture ? (
                    <img src={person.profilePicture} alt={person.name} className="w-16 h-16 rounded-full object-cover" />
                  ) : (
                    <div className="w-16 h-16 rounded-full bg-rose-200 flex items-center justify-center text-2xl">💘</div>
                  )}
                  <div>
                    <h2 className="text-xl font-bold text-gray-800">{person.name}</h2>
                    <p className="text-gray-500 text-sm line-clamp-1">{person.rawLinkedIn?.headline}</p>
                  </div>
                </div>
                <p className="text-gray-600 text-sm mb-4 line-clamp-2">{person.analysis.summary}</p>
                <div className="flex flex-wrap gap-2 mb-3">
                  {(person.analysis.personality ?? []).map((t) => (
                    <span key={t} className="bg-rose-100 text-rose-600 text-xs px-2 py-1 rounded-full">{t}</span>
                  ))}
                </div>
                <div className="flex flex-wrap gap-2">
                  {(person.analysis.hobbies ?? []).slice(0, 3).map((h) => (
                    <span key={h} className="bg-pink-100 text-pink-600 text-xs px-2 py-1 rounded-full">{h}</span>
                  ))}
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </main>
  );
}
