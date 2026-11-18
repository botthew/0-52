"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { WEEKS_PER_YEAR, weekLabel } from "@/lib/weeks";
import { activeWeekEt } from "@/lib/weekTime";
import { type WeeklyPost, getImageSrc } from "@/lib/types";
import { fetchUserPosts, uploadPost } from "@/lib/apiStore";
import { exportProfileGridPng } from "@/lib/exportGrid";
import { calculateStreak, calculateCompletion } from "@/lib/stats";
import PhotoLightbox from "@/components/PhotoLightbox";
import PhotoImage from "@/components/PhotoImage";

function Tile({
  week,
  post,
  editable,
  onPick,
  onView,
}: {
  week: number;
  post: WeeklyPost | null;
  editable: boolean;
  onPick: (week: number) => void;
  onView: (post: WeeklyPost) => void;
}) {
  const imgSrc = post ? getImageSrc(post) : undefined;
  
  const handleClick = () => {
    if (imgSrc) {
      // If there's an image, open lightbox (for anyone)
      onView(post!);
    } else if (editable) {
      // If empty and editable, open file picker
      onPick(week);
    }
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      className="group relative aspect-video w-full overflow-hidden rounded-md border border-zinc-300 bg-white text-left"
      title={imgSrc ? `View week ${weekLabel(week)}` : editable ? `Upload week ${weekLabel(week)}` : `Week ${weekLabel(week)}`}
    >
      {imgSrc ? (
        <PhotoImage
          src={imgSrc}
          alt={`Week ${weekLabel(week)}`}
          sizes="(max-width: 640px) 22vw, (max-width: 1024px) 16vw, 120px"
          className="transition-transform group-hover:scale-[1.02]"
        />
      ) : (
        <div className="flex h-full w-full items-center justify-center bg-zinc-100">
          <span className="text-xs font-semibold text-zinc-400">
            {weekLabel(week)}
          </span>
        </div>
      )}
      {editable && !imgSrc && (
        <div className="pointer-events-none absolute inset-0 hidden items-end justify-end p-1 group-hover:flex">
          <div className="rounded bg-black/70 px-1.5 py-0.5 text-[10px] text-white">
            Upload
          </div>
        </div>
      )}
    </button>
  );
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
  const currentYear = useMemo(() => new Date().getFullYear(), []);

  const [selectedYear, setSelectedYear] = useState<number>(currentYear);
  const [availableYears, setAvailableYears] = useState<number[]>([currentYear]);
  const [posts, setPosts] = useState<WeeklyPost[]>([]);
  const [busy, setBusy] = useState(false);
  const [pickWeek, setPickWeek] = useState<number | null>(null);
  const [lightboxPost, setLightboxPost] = useState<WeeklyPost | null>(null);
  const fileRef = useRef<HTMLInputElement | null>(null);

  const anyWeekMode =
    process.env.NEXT_PUBLIC_ANY_WEEK_PICK === "1" ||
    process.env.NEXT_PUBLIC_ANY_WEEK_PICK === "true";
  const activeWeek = useMemo(() => {
    const { week } = activeWeekEt({ graceMondayNoon: true });
    return Math.min(WEEKS_PER_YEAR, Math.max(1, week));
  }, []);

  // Load posts and available years
  useEffect(() => {
    const loadData = async () => {
      try {
        const { posts: fetchedPosts, years } = await fetchUserPosts(handle, selectedYear);
        // Always include current year
        if (!years.includes(currentYear)) {
          years.unshift(currentYear);
        }
        setAvailableYears(years.sort((a, b) => b - a));
        setPosts(fetchedPosts);
      } catch (e) {
        console.error("Failed to load posts:", e);
      }
    };
    loadData();
    // Also listen for storage events (for localStorage fallback)
    window.addEventListener("storage", () => loadData());
    return () => window.removeEventListener("storage", () => loadData());
  }, [handle, selectedYear, currentYear]);

  const byWeek = useMemo(() => {
    const map = new Map<number, WeeklyPost>();
    for (const p of posts) map.set(p.week, p);
    return map;
  }, [posts]);

  // Stats for current year only
  const { streak, completion } = useMemo(() => {
    if (selectedYear !== currentYear) {
      return { streak: 0, completion: calculateCompletion(posts.length) };
    }
    const weeks = posts.map((p) => p.week);
    return {
      streak: calculateStreak(weeks, activeWeek),
      completion: calculateCompletion(posts.length),
    };
  }, [posts, selectedYear, currentYear, activeWeek]);

  const tiles = useMemo(
    () => Array.from({ length: WEEKS_PER_YEAR }, (_, i) => i + 1),
    [],
  );

  const openPicker = (week: number) => {
    if (!anyWeekMode && week !== activeWeek) return;
    setPickWeek(week);
    // reset value so selecting same file again triggers change
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
      // Reload posts after upload
      const { posts: updatedPosts } = await fetchUserPosts(handle, selectedYear);
      setPosts(updatedPosts);
    } catch (e) {
      console.error("Upload failed:", e);
      alert("Upload failed. Please try again.");
    } finally {
      setBusy(false);
      setPickWeek(null);
    }
  };

  // Only allow editing on current year
  const isCurrentYear = selectedYear === currentYear;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-xl font-semibold">@{handle}</h1>
            {/* Year dropdown - only show if multiple years exist */}
            {availableYears.length > 1 && (
              <select
                value={selectedYear}
                onChange={(e) => setSelectedYear(Number(e.target.value))}
                className="rounded-md border border-zinc-300 bg-white px-2 py-1 text-sm font-medium text-zinc-900 hover:bg-zinc-50 focus:border-zinc-900 focus:outline-none focus:ring-1 focus:ring-zinc-900"
              >
                {availableYears.map((year) => (
                  <option key={year} value={year}>
                    {year}
                  </option>
                ))}
              </select>
            )}
          </div>
          <div className="mt-2 flex items-center gap-3">
            <div className="flex items-center gap-2" title="Photos uploaded this year">
              <div className="h-1.5 w-24 rounded-full bg-zinc-200 overflow-hidden">
                <div
                  className="h-full bg-zinc-900 rounded-full transition-all"
                  style={{ width: `${Math.min(100, (posts.length / 52) * 100)}%` }}
                />
              </div>
              <span className="text-xs text-zinc-500">{posts.length}/52</span>
            </div>
            {streak > 0 && selectedYear === currentYear && (
              <span title="Current weekly streak" className="flex items-center gap-1 text-xs text-zinc-500">
                <span className="text-amber-500">🔥</span> {streak} week{streak !== 1 ? 's' : ''}
              </span>
            )}
          </div>
          {!canEdit && viewerHandle && (
            <p className="mt-1 text-xs text-zinc-500">
              Viewing as @{viewerHandle}.
            </p>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => {
              const url = `${window.location.origin}/u/${handle}`;
              navigator.clipboard.writeText(url);
              alert("Link copied!");
            }}
            className="rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm font-medium text-zinc-900 hover:bg-zinc-100"
          >
            Share
          </button>
          <button
            type="button"
            onClick={() => exportProfileGridPng({ handle, posts, year: selectedYear })}
            className="rounded-lg border border-zinc-300 bg-white p-2 text-zinc-900 hover:bg-zinc-100"
            title="Download PNG"
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
          </button>
          {canEdit && isCurrentYear ? (
            <button
              type="button"
              onClick={() => openPicker(activeWeek)}
              className="rounded-lg bg-black px-3 py-2 text-sm text-white"
              disabled={busy}
            >
              {busy ? "Working…" : anyWeekMode ? "Upload (any week)" : `Upload week ${weekLabel(activeWeek)}`}
            </button>
          ) : canEdit && !isCurrentYear ? (
            <span className="text-xs text-zinc-500">Viewing {selectedYear}</span>
          ) : (
            <Link
              href={viewerHandle ? `/u/${viewerHandle}` : "/login"}
              className="rounded-lg bg-black px-3 py-2 text-sm text-white"
            >
              My profile
            </Link>
          )}
        </div>
      </div>

      {canEdit && (
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => onFile(e.target.files?.[0] ?? null)}
        />
      )}

      <div className="grid grid-cols-4 gap-1.5 sm:grid-cols-6 sm:gap-2 lg:grid-cols-8 lg:gap-2">
        {tiles.map((week) => (
          <Tile
            key={week}
            week={week}
            post={byWeek.get(week) ?? null}
            editable={canEdit && isCurrentYear && !busy && (anyWeekMode || week === activeWeek)}
            onPick={openPicker}
            onView={setLightboxPost}
          />
        ))}
      </div>

      {/* Photo lightbox */}
      {lightboxPost && (
        <PhotoLightbox
          post={lightboxPost}
          year={selectedYear}
          onClose={() => setLightboxPost(null)}
        />
      )}

      {canEdit && (
        <div className="rounded-xl border border-zinc-200 bg-white p-4 text-sm text-zinc-700">
          <div className="font-medium text-zinc-900">Upload rules</div>
          <div className="mt-1 space-y-1">
            <div>• Photos are center-cropped to 16:9 (landscape).</div>
            {anyWeekMode ? (
              <div>
                • <span className="font-medium text-zinc-900">Any-week mode is ON</span> (for testing grids). Click any week.
              </div>
            ) : (
              <>
                <div>
                  • This week's slot is <span className="font-medium text-zinc-900">{weekLabel(activeWeek)}</span>.
                </div>
                <div>
                  • You can swap your photo until <span className="font-medium text-zinc-900">Monday 12pm ET</span>. After that, it's saved forever.
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
