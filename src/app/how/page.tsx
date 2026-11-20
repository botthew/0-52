import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "How it works — 0/52",
  description: "One photo each week, from Monday through Sunday, kept as a single grid for the year.",
};

export default function HowPage() {
  return (
    <article className="mx-auto flex max-w-xl flex-col gap-5 text-sm leading-relaxed">
      <h1 className="text-2xl font-semibold tracking-tight">How it works</h1>
      <p>
        0/52 is a photo journal. You keep one photo for each week of the year, and that is the whole product.
      </p>
      <p>
        A week runs from Monday through Sunday, Eastern time. You can replace that week&apos;s photo until Monday at noon. After noon, the week stays as it is.
      </p>
      <p>
        Every photo is center-cropped to a wide 16:9 frame, so the year lines up as one grid.
      </p>
      <p>
        Your profile is those 52 weeks. You can copy a link to it, or download the grid as an image.
      </p>
    </article>
  );
}
