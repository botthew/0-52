"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { fetchGlobalFeed } from "@/lib/apiStore";
import { type WeeklyPost, getImageSrc } from "@/lib/types";
import { weekLabel } from "@/lib/weeks";
import PhotoImage from "@/components/PhotoImage";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardFooter } from "@/components/ui/card";
import { Empty, EmptyDescription, EmptyHeader, EmptyTitle } from "@/components/ui/empty";
import { Skeleton } from "@/components/ui/skeleton";

function formatUpdated(iso: string) {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

function CardView({ post, priority = false }: { post: WeeklyPost; priority?: boolean }) {
  const imgSrc = getImageSrc(post);

  return (
    <Card className="gap-0 py-0">
      <Link href={`/u/${post.handle}`} className="relative block aspect-video bg-muted">
        {imgSrc && (
          <PhotoImage
            src={imgSrc}
            alt={`@${post.handle}, week ${post.week}`}
            sizes="(max-width: 640px) 100vw, 480px"
            priority={priority}
          />
        )}
      </Link>
      <CardFooter className="items-start justify-between gap-3">
        <div className="flex min-w-0 flex-col gap-0.5">
          <Link className="font-medium underline-offset-4 hover:underline" href={`/u/${post.handle}`}>
            @{post.handle}
          </Link>
          <p className="text-muted-foreground">
            Week {weekLabel(post.week)}
            {typeof post.userProgress === "number" ? ` · ${post.userProgress} of 52` : ""}
          </p>
        </div>
        <time className="shrink-0 text-muted-foreground" dateTime={post.updatedAt}>
          {formatUpdated(post.updatedAt)}
        </time>
      </CardFooter>
    </Card>
  );
}

export default function FeedClient() {
  const [posts, setPosts] = useState<WeeklyPost[]>([]);
  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading");

  const loadFeed = useCallback(async () => {
    setStatus("loading");
    try {
      setPosts(await fetchGlobalFeed());
      setStatus("ready");
    } catch (error) {
      console.error("Failed to load feed:", error);
      setStatus("error");
    }
  }, []);

  useEffect(() => {
    let cancelled = false;
    fetchGlobalFeed()
      .then((feedPosts) => {
        if (cancelled) return;
        setPosts(feedPosts);
        setStatus("ready");
      })
      .catch((error) => {
        console.error("Failed to load feed:", error);
        if (!cancelled) setStatus("error");
      });
    return () => {
      cancelled = true;
    };
  }, []);

  if (status === "loading") {
    return (
      <div className="grid gap-4 sm:grid-cols-2">
        <Skeleton className="aspect-video w-full" />
        <Skeleton className="aspect-video w-full" />
      </div>
    );
  }

  if (status === "error") {
    return (
      <Alert variant="destructive">
        <AlertTitle>The feed did not load.</AlertTitle>
        <AlertDescription>Check your connection, then try again.</AlertDescription>
        <div className="col-span-full pt-2">
          <Button type="button" variant="outline" size="sm" onClick={loadFeed}>
            Try again
          </Button>
        </div>
      </Alert>
    );
  }

  if (posts.length === 0) {
    return (
      <Empty>
        <EmptyHeader>
          <EmptyTitle>No photos yet</EmptyTitle>
          <EmptyDescription>When someone saves a week, it shows up here.</EmptyDescription>
        </EmptyHeader>
      </Empty>
    );
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2">
      {posts.map((post, index) => (
        <CardView key={post.id} post={post} priority={index === 0} />
      ))}
    </div>
  );
}
