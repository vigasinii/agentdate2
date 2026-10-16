"use client";
import { useState, useEffect, useRef, useCallback } from "react";
import Link from "next/link";
import { Play, Pause, RotateCcw, ChevronDown, Gauge, AlertTriangle, ChevronRight, Info } from "lucide-react";

interface Person {
  id: string; name: string; profilePicture?: string;
  rawLinkedIn?: { headline?: string };
  analysis: { summary: string; personality: string[]; hobbies: string[]; dataQuality?: { confidence: string } };
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

function Skeleton({ className = "" }: { className?: string }) {
  return <div className={"skeleton " + className} />;
}

function Avatar({ name, src, size = 36 }: { name: string; src?: string; size?: number }) {
  if (src) return <img src={src} alt={name} className="rounded-full object-cover flex-shrink-0" style={{ width: size, height: size }} />;
  return (
    <div className="rounded-full flex items-center justify-center font-medium flex-shrink-0"
      style={{ width: size, height: size, background: "var(--surface2)", color: "var(--muted)", fontSize: size * 0.38 }}>
      {name[0].toUpperCase()}
    </div>
  );
}

function PersonPanel({ person, side }: { person: Person | null | undefined; side: "A" | "B" }) {
  if (!person) return <div className="rounded-xl border" style={{ background: "var(--card)", borderColor: "var(--border)" }} />;
  return (
    <div className="rounded-xl border p-4 flex flex-col gap-3 h-full" style={{ background: "var(--card)", borderColor: "var(--border)" }}>
      <div className={`flex flex-col items-${side === "A" ? "start" : "end"} gap-2`}>
        <Avatar name={person.name} src={person.profilePicture} size={40} />
        <div className={side === "A" ? "" : "text-right"}>
          <p className="text-[14px] font-semibold" style={{ color: "var(--text)" }}>{person.name}</p>
          <p className="text-[12px] line-clamp-2" style={{ color: "var(--muted)" }}>{person.rawLinkedIn?.headline}</p>
          {person.analysis.dataQuality?.confidence === "low" && (
            <span className="text-[11px]" style={{ color: "var(--warning)" }}>low data confidence</span>
          )}
        </div>
      </div>
      <div className="flex flex-wrap gap-1">
        {(person.analysis.personality ?? []).slice(0, 3).map(t => (
          <span key={t} className="text-[11px] px-1.5 py-0.5 rounded border" style={{ borderColor: "var(--border)", color: "var(--muted)" }}>{t}</span>
        ))}
      </div>
      <p className="text-[12px] leading-relaxed line-clamp-4" style={{ color: "var(--muted)" }}>{person.analysis.summary}</p>
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
    <div className="max-w-2xl mx-auto px-6 py-10">
      <div className="rounded-xl border p-8 text-center" style={{ borderColor: "#fecaca", background: "#fef2f2" }}>
        <AlertTriangle size={20} className="mx-auto mb-3" style={{ color: "var(--destructive)" }} />
        <p className="text-[14px] mb-1" style={{ color: "var(--text)" }}>Failed to load</p>
        <p className="text-[13px] mb-4" style={{ color: "var(--muted)" }}>{loadError}</p>
        <button onClick={() => window.location.reload()} className="text-[13px] px-4 py-2 rounded-lg font-medium" style={{ background: "var(--accent)", color: "#fff" }}>Retry</button>
      </div>
    </div>
  );

  if (loading) return (
    <div className="max-w-5xl mx-auto px-6 py-10">
      <Skeleton className="h-8 w-40 mb-2" />
      <Skeleton className="h-5 w-64 mb-6" />
      <Skeleton className="h-10 w-96 mb-6" />
      <div className="grid grid-cols-1 md:grid-cols-[200px_1fr_200px] gap-4">
        <Skeleton className="h-64" />
        <Skeleton className="h-64" />
        <Skeleton className="h-64" />
      </div>
    </div>
  );

  if (dates.length === 0) return (
    <div className="max-w-2xl mx-auto px-6 py-10">
      <div className="rounded-xl border p-12 text-center" style={{ borderColor: "var(--border)" }}>
        <p className="text-[14px] mb-2" style={{ color: "var(--muted)" }}>No dates yet.</p>
        <Link href="/" className="text-[13px] underline" style={{ color: "var(--accent)" }}>Run dates from the dashboard</Link>
      </div>
    </div>
  );

  return (
    <div className="max-w-6xl mx-auto px-6 py-10">
      <div className="mb-6">
        <h1 className="text-[30px] font-semibold mb-1" style={{ color: "var(--text)" }}>Agent Date Studio</h1>
        <p className="text-[13px]" style={{ color: "var(--muted)" }}>AI agents simulate conversations based on public profile data — not the real people.</p>
      </div>

      {/* Date selector */}
      <div className="relative mb-5">
        <button onClick={() => setDropdownOpen(v => !v)}
          className="flex items-center gap-2 border rounded-lg px-4 py-2.5 text-[13px] w-full max-w-md text-left hover:border-[var(--accent)] transition-colors"
          style={{ background: "var(--card)", borderColor: "var(--border)", color: "var(--text)" }}>
          <span className="flex-1 truncate">
            {date
              ? (pA?.name ?? "?") + " & " + (pB?.name ?? "?")
              : "Select a conversation"}
          </span>
          {date?.synthetic && <span className="text-[10px] px-1.5 rounded border" style={{ borderColor: "var(--border)", color: "var(--muted)" }}>demo</span>}
          <ChevronDown size={14} style={{ color: "var(--muted)" }} />
        </button>
        {dropdownOpen && (
          <div className="absolute z-20 mt-1 w-full max-w-md rounded-xl border overflow-hidden shadow-lg"
            style={{ background: "var(--card)", borderColor: "var(--border)" }}>
            <div className="max-h-64 overflow-y-auto">
              {dates.map((d, i) => {
                const a = people.find(p => p.id === d.personA);
                const b = people.find(p => p.id === d.personB);
                return (
                  <button key={i} onClick={() => selectDate(i)}
                    className="w-full flex items-center justify-between px-4 py-2.5 text-[13px] text-left hover:bg-[var(--surface)] transition-colors"
                    style={{ color: "var(--text)", borderBottom: "1px solid var(--border)" }}>
                    <span className="flex items-center gap-2 min-w-0">
                      <span className="truncate">{(a?.name ?? "?") + " & " + (b?.name ?? "?")}</span>
                      {d.synthetic && <span className="text-[10px] px-1 rounded border flex-shrink-0" style={{ borderColor: "var(--border)", color: "var(--muted)" }}>demo</span>}
                    </span>
                    <span className="text-[12px] font-semibold ml-2" style={{ color: scoreColor(d.compatibilityScore) }}>{d.compatibilityScore}%</span>
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {date?.synthetic && (
        <div className="flex items-center gap-2 mb-4 text-[12px] p-2.5 rounded-lg border" style={{ borderColor: "var(--border)", color: "var(--muted)", background: "var(--surface)" }}>
          <Info size={13} style={{ flexShrink: 0 }} />
          Pre-seeded demo conversation — not a live agent run.
        </div>
      )}

      {date && (
        <div className="grid grid-cols-1 md:grid-cols-[200px_1fr_200px] gap-4">
          <PersonPanel person={pA} side="A" />

          {/* Chat panel */}
          <div className="flex flex-col rounded-xl border overflow-hidden" style={{ background: "var(--card)", borderColor: "var(--border)", minHeight: 480 }}>
            {/* Toolbar */}
            <div className="flex items-center gap-2 px-4 py-3 border-b" style={{ borderColor: "var(--border)" }}>
              <button onClick={togglePlay}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[12px] font-medium transition-opacity hover:opacity-80"
                style={{ background: "var(--accent)", color: "#fff" }}>
                {playing ? <Pause size={12} /> : <Play size={12} />}
                {playing ? "Pause" : done ? "Replay" : "Play"}
              </button>
              <button onClick={restart}
                className="p-1.5 rounded-lg border hover:border-[var(--accent)] transition-colors"
                style={{ borderColor: "var(--border)", color: "var(--muted)" }}>
                <RotateCcw size={13} />
              </button>
              <div className="flex items-center gap-1 ml-auto">
                <Gauge size={12} style={{ color: "var(--muted)" }} />
                {[1, 2].map(s => (
                  <button key={s} onClick={() => setSpeed(s)}
                    className="text-[11px] px-1.5 py-0.5 rounded font-medium transition-colors"
                    style={{ background: speed === s ? "var(--surface2)" : "transparent", color: speed === s ? "var(--text)" : "var(--muted)" }}>
                    {s}x
                  </button>
                ))}
              </div>
              <span className="text-[11px] ml-2" style={{ color: "var(--muted)" }}>
                {Math.min(visibleMsgs, total)}/{total}
              </span>
            </div>

            {/* Progress bar */}
            <div className="h-0.5 w-full" style={{ background: "var(--surface2)" }}>
              <div className="h-full transition-all duration-300" style={{ width: total ? (Math.min(visibleMsgs, total) / total * 100) + "%" : "0%", background: "var(--accent)" }} />
            </div>

            {/* Messages */}
            <div ref={scrollRef} className="flex-1 px-4 py-4 space-y-3 overflow-y-auto" style={{ maxHeight: 460 }}>
              {date.messages.slice(0, visibleMsgs).map((msg, i) => {
                const isA = msg.role === "A";
                const speaker = isA ? pA : pB;
                return (
                  <div key={i} className={"flex gap-2 items-end msg-reveal " + (isA ? "" : "flex-row-reverse")}>
                    <Avatar name={speaker?.name ?? "?"} src={speaker?.profilePicture} size={24} />
                    <div style={{ maxWidth: "72%" }}>
                      <p className="text-[11px] mb-1" style={{ color: "var(--muted)", textAlign: isA ? "left" : "right" }}>{speaker?.name}</p>
                      <div className="px-3 py-2 text-[13px] leading-relaxed"
                        style={{
                          background: isA ? "var(--surface)" : "var(--accent)",
                          color: isA ? "var(--text)" : "#fff",
                          borderRadius: isA ? "4px 12px 12px 12px" : "12px 4px 12px 12px",
                        }}>
                        {msg.content}
                      </div>
                    </div>
                  </div>
                );
              })}
              {visibleMsgs === 0 && (
                <div className="flex flex-col items-center justify-center h-40 gap-2">
                  <p className="text-[14px] font-medium" style={{ color: "var(--muted)" }}>Ready to start</p>
                  <p className="text-[12px]" style={{ color: "var(--muted)" }}>Press play to begin the conversation</p>
                </div>
              )}
            </div>

            {/* Result */}
            {done && (
              <div className="border-t p-4" style={{ borderColor: "var(--border)" }}>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[13px] font-semibold" style={{ color: "var(--text)" }}>Compatibility result</span>
                  <div className="flex items-center gap-2">
                    <span className="text-[18px] font-bold" style={{ color: scoreColor(date.compatibilityScore) }}>{date.compatibilityScore}%</span>
                    {date.compatibilityBreakdown && (
                      <button onClick={() => setShowBreakdown(v => !v)}
                        className="flex items-center gap-0.5 text-[12px]"
                        style={{ color: "var(--accent)" }}>
                        Details <ChevronRight size={12} className={showBreakdown ? "rotate-90" : ""} />
                      </button>
                    )}
                  </div>
                </div>
                <p className="text-[12px]" style={{ color: "var(--muted)" }}>{date.compatibilityReason}</p>

                {showBreakdown && date.compatibilityBreakdown && (
                  <div className="mt-3 space-y-2 pt-3 border-t" style={{ borderColor: "var(--border)" }}>
                    {([["Shared interests", date.compatibilityBreakdown.sharedInterests], ["Personality fit", date.compatibilityBreakdown.personalityFit], ["Value alignment", date.compatibilityBreakdown.valueAlignment]] as [string, number][]).map(([label, val]) => (
                      <div key={label}>
                        <div className="flex justify-between text-[12px] mb-1">
                          <span style={{ color: "var(--muted)" }}>{label}</span>
                          <span style={{ color: scoreColor(val) }}>{val}%</span>
                        </div>
                        <div className="h-1 rounded-full" style={{ background: "var(--surface2)" }}>
                          <div className="h-full rounded-full transition-all" style={{ width: val + "%", background: scoreColor(val) }} />
                        </div>
                      </div>
                    ))}
                    {date.compatibilityBreakdown.evidenceNotes && (
                      <p className="text-[11px] pt-1" style={{ color: "var(--muted)" }}>
                        <span className="font-medium" style={{ color: "var(--text)" }}>Evidence: </span>
                        {date.compatibilityBreakdown.evidenceNotes}
                      </p>
                    )}
                    {date.compatibilityBreakdown.uncertainty && (
                      <p className="text-[11px]" style={{ color: "var(--muted)" }}>
                        <span className="font-medium">Uncertainty: </span>
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
