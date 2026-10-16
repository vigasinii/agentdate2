"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { ArrowRight, Plus, Loader2, ExternalLink, AlertCircle, Users, MessageSquare, TrendingUp } from "lucide-react";

interface Person {
  id: string; name: string; profilePicture?: string;
  rawLinkedIn?: { headline?: string };
  analysis: { summary?: string; personality?: string[]; hobbies?: string[] };
}
interface DateRecord {
  personA: string; personB: string;
  compatibilityScore: number; compatibilityReason: string;
  messages: { role: string; content: string }[];
  synthetic?: boolean;
}

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

function StatCard({ icon: Icon, label, value, href }: { icon: React.ElementType; label: string; value: string | number; href?: string }) {
  const inner = (
    <div className="p-5 rounded-xl border flex items-start gap-4 transition-colors"
      style={{ background: "var(--card)", borderColor: "var(--border)" }}>
      <div className="p-2 rounded-lg" style={{ background: "var(--surface)" }}>
        <Icon size={16} style={{ color: "var(--accent)" }} />
      </div>
      <div>
        <p style={{ fontSize: 26, fontWeight: 700, color: "var(--text)", letterSpacing: "-0.02em", lineHeight: 1 }}>{value}</p>
        <p style={{ fontSize: 12, color: "var(--muted)", marginTop: 4 }}>{label}</p>
      </div>
    </div>
  );
  return href ? <Link href={href} className="hover:border-[var(--accent)] block">{inner}</Link> : inner;
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
      setStatus({ type: "success", msg: `${data.name} added — agent profile created.` });
    } catch (err) {
      setStatus({ type: "error", msg: String(err) });
    } finally {
      setSubmitting(false);
    }
  }

  const topDates = [...dates].sort((a, b) => b.compatibilityScore - a.compatibilityScore).slice(0, 4);
  const avgScore = dates.length ? Math.round(dates.reduce((a, d) => a + d.compatibilityScore, 0) / dates.length) : 0;
  const scoreColor = (s: number) => s >= 70 ? "var(--success)" : s >= 40 ? "var(--warning)" : "var(--destructive)";

  return (
    <div style={{ maxWidth: 1000, margin: "0 auto", padding: "40px 32px 80px" }}>
      {/* Header */}
      <div style={{ marginBottom: 36 }}>
        <p style={{ fontSize: 11, fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase", color: "var(--accent)", marginBottom: 8 }}>
          Overview
        </p>
        <h1 style={{ fontSize: 30, fontWeight: 700, color: "var(--text)", letterSpacing: "-0.02em", lineHeight: 1.2, marginBottom: 8 }}>
          Your agents, at work.
        </h1>
        <p style={{ fontSize: 14, color: "var(--muted)", lineHeight: 1.6 }}>
          Explore profiles, follow conversations, and discover compatibility patterns.
        </p>
      </div>

      {status && (
        <div className="flex items-center gap-2 mb-6 p-3 rounded-lg border"
          style={{ fontSize: 13, borderColor: status.type === "error" ? "#fecaca" : "#bbf7d0", background: status.type === "error" ? "#fef2f2" : "#f0fdf4", color: status.type === "error" ? "var(--destructive)" : "var(--success)" }}>
          <AlertCircle size={14} />
          {status.msg}
        </div>
      )}

      {/* Stats */}
      {loading ? (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 12, marginBottom: 36 }}>
          {[1,2,3].map(i => <div key={i} className="skeleton" style={{ height: 88, borderRadius: 12 }} />)}
        </div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(200px,1fr))", gap: 12, marginBottom: 36 }}>
          <StatCard icon={Users} label="Profiles analyzed" value={people.length} href="/profiles" />
          <StatCard icon={MessageSquare} label="Agent dates run" value={dates.length} href="/dates" />
          <StatCard icon={TrendingUp} label="Avg compatibility" value={dates.length ? avgScore + "%" : "—"} href="/rankings" />
        </div>
      )}

      <div style={{ display: "grid", gridTemplateColumns: "1fr 280px", gap: 24, marginBottom: 28 }}>
        {/* Top Compatibility */}
        <div>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
            <h2 style={{ fontSize: 14, fontWeight: 600, color: "var(--text)" }}>Top Compatibility</h2>
            <Link href="/rankings" style={{ fontSize: 12, color: "var(--accent)", display: "flex", alignItems: "center", gap: 4 }}>
              View rankings <ArrowRight size={12} />
            </Link>
          </div>
          {loading ? (
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {[1,2,3].map(i => <div key={i} className="skeleton" style={{ height: 56, borderRadius: 10 }} />)}
            </div>
          ) : topDates.length === 0 ? (
            <div style={{ border: "1px solid var(--border)", borderRadius: 10, padding: 32, textAlign: "center", fontSize: 13, color: "var(--muted)" }}>
              No dates yet.
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              {topDates.map((d, i) => {
                const a = people.find(p => p.id === d.personA);
                const b = people.find(p => p.id === d.personB);
                return (
                  <Link key={i} href="/dates">
                    <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 14px", borderRadius: 10, border: "1px solid var(--border)", background: "var(--card)", cursor: "pointer", transition: "border-color 0.15s" }}>
                      <div style={{ display: "flex", alignItems: "center" }}>
                        <Avatar name={a?.name ?? "?"} src={a?.profilePicture} size={30} />
                        <div style={{ marginLeft: -8 }}><Avatar name={b?.name ?? "?"} src={b?.profilePicture} size={30} /></div>
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <p style={{ fontSize: 13, fontWeight: 500, color: "var(--text)", marginBottom: 2, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                          {a?.name ?? "?"} &amp; {b?.name ?? "?"}
                        </p>
                        <p style={{ fontSize: 12, color: "var(--muted)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                          {d.compatibilityReason}
                        </p>
                      </div>
                      <span style={{ fontSize: 14, fontWeight: 700, color: scoreColor(d.compatibilityScore), flexShrink: 0 }}>
                        {d.compatibilityScore}%
                      </span>
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </div>

        {/* Recent Profiles */}
        <div>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
            <h2 style={{ fontSize: 14, fontWeight: 600, color: "var(--text)" }}>Recent Profiles</h2>
            <Link href="/profiles" style={{ fontSize: 12, color: "var(--accent)" }}>All →</Link>
          </div>
          {loading ? (
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              {[1,2,3,4,5].map(i => <div key={i} className="skeleton" style={{ height: 42, borderRadius: 8 }} />)}
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
              {people.slice(0, 7).map(p => (
                <Link key={p.id} href={"/profiles/" + p.id}>
                  <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "7px 10px", borderRadius: 8, transition: "background 0.12s" }}
                    className="hover:bg-[var(--surface)]">
                    <Avatar name={p.name} src={p.profilePicture} size={26} />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ fontSize: 13, fontWeight: 500, color: "var(--text)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{p.name}</p>
                      <p style={{ fontSize: 11, color: "var(--muted)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{p.rawLinkedIn?.headline}</p>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Add Person */}
      <div style={{ border: "1px solid var(--border)", borderRadius: 12, padding: 20, background: "var(--card)" }}>
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12, marginBottom: showForm ? 16 : 0 }}>
          <div>
            <h2 style={{ fontSize: 14, fontWeight: 600, color: "var(--text)", marginBottom: 4 }}>Add a person</h2>
            <p style={{ fontSize: 13, color: "var(--muted)" }}>Submit LinkedIn and Instagram URLs to create an AI agent profile.</p>
          </div>
          {!showForm && (
            <button onClick={() => setShowForm(true)}
              style={{ display: "flex", alignItems: "center", gap: 6, padding: "8px 14px", borderRadius: 8, background: "var(--accent)", color: "#fff", fontSize: 13, fontWeight: 500, border: "none", cursor: "pointer", flexShrink: 0 }}>
              <Plus size={13} /> Create agent
            </button>
          )}
        </div>

        {showForm && (
          <form onSubmit={handleAdd} style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {["LinkedIn profile URL", "Instagram profile URL"].map((label, idx) => (
              <div key={label}>
                <label style={{ display: "block", fontSize: 12, fontWeight: 500, color: "var(--muted)", marginBottom: 4 }}>{label}</label>
                <div style={{ display: "flex", alignItems: "center", gap: 8, border: "1px solid var(--border)", borderRadius: 8, padding: "8px 12px", background: "var(--surface)" }}>
                  <ExternalLink size={13} style={{ color: "var(--muted)", flexShrink: 0 }} />
                  <input
                    type="url"
                    value={idx === 0 ? linkedinUrl : instagramUrl}
                    onChange={e => idx === 0 ? setLinkedinUrl(e.target.value) : setInstagramUrl(e.target.value)}
                    placeholder={idx === 0 ? "https://linkedin.com/in/username" : "https://instagram.com/username"}
                    style={{ flex: 1, background: "transparent", border: "none", outline: "none", fontSize: 13, color: "var(--text)" }}
                    required
                  />
                </div>
              </div>
            ))}
            <div style={{ display: "flex", gap: 8, marginTop: 4 }}>
              <button type="submit" disabled={submitting}
                style={{ display: "flex", alignItems: "center", gap: 6, padding: "8px 16px", borderRadius: 8, background: "var(--accent)", color: "#fff", fontSize: 13, fontWeight: 500, border: "none", cursor: submitting ? "not-allowed" : "pointer", opacity: submitting ? 0.6 : 1 }}>
                {submitting ? <><Loader2 size={13} className="animate-spin" /> Analyzing...</> : "Create agent"}
              </button>
              <button type="button" onClick={() => { setShowForm(false); setStatus(null); }}
                style={{ padding: "8px 14px", borderRadius: 8, fontSize: 13, fontWeight: 500, border: "1px solid var(--border)", background: "transparent", color: "var(--muted)", cursor: "pointer" }}>
                Cancel
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
