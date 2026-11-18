"use client";

import type { WeeklyPost } from "@/lib/types";

const API_BASE = "/api";

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

// Check if we're in dev/localStorage mode
function isLocalMode(): boolean {
  return typeof window !== "undefined" && 
    (window.location.hostname === "localhost" || 
     process.env.NEXT_PUBLIC_LOCAL_MODE === "1");
}

// ============ API Functions ============

export async function fetchUserPosts(handle: string, year?: number): Promise<{ posts: WeeklyPost[]; years: number[] }> {
  if (isLocalMode()) {
    // Fallback to localStorage
    const { getUserPosts, getUserYears } = await import("./clientStore");
    return {
      posts: getUserPosts(handle, year),
      years: getUserYears(handle),
    };
  }

  const url = year
    ? `${API_BASE}/posts?handle=${handle}&year=${year}`
    : `${API_BASE}/posts?handle=${handle}`;
  
  const res = await fetch(url);
  if (!res.ok) throw new Error("Failed to fetch posts");
  return res.json();
}

export async function fetchGlobalFeed(): Promise<WeeklyPost[]> {
  if (isLocalMode()) {
    const { getGlobalFeed } = await import("./clientStore");
    return getGlobalFeed();
  }

  const res = await fetch(`${API_BASE}/feed`);
  if (!res.ok) throw new Error("Failed to fetch feed");
  const data = await res.json();
  return data.posts;
}

export async function uploadPost(input: {
  year: number;
  week: number;
  imageFile: File;
  caption?: string;
}): Promise<WeeklyPost> {
  if (isLocalMode()) {
    // Fallback to localStorage with data URL
    const { upsertWeeklyPost } = await import("./clientStore");
    const { fileToLandscapeDataUrl } = await import("./imageCrop");
    
    // We need the handle from somewhere - get from cookie
    const handle = document.cookie
      .split("; ")
      .find((c) => c.startsWith("oneper_user="))
      ?.split("=")[1];
    
    if (!handle) throw new Error("Not logged in");
    
    const decoded = JSON.parse(atob(handle)) as { handle: string };
    const dataUrl = await fileToLandscapeDataUrl(input.imageFile, 16 / 9);
    
    return upsertWeeklyPost({
      handle: decoded.handle,
      year: input.year,
      week: input.week,
      imageDataUrl: dataUrl,
      caption: input.caption,
    });
  }

  const formData = new FormData();
  formData.append("year", input.year.toString());
  formData.append("week", input.week.toString());
  formData.append("image", await imageForUpload(input.imageFile));
  if (input.caption) formData.append("caption", input.caption);

  const res = await fetch(`${API_BASE}/posts`, {
    method: "POST",
    body: formData,
  });

  if (!res.ok) {
    const error = await res.json().catch(() => ({ error: "Upload failed" }));
    throw new Error(error.error || "Upload failed");
  }

  const data = await res.json();
  return data.post;
}
