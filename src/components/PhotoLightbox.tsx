"use client";

import { weekLabel, getWeekDateRange, formatDateRange } from "@/lib/weeks";
import { type WeeklyPost, getImageSrc } from "@/lib/types";
import PhotoImage from "@/components/PhotoImage";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface PhotoLightboxProps {
  post: WeeklyPost;
  year: number;
  onClose: () => void;
}

export default function PhotoLightbox({ post, year, onClose }: PhotoLightboxProps) {
  const { start, end } = getWeekDateRange(year, post.week);
  const dateRange = formatDateRange(start, end);
  const imageSrc = getImageSrc(post);

  return (
    <Dialog
      open
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
    >
      <DialogContent className="sm:max-w-xl">
        <DialogHeader className="pr-8">
          <DialogTitle>Week {weekLabel(post.week)}</DialogTitle>
          <DialogDescription>{dateRange}</DialogDescription>
        </DialogHeader>
        <div className="relative aspect-video w-full overflow-hidden rounded-lg bg-muted">
          {imageSrc && (
            <PhotoImage src={imageSrc} alt={`Week ${weekLabel(post.week)}`} sizes="100vw" fit="contain" />
          )}
        </div>
        {post.caption ? <p className="text-sm text-muted-foreground">{post.caption}</p> : null}
      </DialogContent>
    </Dialog>
  );
}
