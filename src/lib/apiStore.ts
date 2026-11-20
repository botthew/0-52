"use client";

import type { WeeklyPost } from "@/lib/types";

async function imageForUpload(file: File): Promise<File> {
  try {
    const { fileToLandscapeBlob } = await import("./imageCrop");
    const blob = await fileToLandscapeBlob(file);
    return new File([blob], "week.jpg", { type: "image/jpeg" });
  } catch (error) {
    console.error("Could not resize photo, uploading the original", error);
    return file;
  }
}

async function readError(res: Response, fallback: string): Promise<string> {
  const error = await res.json().catch(() => ({ error: fallback }));
  return typeof error.error === "string" ? error.error : fallback;
}

export async function fetchUserPosts(
  handle: string,
  year?: number,
): Promise<{ posts: WeeklyPost[]; years: number[] }> {
  const url = year
    ? `/api/posts?handle=${encodeURIComponent(handle)}&year=${year}`
    : `/api/posts?handle=${encodeURIComponent(handle)}`;

  const res = await fetch(url);
  if (!res.ok) throw new Error(await readError(res, "Could not load this profile."));
  return res.json();
}

export async function fetchGlobalFeed(): Promise<WeeklyPost[]> {
  const res = await fetch("/api/feed");
  if (!res.ok) throw new Error(await readError(res, "Could not load the feed."));
  const data = await res.json();
  return data.posts;
}

export async function uploadPost(input: {
  year: number;
  week: number;
  imageFile: File;
  caption?: string;
}): Promise<WeeklyPost> {
  const formData = new FormData();
  formData.append("year", input.year.toString());
  formData.append("week", input.week.toString());
  formData.append("image", await imageForUpload(input.imageFile));
  if (input.caption) formData.append("caption", input.caption);

  const res = await fetch("/api/posts", {
    method: "POST",
    body: formData,
  });

  if (!res.ok) {
    throw new Error(await readError(res, "The photo could not be saved."));
  }

  const data = await res.json();
  return data.post;
}
