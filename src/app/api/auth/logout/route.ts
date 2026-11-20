import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { AUTH_COOKIE_NAME, publicOrigin } from "@/lib/auth";

export async function POST() {
  const origin = publicOrigin(await headers());
  const res = NextResponse.redirect(new URL("/login", origin), 303);
  res.cookies.set({
    name: AUTH_COOKIE_NAME,
    value: "",
    httpOnly: true,
    sameSite: "lax",
    secure: origin.startsWith("https://"),
    path: "/",
    maxAge: 0,
  });
  return res;
}
