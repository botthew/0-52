import { NextResponse } from "next/server";
import { headers } from "next/headers";
import {
  AUTH_COOKIE_NAME,
  encodeUserCookie,
  makeDevUser,
  normalizeHandle,
  publicOrigin,
} from "@/lib/auth";

export async function POST(req: Request) {
  const form = await req.formData();
  const rawHandle = String(form.get("handle") ?? "").slice(0, 64);
  const handle = normalizeHandle(rawHandle);
  const origin = publicOrigin(await headers());

  if (!handle) {
    const back = new URL("/login", origin);
    back.searchParams.set("error", "handle");
    if (rawHandle.trim()) back.searchParams.set("handle", rawHandle.trim());
    return NextResponse.redirect(back, 303);
  }

  const res = NextResponse.redirect(new URL(`/u/${handle}`, origin), 303);
  res.cookies.set({
    name: AUTH_COOKIE_NAME,
    value: encodeUserCookie(makeDevUser(handle)),
    httpOnly: true,
    sameSite: "lax",
    secure: origin.startsWith("https://"),
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
  });
  return res;
}
