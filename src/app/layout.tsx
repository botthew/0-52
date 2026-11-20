import type { Metadata } from "next";
import { Geist } from "next/font/google";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Toaster } from "@/components/ui/sonner";
import { getServerUser } from "@/lib/auth";
import { currentSlotEt } from "@/lib/weekTime";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const siteUrl = "https://52grid.com";

export const metadata: Metadata = {
  title: "0/52 — One photo per week",
  description:
    "Capture your year, one photo at a time. 52 weeks. 52 moments. No likes, no noise — just your visual journal.",
  metadataBase: new URL(siteUrl),
  openGraph: {
    title: "0/52",
    description: "Capture your year, one photo at a time. 52 weeks. 52 moments.",
    url: siteUrl,
    siteName: "0/52",
    images: [
      {
        url: "/og.png",
        width: 1200,
        height: 630,
        alt: "0/52 — One photo per week",
      },
    ],
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "0/52 — One photo per week",
    description: "Capture your year, one photo at a time. 52 weeks. 52 moments.",
    images: ["/og.png"],
  },
  icons: {
    icon: "/favicon.ico",
    apple: "/apple-touch-icon.png",
  },
};

async function TopNav() {
  const user = await getServerUser();
  const handle = user?.handle;
  const { week } = currentSlotEt();
  const profileHref = handle ? `/u/${handle}` : "/login";

  return (
    <header className="sticky top-0 z-10 border-b bg-background/95 backdrop-blur-sm">
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-2 px-4 py-3">
        <div className="flex items-center justify-between gap-3">
          <Link href="/feed" className="text-base font-semibold tracking-tight">
            {week}/52
          </Link>
          {handle ? (
            <form action="/api/auth/logout" method="post">
              <Button type="submit" variant="outline" size="sm">
                Log out
              </Button>
            </form>
          ) : (
            <Button nativeButton={false} render={<Link href="/login" />} variant="outline" size="sm">
              Log in
            </Button>
          )}
        </div>
        <nav className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm font-medium">
          <Link className="underline-offset-4 hover:underline" href="/feed">
            Feed
          </Link>
          <Link className="underline-offset-4 hover:underline" href={profileHref}>
            Profile
          </Link>
          <Link className="underline-offset-4 hover:underline" href="/how">
            How it works
          </Link>
        </nav>
      </div>
    </header>
  );
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={geistSans.variable}>
      <body className="min-h-dvh bg-background font-sans text-foreground antialiased">
        <TopNav />
        <main className="mx-auto w-full max-w-5xl px-4 py-6">{children}</main>
        <Toaster />
      </body>
    </html>
  );
}
