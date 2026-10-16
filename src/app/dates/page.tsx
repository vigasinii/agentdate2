"use client";
import { useState, useEffect, useRef, useCallback } from "react";
import Link from "next/link";
import { Play, Pause, RotateCcw, ChevronDown, Gauge } from "lucide-react";

interface Person {
  id: string;
  name: string;
  profilePicture?: string;
  rawLinkedIn?: { headline?: string };
  analysis: { summary: string; personality: string[]; hobbies: string[] };
}

interface DateRecord {
  personA: string;
  personB: string;
  compatibilityScore: number;
  compatibilityReason: string;
  messages: { role: string; content: string }[];
}

export default function DatesPage() {
  const [people, setPeople] = useState<Person[]>([]);
  const [dates, setDates] = useState<DateRecord[]>([]);
  const [selectedIdx, setSelectedIdx] = useState(0);
  const [visibleMsgs, setVisibleMsgs] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [speed, setSpeed] = useState(1);
  const [done, setDone] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    Promise.all([
      fetch("/api/add-person").then(r => r.json()),
      fetch("/api/run-dates").then(r => r.json()),
    ]).then(([pData, dData]) => {
      setPeople(Array.isArray(pData) ? pData : []);
      setDates(Array.isArray(dData?.dates) ? dData.dates : []);
    });
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
    if (playing) {
      intervalRef.current = setInterval(advance, 1200 / speed);
    } else if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [playing, speed, advance]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [visibleMsgs]);

  function selectDate(idx: number) {
    stop(); setSelectedIdx(idx); setVisibleMsgs(0); setDone(false); setDropdownOpen(false);
  }

  function restart() { stop(); setVisibleMsgs(0); setDone(false); }

  function togglePlay() {
    if (done) { restart(); return; }
    if (playing) { stop(); } else { setPlaying(true); }
  }

  const scoreColor = (s: number) => s >= 70 ? "#4ade80" : s >= 40 ? "#facc15" : "#f87171";

  if (dates.length === 0) {
    return (
      <div className="p-8 max-w-2xl">
        <p className="text-xs font-semibold uppercase tracking-widest mb-4" style={{ color: "var(--accent)" }}>Agent Dates</p>
        <div className="rounded-xl border p-12 text-center" style={{ background: "var(--surface1)", borderColor: "var(--border)" }}>
          <p className="text-sm mb-2" style={{ color: "var(--muted)" }}>No dates yet.</p>
          <Link href="/" className="text-sm hover:underline" style={{ color: "var(--accent)" }}>Run dates from the home page</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 md:p-8 flex flex-col gap-5" style={{ minHeight: "100vh" }}>
      <div>
        <p className="text-xs font-semibold uppercase tracking-widest mb-1" style={{ color: "var(--accent)" }}>Agent Dates</p>
        <h1 className="text-2xl font-bold" style={{ color: "var(--text)" }}>Dating Theater</h1>
        <p className="text-xs mt-0.5" style={{ color: "var(--muted)" }}>AI agents simulating these individuals, not the real people</p>
      </div>

      <div className="relative">
        <button
          onClick={() => setDropdownOpen(v => !v)}
          className="flex items-center gap-3 rounded-xl border px-4 py-3 text-sm w-full max-w-lg text-left"
          style={{ background: "var(--surface1)", borderColor: "var(--border)", color: "var(--text)" }}
        >
          <span className="flex-1 truncate">{date ? (pA?.name ?? "?") + " & " + (pB?.name ?? "?") : "Select a date"}</span>
          <ChevronDown size={16} style={{ color: "var(--muted)" }} />
        </button>
        {dropdownOpen && (
          <div className="absolute z-20 mt-1 w-full max-w-lg rounded-xl border overflow-hidden shadow-xl"
            style={{ background: "var(--surface2)", borderColor: "var(--border)" }}>
            <div className="max-h-60 overflow-y-auto">
              {dates.map((d, i) => {
                const a = people.find(p => p.id === d.personA);
                const b = people.find(p => p.id === d.personB);
                return (
                  <button key={i} onClick={() => selectDate(i)}
                    className="w-full flex items-center justify-between px-4 py-2.5 text-sm text-left hover:bg-white/5"
                    style={{ color: "var(--text)" }}>
                    <span>{(a?.name ?? "?") + " & " + (b?.name ?? "?")}</span>
                    <span className="text-xs font-bold" style={{ color: scoreColor(d.compatibilityScore) }}>{d.compatibilityScore}%</span>
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {date && (
        <div className="grid grid-cols-1 md:grid-cols-[200px_1fr_200px] gap-4 flex-1">
          <PersonCard person={pA} side="A" />

          <div className="flex flex-col rounded-xl border overflow-hidden" style={{ background: "var(--surface1)", borderColor: "var(--border)", minHeight: 400 }}>
            <div className="flex items-center gap-2 px-4 py-3 border-b" style={{ borderColor: "var(--border)" }}>
              <button onClick={togglePlay}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold"
                style={{ background: "var(--accent)", color: "#100D16" }}>
                {playing ? <Pause size={13} /> : <Play size={13} />}
                {playing ? "Pause" : done ? "Restart" : "Play"}
              </button>
              <button onClick={restart}
                className="p-1.5 rounded-lg border"
                style={{ borderColor: "var(--border)", color: "var(--muted)" }}>
                <RotateCcw size={13} />
              </button>
              <div className="flex items-center gap-1.5 ml-auto">
                <Gauge size={13} style={{ color: "var(--muted)" }} />
                {[1, 2].map(s => (
                  <button key={s} onClick={() => setSpeed(s)}
                    className="text-xs px-2 py-1 rounded font-medium"
                    style={{ background: speed === s ? "rgba(201,167,255,0.15)" : "transparent", color: speed === s ? "var(--accent)" : "var(--muted)" }}>
                    {s}x
                  </button>
                ))}
              </div>
              <span className="text-xs ml-2" style={{ color: "var(--muted)" }}>{Math.min(visibleMsgs, total)}/{total}</span>
            </div>

            <div ref={scrollRef} className="flex-1 p-4 space-y-3 overflow-y-auto" style={{ maxHeight: 440 }}>
              {date.messages.slice(0, visibleMsgs).map((msg, i) => {
                const isA = msg.role === "A";
                const speaker = isA ? pA : pB;
                return (
                  <div key={i} className={"flex gap-2 msg-reveal " + (isA ? "" : "flex-row-reverse")}>
                    <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0"
                      style={{ background: isA ? "rgba(201,167,255,0.15)" : "rgba(242,166,184,0.15)", color: isA ? "var(--accent)" : "var(--romantic)" }}>
                      {speaker?.name[0] ?? "?"}
                    </div>
                    <div className="flex-1 max-w-xs">
                      <p className="text-xs mb-1" style={{ color: "var(--muted)" }}>{speaker?.name}</p>
                      <div className="px-3 py-2 rounded-xl text-xs leading-relaxed"
                        style={{ background: isA ? "rgba(201,167,255,0.1)" : "var(--surface2)", color: "var(--text)" }}>
                        {msg.content}
                      </div>
                    </div>
                  </div>
                );
              })}
              {visibleMsgs === 0 && (
                <p className="text-center text-xs py-8" style={{ color: "var(--muted)" }}>Press Play to start the date</p>
              )}
            </div>

            {done && (
              <div className="p-4 border-t" style={{ borderColor: "var(--border)" }}>
                <div className="flex items-center gap-3 mb-2">
                  <span className="text-sm font-semibold" style={{ color: "var(--text)" }}>Compatibility</span>
                  <span className="text-xl font-bold" style={{ color: scoreColor(date.compatibilityScore) }}>{date.compatibilityScore}%</span>
                </div>
                <p className="text-xs italic" style={{ color: "var(--muted)" }}>{date.compatibilityReason}</p>
              </div>
            )}
          </div>

          <PersonCard person={pB} side="B" />
        </div>
      )}
    </div>
  );
}

function PersonCard({ person, side }: { person: Person | null | undefined; side: "A" | "B" }) {
  if (!person) return <div className="rounded-xl border p-4" style={{ background: "var(--surface1)", borderColor: "var(--border)" }} />;
  const accent = side === "A" ? "var(--accent)" : "var(--romantic)";
  const bg = side === "A" ? "rgba(201,167,255,0.1)" : "rgba(242,166,184,0.1)";
  return (
    <div className="rounded-xl border p-4 flex flex-col gap-3" style={{ background: "var(--surface1)", borderColor: "var(--border)" }}>
      <div className="flex flex-col items-center text-center gap-2">
        {person.profilePicture ? (
          <img src={person.profilePicture} alt={person.name} className="w-14 h-14 rounded-full object-cover" />
        ) : (
          <div className="w-14 h-14 rounded-full flex items-center justify-center text-xl font-bold" style={{ background: bg, color: accent }}>
            {person.name[0]}
          </div>
        )}
        <div>
          <p className="text-sm font-bold" style={{ color: "var(--text)" }}>{person.name}</p>
          <p className="text-xs line-clamp-2" style={{ color: "var(--muted)" }}>{person.rawLinkedIn?.headline}</p>
        </div>
      </div>
      <div className="flex flex-wrap gap-1 justify-center">
        {(person.analysis.personality ?? []).slice(0, 3).map(t => (
          <span key={t} className="text-xs px-1.5 py-0.5 rounded-full" style={{ background: bg, color: accent }}>{t}</span>
        ))}
      </div>
      <p className="text-xs line-clamp-3" style={{ color: "var(--muted)" }}>{person.analysis.summary}</p>
    </div>
  );
}
