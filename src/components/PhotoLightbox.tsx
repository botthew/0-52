"use client";

import { useEffect, useRef, useCallback } from "react";
import { weekLabel, getWeekDateRange, formatDateRange } from "@/lib/weeks";
import { type WeeklyPost, getImageSrc } from "@/lib/types";
import PhotoImage from "@/components/PhotoImage";

interface PhotoLightboxProps {
  post: WeeklyPost;
  year: number;
  onClose: () => void;
}

export default function PhotoLightbox({ post, year, onClose }: PhotoLightboxProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  const { start, end } = getWeekDateRange(year, post.week);
  const dateRange = formatDateRange(start, end);
  const imageSrc = getImageSrc(post);

  // Request fullscreen on mount (mobile landscape)
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const tryFullscreen = async () => {
      try {
        if (el.requestFullscreen) {
          await el.requestFullscreen();
        } else if ((el as any).webkitRequestFullscreen) {
          await (el as any).webkitRequestFullscreen();
        }
        // Try to lock to landscape (non-standard API, cast to any)
        const orientation = screen.orientation as any;
        if (orientation?.lock) {
          try {
            await orientation.lock("landscape");
          } catch {
            // Orientation lock not supported or denied
          }
        }
      } catch {
        // Fullscreen not supported or denied
      }
    };

    // Only try fullscreen on touch devices
    if ("ontouchstart" in window) {
      tryFullscreen();
    }

    return () => {
      if (document.fullscreenElement) {
        document.exitFullscreen().catch(() => {});
      }
      const orientation = screen.orientation as any;
      if (orientation?.unlock) {
        orientation.unlock();
      }
    };
  }, []);

  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, []);

  // Close on escape
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [onClose]);

  // Close on fullscreen exit
  useEffect(() => {
    const handleFullscreenChange = () => {
      if (!document.fullscreenElement) {
        // User exited fullscreen via browser UI
      }
    };
    document.addEventListener("fullscreenchange", handleFullscreenChange);
    return () => document.removeEventListener("fullscreenchange", handleFullscreenChange);
  }, [onClose]);

  const handleBackdropClick = useCallback(
    (e: React.MouseEvent) => {
      if (e.target === e.currentTarget) onClose();
    },
    [onClose]
  );

  return (
    <div
      ref={containerRef}
      className="fixed inset-0 z-50 flex h-dvh w-full flex-col bg-zinc-950 px-4 pb-6 pt-14"
      onClick={handleBackdropClick}
    >
      {/* Close button */}
      <button
        onClick={onClose}
        className="absolute right-4 top-4 z-10 rounded-full bg-white/10 p-2.5 text-white backdrop-blur hover:bg-white/20"
        aria-label="Close"
      >
        <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>

      <div className="relative min-h-0 w-full flex-1">
        {imageSrc && (
          <PhotoImage
            src={imageSrc}
            alt={`Week ${weekLabel(post.week)}`}
            sizes="100vw"
            fit="contain"
          />
        )}
      </div>

      <div className="shrink-0 pt-4 text-center">
        <div className="text-lg font-semibold text-white">
          Week {weekLabel(post.week)}
        </div>
        <div className="mt-1 text-sm text-white/70">{dateRange}</div>
        {post.caption && (
          <div className="mt-1 text-sm text-white/50">{post.caption}</div>
        )}
      </div>
    </div>
  );
}
