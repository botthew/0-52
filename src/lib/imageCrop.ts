"use client";

const OUT_W = 1600;
const JPEG_QUALITY = 0.9;

export async function fileToLandscapeBlob(file: File, aspect = 16 / 9): Promise<Blob> {
  const bitmap = await createImageBitmap(file);
  try {
    const srcW = bitmap.width;
    const srcH = bitmap.height;

    let cropW = srcW;
    let cropH = Math.round(cropW / aspect);
    if (cropH > srcH) {
      cropH = srcH;
      cropW = Math.round(cropH * aspect);
    }

    const sx = Math.round((srcW - cropW) / 2);
    const sy = Math.round((srcH - cropH) / 2);
    const outH = Math.round(OUT_W / aspect);

    const canvas = document.createElement("canvas");
    canvas.width = OUT_W;
    canvas.height = outH;
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("Missing canvas context");
    ctx.drawImage(bitmap, sx, sy, cropW, cropH, 0, 0, OUT_W, outH);

    const blob = await new Promise<Blob | null>((resolve) => {
      canvas.toBlob(resolve, "image/jpeg", JPEG_QUALITY);
    });
    if (!blob) throw new Error("Could not encode photo");
    return blob;
  } finally {
    bitmap.close?.();
  }
}

export async function fileToLandscapeDataUrl(file: File, aspect = 16 / 9) {
  const blob = await fileToLandscapeBlob(file, aspect);
  return await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(reader.error ?? new Error("Could not read photo"));
    reader.readAsDataURL(blob);
  });
}
