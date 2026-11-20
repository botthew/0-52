"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Download } from "lucide-react";
import { toast } from "sonner";
import { WEEKS_PER_YEAR, weekLabel } from "@/lib/weeks";
import { currentSlotEt } from "@/lib/weekTime";
import { type WeeklyPost, getImageSrc } from "@/lib/types";
import { fetchUserPosts, uploadPost } from "@/lib/apiStore";
import { exportProfileGridPng } from "@/lib/exportGrid";
import { calculateStreak } from "@/lib/stats";
import PhotoLightbox from "@/components/PhotoLightbox";
import PhotoImage from "@/components/PhotoImage";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { NativeSelect, NativeSelectOption } from "@/components/ui/native-select";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "cn";

function Tile({
  week,
  post,
  editable,
  current,
  onPick,
  onView,
}: {
  week: number;
  post: WeeklyPost | null;
  editable: boolean;
  current: boolean;
  onPick: (week: number) => void;
  onView: (post: WeeklyPost) => void;
}) {
  const imgSrc = post ? getImageSrc(post) : undefined;
  const label = weekLabel(week);

  const body = imgSrc ? (
    <PhotoImage
      src={imgSrc}
      alt={`Week ${label}`}
      sizes="(max-width: 640px) 22vw, (max-width: 1024px) 16vw, 120px"
    />
  ) : (
    <span className="flex h-full w-full items-center justify-center bg-muted text-xs font-medium text-muted-foreground">
      {label}
    </span>
  );

  const className = cn(
    "relative aspect-video w-full overflow-hidden rounded-md border bg-card",
    current ? "ring-2 ring-foreground ring-inset" : "border-border",
  );

  if (imgSrc && post) {
    return (
      <button type="button" onClick={() => onView(post)} className={className} aria-label={`View week ${label}`}>
        {body}
      </button>
    );
  }

  if (editable) {
    return (
      <button type="button" onClick={() => onPick(week)} className={className} aria-label={`Add a photo for week ${label}`}>
        {body}
      </button>
    );
  }

  return <div className={className}>{body}</div>;
}

export default function ProfileClient({
  handle,
  canEdit,
  viewerHandle,
}: {
  handle: string;
  canEdit: boolean;
  viewerHandle: string | null;
}) {
  const { year: currentYear, week: activeWeek } = currentSlotEt();
  const anyWeekMode =
    process.env.NEXT_PUBLIC_ANY_WEEK_PICK === "1" ||
    process.env.NEXT_PUBLIC_ANY_WEEK_PICK === "true";

  const [selectedYear, setSelectedYear] = useState<number>(currentYear);
  const [loaded, setLoaded] = useState<{
    handle: string;
    year: number;
    posts: WeeklyPost[];
    years: number[];
    error: boolean;
  } | null>(null);
  const [busy, setBusy] = useState(false);
  const [pickWeek, setPickWeek] = useState<number | null>(null);
  const [lightboxPost, setLightboxPost] = useState<WeeklyPost | null>(null);
  const fileRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetchUserPosts(handle, selectedYear)
      .then(({ posts: fetchedPosts, years }) => {
        if (cancelled) return;
        const nextYears = years.includes(currentYear) ? years : [currentYear, ...years];
        setLoaded({
          handle,
          year: selectedYear,
          posts: fetchedPosts,
          years: nextYears.sort((a, b) => b - a),
          error: false,
        });
      })
      .catch((error) => {
        console.error("Failed to load posts:", error);
        if (!cancelled) {
          setLoaded({ handle, year: selectedYear, posts: [], years: [currentYear], error: true });
        }
      });
    return () => {
      cancelled = true;
    };
  }, [handle, selectedYear, currentYear]);

  const status: "loading" | "ready" | "error" =
    !loaded || loaded.handle !== handle || loaded.year !== selectedYear
      ? "loading"
      : loaded.error
        ? "error"
        : "ready";
  const posts = status === "ready" && loaded ? loaded.posts : [];
  const availableYears = loaded && loaded.handle === handle && loaded.years.length > 0 ? loaded.years : [currentYear];

  const byWeek = new Map<number, WeeklyPost>();
  for (const post of posts) byWeek.set(post.week, post);

  const streak =
    selectedYear === currentYear
      ? calculateStreak(
          posts.map((post) => post.week),
          activeWeek,
        )
      : 0;

  const tiles = Array.from({ length: WEEKS_PER_YEAR }, (_, i) => i + 1);
  const isCurrentYear = selectedYear === currentYear;
  const filled = status === "ready" ? posts.length : 0;

  const openPicker = (week: number) => {
    if (!anyWeekMode && week !== activeWeek) return;
    setPickWeek(week);
    if (fileRef.current) fileRef.current.value = "";
    fileRef.current?.click();
  };

  const onFile = async (file: File | null) => {
    if (!file || pickWeek == null) return;
    setBusy(true);
    try {
      await uploadPost({
        year: selectedYear,
        week: pickWeek,
        imageFile: file,
      });
      const { posts: updatedPosts, years } = await fetchUserPosts(handle, selectedYear);
      const nextYears = years.includes(currentYear) ? years : [currentYear, ...years];
      setLoaded({
        handle,
        year: selectedYear,
        posts: updatedPosts,
        years: nextYears.sort((a, b) => b - a),
        error: false,
      });
      toast.success("Photo saved.");
    } catch (error) {
      console.error("Upload failed:", error);
      toast.error(error instanceof Error ? error.message : "The photo could not be saved.");
    } finally {
      setBusy(false);
      setPickWeek(null);
    }
  };

  const share = async () => {
    const url = `${window.location.origin}/u/${handle}`;
    try {
      await navigator.clipboard.writeText(url);
      toast.success("Link copied.");
    } catch {
      toast.error("The link could not be copied. Copy the address from the browser instead.");
    }
  };

  const download = async () => {
    try {
      await exportProfileGridPng({ handle, posts, year: selectedYear });
    } catch (error) {
      if (error instanceof DOMException && error.name === "AbortError") return;
      console.error("Export failed:", error);
      toast.error("The grid could not be downloaded. Try again in a moment.");
    }
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-4">
        <div className="flex flex-wrap items-center gap-3">
          <h1 className="text-xl font-semibold">@{handle}</h1>
          {availableYears.length > 1 && (
            <NativeSelect
              value={selectedYear}
              aria-label="Year"
              onChange={(event) => setSelectedYear(Number(event.target.value))}
            >
              {availableYears.map((year) => (
                <NativeSelectOption key={year} value={year}>
                  {year}
                </NativeSelectOption>
              ))}
            </NativeSelect>
          )}
        </div>

        <div className="flex flex-col gap-2">
          <Progress
            className="max-w-xs"
            value={status === "ready" ? (filled / 52) * 100 : 0}
            aria-label={`${filled} of 52 weeks`}
          />
          <p className="text-sm text-muted-foreground">
            {status === "ready" ? `${filled} of 52 weeks` : "Loading this year."}
            {streak > 0 ? ` · ${streak} ${streak === 1 ? "week" : "weeks"} in a row` : ""}
          </p>
        </div>

        {!canEdit && viewerHandle && (
          <p className="text-sm text-muted-foreground">You are viewing this grid as @{viewerHandle}.</p>
        )}

        <div className="flex flex-wrap items-center gap-2">
          <Button type="button" variant="outline" onClick={share}>
            Share
          </Button>
          <Button type="button" variant="outline" onClick={download} disabled={status !== "ready"}>
            <Download data-icon="inline-start" />
            Download
          </Button>
          {canEdit && isCurrentYear ? (
            <Button type="button" onClick={() => openPicker(activeWeek)} disabled={busy || status !== "ready"}>
              {busy
                ? "Saving the photo…"
                : anyWeekMode
                  ? "Upload any week"
                  : `Upload week ${weekLabel(activeWeek)}`}
            </Button>
          ) : canEdit && !isCurrentYear ? (
            <p className="text-sm text-muted-foreground">This is {selectedYear}, so the photos stay as they are.</p>
          ) : (
            <Button nativeButton={false} render={<Link href={viewerHandle ? `/u/${viewerHandle}` : "/login"} />}>
              My profile
            </Button>
          )}
        </div>
      </div>

      {canEdit && isCurrentYear && (
        <p className="text-sm text-muted-foreground">
          {anyWeekMode
            ? "Any week can take a photo right now. This is only for trying the grid."
            : `Photos are center-cropped to a wide frame. This week is ${weekLabel(activeWeek)}, and you can replace the photo until Monday at noon Eastern time.`}
        </p>
      )}

      {canEdit && (
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(event) => onFile(event.target.files?.[0] ?? null)}
        />
      )}

      {status === "error" ? (
        <Alert variant="destructive">
          <AlertTitle>This profile did not load.</AlertTitle>
          <AlertDescription>Check your connection, then refresh the page.</AlertDescription>
        </Alert>
      ) : status === "loading" ? (
        <div className="grid grid-cols-4 gap-1.5 sm:grid-cols-6 sm:gap-2 lg:grid-cols-8">
          {tiles.map((week) => (
            <Skeleton key={week} className="aspect-video w-full" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-4 gap-1.5 sm:grid-cols-6 sm:gap-2 lg:grid-cols-8">
          {tiles.map((week) => (
            <Tile
              key={week}
              week={week}
              post={byWeek.get(week) ?? null}
              editable={canEdit && isCurrentYear && !busy && (anyWeekMode || week === activeWeek)}
              current={isCurrentYear && week === activeWeek}
              onPick={openPicker}
              onView={setLightboxPost}
            />
          ))}
        </div>
      )}

      {lightboxPost && (
        <PhotoLightbox post={lightboxPost} year={selectedYear} onClose={() => setLightboxPost(null)} />
      )}
    </div>
  );
}
