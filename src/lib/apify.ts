export interface LinkedInProfile {
  name: string;
  headline: string;
  summary: string;
  experience: Array<{ title: string; company: string; description: string }>;
  education: Array<{ school: string; degree: string; field: string }>;
  skills: string[];
  location: string;
  profilePicture: string;
}

export interface InstagramProfile {
  username: string;
  fullName: string;
  biography: string;
  followersCount: number;
  followingCount: number;
  postsCount: number;
  profilePicUrl: string;
  posts: Array<{ caption: string; likesCount: number; commentsCount: number }>;
}

async function fetchWithTimeout(url: string, timeoutMs = 8000): Promise<Response> {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, {
      signal: controller.signal,
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        "Accept-Language": "en-US,en;q=0.5",
      },
    });
  } finally {
    clearTimeout(id);
  }
}

function extractMeta(html: string, property: string): string {
  const patterns = [
    new RegExp(`<meta[^>]+property=["']${property}["'][^>]+content=["']([^"']+)["']`, "i"),
    new RegExp(`<meta[^>]+content=["']([^"']+)["'][^>]+property=["']${property}["']`, "i"),
    new RegExp(`<meta[^>]+name=["']${property}["'][^>]+content=["']([^"']+)["']`, "i"),
  ];
  for (const re of patterns) {
    const m = html.match(re);
    if (m?.[1]) return m[1].trim();
  }
  return "";
}

export async function scrapeInstagram(url: string): Promise<InstagramProfile> {
  const username = url.replace(/\/$/, "").split("/").pop() ?? "";

  try {
    const res = await fetchWithTimeout(`https://www.instagram.com/${username}/`);
    const html = await res.text();

    // Extract from Open Graph / meta tags
    const fullName = extractMeta(html, "og:title").replace(/\s*\(@[^)]+\)\s*/, "").replace(/\s*•.*$/, "").trim();
    const description = extractMeta(html, "og:description");

    // Parse description: "X Followers, Y Following, Z Posts - See Instagram photos..."
    const followersMatch = description.match(/([\d,.]+[KkMm]?)\s+Followers/i);
    const followingMatch = description.match(/([\d,.]+[KkMm]?)\s+Following/i);
    const postsMatch = description.match(/([\d,.]+[KkMm]?)\s+Posts/i);
    const bioMatch = description.match(/- ([^-].+)$/);

    function parseNum(s?: string): number {
      if (!s) return 0;
      const n = s.replace(/,/g, "");
      if (n.endsWith("M") || n.endsWith("m")) return parseFloat(n) * 1_000_000;
      if (n.endsWith("K") || n.endsWith("k")) return parseFloat(n) * 1_000;
      return parseInt(n) || 0;
    }

    return {
      username,
      fullName: fullName || username,
      biography: bioMatch?.[1]?.trim() ?? description.slice(0, 200),
      followersCount: parseNum(followersMatch?.[1]),
      followingCount: parseNum(followingMatch?.[1]),
      postsCount: parseNum(postsMatch?.[1]),
      profilePicUrl: extractMeta(html, "og:image"),
      posts: [],
    };
  } catch {
    // Minimal fallback with username only
    return {
      username,
      fullName: username,
      biography: "",
      followersCount: 0,
      followingCount: 0,
      postsCount: 0,
      profilePicUrl: "",
      posts: [],
    };
  }
}

export async function scrapeLinkedIn(url: string): Promise<LinkedInProfile> {
  try {
    const res = await fetchWithTimeout(url);
    const html = await res.text();

    const title = extractMeta(html, "og:title") || extractMeta(html, "title");
    const description = extractMeta(html, "og:description") || extractMeta(html, "description");

    // LinkedIn og:title is usually "Name - Title at Company | LinkedIn"
    const namePart = title.replace(/\s*\|.*$/, "").replace(/\s*-\s*LinkedIn$/, "").trim();
    const nameMatch = namePart.match(/^([^-|]+?)(?:\s+-\s+(.+))?$/);
    const name = nameMatch?.[1]?.trim() ?? namePart;
    const headline = nameMatch?.[2]?.trim() ?? description.slice(0, 120);

    return {
      name,
      headline,
      summary: description.slice(0, 500),
      experience: [],
      education: [],
      skills: [],
      location: "",
      profilePicture: extractMeta(html, "og:image"),
    };
  } catch {
    const slug = url.replace(/\/$/, "").split("/").pop() ?? "";
    const name = slug.replace(/-/g, " ").replace(/\b\w/g, c => c.toUpperCase());
    return {
      name,
      headline: "",
      summary: "",
      experience: [],
      education: [],
      skills: [],
      location: "",
      profilePicture: "",
    };
  }
}
