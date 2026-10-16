export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { getPeople } from "@/lib/store";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const people = getPeople();
  const person = people.find((p) => p.id === id);
  if (!person) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(person);
}
