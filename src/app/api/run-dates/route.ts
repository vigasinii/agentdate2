export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import { runDate, computeRankings } from "@/lib/groq";
import { getPeople, getDates, addDate } from "@/lib/store";

export async function POST() {
  const people = getPeople();
  if (people.length < 2) {
    return NextResponse.json({ error: "Need at least 2 people" }, { status: 400 });
  }

  const results = [];

  // Run dates between all pairs
  for (let i = 0; i < people.length; i++) {
    for (let j = i + 1; j < people.length; j++) {
      try {
        const date = await runDate(people[i], people[j]);
        addDate(date);
        results.push(date);
      } catch (err) {
        console.error(`Failed date between ${people[i].name} and ${people[j].name}:`, err);
      }
    }
  }

  const rankings = computeRankings(people, getDates());
  return NextResponse.json({ dates: results, rankings });
}

export async function GET() {
  const people = getPeople();
  const dates = getDates();
  const rankings = computeRankings(people, dates);
  return NextResponse.json({ dates, rankings });
}
