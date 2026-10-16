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
    /** Which fields are inferred (not directly stated) */
    inferredFields?: string[];
    /** Evidence citations: field -> source text */
    evidence?: Record<string, string>;
    /** Data quality flags */
    dataQuality?: {
      linkedinAvailable: boolean;
      instagramAvailable: boolean;
      confidence: "high" | "medium" | "low";
      warnings?: string[];
    };
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
  compatibilityBreakdown?: {
    sharedInterests: number;
    personalityFit: number;
    valueAlignment: number;
    evidenceNotes: string;
    uncertainty: string;
  };
  /** true = AI-generated fixture from pre-seeded data, not a live agent run */
  synthetic?: boolean;
  createdAt?: string;
}

async function chat(systemPrompt: string, userPrompt: string, maxTokens = 1024): Promise<string> {
  const res = await getGroq().chat.completions.create({
    model: process.env.GROQ_MODEL ?? "openai/gpt-oss-20b",
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: userPrompt },
    ],
    temperature: 0.7,
    max_tokens: maxTokens,
  });
  return res.choices[0]?.message?.content ?? "";
}

export async function analyzeProfile(
  linkedin: LinkedInProfile,
  instagram: InstagramProfile
): Promise<PersonProfile["analysis"]> {
  const liAvail = !!(linkedin.name || linkedin.headline || linkedin.summary);
  const igAvail = !!(instagram.biography || instagram.fullName);

  if (!liAvail && !igAvail) {
    return {
      summary: "Insufficient public data available to build a profile.",
      needs: [],
      hobbies: [],
      interests: [],
      personality: [],
      dealbreakers: [],
      lookingFor: "Unknown — no public data extracted.",
      dataQuality: {
        linkedinAvailable: false,
        instagramAvailable: false,
        confidence: "low",
        warnings: ["Both LinkedIn and Instagram returned no usable data. Analysis is not possible."],
      },
    };
  }

  const warnings: string[] = [];
  if (!liAvail) warnings.push("LinkedIn data unavailable — analysis based on Instagram only.");
  if (!igAvail) warnings.push("Instagram data unavailable — analysis based on LinkedIn only.");

  const context = `
LINKEDIN DATA (${liAvail ? "available" : "unavailable"}):
Name: ${linkedin.name || "not available"}
Headline: ${linkedin.headline || "not available"}
Summary: ${linkedin.summary || "not available"}
Experience: ${linkedin.experience.map(e => e.title + " at " + e.company).join(", ") || "not available"}
Skills: ${linkedin.skills.join(", ") || "not available"}
Education: ${linkedin.education.map(e => e.degree + " from " + e.school).join(", ") || "not available"}

INSTAGRAM DATA (${igAvail ? "available" : "unavailable"}):
Username: @${instagram.username || "unknown"}
Full name: ${instagram.fullName || "not available"}
Bio: ${instagram.biography || "not available"}
Followers: ${instagram.followersCount || "unknown"}
Recent posts: ${instagram.posts.map(p => p.caption).filter(Boolean).join(" | ") || "not available"}
`;

  const raw = await chat(
    `You are a careful dating profile analyst. Analyze the person from available public data.

CRITICAL RULES:
1. Only assert facts directly supported by the data.
2. Mark inferred traits clearly with "likely" or "appears to".
3. If data is missing for a field, use an empty array [] — DO NOT invent values.
4. In the "evidence" object, cite the specific text that supports each claim.
5. In "inferredFields", list any field names where you made inferences beyond stated facts.

Return ONLY valid JSON:
{
  "summary": "2-3 sentences using only what the data supports. Note any gaps.",
  "needs": ["3-5 relationship needs, empty array if genuinely unknown"],
  "hobbies": ["hobbies directly evidenced, empty array if none found"],
  "interests": ["interests directly evidenced, empty array if none found"],
  "personality": ["traits supported by data, with 'likely' prefix for inferences"],
  "dealbreakers": ["only if clearly evidenced, empty array if unknown"],
  "lookingFor": "1 sentence — state 'unclear from available data' if not evidenced",
  "inferredFields": ["list field names where inference was required"],
  "evidence": {
    "summary": "quoted or paraphrased supporting text from source",
    "needs": "supporting evidence",
    "hobbies": "supporting evidence",
    "interests": "supporting evidence",
    "personality": "supporting evidence"
  }
}`,
    context,
    1200
  );

  try {
    const json = raw.match(/\{[\s\S]*\}/)?.[0] ?? "{}";
    const parsed = JSON.parse(json);
    return {
      summary: parsed.summary ?? "Analysis incomplete.",
      needs: Array.isArray(parsed.needs) ? parsed.needs : [],
      hobbies: Array.isArray(parsed.hobbies) ? parsed.hobbies : [],
      interests: Array.isArray(parsed.interests) ? parsed.interests : [],
      personality: Array.isArray(parsed.personality) ? parsed.personality : [],
      dealbreakers: Array.isArray(parsed.dealbreakers) ? parsed.dealbreakers : [],
      lookingFor: parsed.lookingFor ?? "Unclear from available data.",
      inferredFields: parsed.inferredFields ?? [],
      evidence: parsed.evidence ?? {},
      dataQuality: {
        linkedinAvailable: liAvail,
        instagramAvailable: igAvail,
        confidence: liAvail && igAvail ? "medium" : "low",
        warnings: warnings.length ? warnings : undefined,
      },
    };
  } catch {
    return {
      summary: "Profile analysis failed — the AI response could not be parsed. Raw data was collected but analysis is unavailable.",
      needs: [],
      hobbies: [],
      interests: [],
      personality: [],
      dealbreakers: [],
      lookingFor: "Unknown — analysis error.",
      dataQuality: {
        linkedinAvailable: liAvail,
        instagramAvailable: igAvail,
        confidence: "low",
        warnings: ["Analysis parsing failed. The raw data is preserved above."],
      },
    };
  }
}

export async function runDate(
  personA: PersonProfile,
  personB: PersonProfile
): Promise<DateConversation> {
  const messages: DateConversation["messages"] = [];

  const makeSystemPrompt = (person: PersonProfile, other: PersonProfile) =>
    `You are the AI dating agent representing ${person.name} on a simulated first date with ${other.name}.
This is a simulation — you are NOT the real person. Stay in character based only on their public profile.
Your known traits: ${person.analysis.personality.join(", ") || "unknown"}
Your known interests: ${person.analysis.interests.join(", ") || "unknown"}
Your known hobbies: ${person.analysis.hobbies.join(", ") || "unknown"}
What you seek: ${person.analysis.lookingFor}

Keep each response to 2-3 natural sentences. Be warm and curious.`;

  const phases = [
    {
      aPrompt: `Opening: greet ${personB.name} warmly. Mention one genuine interest of yours (from: ${personA.analysis.hobbies.slice(0,2).join(", ") || "your work"}) and ask ${personB.name} an open-ended question about themselves.`,
      bPrompt: (aMsg: string) => `Respond to ${personA.name}'s opener: "${aMsg}". Share something about yourself and reciprocate with curiosity.`,
    },
    {
      aPrompt: (bMsg: string) => `${personB.name} just said: "${bMsg}". Find a genuine point of connection — a shared interest or experience — and explore it.`,
      bPrompt: (aMsg: string) => `${personA.name} said: "${aMsg}". Engage with that shared thread. You can agree, add your perspective, or gently note a difference.`,
    },
    {
      aPrompt: (bMsg: string) => `${personB.name} said: "${bMsg}". Explore a difference or an interesting contrast in your values or lifestyles — keep it light.`,
      bPrompt: (aMsg: string) => `${personA.name} said: "${aMsg}". Respond thoughtfully to the contrast they raised.`,
    },
    {
      aPrompt: (bMsg: string) => `${personB.name} said: "${bMsg}". Give a closing reflection on how the date felt — what you noticed, what you liked, what you are curious about.`,
      bPrompt: (aMsg: string) => `${personA.name} said: "${aMsg}". Close the date with your honest reflection on how the conversation went.`,
    },
  ];

  for (let i = 0; i < phases.length; i++) {
    const phase = phases[i];
    const lastB = messages.filter(m => m.role === "B").pop()?.content ?? "";

    const aPromptStr = i === 0
      ? (phase.aPrompt as string)
      : (phase.aPrompt as (s: string) => string)(lastB);

    const aMsg = await chat(makeSystemPrompt(personA, personB), aPromptStr);
    messages.push({ role: "A", content: aMsg });

    const bPromptStr = (phase.bPrompt as (s: string) => string)(aMsg);
    const bMsg = await chat(makeSystemPrompt(personB, personA), bPromptStr);
    messages.push({ role: "B", content: bMsg });
  }

  // Compatibility breakdown
  const scoreRaw = await chat(
    `You are a compatibility analyst. Score two people's dating compatibility with evidence-based reasoning.
Return ONLY valid JSON:
{
  "score": <0-100>,
  "reason": "<2 sentences — cite specific evidence from their profiles or conversation>",
  "breakdown": {
    "sharedInterests": <0-100>,
    "personalityFit": <0-100>,
    "valueAlignment": <0-100>,
    "evidenceNotes": "<what specific evidence supports the score>",
    "uncertainty": "<what we cannot assess due to limited data>"
  }
}`,
    `${personA.name}: needs=${personA.analysis.needs.join(", ")}, personality=${personA.analysis.personality.join(", ")}, lookingFor=${personA.analysis.lookingFor}, hobbies=${personA.analysis.hobbies.join(", ")}
${personB.name}: needs=${personB.analysis.needs.join(", ")}, personality=${personB.analysis.personality.join(", ")}, lookingFor=${personB.analysis.lookingFor}, hobbies=${personB.analysis.hobbies.join(", ")}
Conversation:
${messages.map(m => (m.role === "A" ? personA.name : personB.name) + ": " + m.content).join("\n")}`,
    512
  );

  let score = 50;
  let reason = "Compatibility assessed from limited public data.";
  let breakdown: DateConversation["compatibilityBreakdown"];

  try {
    const json = scoreRaw.match(/\{[\s\S]*\}/)?.[0] ?? "{}";
    const parsed = JSON.parse(json);
    score = Math.max(0, Math.min(100, Number(parsed.score ?? 50)));
    reason = String(parsed.reason ?? reason);
    if (parsed.breakdown) {
      breakdown = {
        sharedInterests: Number(parsed.breakdown.sharedInterests ?? 50),
        personalityFit: Number(parsed.breakdown.personalityFit ?? 50),
        valueAlignment: Number(parsed.breakdown.valueAlignment ?? 50),
        evidenceNotes: String(parsed.breakdown.evidenceNotes ?? ""),
        uncertainty: String(parsed.breakdown.uncertainty ?? ""),
      };
    }
  } catch {}

  return {
    personA: personA.id,
    personB: personB.id,
    messages,
    compatibilityScore: score,
    compatibilityReason: reason,
    compatibilityBreakdown: breakdown,
    synthetic: false,
    createdAt: new Date().toISOString(),
  };
}

export function computeRankings(
  people: PersonProfile[],
  dates: DateConversation[]
): Array<{
  personId: string;
  rankings: Array<{ personId: string; score: number; reason: string; synthetic?: boolean }>;
  unevaluatedCount: number;
}> {
  return people.map((person) => {
    const relevant = dates.filter(d => d.personA === person.id || d.personB === person.id);
    const rankings = relevant
      .map(d => {
        const otherId = d.personA === person.id ? d.personB : d.personA;
        return {
          personId: otherId,
          score: d.compatibilityScore,
          reason: d.compatibilityReason,
          synthetic: d.synthetic,
        };
      })
      .sort((a, b) => b.score - a.score);

    const evaluatedIds = new Set(relevant.map(d => d.personA === person.id ? d.personB : d.personA));
    const unevaluatedCount = people.filter(p => p.id !== person.id && !evaluatedIds.has(p.id)).length;

    return { personId: person.id, rankings, unevaluatedCount };
  });
}
