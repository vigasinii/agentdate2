"use client";
import { useState } from "react";
import Link from "next/link";

interface Person {
  id: string;
  name: string;
  profilePicture?: string;
  analysis: {
    summary: string;
    needs: string[];
    hobbies: string[];
    interests: string[];
    personality: string[];
    lookingFor: string;
  };
}

export default function Home() {
  const [linkedinUrl, setLinkedinUrl] = useState("");
  const [instagramUrl, setInstagramUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [people, setPeople] = useState<Person[]>([]);
  const [status, setStatus] = useState("");
  const [datingLoading, setDatingLoading] = useState(false);

  async function handleAddPerson(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setStatus("Scraping profiles...");
    try {
      const res = await fetch("/api/add-person", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ linkedinUrl, instagramUrl }),
      });
      const person = await res.json();
      if (person.error) throw new Error(person.error);
      setPeople((prev) => [...prev, person]);
      setLinkedinUrl("");
      setInstagramUrl("");
      setStatus(`✓ ${person.name} added`);
    } catch (err) {
      setStatus(`Error: ${err}`);
    } finally {
      setLoading(false);
    }
  }

  async function loadAll() {
    const res = await fetch("/api/add-person");
    const data = await res.json();
    setPeople(data);
  }

  async function runDates() {
    setDatingLoading(true);
    setStatus("Agents are dating... this may take a few minutes.");
    try {
      const res = await fetch("/api/run-dates", { method: "POST" });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setStatus(`✓ Dating complete! ${data.dates.length} dates ran.`);
      window.location.href = "/rankings";
    } catch (err) {
      setStatus(`Error: ${err}`);
    } finally {
      setDatingLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-rose-50 to-pink-100 p-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-10">
          <h1 className="text-5xl font-bold text-rose-600 mb-2">💘 AgentDate</h1>
          <p className="text-gray-600 text-lg">AI agents that date on your behalf</p>
          <div className="flex gap-4 justify-center mt-4">
            <Link href="/profiles" className="text-rose-500 underline hover:text-rose-700">View Profiles</Link>
            <Link href="/rankings" className="text-rose-500 underline hover:text-rose-700">View Rankings</Link>
            <Link href="/dates" className="text-rose-500 underline hover:text-rose-700">View Dates</Link>
          </div>
        </div>

        {/* Add Person Form */}
        <div className="bg-white rounded-2xl shadow-lg p-8 mb-8">
          <h2 className="text-2xl font-semibold text-gray-800 mb-6">Add a Person</h2>
          <form onSubmit={handleAddPerson} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">LinkedIn Profile URL</label>
              <input
                type="url"
                value={linkedinUrl}
                onChange={(e) => setLinkedinUrl(e.target.value)}
                placeholder="https://linkedin.com/in/username"
                className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-rose-400"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Instagram Profile URL (public)</label>
              <input
                type="url"
                value={instagramUrl}
                onChange={(e) => setInstagramUrl(e.target.value)}
                placeholder="https://instagram.com/username"
                className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-rose-400"
                required
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-rose-500 text-white py-3 rounded-lg font-semibold hover:bg-rose-600 disabled:opacity-50 transition"
            >
              {loading ? "Analyzing..." : "Add Person & Analyze"}
            </button>
          </form>
          {status && <p className="mt-4 text-sm text-gray-600">{status}</p>}
        </div>

        {/* People Grid */}
        {people.length > 0 && (
          <div className="mb-8">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-2xl font-semibold text-gray-800">{people.length} People Added</h2>
              <button
                onClick={runDates}
                disabled={datingLoading || people.length < 2}
                className="bg-pink-600 text-white px-6 py-2 rounded-lg font-semibold hover:bg-pink-700 disabled:opacity-50 transition"
              >
                {datingLoading ? "Dating in progress..." : "🚀 Run All Dates"}
              </button>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {people.map((p) => (
                <Link href={`/profiles/${p.id}`} key={p.id}>
                  <div className="bg-white rounded-xl shadow p-4 hover:shadow-md transition cursor-pointer">
                    {p.profilePicture && (
                      <img src={p.profilePicture} alt={p.name} className="w-16 h-16 rounded-full object-cover mb-3 mx-auto" />
                    )}
                    <h3 className="font-semibold text-gray-800 text-center">{p.name}</h3>
                    <p className="text-xs text-gray-500 text-center mt-1 line-clamp-2">{p.analysis.summary}</p>
                    <div className="flex flex-wrap gap-1 mt-2 justify-center">
                      {(p.analysis.personality ?? []).slice(0, 2).map((t) => (
                        <span key={t} className="bg-rose-100 text-rose-600 text-xs px-2 py-0.5 rounded-full">{t}</span>
                      ))}
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}

        {people.length === 0 && (
          <button onClick={loadAll} className="w-full text-rose-500 border border-rose-300 py-2 rounded-lg hover:bg-rose-50">
            Load existing profiles
          </button>
        )}
      </div>
    </main>
  );
}
