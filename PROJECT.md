# 0/52 Project Context

## Overview
Minimalist photo journal PWA — one photo per week, 52 weeks per year.

## Live URL
https://oneper.fly.dev

## Repository
https://github.com/botthew/0-52

## Key Paths
- `/data/.openclaw/workspace/oneper` — project root
- `src/app/u/[handle]/profile-client.tsx` — main profile grid component
- `src/lib/apiStore.ts` — profile and feed requests
- `src/lib/weekTime.ts` — week calculations with ET timezone
- `src/lib/stats.ts` — streak calculation

## Week Logic
- Week boundary: Monday 12:00am ET to Sunday 11:59pm ET (ISO weeks)
- Grace period: Can swap photo until Monday 12:00pm ET
- Wordmark updates: Sunday midnight ET

## Design System
- **Primary button:** black bg, white text
- **Secondary button:** white bg, black border, black text
- **Theme:** Forced light mode, minimalist, zinc color palette
- **Tiles:** 16:9 landscape aspect ratio

## Current State (2026-02-12)
- ✅ Core upload/display working
- ✅ Year selector on profiles
- ✅ Streaks + completion on profiles (not feed)
- ✅ OG meta tags + social image
- ✅ Git repo initialized, pushed to GitHub
- 🔲 Resend magic link auth
- 🔲 Postgres + Tigris persistent storage

## Deploy Command
```bash
cd /data/.openclaw/workspace/oneper
export FLYCTL_INSTALL="/data/.fly"; export PATH="$FLYCTL_INSTALL/bin:$PATH"
ACCESS=$(awk -F': ' '/^access_token:/{print $2}' /data/.fly/config.yml)
REFRESH=$(awk -F': ' '/^refresh_token:/{print $2}' /data/.fly/config.yml)
export FLY_ACCESS_TOKEN="$ACCESS,$REFRESH"
flyctl deploy --remote-only
```

## Git Workflow
- Main branch: `main`
- Feature branches for risky changes
- Commit frequently with descriptive messages
