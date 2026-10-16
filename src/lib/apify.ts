import { ApifyClient } from "apify-client";

const client = new ApifyClient({ token: process.env.APIFY_API_TOKEN });

export interface LinkedInProfile {
  name: string;
  headline: string;
  summary: string;
  experience: Array<{ title: string; company: string; description: string }>;
  education: Array<{ school: string; degree: string; field: string }>;
  skills: string[];
  location: string;
  profilePicture?: string;
}

export interface InstagramProfile {
  username: string;
  fullName: string;
  biography: string;
  followersCount: number;
  followingCount: number;
  postsCount: number;
  profilePicUrl?: string;
  posts: Array<{ caption: string; likesCount: number; commentsCount: number }>;
}

export async function scrapeLinkedIn(url: string): Promise<LinkedInProfile> {
  const run = await client.actor("2SyF0bVxmgGr8IVCZ").call({ profileUrls: [url] });
  const { items } = await client.dataset(run.defaultDatasetId).listItems();
  const raw = items[0] as Record<string, unknown>;

  const experience = ((raw.positions as Record<string, unknown>[] | undefined) ?? []).map(
    (p: Record<string, unknown>) => ({
      title: String(p.title ?? ""),
      company: String((p.companyName ?? p.company) ?? ""),
      description: String(p.description ?? ""),
    })
  );

  const education = ((raw.educations as Record<string, unknown>[] | undefined) ?? []).map(
    (e: Record<string, unknown>) => ({
      school: String((e.schoolName ?? e.school) ?? ""),
      degree: String(e.degreeName ?? ""),
      field: String((e.fieldOfStudy ?? e.field) ?? ""),
    })
  );

  return {
    name: String(raw.fullName ?? raw.name ?? ""),
    headline: String(raw.headline ?? ""),
    summary: String(raw.summary ?? ""),
    experience,
    education,
    skills: ((raw.skills as string[] | undefined) ?? []).map(String),
    location: String(raw.location ?? ""),
    profilePicture: String(raw.profilePicture ?? raw.photoUrl ?? ""),
  };
}

export async function scrapeInstagram(url: string): Promise<InstagramProfile> {
  const username = url.replace(/\/$/, "").split("/").pop() ?? "";
  const run = await client.actor("shu8hvrXbJbY3Eb9W").call({
    usernames: [username],
    resultsLimit: 12,
  });
  const { items } = await client.dataset(run.defaultDatasetId).listItems();
  const raw = items[0] as Record<string, unknown>;

  const posts = ((raw.latestPosts as Record<string, unknown>[] | undefined) ?? []).slice(0, 12).map(
    (p: Record<string, unknown>) => ({
      caption: String(p.caption ?? "").slice(0, 300),
      likesCount: Number(p.likesCount ?? 0),
      commentsCount: Number(p.commentsCount ?? 0),
    })
  );

  return {
    username: String(raw.username ?? username),
    fullName: String(raw.fullName ?? ""),
    biography: String(raw.biography ?? raw.bio ?? ""),
    followersCount: Number(raw.followersCount ?? 0),
    followingCount: Number(raw.followingCount ?? 0),
    postsCount: Number(raw.postsCount ?? 0),
    profilePicUrl: String(raw.profilePicUrl ?? raw.profilePicUrlHD ?? ""),
    posts,
  };
}
