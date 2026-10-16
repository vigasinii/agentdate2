export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { scrapeLinkedIn, scrapeInstagram } from "@/lib/apify";
import { analyzeProfile } from "@/lib/groq";
import { addPerson, getPeople } from "@/lib/store";
import { randomUUID } from "crypto";

function isValidLinkedInUrl(url: string): boolean {
  try {
    const u = new URL(url);
    return u.hostname.includes("linkedin.com") && u.pathname.includes("/in/");
  } catch { return false; }
}

function isValidInstagramUrl(url: string): boolean {
  try {
    const u = new URL(url);
    return u.hostname.includes("instagram.com");
  } catch { return false; }
}

/** Rough name similarity: >50% token overlap => plausible same person */
function namesConsistent(a: string, b: string): boolean {
  if (!a || !b) return true; // can't check, don't block
  const tokenize = (s: string) =>
    s.toLowerCase().replace(/[^a-z\s]/g, "").split(/\s+/).filter(Boolean);
  const ta = new Set(tokenize(a));
  const tb = tokenize(b);
  const overlap = tb.filter(t => ta.has(t)).length;
  return overlap > 0;
}

export async function POST(req: NextRequest) {
  try {
    const { linkedinUrl, instagramUrl } = await req.json();

    if (!linkedinUrl || !instagramUrl) {
      return NextResponse.json({ error: "Both LinkedIn and Instagram URLs required" }, { status: 400 });
    }

    if (!isValidLinkedInUrl(linkedinUrl)) {
      return NextResponse.json({ error: "Invalid LinkedIn URL — must be a linkedin.com/in/ profile link" }, { status: 400 });
    }

    if (!isValidInstagramUrl(instagramUrl)) {
      return NextResponse.json({ error: "Invalid Instagram URL — must be an instagram.com profile link" }, { status: 400 });
    }

    const [linkedin, instagram] = await Promise.all([
      scrapeLinkedIn(linkedinUrl),
      scrapeInstagram(instagramUrl),
    ]);

    const identityWarning = !namesConsistent(linkedin.name, instagram.fullName)
      ? `Name mismatch: LinkedIn shows "${linkedin.name}" but Instagram shows "${instagram.fullName}". Please verify these profiles belong to the same person.`
      : undefined;

    const analysis = await analyzeProfile(linkedin, instagram);

    if (identityWarning && analysis.dataQuality) {
      analysis.dataQuality.warnings = [
        ...(analysis.dataQuality.warnings ?? []),
        identityWarning,
      ];
    }

    const person = {
      id: randomUUID(),
      name: linkedin.name || instagram.fullName,
      linkedinUrl,
      instagramUrl,
      profilePicture: linkedin.profilePicture || instagram.profilePicUrl,
      analysis,
      rawLinkedIn: linkedin,
      rawInstagram: instagram,
    };

    addPerson(person);
    return NextResponse.json(person);
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json(getPeople());
}
