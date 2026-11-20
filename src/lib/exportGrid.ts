"use client";

import { type WeeklyPost, getImageSrc } from "@/lib/types";
import { WEEKS_PER_YEAR, weekLabel } from "@/lib/weeks";

function loadableSrc(src: string): string {
  try {
    const url = new URL(src);
    if (
      url.protocol === "https:" &&
      url.hostname.endsWith(".fly.storage.tigris.dev") &&
      url.pathname.startsWith("/posts/")
    ) {
      // Same-origin optimizer URL. The storage host does not send CORS headers, so a direct fetch taints the canvas.
      return `/_next/image?url=${encodeURIComponent(src)}&w=384&q=75`;
    }
  } catch {
    // Relative or data URL.
  }
  return src;
}

async function loadImage(src: string): Promise<HTMLImageElement> {
  const resolved = loadableSrc(src);
  return await new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("Could not load photo"));
    img.src = resolved;
  });
}

export async function exportProfileGridPng(opts: {
  handle: string;
  posts: WeeklyPost[];
  year?: number;
}) {
  const year = opts.year ?? new Date().getFullYear();
  
  // Landscape tiles (16:9 aspect ratio)
  const cols = 8;
  const rows = 7; // 52 weeks = 8*6 + 4 = need 7 rows
  const tileW = 160;
  const tileH = 90; // 16:9
  const gap = 6;
  const pad = 20;
  const headerH = 56;

  const width = pad * 2 + cols * tileW + (cols - 1) * gap;
  const height = pad * 2 + headerH + rows * tileH + (rows - 1) * gap;

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Missing canvas context");

  // Background
  ctx.fillStyle = "#fafafa";
  ctx.fillRect(0, 0, width, height);

  // Header
  ctx.fillStyle = "#18181b";
  ctx.font = "bold 24px system-ui, -apple-system, Segoe UI, Roboto";
  ctx.fillText(`@${opts.handle}`, pad, pad + 28);

  ctx.fillStyle = "#71717a";
  ctx.font = "500 12px system-ui, -apple-system, Segoe UI, Roboto";
  ctx.fillText(`${opts.posts.length} of 52 · ${year}`, pad, pad + 46);

  const byWeek = new Map<number, WeeklyPost>();
  for (const p of opts.posts) byWeek.set(p.week, p);

  for (let week = 1; week <= WEEKS_PER_YEAR; week++) {
    const idx = week - 1;
    const r = Math.floor(idx / cols);
    const c = idx % cols;
    const x = pad + c * (tileW + gap);
    const y = pad + headerH + r * (tileH + gap);

    // Tile background
    ctx.fillStyle = "#f4f4f5";
    ctx.fillRect(x, y, tileW, tileH);

    const post = byWeek.get(week);
    const imgSrc = post ? getImageSrc(post) : undefined;
    if (imgSrc) {
      try {
        const img = await loadImage(imgSrc);
        // Cover fill
        const scale = Math.max(tileW / img.width, tileH / img.height);
        const dw = img.width * scale;
        const dh = img.height * scale;
        const dx = x + (tileW - dw) / 2;
        const dy = y + (tileH - dh) / 2;
        
        // Clip to tile bounds
        ctx.save();
        ctx.beginPath();
        ctx.rect(x, y, tileW, tileH);
        ctx.clip();
        ctx.drawImage(img, dx, dy, dw, dh);
        ctx.restore();
      } catch {
        // fall through to week label
      }
    }

    // Border
    ctx.strokeStyle = "#d4d4d8";
    ctx.lineWidth = 1;
    ctx.strokeRect(x, y, tileW, tileH);

    // Week label for empty tiles
    if (!imgSrc) {
      ctx.fillStyle = "#a1a1aa";
      ctx.font = "600 12px system-ui, -apple-system, Segoe UI, Roboto";
      const label = weekLabel(week);
      const textW = ctx.measureText(label).width;
      ctx.fillText(label, x + (tileW - textW) / 2, y + tileH / 2 + 4);
    }
  }

  // Watermark
  ctx.fillStyle = "#a1a1aa";
  ctx.font = "500 10px system-ui, -apple-system, Segoe UI, Roboto";
  ctx.fillText("0/52", width - pad - 30, height - pad + 4);

  const blob: Blob = await new Promise((resolve, reject) => {
    canvas.toBlob((b) => (b ? resolve(b) : reject(new Error("toBlob failed"))), "image/png");
  });

  const file = new File([blob], `${opts.handle}-${year}.png`, {
    type: "image/png",
  });

  const canShare = "canShare" in navigator && typeof navigator.canShare === "function" && navigator.canShare({ files: [file] });
  if (navigator.share && canShare) {
    await navigator.share({
      title: `@${opts.handle} — ${year}`,
      files: [file],
    });
    return;
  }

  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = file.name;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
