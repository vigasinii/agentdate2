"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { Users, MessageSquareHeart, Trophy, Sparkles, Plus, Loader2, ExternalLink, Heart } from "lucide-react";

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

interface DateRecord {
  personA: string;
  personB: string;
  compatibilityScore: number;
  compatibilityReason: string;
  messages: { role: string; content: string }[];
}

function StatCard({ label, value, icon: Icon, accent }: { label: string; value: string | number; icon: React.ElementType; accent?: string }) {
  return (
    <div
      className="rounded-xl p-5 border flex items-center gap-4"
      style={{ background: "var(--surface1)", borderColor: "var(--border)" }}
    >
      <div
        className="w-10 h-10 rounded-lg flex items-center justify-center"
        style={{ background: accent ? `${accent}18` : "rgba(201,167,255,0.1)" }}
      >
        <Icon size={18} style={{ color: accent ?? "var(--accent)" }} />
      </div>
      <div>
        <p className="text-2xl font-bold" style={{ color: "var(--text)" }}>{value}</p>
        <p className="text-xs" style={{ color: "var(--muted)" }}>{label}</p>
      </div>
    </div>
  );
}

export default function Home() {
  const [linkedinUrl, setLinkedinUrl] = useState("");
  const [instagramUrl, setInstagramUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState("");
  const [people, setPeople] = useState<Person[]>([]);
  const [dates, setDates] = useState<DateRecord[]>([]);
  const [topMatches, setTopMatches] = useState<{ a: Person; b: Person; score: number }[]>([]);
  const [showForm, setShowForm] = useState(false);

  useEffect(() => {
    Promise.all([
      fetch("/api/add-person").then(r => r.json()),
      fetch("/api/run-dates").then(r => r.json()),
    ]).then(([pData, dData]) => {
      const pArr: Person[] = Array.isArray(pData) ? pData : [];
      setPeople(pArr);
      const dArr: DateRecord[] = Array.isArray(dData?.dates) ? dData.dates : [];
      setDates(dArr);
      const sorted = [...dArr].sort((a, b) => b.compatibilityScore - a.compatibilityScore).slice(0, 3);
      const matches = sorted.flatMap(d => {
        const a = pArr.find(p => p.id === d.personA);
        const b = pArr.find(p => p.id === d.personB);
        return a && b ? [{ a, b, score: d.compatibilityScore }] : [];
      });
      setTopMatches(matches);
    });
  }, []);

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
      setPeople(prev => [...prev, person]);
      setLinkedinUrl("");
      setInstagramUrl("");
      setStatus(`Added ${person.name} successfully`);
      setShowForm(false);
    } catch (err) {
      setStatus(`Error: ${err}`);
    } finally {
      setLoading(false);
    }
  }

  const scoreColor = (s: number) => s >= 70 ? "#4ade80" : s >= 40 ? "#facc15" : "#f87171";

  return (
    <div className="p-6 md:p-8 max-w-4xl">
      {/* Header */}
      <div className="mb-8">
        <p className="text-xs font-semibold uppercase tracking-widest mb-2" style={{ color: "var(--accent)" }}>Overview</p>
        <h1 className="text-3xl font-bold mb-1" style={{ color: "var(--text)" }}>AgentDate Dashboard</h1>
        <p className="text-sm" style={{ color: "var(--muted)" }}>AI agents simulate real-person conversations to find compatibility</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-8">
        <StatCard label="Profiles analyzed" value={people.length} icon={Users} />
        <StatCard label="Agent dates run" value={dates.length} icon={MessageSquareHeart} accent="var(--romantic)" />
        <StatCard label="Avg compatibility" value={dates.length ? Math.round(dates.reduce((a, d) => a + d.compatibilityScore, 0) / dates.length) + "%" : "—"} icon={Trophy} accent="#facc15" />
      </div>

      {/* Top Matches */}
      {topMatches.length > 0 && (
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold uppercase tracking-widest" style={{ color: "var(--muted)" }}>Top Compatibility</h2>
            <Link href="/rankings" className="text-xs hover:underline" style={{ color: "var(--accent)" }}>View all →</Link>
          </div>
          <div className="space-y-3">
            {topMatches.map(({ a, b, score }, i) => (
              <div key={i} className="flex items-center gap-4 rounded-xl p-4 border" style={{ background: "var(--surface1)", borderColor: "var(--border)" }}>
                <span className="text-xs font-bold w-4" style={{ color: "var(--muted)" }}>#{i + 1}</span>
                <div className="flex items-center gap-2 flex-1 min-w-0">
                  <div className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold" style={{ background: "rgba(201,167,255,0.15)", color: "var(--accent)" }}>{a.name[0]}</div>
                  <span className="text-sm font-medium truncate" style={{ color: "var(--text)" }}>{a.name}</span>
                </div>
                <Heart size={14} style={{ color: "var(--romantic)", flexShrink: 0 }} />
                <div className="flex items-center gap-2 flex-1 min-w-0">
                  <div className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold" style={{ background: "rgba(242,166,184,0.15)", color: "var(--romantic)" }}>{b.name[0]}</div>
                  <span className="text-sm font-medium truncate" style={{ color: "var(--text)" }}>{b.name}</span>
                </div>
                <span className="text-sm font-bold ml-2" style={{ color: scoreColor(score) }}>{score}%</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* CTA + Add form */}
      <div className="flex gap-3 mb-6 flex-wrap">
        <Link
          href="/dates"
          className="flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-semibold transition-all"
          style={{ background: "var(--accent)", color: "#100D16" }}
        >
          <Sparkles size={16} /> Watch Agents Date
        </Link>
        <button
          onClick={() => setShowForm(v => !v)}
          className="flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-semibold border transition-all"
          style={{ borderColor: "var(--border)", color: "var(--text)", background: "var(--surface1)" }}
        >
          <Plus size={16} /> Add a Person
        </button>
      </div>

      {/* Add Person Form */}
      {showForm && (
        <div className="rounded-xl border p-6 mb-6 animate-fade-in" style={{ background: "var(--surface1)", borderColor: "var(--border)" }}>
          <h2 className="text-base font-semibold mb-4" style={{ color: "var(--text)" }}>Add a Person</h2>
          <form onSubmit={handleAddPerson} className="space-y-4">
            <div>
              <label className="block text-xs font-medium mb-1.5" style={{ color: "var(--muted)" }}>LinkedIn URL</label>
              <div className="flex items-center gap-2 rounded-lg border px-3" style={{ background: "var(--surface2)", borderColor: "var(--border)" }}>
                <ExternalLink size={14} style={{ color: "var(--muted)" }} />
                <input
                  type="url"
                  value={linkedinUrl}
                  onChange={e => setLinkedinUrl(e.target.value)}
                  placeholder="https://linkedin.com/in/username"
                  className="flex-1 bg-transparent py-2.5 text-sm outline-none placeholder-gray-600"
                  style={{ color: "var(--text)" }}
                  required
                />
              </div>
            </div>
            <div>
              <label className="block text-xs font-medium mb-1.5" style={{ color: "var(--muted)" }}>Instagram URL (public)</label>
              <div className="flex items-center gap-2 rounded-lg border px-3" style={{ background: "var(--surface2)", borderColor: "var(--border)" }}>
                <ExternalLink size={14} style={{ color: "var(--muted)" }} />
                <input
                  type="url"
                  value={instagramUrl}
                  onChange={e => setInstagramUrl(e.target.value)}
                  placeholder="https://instagram.com/username"
                  className="flex-1 bg-transparent py-2.5 text-sm outline-none placeholder-gray-600"
                  style={{ color: "var(--text)" }}
                  required
                />
              </div>
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 rounded-lg text-sm font-semibold flex items-center justify-center gap-2 transition-opacity disabled:opacity-60"
              style={{ background: "var(--accent)", color: "#100D16" }}
            >
              {loading ? <><Loader2 size={16} className="animate-spin" /> Analyzing...</> : "Add Person & Analyze"}
            </button>
            {status && <p className="text-xs mt-2" style={{ color: status.startsWith("Error") ? "#f87171" : "var(--accent)" }}>{status}</p>}
          </form>
        </div>
      )}

      {/* People mini-grid */}
      {people.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold uppercase tracking-widest" style={{ color: "var(--muted)" }}>People · {people.length}</h2>
            <Link href="/profiles" className="text-xs hover:underline" style={{ color: "var(--accent)" }}>View all →</Link>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
            {people.slice(0, 8).map(p => (
              <Link key={p.id} href={`/profiles/${p.id}`}>
                <div className="rounded-xl border p-3 text-center transition-all hover:border-opacity-50 cursor-pointer" style={{ background: "var(--surface1)", borderColor: "var(--border)" }}>
                  <div className="w-10 h-10 rounded-full mx-auto mb-2 flex items-center justify-center text-sm font-bold" style={{ background: "rgba(201,167,255,0.15)", color: "var(--accent)" }}>
                    {p.profilePicture
                      ? <img src={p.profilePicture} alt={p.name} className="w-10 h-10 rounded-full object-cover" />
                      : p.name[0]}
                  </div>
                  <p className="text-xs font-medium truncate" style={{ color: "var(--text)" }}>{p.name}</p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
