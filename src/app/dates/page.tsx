"use client";
import { useState, useEffect, useRef, useCallback } from "react";
import Link from "next/link";
import { Play, Pause, RotateCcw, ChevronDown, AlertTriangle, ChevronRight, Info } from "lucide-react";

interface Person {
  id: string; name: string; profilePicture?: string;
  rawLinkedIn?: { headline?: string };
  analysis: { summary?: string; personality?: string[]; hobbies?: string[]; dataQuality?: { confidence: string } };
}
interface CompatibilityBreakdown {
  sharedInterests: number; personalityFit: number; valueAlignment: number;
  evidenceNotes: string; uncertainty: string;
}
interface DateRecord {
  personA: string; personB: string;
  compatibilityScore: number; compatibilityReason: string;
  compatibilityBreakdown?: CompatibilityBreakdown;
  messages: { role: string; content: string }[];
  synthetic?: boolean; createdAt?: string;
}

function Avatar({ name, src, size = 36 }: { name: string; src?: string; size?: number }) {
  const colors: [string,string][] = [["#E8F0EC","#456B59"],["#EBE8F0","#5B4592"],["#F0E8E8","#924545"],["#E8EDF0","#456789"],["#F0EDE8","#896745"]];
  const [bg, fg] = colors[name.charCodeAt(0) % colors.length];
  if (src) return <img src={src} alt={name} className="rounded-full object-cover flex-shrink-0" style={{ width: size, height: size }} />;
  return (
    <div className="rounded-full flex items-center justify-center font-semibold flex-shrink-0"
      style={{ width: size, height: size, background: bg, color: fg, fontSize: size * 0.38 }}>
      {name[0].toUpperCase()}
    </div>
  );
}

function PersonPanel({ person, side }: { person: Person | null | undefined; side: "A" | "B" }) {
  if (!person) return <div style={{ border: "1px solid var(--border)", borderRadius: 12, background: "var(--card)" }} />;
  const align = side === "A" ? "flex-start" : "flex-end";
  const textAlign = side === "A" ? "left" : "right";
  return (
    <div style={{ border: "1px solid var(--border)", borderRadius: 12, background: "var(--card)", padding: 16, display: "flex", flexDirection: "column", gap: 12, height: "100%" }}>
      <div style={{ display: "flex", flexDirection: "column", alignItems: align, gap: 8 }}>
        <Avatar name={person.name} src={person.profilePicture} size={40} />
        <div style={{ textAlign }}>
          <p style={{ fontSize: 14, fontWeight: 600, color: "var(--text)", letterSpacing: "-0.01em" }}>{person.name}</p>
          <p style={{ fontSize: 11, color: "var(--muted)", lineHeight: 1.5, marginTop: 2 }}
            className="line-clamp-2">{person.rawLinkedIn?.headline}</p>
          {person.analysis.dataQuality?.confidence === "low" && (
            <span style={{ fontSize: 10, color: "var(--warning)" }}>low data confidence</span>
          )}
        </div>
      </div>
      {(person.analysis.personality ?? []).length > 0 && (
        <div style={{ display: "flex", flexWrap: "wrap", gap: 4, justifyContent: align }}>
          {(person.analysis.personality ?? []).slice(0, 3).map(t => (
            <span key={t} style={{ fontSize: 10, padding: "2px 8px", borderRadius: 12, border: "1px solid var(--border)", color: "var(--muted)" }}>{t}</span>
          ))}
        </div>
      )}
      {person.analysis.summary && (
        <p style={{ fontSize: 12, lineHeight: 1.6, color: "var(--muted)", textAlign }}
          className="line-clamp-4">{person.analysis.summary}</p>
      )}
    </div>
  );
}

export default function DatesPage() {
  const [people, setPeople] = useState<Person[]>([]);
  const [dates, setDates] = useState<DateRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [selectedIdx, setSelectedIdx] = useState(0);
  const [visibleMsgs, setVisibleMsgs] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [speed, setSpeed] = useState(1);
  const [done, setDone] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [showBreakdown, setShowBreakdown] = useState(false);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    Promise.all([
      fetch("/api/add-person").then(r => r.json()),
      fetch("/api/run-dates").then(r => r.json()),
    ]).then(([pData, dData]) => {
      setPeople(Array.isArray(pData) ? pData : []);
      setDates(Array.isArray(dData?.dates) ? dData.dates : []);
      setLoading(false);
    }).catch(err => { setLoadError(String(err)); setLoading(false); });
  }, []);

  const date = dates[selectedIdx];
  const pA = date ? people.find(p => p.id === date.personA) : null;
  const pB = date ? people.find(p => p.id === date.personB) : null;
  const total = date?.messages.length ?? 0;

  const stop = useCallback(() => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    intervalRef.current = null;
    setPlaying(false);
  }, []);

  const advance = useCallback(() => {
    setVisibleMsgs(prev => {
      if (prev >= total) { stop(); setDone(true); return prev; }
      return prev + 1;
    });
  }, [total, stop]);

  useEffect(() => {
    if (playing) { intervalRef.current = setInterval(advance, 1200 / speed); }
    else if (intervalRef.current) { clearInterval(intervalRef.current); }
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [playing, speed, advance]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [visibleMsgs]);

  function selectDate(idx: number) {
    stop(); setSelectedIdx(idx); setVisibleMsgs(0); setDone(false); setDropdownOpen(false); setShowBreakdown(false);
  }
  function restart() { stop(); setVisibleMsgs(0); setDone(false); }
  function togglePlay() {
    if (done) { restart(); return; }
    if (playing) { stop(); } else { setPlaying(true); }
  }

  const scoreColor = (s: number) => s >= 70 ? "var(--success)" : s >= 40 ? "var(--warning)" : "var(--destructive)";

  if (loadError) return (
    <div style={{ maxWidth: 560, margin: "0 auto", padding: "40px 32px" }}>
      <div style={{ border: "1px solid #fecaca", borderRadius: 12, padding: 40, textAlign: "center", background: "#fef2f2" }}>
        <AlertTriangle size={20} style={{ color: "var(--destructive)", margin: "0 auto 12px" }} />
        <p style={{ fontSize: 14, color: "var(--text)", marginBottom: 4 }}>Failed to load</p>
        <p style={{ fontSize: 13, color: "var(--muted)", marginBottom: 16 }}>{loadError}</p>
        <button onClick={() => window.location.reload()} style={{ fontSize: 13, padding: "8px 16px", borderRadius: 8, background: "var(--accent)", color: "#fff", border: "none", cursor: "pointer", fontWeight: 500 }}>
          Retry
        </button>
      </div>
    </div>
  );

  if (loading) return (
    <div style={{ maxWidth: 1100, margin: "0 auto", padding: "40px 32px" }}>
      <div style={{ height: 32, width: 200, marginBottom: 8 }} className="skeleton" />
      <div style={{ height: 20, width: 320, marginBottom: 28 }} className="skeleton" />
      <div style={{ height: 40, width: 360, marginBottom: 20 }} className="skeleton" />
      <div style={{ display: "grid", gridTemplateColumns: "200px 1fr 200px", gap: 12 }}>
        <div style={{ height: 280 }} className="skeleton" />
        <div style={{ height: 280 }} className="skeleton" />
        <div style={{ height: 280 }} className="skeleton" />
      </div>
    </div>
  );

  if (dates.length === 0) return (
    <div style={{ maxWidth: 560, margin: "0 auto", padding: "40px 32px" }}>
      <div style={{ border: "1px solid var(--border)", borderRadius: 12, padding: 64, textAlign: "center" }}>
        <p style={{ fontSize: 14, color: "var(--muted)", marginBottom: 8 }}>No dates yet.</p>
        <Link href="/" style={{ fontSize: 13, color: "var(--accent)", textDecoration: "underline" }}>Run dates from the dashboard</Link>
      </div>
    </div>
  );

  return (
    <div style={{ maxWidth: 1100, margin: "0 auto", padding: "40px 32px 80px" }}>
      {/* Header */}
      <div style={{ marginBottom: 28 }}>
        <p style={{ fontSize: 11, fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase", color: "var(--accent)", marginBottom: 8 }}>
          Studio
        </p>
        <h1 style={{ fontSize: 30, fontWeight: 700, color: "var(--text)", letterSpacing: "-0.02em", lineHeight: 1.2, marginBottom: 6 }}>
          Agent Date Studio
        </h1>
        <p style={{ fontSize: 13, color: "var(--muted)" }}>
          AI agents simulate conversations based on public profile data — not the real people.
        </p>
      </div>

      {/* Date selector */}
      <div style={{ position: "relative", marginBottom: 16 }}>
        <button
          onClick={() => setDropdownOpen(v => !v)}
          style={{ display: "flex", alignItems: "center", gap: 8, border: "1px solid var(--border)", borderRadius: 9, padding: "10px 14px", fontSize: 13, width: "100%", maxWidth: 440, background: "var(--card)", color: "var(--text)", cursor: "pointer", textAlign: "left" }}
        >
          <span style={{ flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
            {date ? `${pA?.name ?? "?"} & ${pB?.name ?? "?"}` : "Select a conversation"}
          </span>
          {date?.synthetic && (
            <span style={{ fontSize: 10, padding: "2px 7px", borderRadius: 4, border: "1px solid var(--border)", color: "var(--muted)", flexShrink: 0 }}>
              demo
            </span>
          )}
          <ChevronDown size={14} style={{ color: "var(--muted)", flexShrink: 0 }} />
        </button>

        {dropdownOpen && (
          <div style={{ position: "absolute", zIndex: 20, marginTop: 4, width: "100%", maxWidth: 440, borderRadius: 10, border: "1px solid var(--border)", background: "var(--card)", boxShadow: "0 8px 24px rgba(0,0,0,0.08)", overflow: "hidden" }}>
            <div style={{ maxHeight: 280, overflowY: "auto" }}>
              {dates.map((d, i) => {
                const a = people.find(p => p.id === d.personA);
                const b = people.find(p => p.id === d.personB);
                return (
                  <button key={i} onClick={() => selectDate(i)}
                    style={{ width: "100%", display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 14px", fontSize: 13, background: i === selectedIdx ? "var(--surface)" : "transparent", color: "var(--text)", border: "none", borderBottom: "1px solid var(--border)", cursor: "pointer", textAlign: "left" }}>
                    <span style={{ display: "flex", alignItems: "center", gap: 8, minWidth: 0 }}>
                      <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        {(a?.name ?? "?") + " & " + (b?.name ?? "?")}
                      </span>
                      {d.synthetic && (
                        <span style={{ fontSize: 10, padding: "1px 6px", borderRadius: 4, border: "1px solid var(--border)", color: "var(--muted)", flexShrink: 0 }}>demo</span>
                      )}
                    </span>
                    <span style={{ fontSize: 12, fontWeight: 700, color: scoreColor(d.compatibilityScore), marginLeft: 8, flexShrink: 0 }}>
                      {d.compatibilityScore}%
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Demo notice */}
      {date?.synthetic && (
        <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "8px 12px", borderRadius: 8, border: "1px solid var(--border)", background: "var(--surface)", fontSize: 12, color: "var(--muted)", marginBottom: 16 }}>
          <Info size={13} style={{ flexShrink: 0 }} />
          Pre-seeded demo conversation — not a live agent run.
        </div>
      )}

      {date && (
        <div style={{ display: "grid", gridTemplateColumns: "200px 1fr 200px", gap: 12, alignItems: "start" }}>
          <PersonPanel person={pA} side="A" />

          {/* Chat panel */}
          <div style={{ display: "flex", flexDirection: "column", border: "1px solid var(--border)", borderRadius: 12, background: "var(--card)", overflow: "hidden", minHeight: 500 }}>
            {/* Toolbar */}
            <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "10px 14px", borderBottom: "1px solid var(--border)" }}>
              <button onClick={togglePlay}
                style={{ display: "flex", alignItems: "center", gap: 6, padding: "6px 12px", borderRadius: 7, fontSize: 12, fontWeight: 500, background: "var(--accent)", color: "#fff", border: "none", cursor: "pointer" }}>
                {playing ? <Pause size={12} /> : <Play size={12} />}
                {playing ? "Pause" : done ? "Replay" : "Play"}
              </button>
              <button onClick={restart}
                style={{ padding: "6px 8px", borderRadius: 7, border: "1px solid var(--border)", background: "transparent", color: "var(--muted)", cursor: "pointer", display: "flex", alignItems: "center" }}>
                <RotateCcw size={13} />
              </button>
              <div style={{ display: "flex", alignItems: "center", gap: 4, marginLeft: "auto" }}>
                <span style={{ fontSize: 11, color: "var(--muted)" }}>Speed</span>
                {[1, 2].map(s => (
                  <button key={s} onClick={() => setSpeed(s)}
                    style={{ fontSize: 11, padding: "3px 7px", borderRadius: 5, fontWeight: 500, border: "none", cursor: "pointer", background: speed === s ? "var(--surface2)" : "transparent", color: speed === s ? "var(--text)" : "var(--muted)" }}>
                    {s}x
                  </button>
                ))}
              </div>
              <span style={{ fontSize: 11, color: "var(--muted)", marginLeft: 8 }}>
                {Math.min(visibleMsgs, total)}/{total}
              </span>
            </div>

            {/* Progress bar */}
            <div style={{ height: 2, background: "var(--surface2)" }}>
              <div style={{ height: "100%", background: "var(--accent)", width: total ? (Math.min(visibleMsgs, total) / total * 100) + "%" : "0%", transition: "width 0.3s" }} />
            </div>

            {/* Messages */}
            <div ref={scrollRef} style={{ flex: 1, padding: "16px 14px", display: "flex", flexDirection: "column", gap: 12, overflowY: "auto", maxHeight: 440 }}>
              {date.messages.slice(0, visibleMsgs).map((msg, i) => {
                const isA = msg.role === "A";
                const speaker = isA ? pA : pB;
                return (
                  <div key={i} className="msg-reveal" style={{ display: "flex", gap: 8, alignItems: "flex-end", flexDirection: isA ? "row" : "row-reverse" }}>
                    <Avatar name={speaker?.name ?? "?"} src={speaker?.profilePicture} size={22} />
                    <div style={{ maxWidth: "74%" }}>
                      <p style={{ fontSize: 10, color: "var(--muted)", marginBottom: 3, textAlign: isA ? "left" : "right" }}>
                        {speaker?.name}
                      </p>
                      <div style={{
                        padding: "8px 12px",
                        fontSize: 13,
                        lineHeight: 1.55,
                        background: isA ? "var(--surface)" : "var(--accent)",
                        color: isA ? "var(--text)" : "#fff",
                        borderRadius: isA ? "3px 12px 12px 12px" : "12px 3px 12px 12px",
                      }}>
                        {msg.content}
                      </div>
                    </div>
                  </div>
                );
              })}
              {visibleMsgs === 0 && (
                <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", flex: 1, gap: 6, minHeight: 200 }}>
                  <p style={{ fontSize: 14, fontWeight: 500, color: "var(--muted)" }}>Ready to start</p>
                  <p style={{ fontSize: 12, color: "var(--muted)", opacity: 0.7 }}>Press play to begin the conversation</p>
                </div>
              )}
            </div>

            {/* Compatibility result */}
            {done && (
              <div style={{ borderTop: "1px solid var(--border)", padding: "14px 16px" }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 4 }}>
                  <span style={{ fontSize: 13, fontWeight: 600, color: "var(--text)" }}>Compatibility result</span>
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <span style={{ fontSize: 20, fontWeight: 800, color: scoreColor(date.compatibilityScore), letterSpacing: "-0.02em" }}>
                      {date.compatibilityScore}%
                    </span>
                    {date.compatibilityBreakdown && (
                      <button onClick={() => setShowBreakdown(v => !v)}
                        style={{ display: "flex", alignItems: "center", gap: 3, fontSize: 12, color: "var(--accent)", background: "none", border: "none", cursor: "pointer" }}>
                        Details <ChevronRight size={12} style={{ transform: showBreakdown ? "rotate(90deg)" : "none", transition: "transform 0.15s" }} />
                      </button>
                    )}
                  </div>
                </div>
                <p style={{ fontSize: 12, color: "var(--muted)", lineHeight: 1.5 }}>{date.compatibilityReason}</p>

                {showBreakdown && date.compatibilityBreakdown && (
                  <div style={{ marginTop: 12, paddingTop: 12, borderTop: "1px solid var(--border)", display: "flex", flexDirection: "column", gap: 8 }}>
                    {([
                      ["Shared interests", date.compatibilityBreakdown.sharedInterests],
                      ["Personality fit", date.compatibilityBreakdown.personalityFit],
                      ["Value alignment", date.compatibilityBreakdown.valueAlignment],
                    ] as [string, number][]).map(([label, val]) => (
                      <div key={label}>
                        <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, marginBottom: 4 }}>
                          <span style={{ color: "var(--muted)" }}>{label}</span>
                          <span style={{ color: scoreColor(val), fontWeight: 600 }}>{val}%</span>
                        </div>
                        <div style={{ height: 3, borderRadius: 2, background: "var(--surface2)" }}>
                          <div style={{ height: "100%", borderRadius: 2, width: val + "%", background: scoreColor(val), transition: "width 0.4s" }} />
                        </div>
                      </div>
                    ))}
                    {date.compatibilityBreakdown.evidenceNotes && (
                      <p style={{ fontSize: 11, color: "var(--muted)", paddingTop: 4 }}>
                        <strong style={{ color: "var(--text)" }}>Evidence: </strong>
                        {date.compatibilityBreakdown.evidenceNotes}
                      </p>
                    )}
                    {date.compatibilityBreakdown.uncertainty && (
                      <p style={{ fontSize: 11, color: "var(--muted)" }}>
                        <strong>Uncertainty: </strong>
                        {date.compatibilityBreakdown.uncertainty}
                      </p>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>

          <PersonPanel person={pB} side="B" />
        </div>
      )}
    </div>
  );
}
