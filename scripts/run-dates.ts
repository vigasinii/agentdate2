/**
 * Standalone dating script — runs directly with tsx, no HTTP layer.
 * Runs all N*(N-1)/2 pairs and writes to data/dates.json incrementally.
 */
import * as fs from "fs";
import * as path from "path";
import Groq from "groq-sdk";

const DATA_DIR = path.join(process.cwd(), "data");
const DATES_FILE = path.join(DATA_DIR, "dates.json");
const PEOPLE_FILE = path.join(DATA_DIR, "people.json");

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY ?? "" });

async function chat(system: string, user: string): Promise<string> {
  for (let attempt = 0; attempt < 5; attempt++) {
    try {
      const res = await groq.chat.completions.create({
        model: "openai/gpt-oss-20b",
        messages: [{ role: "system", content: system }, { role: "user", content: user }],
        temperature: 0.8,
        max_tokens: 400,
      });
      return res.choices[0]?.message?.content ?? "";
    } catch (err: any) {
      const msg = String(err);
      if (msg.includes("429") || msg.includes("rate_limit")) {
        const waitMs = attempt === 0 ? 30000 : 60000 * attempt;
        process.stdout.write(`[rate limited, waiting ${waitMs/1000}s] `);
        await new Promise(r => setTimeout(r, waitMs));
      } else {
        throw err;
      }
    }
  }
  throw new Error("Rate limit exceeded after retries");
}

function getDates() {
  if (!fs.existsSync(DATES_FILE)) return [];
  return JSON.parse(fs.readFileSync(DATES_FILE, "utf-8"));
}

function addDate(date: object) {
  const dates = getDates();
  const d = date as { personA: string; personB: string };
  const key = [d.personA, d.personB].sort().join("--");
  const idx = dates.findIndex((x: { personA: string; personB: string }) => [x.personA, x.personB].sort().join("--") === key);
  if (idx >= 0) dates[idx] = date;
  else dates.push(date);
  fs.writeFileSync(DATES_FILE, JSON.stringify(dates, null, 2));
}

async function runDate(personA: any, personB: any) {
  const messages: Array<{ role: string; content: string }> = [];

  const sys = (me: any, them: any) =>
    `You are ${me.name}. You are on a first date with ${them.name}.
Your personality: ${me.analysis.personality.join(", ")}
Your interests: ${me.analysis.interests.join(", ")}
Your hobbies: ${me.analysis.hobbies.join(", ")}
You know ${them.name} loves ${them.analysis.hobbies.slice(0, 2).join(" and ")}.
Be natural, flirty when appropriate, and speak authentically as ${me.name}. 2-3 sentences max.`;

  // Round 1: A opens
  const open = await chat(
    sys(personA, personB),
    `You are ${personA.name}. Open the date warmly — mention one thing you genuinely love (from your real hobbies: ${personA.analysis.hobbies.slice(0, 2).join(", ")}) and ask ${personB.name} a genuine question.`
  );
  messages.push({ role: "A", content: open });

  const r1b = await chat(sys(personB, personA), `You are ${personB.name}. Respond to ${personA.name}: "${open}"`);
  messages.push({ role: "B", content: r1b });

  // Round 2
  const r2a = await chat(sys(personA, personB), `You are ${personA.name}. Continue the date: "${r1b}"`);
  messages.push({ role: "A", content: r2a });

  const r2b = await chat(sys(personB, personA), `You are ${personB.name}. Respond to ${personA.name}: "${r2a}"`);
  messages.push({ role: "B", content: r2b });

  // Round 3
  const r3a = await chat(sys(personA, personB), `You are ${personA.name}. Wrap up the date naturally: "${r2b}"`);
  messages.push({ role: "A", content: r3a });

  const r3b = await chat(sys(personB, personA), `You are ${personB.name}. Give a warm closing: "${r3a}"`);
  messages.push({ role: "B", content: r3b });

  // Score
  const scoreRaw = await chat(
    `You are a compatibility analyst for a dating app. Analyze these two people and score their romantic compatibility 0-100.
Respond with ONLY this JSON (no markdown, no explanation):
{"score": 75, "reason": "They share X and Y but differ on Z."}`,
    `${personA.name}: personality=${personA.analysis.personality.join(", ")}; needs=${personA.analysis.needs.join(", ")}; lookingFor="${personA.analysis.lookingFor}"
${personB.name}: personality=${personB.analysis.personality.join(", ")}; needs=${personB.analysis.needs.join(", ")}; lookingFor="${personB.analysis.lookingFor}"
Their chat: ${messages.map(m => `${m.role === "A" ? personA.name : personB.name}: ${m.content}`).join(" | ").slice(0, 600)}`
  );

  let score = 50, reason = "";
  try {
    const json = scoreRaw.match(/\{[\s\S]*?\}/)?.[0] ?? "{}";
    const p = JSON.parse(json);
    score = Math.min(100, Math.max(0, Number(p.score ?? p.Score ?? 50)));
    reason = String(p.reason ?? p.Reason ?? "");
  } catch {}
  // Also try plain number extraction if JSON fails
  if (score === 50 && !reason) {
    const numMatch = scoreRaw.match(/\b(\d{1,3})\b/);
    if (numMatch) score = Math.min(100, parseInt(numMatch[1]));
    const reasonMatch = scoreRaw.match(/"reason"\s*:\s*"([^"]+)"/i);
    if (reasonMatch) reason = reasonMatch[1];
  }

  return { personA: personA.id, personB: personB.id, messages, compatibilityScore: score, compatibilityReason: reason };
}

async function main() {
  // Load env
  const envPath = path.join(process.cwd(), ".env.local");
  if (fs.existsSync(envPath)) {
    fs.readFileSync(envPath, "utf-8").split("\n").forEach(line => {
      const [k, ...v] = line.split("=");
      if (k && v.length) process.env[k.trim()] = v.join("=").trim();
    });
  }

  const people = JSON.parse(fs.readFileSync(PEOPLE_FILE, "utf-8"));
  const existingDates = getDates();
  const existingKeys = new Set(existingDates.map((d: any) => [d.personA, d.personB].sort().join("--")));

  const pairs: [any, any][] = [];
  for (let i = 0; i < people.length; i++) {
    for (let j = i + 1; j < people.length; j++) {
      const key = [people[i].id, people[j].id].sort().join("--");
      if (!existingKeys.has(key)) pairs.push([people[i], people[j]]);
    }
  }

  console.log(`Running ${pairs.length} dates (${people.length} people)...`);

  for (let idx = 0; idx < pairs.length; idx++) {
    const [a, b] = pairs[idx];
    process.stdout.write(`[${idx + 1}/${pairs.length}] ${a.name} ↔ ${b.name}... `);
    try {
      const date = await runDate(a, b);
      addDate(date);
      console.log(`✓ score=${date.compatibilityScore}`);
    } catch (err) {
      console.log(`✗ ${err}`);
    }
  }

  console.log("Done! All dates complete.");
}

main().catch(console.error);
