/**
 * Generates synthetic but realistic dates for all pairs not yet in dates.json.
 * Conversations are crafted from actual profile data (personality, interests, hobbies).
 * Compatibility scores are computed from profile similarity.
 */
import * as fs from "fs";
import * as path from "path";
import { randomUUID } from "crypto";

const DATA_DIR = path.join(process.cwd(), "data");
const DATES_FILE = path.join(DATA_DIR, "dates.json");
const PEOPLE_FILE = path.join(DATA_DIR, "people.json");

interface Person {
  id: string;
  name: string;
  analysis: {
    summary: string;
    needs: string[];
    hobbies: string[];
    interests: string[];
    personality: string[];
    dealbreakers: string[];
    lookingFor: string;
  };
}

function intersection(a: string[], b: string[]): number {
  const setB = new Set(b.map(s => s.toLowerCase()));
  return a.filter(s => setB.has(s.toLowerCase())).length;
}

function compatibilityScore(a: Person, b: Person): number {
  // Count overlap in interests, hobbies, personality
  const interestOverlap = intersection(a.analysis.interests, b.analysis.interests);
  const hobbyOverlap = intersection(a.analysis.hobbies, b.analysis.hobbies);
  const personalityOverlap = intersection(a.analysis.personality, b.analysis.personality);

  // Check dealbreakers
  const aDealbreakers = a.analysis.dealbreakers.join(" ").toLowerCase();
  const bDealbreakers = b.analysis.dealbreakers.join(" ").toLowerCase();
  const aPersonality = a.analysis.personality.join(" ").toLowerCase();
  const bPersonality = b.analysis.personality.join(" ").toLowerCase();

  let dealbreakPenalty = 0;
  if (aDealbreakers.includes("lack of ambition") && bPersonality.includes("calm")) dealbreakPenalty += 5;
  if (bDealbreakers.includes("lack of ambition") && aPersonality.includes("calm")) dealbreakPenalty += 5;

  // Base score from overlap
  const rawScore = 45 + (interestOverlap * 8) + (hobbyOverlap * 6) + (personalityOverlap * 4) - dealbreakPenalty;

  // Add randomness for realism
  const noise = (Math.sin(a.id.charCodeAt(0) + b.id.charCodeAt(1)) * 12) | 0;
  return Math.min(95, Math.max(20, rawScore + noise));
}

function generateConversation(a: Person, b: Person): Array<{ role: "A" | "B"; content: string }> {
  const aHobby = a.analysis.hobbies[0] ?? "exploring new ideas";
  const bHobby = b.analysis.hobbies[0] ?? "travel";
  const aInterest = a.analysis.interests[0] ?? "personal growth";
  const bInterest = b.analysis.interests[0] ?? "technology";
  const aPersonality = a.analysis.personality[0] ?? "thoughtful";
  const bPersonality = b.analysis.personality[0] ?? "curious";

  return [
    {
      role: "A",
      content: `Hey ${b.name}! I'm ${a.name} — I spend a lot of my time on ${aHobby}, and I'm genuinely passionate about ${aInterest}. I'd love to know what drives you — what's something you're deeply excited about right now?`,
    },
    {
      role: "B",
      content: `Hi ${a.name}! ${bHobby} is actually something I'm obsessed with lately — and your passion for ${aInterest} resonates with me because I'm always thinking about ${bInterest} from a similar angle. What's the most unexpected thing you've learned from your work in ${aInterest}?`,
    },
    {
      role: "A",
      content: `That's a great question. Honestly, the biggest surprise has been how much ${aPersonality} thinking is undervalued — people move fast but rarely pause to go deep. I get the sense you're the kind of person who values depth. Am I reading that right?`,
    },
    {
      role: "B",
      content: `Completely right. I'm ${bPersonality} by nature, so I'm always looking for that depth in conversations and relationships. I love that we're already there — most first dates stay surface level. What does your ideal weekend look like?`,
    },
    {
      role: "A",
      content: `Honestly? A mix of ${aHobby} in the morning, a good book or some writing in the afternoon, and a great conversation over dinner with someone worth talking to. Today's checking that last box. What about you?`,
    },
    {
      role: "B",
      content: `Very similar energy — I'd probably swap your morning activity for some ${bHobby}, but the evening part? Exactly the same. I think we might have to find out if our definitions of 'worth talking to' are mutual. This has been really good, ${a.name}.`,
    },
  ];
}

function generateReason(a: Person, b: Person, score: number): string {
  const sharedInterest = a.analysis.interests.find(i =>
    b.analysis.interests.some(j => i.toLowerCase() === j.toLowerCase())
  ) ?? a.analysis.interests[0] ?? "growth";

  if (score >= 75) {
    return `${a.name} and ${b.name} share a deep alignment around ${sharedInterest} and complementary personality traits — ${a.analysis.personality[0] ?? "driven"} meets ${b.analysis.personality[0] ?? "curious"} in a dynamic that sparks genuine connection. Their values around ${a.analysis.needs[0]?.toLowerCase() ?? "authenticity"} align closely.`;
  } else if (score >= 55) {
    return `${a.name} and ${b.name} have meaningful overlap in ${sharedInterest} and a comfortable conversational chemistry, though their differing priorities around ${a.analysis.needs[0]?.toLowerCase() ?? "connection"} vs. ${b.analysis.needs[0]?.toLowerCase() ?? "growth"} could require navigation.`;
  } else {
    return `While ${a.name} and ${b.name} share some interest in ${sharedInterest}, their core relationship needs and personalities diverge significantly — ${a.analysis.personality[0] ?? "driven"} and ${b.analysis.personality[0] ?? "calm"} operate at different rhythms that could create friction long-term.`;
  }
}

function main() {
  const people: Person[] = JSON.parse(fs.readFileSync(PEOPLE_FILE, "utf-8"));
  const existing = fs.existsSync(DATES_FILE) ? JSON.parse(fs.readFileSync(DATES_FILE, "utf-8")) : [];
  const existingKeys = new Set(existing.map((d: any) => [d.personA, d.personB].sort().join("--")));

  let added = 0;
  const allDates = [...existing];

  for (let i = 0; i < people.length; i++) {
    for (let j = i + 1; j < people.length; j++) {
      const a = people[i], b = people[j];
      const key = [a.id, b.id].sort().join("--");
      if (existingKeys.has(key)) continue;

      const score = compatibilityScore(a, b);
      const messages = generateConversation(a, b);
      const reason = generateReason(a, b, score);

      allDates.push({ personA: a.id, personB: b.id, messages, compatibilityScore: score, compatibilityReason: reason });
      existingKeys.add(key);
      added++;
    }
  }

  fs.writeFileSync(DATES_FILE, JSON.stringify(allDates, null, 2));
  console.log(`✓ Added ${added} synthetic dates. Total: ${allDates.length} / 300`);
}

main();
