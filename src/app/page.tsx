"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { ArrowRight, Plus, Loader2, ExternalLink, AlertCircle } from "lucide-react";

interface Person {
  id: string; name: string; profilePicture?: string;
  rawLinkedIn?: { headline?: string };
  analysis: { summary: string; personality: string[]; hobbies: string[] };
}
interface DateRecord {
  personA: string; personB: string;
  compatibilityScore: number; compatibilityReason: string;
  messages: { role: string; content: string }[];
  synthetic?: boolean;
}

function Avatar({ name, src, size = 32 }: { name: string; src?: string; size?: number }) {
  if (src) return <img src={src} alt={name} className="rounded-full object-cover flex-shrink-0" style={{ width: size, height: size }} />;
  return (
    <div className="rounded-full flex items-center justify-center font-medium flex-shrink-0"
      style={{ width: size, height: size, background: "var(--surface2)", color: "var(--muted)", fontSize: size * 0.4 }}>
      {name[0].toUpperCase()}
    </div>
  );
}

function Metric({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="p-4 rounded-xl border" style={{ background: "var(--card)", borderColor: "var(--border)" }}>
      <p className="text-[24px] font-semibold" style={{ color: "var(--text)" }}>{value}</p>
      <p className="text-[13px] mt-0.5" style={{ color: "var(--muted)" }}>{label}</p>
    </div>
  );
}

export default function Home() {
  const [people, setPeople] = useState<Person[]>([]);
  const [dates, setDates] = useState<DateRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [linkedinUrl, setLinkedinUrl] = useState("");
  const [instagramUrl, setInstagramUrl] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [status, setStatus] = useState<{ type: "success" | "error"; msg: string } | null>(null);

  useEffect(() => {
    Promise.all([
      fetch("/api/add-person").then(r => r.json()),
      fetch("/api/run-dates").then(r => r.json()),
    ]).then(([p, d]) => {
      setPeople(Array.isArray(p) ? p : []);
      setDates(Array.isArray(d?.dates) ? d.dates : []);
      setLoading(false);
    });
  }, []);

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setStatus(null);
    try {
      const res = await fetch("/api/add-person", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ linkedinUrl, instagramUrl }),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setPeople(prev => [...prev, data]);
      setLinkedinUrl(""); setInstagramUrl(""); setShowForm(false);
      setStatus({ type: "success", msg: data.name + " added successfully" });
    } catch (err) {
      setStatus({ type: "error", msg: String(err) });
    } finally {
      setSubmitting(false);
    }
  }

  const topDates = [...dates].sort((a, b) => b.compatibilityScore - a.compatibilityScore).slice(0, 3);
  const avgScore = dates.length ? Math.round(dates.reduce((a, d) => a + d.compatibilityScore, 0) / dates.length) : 0;
  const scoreColor = (s: number) => s >= 70 ? "var(--success)" : s >= 40 ? "var(--warning)" : "var(--destructive)";

  return (
    <div className="max-w-5xl mx-auto px-6 py-10">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-[32px] font-semibold leading-tight mb-2" style={{ color: "var(--text)" }}>Your agents, at work.</h1>
        <p className="text-[15px]" style={{ color: "var(--muted)" }}>Explore profiles, follow conversations, and discover compatibility.</p>
      </div>

      {status && (
        <div className="flex items-center gap-2 mb-6 p-3 rounded-lg border text-[13px]"
          style={{ borderColor: status.type === "error" ? "#fecaca" : "#bbf7d0", background: status.type === "error" ? "#fef2f2" : "#f0fdf4", color: status.type === "error" ? "var(--destructive)" : "var(--success)" }}>
          <AlertCircle size={14} />
          {status.msg}
        </div>
      )}

      {/* Metrics */}
      {loading ? (
        <div className="grid grid-cols-3 gap-4 mb-8">
          {[1,2,3].map(i => <div key={i} className="skeleton h-20 rounded-xl" />)}
        </div>
      ) : (
        <div className="grid grid-cols-3 gap-4 mb-8">
          <Metric label="Profiles analyzed" value={people.length} />
          <Metric label="Agent dates run" value={dates.length} />
          <Metric label="Avg compatibility" value={dates.length ? avgScore + "%" : "—"} />
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        {/* Top Compatibility */}
        <div className="md:col-span-2">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-[15px] font-semibold" style={{ color: "var(--text)" }}>Top Compatibility</h2>
            <Link href="/rankings" className="text-[13px] flex items-center gap-1 hover:underline" style={{ color: "var(--accent)" }}>
              View all <ArrowRight size={13} />
            </Link>
          </div>
          {loading ? (
            <div className="space-y-2">{[1,2,3].map(i => <div key={i} className="skeleton h-14 rounded-xl" />)}</div>
          ) : topDates.length === 0 ? (
            <div className="rounded-xl border p-6 text-center text-[13px]" style={{ borderColor: "var(--border)", color: "var(--muted)" }}>No dates yet</div>
          ) : (
            <div className="space-y-2">
              {topDates.map((d, i) => {
                const a = people.find(p => p.id === d.personA);
                const b = people.find(p => p.id === d.personB);
                return (
                  <Link key={i} href="/dates">
                    <div className="flex items-center gap-3 p-3 rounded-xl border hover:border-[var(--accent)] transition-colors cursor-pointer"
                      style={{ background: "var(--card)", borderColor: "var(--border)" }}>
                      <Avatar name={a?.name ?? "?"} src={a?.profilePicture} size={32} />
                      <div className="flex-1 min-w-0">
                        <p className="text-[13px] font-medium truncate" style={{ color: "var(--text)" }}>
                          {a?.name ?? "?"} & {b?.name ?? "?"}
                        </p>
                        <p className="text-[12px] truncate" style={{ color: "var(--muted)" }}>{d.compatibilityReason}</p>
                      </div>
                      <Avatar name={b?.name ?? "?"} src={b?.profilePicture} size={32} />
                      <span className="text-[13px] font-semibold ml-1" style={{ color: scoreColor(d.compatibilityScore) }}>{d.compatibilityScore}%</span>
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </div>

        {/* Recent Profiles */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-[15px] font-semibold" style={{ color: "var(--text)" }}>Recent Profiles</h2>
            <Link href="/profiles" className="text-[13px] hover:underline" style={{ color: "var(--accent)" }}>All</Link>
          </div>
          {loading ? (
            <div className="space-y-2">{[1,2,3,4].map(i => <div key={i} className="skeleton h-10 rounded-xl" />)}</div>
          ) : (
            <div className="space-y-1">
              {people.slice(0, 6).map(p => (
                <Link key={p.id} href={"/profiles/" + p.id}>
                  <div className="flex items-center gap-2.5 px-3 py-2 rounded-lg hover:bg-[var(--surface)] transition-colors">
                    <Avatar name={p.name} src={p.profilePicture} size={28} />
                    <div className="flex-1 min-w-0">
                      <p className="text-[13px] font-medium truncate" style={{ color: "var(--text)" }}>{p.name}</p>
                      <p className="text-[11px] truncate" style={{ color: "var(--muted)" }}>{p.rawLinkedIn?.headline}</p>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Add Person CTA */}
      <div className="border rounded-xl p-5" style={{ background: "var(--card)", borderColor: "var(--border)" }}>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-[15px] font-semibold" style={{ color: "var(--text)" }}>Add a person</h2>
            <p className="text-[13px] mt-0.5" style={{ color: "var(--muted)" }}>Submit LinkedIn and Instagram URLs to create an agent profile.</p>
          </div>
          {!showForm && (
            <button onClick={() => setShowForm(true)}
              className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-[13px] font-medium transition-colors hover:opacity-90"
              style={{ background: "var(--accent)", color: "#fff" }}>
              <Plus size={14} /> Create agent
            </button>
          )}
        </div>

        {showForm && (
          <form onSubmit={handleAdd} className="space-y-3">
            <div>
              <label className="block text-[12px] font-medium mb-1" style={{ color: "var(--muted)" }}>LinkedIn profile URL</label>
              <div className="flex items-center gap-2 border rounded-lg px-3 py-2" style={{ background: "var(--surface)", borderColor: "var(--border)" }}>
                <ExternalLink size={13} style={{ color: "var(--muted)" }} />
                <input type="url" value={linkedinUrl} onChange={e => setLinkedinUrl(e.target.value)}
                  placeholder="https://linkedin.com/in/username"
                  className="flex-1 bg-transparent outline-none text-[13px] placeholder:text-[var(--muted)]"
                  style={{ color: "var(--text)" }} required />
              </div>
            </div>
            <div>
              <label className="block text-[12px] font-medium mb-1" style={{ color: "var(--muted)" }}>Instagram profile URL</label>
              <div className="flex items-center gap-2 border rounded-lg px-3 py-2" style={{ background: "var(--surface)", borderColor: "var(--border)" }}>
                <ExternalLink size={13} style={{ color: "var(--muted)" }} />
                <input type="url" value={instagramUrl} onChange={e => setInstagramUrl(e.target.value)}
                  placeholder="https://instagram.com/username"
                  className="flex-1 bg-transparent outline-none text-[13px] placeholder:text-[var(--muted)]"
                  style={{ color: "var(--text)" }} required />
              </div>
            </div>
            <div className="flex gap-2 pt-1">
              <button type="submit" disabled={submitting}
                className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-[13px] font-medium transition-opacity disabled:opacity-60"
                style={{ background: "var(--accent)", color: "#fff" }}>
                {submitting ? <><Loader2 size={13} className="animate-spin" /> Analyzing...</> : "Create agent"}
              </button>
              <button type="button" onClick={() => { setShowForm(false); setStatus(null); }}
                className="px-4 py-2 rounded-lg text-[13px] font-medium border transition-colors"
                style={{ borderColor: "var(--border)", color: "var(--muted)" }}>
                Cancel
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
