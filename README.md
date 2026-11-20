# 0/52

**One photo per week. 52 weeks. Your visual year.**

A minimalist photo journal app where you capture one moment each week. No likes, no comments, no noise — just your year in 52 photos.

🌐 **Live:** https://oneper.fly.dev

## Features

- 📸 **Weekly uploads** — One photo slot per week (Mon-Sun)
- 🔄 **Grace period** — Swap your photo until Monday 12pm ET, then it's saved forever
- 🖼️ **16:9 landscape** — All photos auto-cropped for a clean, consistent grid
- 📊 **Progress tracking** — See your completion (X/52) and current streak
- 📤 **Share & Export** — Copy profile link or download your grid as PNG
- 📅 **Year selector** — Browse your history by year
- 🔥 **Streaks** — Track consecutive weeks of uploads

## Tech Stack

- **Framework:** Next.js 16 (App Router)
- **Styling:** Tailwind CSS
- **Hosting:** Fly.io
- **Storage:** Postgres + Tigris
- **Auth:** Handle cookie (no password) → Resend magic links (planned)

## Development

```bash
# Install dependencies
npm install

# Run dev server
npm run dev

# Build for production
npm run build
```

## Deploy

```bash
# Deploy to Fly.io
flyctl deploy --remote-only
```

## Environment Variables

| Variable | Description |
|----------|-------------|
| `NEXT_PUBLIC_ANY_WEEK_PICK` | Set to `1` to enable uploading to any week (testing) |

## Roadmap

- [ ] Resend magic link authentication
- [ ] Postgres + Tigris for persistent storage
- [ ] PWA with offline support
- [ ] Push notifications for weekly reminders

## License

MIT
