import Image from "next/image";

function canOptimize(src: string) {
  try {
    const url = new URL(src);
    return (
      url.protocol === "https:" &&
      url.hostname.endsWith(".fly.storage.tigris.dev") &&
      url.pathname.startsWith("/posts/")
    );
  } catch {
    return false;
  }
}

export default function PhotoImage({
  src,
  alt,
  sizes,
  priority = false,
  fit = "cover",
  className = "",
}: {
  src: string;
  alt: string;
  sizes: string;
  priority?: boolean;
  fit?: "cover" | "contain";
  className?: string;
}) {
  const fitClass = fit === "cover" ? "object-cover" : "object-contain";

  if (!canOptimize(src)) {
    return (
      // Local previews are data URLs, which the image optimizer cannot fetch.
      // eslint-disable-next-line @next/next/no-img-element
      <img src={src} alt={alt} className={`h-full w-full ${fitClass} ${className}`} />
    );
  }

  return (
    <Image
      src={src}
      alt={alt}
      fill
      sizes={sizes}
      priority={priority}
      className={`${fitClass} ${className}`}
    />
  );
}
