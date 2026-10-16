import Groq from "groq-sdk";
import type { LinkedInProfile, InstagramProfile } from "./apify";

let _groq: Groq | null = null;
function getGroq() {
  if (!_groq) _groq = new Groq({ apiKey: process.env.GROQ_API_KEY ?? "" });
  return _groq;
}

export interface PersonProfile {
  id: string;
  name: string;
  linkedinUrl: string;
  instagramUrl: string;
  profilePicture?: string;
  analysis: {
    summary: string;
    needs: string[];
    hobbies: string[];
    interests: string[];
    personality: string[];
    dealbreakers: string[];
    lookingFor: string;
  };
  rawLinkedIn: LinkedInProfile;
  rawInstagram: InstagramProfile;
}

export interface DateConversation {
  personA: string;
  personB: string;
  messages: Array<{ role: "A" | "B"; content: string }>;
  compatibilityScore: number;
  compatibilityReason: string;
}

async function chat(systemPrompt: string, userPrompt: string): Promise<string> {
  const res = await getGroq().chat.completions.create({
    model: process.env.GROQ_MODEL ?? "openai/gpt-oss-20b",
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: userPrompt },
    ],
    temperature: 0.7,
    max_tokens: 1024,
  });
  return res.choices[0]?.message?.content ?? "";
}

export async function analyzeProfile(
  linkedin: LinkedInProfile,
  instagram: InstagramProfile
): Promise<PersonProfile["analysis"]> {
  const context = `
LinkedIn URL: ${linkedin.name ? `Profile of ${linkedin.name}` : "unknown"}
Name: ${linkedin.name}
Headline: ${linkedin.headline}
Summary: ${linkedin.summary}
Experience: ${linkedin.experience.map((e) => `${e.title} at ${e.company}`).join(", ") || "not available"}
Skills: ${linkedin.skills.join(", ") || "not available"}
Education: ${linkedin.education.map((e) => `${e.degree} from ${e.school}`).join(", ") || "not available"}

Instagram:
Username: @${instagram.username}
Full name: ${instagram.fullName}
Bio: ${instagram.biography || "not available"}
Followers: ${instagram.followersCount || "unknown"}
Recent posts: ${instagram.posts.map((p) => p.caption).filter(Boolean).join(" | ") || "not available"}

Use all available signals — name, headline, bio, username — to infer their personality, interests and relationship needs. Make educated inferences even with limited data.
`;

  const raw = await chat(
    `You are a dating profile analyst. Analyze the person from their LinkedIn and Instagram data.
Return ONLY valid JSON with these exact fields:
{
  "summary": "2-3 sentence personality summary",
  "needs": ["3-5 emotional/relationship needs"],
  "hobbies": ["4-6 hobbies/activities"],
  "interests": ["4-6 topics they care about"],
  "personality": ["3-5 personality traits"],
  "dealbreakers": ["2-3 likely dealbreakers"],
  "lookingFor": "1 sentence on what they likely seek in a partner"
}`,
    context
  );

  try {
    const json = raw.match(/\{[\s\S]*\}/)?.[0] ?? "{}";
    return JSON.parse(json);
  } catch {
    return {
      summary: "Interesting professional with varied interests.",
      needs: ["Connection", "Growth", "Authenticity"],
      hobbies: ["Work", "Travel", "Learning"],
      interests: ["Technology", "Culture"],
      personality: ["Driven", "Curious"],
      dealbreakers: ["Dishonesty"],
      lookingFor: "A genuine partner who shares their values.",
    };
  }
}

export async function runDate(
  personA: PersonProfile,
  personB: PersonProfile
): Promise<DateConversation> {
  const messages: DateConversation["messages"] = [];

  const makeSystemPrompt = (person: PersonProfile, other: PersonProfile) => `
You are the dating agent for ${person.name}. You are on a first date with ${other.name}.
Your personality: ${person.analysis.personality.join(", ")}
Your interests: ${person.analysis.interests.join(", ")}
Your hobbies: ${person.analysis.hobbies.join(", ")}
What you need: ${person.analysis.needs.join(", ")}
What you're looking for: ${person.analysis.lookingFor}

You know ${other.name}'s interests are: ${other.analysis.interests.join(", ")} and hobbies: ${other.analysis.hobbies.join(", ")}

Be natural, flirty when appropriate, and authentic to your character. Keep responses to 2-3 sentences.`;

  // 3 rounds of conversation
  for (let round = 0; round < 3; round++) {
    // A speaks
    const aPrompt =
      round === 0
        ? `You are ${personA.name}. Start the date with a warm opener as yourself. Mention one of your real interests (${personA.analysis.hobbies.slice(0,2).join(" or ")}) and ask ${personB.name} something genuine about their life.`
        : `You are ${personA.name}. Continue the date naturally, responding to what ${personB.name} just said: "${messages[messages.length - 1]?.content}"`;

    const aMsg = await chat(makeSystemPrompt(personA, personB), aPrompt);
    messages.push({ role: "A", content: aMsg });

    // B responds
    const bMsg = await chat(
      makeSystemPrompt(personB, personA),
      `You are ${personB.name}. Respond authentically to ${personA.name}'s message as yourself: "${aMsg}"`
    );
    messages.push({ role: "B", content: bMsg });
  }

  // Score compatibility
  const scoreRaw = await chat(
    `You are a compatibility analyst. Analyze how compatible two people are for dating based on their profiles and their conversation.
Return ONLY valid JSON: { "score": <number 0-100>, "reason": "<2 sentence explanation>" }`,
    `Person A (${personA.name}): needs=${personA.analysis.needs.join(", ")}, personality=${personA.analysis.personality.join(", ")}, lookingFor=${personA.analysis.lookingFor}
Person B (${personB.name}): needs=${personB.analysis.needs.join(", ")}, personality=${personB.analysis.personality.join(", ")}, lookingFor=${personB.analysis.lookingFor}
Their conversation: ${messages.map((m) => `${m.role === "A" ? personA.name : personB.name}: ${m.content}`).join("\n")}`
  );

  let score = 50;
  let reason = "Moderate compatibility based on shared interests.";
  try {
    const json = scoreRaw.match(/\{[\s\S]*\}/)?.[0] ?? "{}";
    const parsed = JSON.parse(json);
    score = Number(parsed.score ?? 50);
    reason = String(parsed.reason ?? reason);
  } catch {}

  return { personA: personA.id, personB: personB.id, messages, compatibilityScore: score, compatibilityReason: reason };
}

export function computeRankings(
  people: PersonProfile[],
  dates: DateConversation[]
): Array<{ personId: string; rankings: Array<{ personId: string; score: number; reason: string }> }> {
  return people.map((person) => {
    const relevant = dates.filter((d) => d.personA === person.id || d.personB === person.id);
    const rankings = relevant
      .map((d) => {
        const otherId = d.personA === person.id ? d.personB : d.personA;
        return { personId: otherId, score: d.compatibilityScore, reason: d.compatibilityReason };
      })
      .sort((a, b) => b.score - a.score);
    return { personId: person.id, rankings };
  });
}
