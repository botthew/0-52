"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { fetchGlobalFeed } from "@/lib/apiStore";
import { type WeeklyPost, getImageSrc } from "@/lib/types";
import PhotoImage from "@/components/PhotoImage";

function ProgressBar({ count, total = 52 }: { count: number; total?: number }) {
  const pct = Math.min(100, (count / total) * 100);
  return (
    <div className="flex items-center gap-1.5">
      <div className="h-1 w-12 rounded-full bg-zinc-200 overflow-hidden">
        <div
          className="h-full bg-zinc-900 rounded-full transition-all"
          style={{ width: `${pct}%` }}
        />
      </div>
      <span className="text-[10px] text-zinc-400">{count}/52</span>
    </div>
  );
}

function Card({ post, priority = false }: { post: WeeklyPost; priority?: boolean }) {
  const imgSrc = getImageSrc(post);

  return (
    <article className="overflow-hidden rounded-xl border border-zinc-200 bg-white">
      <div className="relative aspect-video w-full bg-zinc-100">
        {imgSrc && (
          <PhotoImage
            src={imgSrc}
            alt={`@${post.handle} week ${post.week}`}
            sizes="(max-width: 640px) 100vw, 480px"
            priority={priority}
          />
        )}
      </div>
      <div className="flex items-center justify-between px-4 py-3">
        <div className="flex items-center gap-3 text-sm">
          <Link className="font-medium hover:underline" href={`/u/${post.handle}`}>
            @{post.handle}
          </Link>
          <ProgressBar count={post.userProgress ?? 0} />
        </div>
        <time className="text-xs text-zinc-400">
          {new Date(post.updatedAt).toLocaleDateString()}
        </time>
      </div>
    </article>
  );
}

export default function FeedClient() {
  const [posts, setPosts] = useState<WeeklyPost[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadFeed = async () => {
      try {
        const feedPosts = await fetchGlobalFeed();
        setPosts(feedPosts);
      } catch (e) {
        console.error("Failed to load feed:", e);
      } finally {
        setLoading(false);
      }
    };
    loadFeed();
  }, []);

  if (loading) {
    return (
      <div className="text-sm text-zinc-500">Loading...</div>
    );
  }

  if (posts.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-zinc-300 bg-white p-6 text-sm text-zinc-600">
        No posts yet. Go to your profile and upload a week.
      </div>
    );
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2">
      {posts.map((p, index) => (
        <Card key={p.id} post={p} priority={index === 0} />
      ))}
    </div>
  );
}
