"use client";
import { useState, useMemo } from "react";
import Link from "next/link";
import { Search, ArrowRight, SlidersHorizontal, Plus } from "lucide-react";

interface Person {
  id: string;
  name: string;
  profilePicture?: string;
  rawLinkedIn?: { headline?: string; location?: string };
  analysis: { summary?: string; personality?: string[]; interests?: string[]; hobbies?: string[] };
}

function InitialAvatar({ name, size = 160 }: { name: string; size?: number }) {
  const colors = [
    ["#E8F0EC", "#456B59"],
    ["#EBE8F0", "#5B4592"],
    ["#F0E8E8", "#924545"],
    ["#E8EDF0", "#456789"],
    ["#F0EDE8", "#896745"],
  ];
  const [bg, fg] = colors[name.charCodeAt(0) % colors.length];
  return (
    <div
      className="w-full flex items-center justify-center select-none"
      style={{ height: size, background: bg, flexShrink: 0 }}
    >
      <span style={{ fontSize: size * 0.38, fontWeight: 600, color: fg, letterSpacing: "-0.02em" }}>
        {name[0].toUpperCase()}
      </span>
    </div>
  );
}

function ProfileCard({ p }: { p: Person }) {
  const tags = [
    ...(p.analysis.interests ?? []),
    ...(p.analysis.hobbies ?? []),
    ...(p.analysis.personality ?? []),
  ].filter(Boolean).slice(0, 2);

  return (
    <Link href={"/profiles/" + p.id} className="group block h-full">
      <div
        className="h-full rounded-xl border overflow-hidden transition-all"
        style={{
          background: "var(--card)",
          borderColor: "var(--border)",
          display: "flex",
          flexDirection: "column",
        }}
      >
        {/* Portrait */}
        <div className="overflow-hidden" style={{ height: 180, flexShrink: 0 }}>
          {p.profilePicture ? (
            <img
              src={p.profilePicture}
              alt={p.name}
              className="w-full h-full object-cover object-top transition-transform duration-500 group-hover:scale-[1.03]"
            />
          ) : (
            <InitialAvatar name={p.name} size={180} />
          )}
        </div>

        {/* Info */}
        <div className="flex flex-col flex-1 p-4">
          <h3
            style={{ fontSize: 15, fontWeight: 600, color: "var(--text)", marginBottom: 2, letterSpacing: "-0.01em" }}
          >
            {p.name}
          </h3>
          {p.rawLinkedIn?.headline && (
            <p
              className="line-clamp-2"
              style={{ fontSize: 12, color: "var(--muted)", marginBottom: 10, lineHeight: 1.5 }}
            >
              {p.rawLinkedIn.headline}
            </p>
          )}
          {p.analysis.summary && (
            <p
              className="line-clamp-2 flex-1"
              style={{ fontSize: 13, color: "var(--muted)", lineHeight: 1.6, marginBottom: 12 }}
            >
              {p.analysis.summary}
            </p>
          )}

          {tags.length > 0 && (
            <div className="flex flex-wrap gap-1 mb-3">
              {tags.map(t => (
                <span
                  key={t}
                  style={{
                    fontSize: 11,
                    padding: "2px 8px",
                    borderRadius: 20,
                    background: "var(--surface)",
                    color: "var(--muted)",
                    border: "1px solid var(--border)",
                  }}
                >
                  {t}
                </span>
              ))}
            </div>
          )}

          <div
            className="flex items-center gap-1 transition-colors"
            style={{ fontSize: 12, fontWeight: 500, color: "var(--muted)", marginTop: "auto" }}
          >
            <span className="group-hover:text-[var(--accent)]" style={{ transition: "color 0.15s" }}>
              View profile
            </span>
            <ArrowRight
              size={12}
              className="group-hover:translate-x-0.5"
              style={{ transition: "transform 0.15s", color: "inherit" }}
            />
          </div>
        </div>
      </div>
    </Link>
  );
}

export default function ProfilesGrid({ people }: { people: Person[] }) {
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState<"name" | "recent">("recent");
  const [showAdd, setShowAdd] = useState(false);

  const allTags = useMemo(() => {
    const set = new Set<string>();
    people.forEach(p => {
      [...(p.analysis.interests ?? []), ...(p.analysis.hobbies ?? []), ...(p.analysis.personality ?? [])]
        .slice(0, 4)
        .forEach(t => set.add(t));
    });
    return Array.from(set).slice(0, 12);
  }, [people]);

  const [activeTag, setActiveTag] = useState<string | null>(null);

  const filtered = useMemo(() => {
    let list = [...people];
    if (query.trim()) {
      const q = query.toLowerCase();
      list = list.filter(
        p =>
          p.name.toLowerCase().includes(q) ||
          p.rawLinkedIn?.headline?.toLowerCase().includes(q) ||
          p.analysis.summary?.toLowerCase().includes(q)
      );
    }
    if (activeTag) {
      list = list.filter(p =>
        [
          ...(p.analysis.interests ?? []),
          ...(p.analysis.hobbies ?? []),
          ...(p.analysis.personality ?? []),
        ].includes(activeTag)
      );
    }
    if (sort === "name") list.sort((a, b) => a.name.localeCompare(b.name));
    return list;
  }, [people, query, activeTag, sort]);

  return (
    <div style={{ maxWidth: 1100, margin: "0 auto", padding: "40px 32px 80px" }}>
      {/* Header */}
      <div style={{ marginBottom: 32 }}>
        <p
          style={{
            fontSize: 11,
            fontWeight: 600,
            letterSpacing: "0.08em",
            textTransform: "uppercase",
            color: "var(--accent)",
            marginBottom: 8,
          }}
        >
          Your Network
        </p>
        <h1
          style={{
            fontSize: 30,
            fontWeight: 700,
            color: "var(--text)",
            letterSpacing: "-0.02em",
            lineHeight: 1.2,
            marginBottom: 8,
          }}
        >
          Meet the people behind the agents.
        </h1>
        <p style={{ fontSize: 14, color: "var(--muted)", lineHeight: 1.6 }}>
          Explore {people.length} AI-analyzed profiles and discover how their agents connect.
        </p>
      </div>

      {/* Toolbar */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 8,
          marginBottom: 24,
          flexWrap: "wrap",
        }}
      >
        {/* Search */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            flex: "1 1 200px",
            minWidth: 180,
            maxWidth: 320,
            border: "1px solid var(--border)",
            borderRadius: 8,
            padding: "8px 12px",
            background: "var(--card)",
          }}
        >
          <Search size={13} style={{ color: "var(--muted)", flexShrink: 0 }} />
          <input
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Search by name or role..."
            style={{
              flex: 1,
              background: "transparent",
              border: "none",
              outline: "none",
              fontSize: 13,
              color: "var(--text)",
            }}
          />
        </div>

        {/* Sort */}
        <div style={{ display: "flex", alignItems: "center", gap: 6, marginLeft: "auto" }}>
          <SlidersHorizontal size={13} style={{ color: "var(--muted)" }} />
          <select
            value={sort}
            onChange={e => setSort(e.target.value as "name" | "recent")}
            style={{
              fontSize: 12,
              color: "var(--muted)",
              background: "transparent",
              border: "none",
              outline: "none",
              cursor: "pointer",
            }}
          >
            <option value="recent">Recently added</option>
            <option value="name">Name A–Z</option>
          </select>
        </div>

        {/* Add person */}
        <Link
          href="/"
          onClick={() => setShowAdd(true)}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 6,
            padding: "8px 14px",
            borderRadius: 8,
            background: "var(--accent)",
            color: "#fff",
            fontSize: 13,
            fontWeight: 500,
            textDecoration: "none",
          }}
        >
          <Plus size={13} />
          Add person
        </Link>
      </div>

      {/* Tag filters */}
      {allTags.length > 0 && (
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 28 }}>
          <button
            onClick={() => setActiveTag(null)}
            style={{
              fontSize: 12,
              padding: "4px 12px",
              borderRadius: 20,
              border: "1px solid var(--border)",
              background: activeTag === null ? "var(--accent)" : "var(--card)",
              color: activeTag === null ? "#fff" : "var(--muted)",
              cursor: "pointer",
              transition: "all 0.15s",
            }}
          >
            All
          </button>
          {allTags.map(t => (
            <button
              key={t}
              onClick={() => setActiveTag(activeTag === t ? null : t)}
              style={{
                fontSize: 12,
                padding: "4px 12px",
                borderRadius: 20,
                border: "1px solid var(--border)",
                background: activeTag === t ? "var(--accent)" : "var(--card)",
                color: activeTag === t ? "#fff" : "var(--muted)",
                cursor: "pointer",
                transition: "all 0.15s",
              }}
            >
              {t}
            </button>
          ))}
        </div>
      )}

      {/* Results count */}
      {query || activeTag ? (
        <p style={{ fontSize: 12, color: "var(--muted)", marginBottom: 16 }}>
          {filtered.length} result{filtered.length !== 1 ? "s" : ""}
          {query ? ` for "${query}"` : ""}
          {activeTag ? ` tagged "${activeTag}"` : ""}
        </p>
      ) : null}

      {/* Empty state */}
      {filtered.length === 0 && (
        <div
          style={{
            border: "1px solid var(--border)",
            borderRadius: 12,
            padding: 64,
            textAlign: "center",
          }}
        >
          <p style={{ fontSize: 14, color: "var(--muted)" }}>No profiles match your filters.</p>
          <button
            onClick={() => { setQuery(""); setActiveTag(null); }}
            style={{ marginTop: 8, fontSize: 13, color: "var(--accent)", background: "none", border: "none", cursor: "pointer", textDecoration: "underline" }}
          >
            Clear filters
          </button>
        </div>
      )}

      {/* Grid */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))",
          gap: 16,
        }}
      >
        {filtered.map(p => (
          <ProfileCard key={p.id} p={p} />
        ))}
      </div>
    </div>
  );
}
