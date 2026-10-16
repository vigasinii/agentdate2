import { NextRequest, NextResponse } from "next/server";
import { scrapeLinkedIn, scrapeInstagram } from "@/lib/apify";
import { analyzeProfile } from "@/lib/groq";
import { addPerson, getPeople } from "@/lib/store";
import { randomUUID } from "crypto";

export async function POST(req: NextRequest) {
  try {
    const { linkedinUrl, instagramUrl } = await req.json();
    if (!linkedinUrl || !instagramUrl) {
      return NextResponse.json({ error: "Both LinkedIn and Instagram URLs required" }, { status: 400 });
    }

    const [linkedin, instagram] = await Promise.all([
      scrapeLinkedIn(linkedinUrl),
      scrapeInstagram(instagramUrl),
    ]);

    const analysis = await analyzeProfile(linkedin, instagram);

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
