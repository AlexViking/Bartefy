# CLAUDE.md — Bartefy V3

## Project overview
Bartefy is a peer-to-peer item-swap app: list items, swipe nearby finds, mutual like = match, chat, confirm swap, meet, rate. This is the **v3** codebase — a major design system overhaul applied on top of the v2 production app.

## Repository structure
```
17-BARTEFY-V3/
├── client/              # React 18 + Vite 6 + TypeScript SPA (Capacitor-wrapped)
├── server/              # Supabase Edge Functions (Deno)
├── database/            # Postgres migrations (001-007)
└── .github/workflows/   # GitHub Pages deploy
```

## Client (`client/`)
- **Framework**: React 18, Vite 6, TypeScript, React Router 7
- **State**: Zustand (client state) + TanStack Query (server state, persisted to IndexedDB)
- **Styling**: Tailwind v4 + shadcn/ui everywhere. `tokens.css` is the single source of truth — `shadcn-bridge.css` only aliases it into shadcn's variable names. No inline-style components remain.
- **UI library**: shadcn/ui only (`components.json` at `client/`). 28 registry components plus Bartefy wrappers. Never hand-roll an atom that shadcn ships.
- **i18n**: react-i18next. EN (`src/i18n/locales/en.json`) is the source of truth; other packs load on demand. All copy renders through `<T k="key">` or `useT()`, and `<T>` stamps `data-i18n="key"` into the DOM.
- **Platform split**: screens are `Screen.mobile.tsx` / `Screen.desktop.tsx` behind `createScreen()`, sharing a `useScreen.ts` hook. One layout is ever mounted — there is no responsive CSS layer.
- **Path alias**: `@/` maps to `src/` (configured in vite.config.ts + tsconfig.app.json)
- **Utility**: `cn()` helper at `src/lib/utils.ts` (clsx + tailwind-merge)
- **Build**: `npm run build` from `client/` directory
- **Dev**: `npm run dev` from `client/` directory
- **Env vars**: `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` in `.env.local` (gitignored), injected from GitHub secrets in CI
- **Custom domain**: `bartefy.com` (CNAME in `public/`)
- **Deploy**: Push to `main` branch triggers GitHub Actions → builds → deploys to GitHub Pages

### Key directories
- `src/components/ui/` — shadcn components + Bartefy wrappers (`button` re-branded to primary/accent/ghost, `user-avatar`, `tone-badge` + `Chip`, `field` (Field/TextField), `responsive-sheet`, plus Bartefy-only `icon`, `img`, `photo-well`, `stamp`, `stars`, `stat`)
- `src/components/guidance/` — `InfoHint` (tooltip on desktop, popover on touch), `LabelWithHint`, `FlowSteps`, `NextStep` (stall nudges)
- `src/components/shell/` — `AppShell` (picks one nav), `TopNav` (desktop), `TabBar` (mobile)
- `src/i18n/` — `index.ts` (bootstrap), `T.tsx` (`<T>`, `useT`, `i18nAttr`), `locales/`
- `src/lib/platform.tsx` — `PlatformProvider`, `usePlatform`, `createScreen`
- `src/components/swap/` — Swap molecules (SwapPair, OwnerRow, StatusRow, WantsRow, MessageBubble, TroubleSheet, ConfirmAndRateSheet)
- `src/components/hunt/` — Hunt card + stack
- `src/components/offer/` — OfferComposerSheet
- `src/components/membership/` — UpgradeSheet, PausedFindsSheet
- `src/navigation/destinations.ts` — Single source for nav order (4 destinations + brass Add)
- `src/lib/cache/` — TanStack Query client + IndexedDB persister
- `src/lib/realtime.ts` — Supabase Realtime → query cache patches (no polling)
- `src/lib/outbox.ts` — Batched swipes/saves/messages, survives bad signal
- `src/lib/images.ts` — LQIP, variants, decode warming
- `src/lib/membership.ts` — Tier entitlements, ALWAYS_FREE list

### Screens
Platform-split (folder with `.mobile`/`.desktop`/`use*`): Auth, Onboarding, Hunt, Browse, SwapsInbox, Chat.
Single-file (layout is the same shape on both): AddItem, Arrange, BlockedList, ItemDetail, Membership, Profile, Settings, Verify, admin/ReportQueue.
Redirect shims: Match, Rate — legacy push-notification targets whose UX now lives in sheets.

Deleted in the V4 rebuild: the ten inline-style components, plus Login, Register, Welcome, CityPicker (now a shared component), Cancel (now TroubleSheet) and DesignProfile.

### Verifying UI work
`npm run build` and `tsc` do NOT catch layout bugs. Drive the running app with Puppeteer (already a dependency) and screenshot both viewports — 390x844 and 1440x900. That is how the Tailwind layer bug below was found.

`node scripts/i18n-audit.mjs` reports keys referenced but missing from en.json (they render as raw keys at the user) and keys defined but unused. Exits non-zero on missing, so it can gate CI.

## Server (`server/`)
- **Runtime**: Deno (Supabase Edge Functions)
- **13 functions**: feed, swipe, get-r2-upload-urls, notify-match, notify-message, search, offer, meetup, handover, report, sync, checkout, stripe-webhook
- **Shared**: `_shared/auth.ts` (reference — functions are self-contained)
- **Deploy**: `supabase functions deploy <name>` (stripe-webhook uses `--no-verify-jwt`)
- **Linked project**: ref `cjsugsbqtwsvdsfpdqmy`, name "Bartefy"
- **See**: `server/README.md` for deploy commands, secrets, conventions, known bugs

### Stripe secrets needed (not yet set)
```
STRIPE_SECRET_KEY, STRIPE_WEBHOOK_SECRET, STRIPE_PRICE_COLLECTOR, STRIPE_PRICE_CURATOR, STRIPE_PRICE_SPOTLIGHT, APP_URL
```

## Database (`database/`)
- **Migrations 001-004**: Original schema + bug fixes (already applied)
- **Migration 005**: Offers, reservation, handover, meetups, reports, blocks, membership, saves, blind ratings, saved searches, outbox receipts, indexes, RLS, `entitlements()` function
- **Migration 006**: RPCs — `get_item_detail`, `search_items`, `get_swaps_inbox`, `create_offer`, `respond_to_offer`, `confirm_receipt`, `leave_rating`, `get_eyeing_people`
- **Migration 007**: 5 pg_cron jobs — expire offers (15min), close one-sided (hourly), archive silent (daily), reveal ratings (daily), gc receipts (weekly)
- **All migrations 005-007 have been applied** to the remote database
- **IMPORTANT**: `items.id` is `bigint` (not uuid). All item FK references use `bigint`. Migrations were fixed for this before applying.
- **IMPORTANT**: `ratings` table uses `from_user`/`to_user` columns (not `rater_id`/`ratee_id`). Migrations and RPCs were fixed for this.

## GitHub repo
- **Remote**: `https://github.com/AlexViking/Bartefy.git`
- **Branch `main`**: Currently deployed v2
- **Branch `v3`**: All v3 client changes committed and pushed, ready to merge

## Hard invariants — never regress these
- **Uploads**: client mints `uploadId` (UUIDv4) once per photo; retries overwrite, never duplicate
- **Matching**: all swipe→match logic inside `record_swipe_and_match()` — one transaction
- **Messages**: `client_msg_id` dedupes resends via UNIQUE(swap_id, client_msg_id)
- **Deletes**: soft delete (`status='deleted'`); always `.select()` after mutations
- **Errors**: every API result checked; no silent catch-and-continue
- **Identity from JWT**, never request body
- **State changes transactional in SQL**, not TypeScript
- **Nothing decided automatically** — reports freeze and wait for a human
- **Addresses never enter storage**
- **402 means "open the upgrade sheet"**
- **Three button variants**: primary, accent, ghost. No red buttons. No danger variant.
- **CSS resets belong in `@layer base`** — unlayered CSS beats anything inside `@layer`, so an unlayered `* { padding: 0 }` silently defeats every Tailwind padding utility with no warning.
- **All user-visible copy goes through i18n** — never a bare English string in JSX. Rows rendering user data (an email, a name) must not carry `data-i18n`.
- **One UI library** — shadcn. Compose it; never fork an atom it already ships.
- **ALWAYS_FREE**: reporting, blocking, meeting safely, confirming handover, rating, reading threads, finishing agreed swaps

## Design system
- Parchment `#F7F2E1` bg, Bartefy Green `#2F6A52` primary, Ink `#33322B`, Brass `#E9BE8C` accent, danger `#A05340`
- Quicksand (headings) + Karla (body, >=15px)
- Terracotta, denim, sage are illustration accents ONLY — never status, never buttons
- Motion 140-240ms `cubic-bezier(0.2,0,0,1)`
- Voice: warm flea-market friend — "finds", "treasures", "put it on the table", "It's a bartefy!"

## Known bugs / still open
1. **FCM legacy API is dead** — notify-match and notify-message use deprecated endpoint. Need FCM v1 with OAuth2.
2. **Listing limit hardcoded** — get-r2-upload-urls has `MAX_ACTIVE_ITEMS = 3`, should call `entitlements()`.
3. **Feed pagination uses integer offset** — should be keyset, low urgency.
4. **notify-offer, notify-billing** — invoked but not written.
5. **Image variant generation** — R2 worker for 200/640/1600 WebP + LQIP not built yet. `<Img>` takes a `photo` object; HuntCard and the Browse grid use a plain `<img>` until the worker exists.
6. **meeting_spots table** — needs seeding per launch city.
7. **profiles.is_staff** — staff gate on `/admin/reports` not implemented.
8. **Account deletion** — Settings records `deletion_requested_at` and signs out; real deletion needs a service-role job.
9. **Language packs** — de/fr/es/lv are stubs. Keys fall back to EN until translated.
10. **Logo asset** — RGB with no alpha, so it cannot sit on green. `Wordmark` sets the brand as type on dark surfaces; replace with a transparent SVG when one exists.
11. **AddItem, ItemDetail, Arrange, Profile** — on shadcn and translated, but not yet platform-split; they are single-file with a max-width container.

## V3 design reference files (in the v2 repo)
Located at `/Users/Alex/Dev/2026/Aug/16-BARTEFY-V2/v3/Barter Platform Design System/`:
- `Atomic System.dc.html` — tokens, atoms, molecules, organisms, 5 templates
- `Flows & Edge Cases.dc.html` — 7 flows, edge-case matrix, membership tiers
- `Missing Screens.dc.html` — Item detail, offer composer, meetup, confirm+rate
- `code/MAPPING.md` — Component audit with keep/extend/replace verdicts
- `code/ARCHITECTURE.md` — Caching, images, push-not-poll, API shaping
