export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { ApifyClient } from "apify-client";

const client = new ApifyClient({ token: process.env.APIFY_API_TOKEN });

export async function GET(req: NextRequest) {
  const url = req.nextUrl.searchParams.get("url") ?? "";
  const type = req.nextUrl.searchParams.get("type") ?? "instagram";

  try {
    if (type === "instagram") {
      const username = url.replace(/\/$/, "").split("/").pop() ?? "";
      const run = await client.actor("shu8hvrXbJbY3Eb9W").call({
        usernames: [username],
        resultsLimit: 3,
      });
      const { items } = await client.dataset(run.defaultDatasetId).listItems();
      return NextResponse.json({ raw: items[0] ?? null, keys: items[0] ? Object.keys(items[0]) : [] });
    } else {
      const run = await client.actor("2SyF0bVxmgGr8IVCZ").call({ profileUrls: [url] });
      const { items } = await client.dataset(run.defaultDatasetId).listItems();
      return NextResponse.json({ raw: items[0] ?? null, keys: items[0] ? Object.keys(items[0]) : [], count: items.length });
    }
  } catch (err) {
    return NextResponse.json({ error: String(err) });
  }
}
