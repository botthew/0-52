import { NextResponse } from "next/server";
import { getServerUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { uploadImage, deleteImage, generateImageKey } from "@/lib/tigris";
import { currentSlotEt } from "@/lib/weekTime";

const MAX_IMAGE_BYTES = 8 * 1024 * 1024;
const ALLOWED_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
  "image/heic",
  "image/heif",
]);

// GET /api/posts - Get posts for a user
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const handle = searchParams.get("handle");
  const year = searchParams.get("year");

  if (!handle) {
    return NextResponse.json({ error: "Missing handle" }, { status: 400 });
  }

  let yearNumber: number | undefined;
  if (year) {
    yearNumber = Number.parseInt(year, 10);
    if (!Number.isInteger(yearNumber) || yearNumber < 2000 || yearNumber > 2100) {
      return NextResponse.json({ error: "That year is not valid." }, { status: 400 });
    }
  }

  const user = await prisma.user.findUnique({
    where: { handle },
    include: {
      posts: yearNumber
        ? { where: { year: yearNumber }, orderBy: { week: "asc" } }
        : { orderBy: [{ year: "desc" }, { week: "asc" }] },
    },
  });

  if (!user) {
    return NextResponse.json({ posts: [], years: [] });
  }

  // Get all years with posts
  const yearsResult = await prisma.weeklyPost.groupBy({
    by: ["year"],
    where: { userId: user.id },
    orderBy: { year: "desc" },
  });
  const years = yearsResult.map((y) => y.year);

  return NextResponse.json({
    posts: user.posts.map((p) => ({
      id: p.id,
      handle: user.handle,
      year: p.year,
      week: p.week,
      imageUrl: p.imageUrl,
      caption: p.caption,
      createdAt: p.createdAt.toISOString(),
      updatedAt: p.updatedAt.toISOString(),
    })),
    years,
  });
}

// POST /api/posts - Create or update a post
export async function POST(req: Request) {
  const user = await getServerUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const formData = await req.formData();
  const yearStr = formData.get("year") as string;
  const weekStr = formData.get("week") as string;
  const imageFile = formData.get("image") as File | null;
  const caption = formData.get("caption") as string | null;

  const year = Number.parseInt(yearStr, 10);
  const week = Number.parseInt(weekStr, 10);

  if (!Number.isInteger(year) || year < 2000 || year > 2100 || !Number.isInteger(week) || week < 1 || week > 52) {
    return NextResponse.json({ error: "That year or week is not valid." }, { status: 400 });
  }

  if (!(imageFile instanceof File)) {
    return NextResponse.json({ error: "Choose a photo to upload." }, { status: 400 });
  }

  if (imageFile.type && !ALLOWED_TYPES.has(imageFile.type)) {
    return NextResponse.json({ error: "Use a JPEG, PNG, or WebP photo." }, { status: 400 });
  }

  if (imageFile.size > MAX_IMAGE_BYTES) {
    return NextResponse.json({ error: "That photo is larger than 8 MB." }, { status: 400 });
  }

  const anyWeek =
    process.env.ANY_WEEK_PICK === "1" ||
    process.env.NEXT_PUBLIC_ANY_WEEK_PICK === "1" ||
    process.env.NEXT_PUBLIC_ANY_WEEK_PICK === "true";
  if (!anyWeek) {
    const active = currentSlotEt();
    if (year !== active.year || week !== active.week) {
      return NextResponse.json(
        { error: "You can only change the photo for the current week." },
        { status: 403 },
      );
    }
  }

  // Get or create user in DB
  let dbUser = await prisma.user.findUnique({ where: { handle: user.handle } });
  if (!dbUser) {
    dbUser = await prisma.user.create({
      data: {
        handle: user.handle,
        displayName: user.displayName,
      },
    });
  }

  // Check for existing post (to delete old image)
  const existingPost = await prisma.weeklyPost.findUnique({
    where: {
      userId_year_week: {
        userId: dbUser.id,
        year,
        week,
      },
    },
  });

  // Delete old image if exists
  if (existingPost?.imageKey) {
    try {
      await deleteImage(existingPost.imageKey);
    } catch (e) {
      console.error("Failed to delete old image:", e);
    }
  }

  // Upload new image to Tigris
  const imageBuffer = Buffer.from(await imageFile.arrayBuffer());
  const imageKey = generateImageKey(user.handle, year, week);
  const imageUrl = await uploadImage(imageKey, imageBuffer, imageFile.type || "image/jpeg");

  // Upsert post in database
  const post = await prisma.weeklyPost.upsert({
    where: {
      userId_year_week: {
        userId: dbUser.id,
        year,
        week,
      },
    },
    create: {
      userId: dbUser.id,
      year,
      week,
      imageKey,
      imageUrl,
      caption: caption || undefined,
    },
    update: {
      imageKey,
      imageUrl,
      caption: caption || undefined,
    },
  });

  return NextResponse.json({
    post: {
      id: post.id,
      handle: user.handle,
      year: post.year,
      week: post.week,
      imageUrl: post.imageUrl,
      caption: post.caption,
      createdAt: post.createdAt.toISOString(),
      updatedAt: post.updatedAt.toISOString(),
    },
  });
}
