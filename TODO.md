# Bartefy — work queue

**Updated:** 2026-09-08 · **Live:** v3.0.1 (`d731343`) on bartefy.com
**Goal:** bring the client fully to the V5 / Wireframes-v2 target.
**Focus:** client only. Server work is parked at the bottom.

---

## How to pick up after a context clear

1. Read this file top to bottom. Work items **in order** — they are sorted by
   user impact, not by effort.
2. **Verify before you fix.** This list was partly built from an audit artifact
   dated 6 Sep; four of its "open" items were already done by the time I checked
   on 8 Sep. Always open the file and confirm the problem still exists before
   changing anything. Grepping call sites is not enough — read the component.
3. `npm run build` and `tsc` do **not** catch layout bugs. Drive the app with
   Puppeteer and screenshot 390x844 **and** 1440x900, in **both themes** (dark
   is the default and most screens were only ever seen in light).
4. Commit per fix, in the house style: what broke, why, how it was verified.
   **Never** add `Co-Authored-By`.
5. Push only when asked. A push to `main` deploys to production in ~60s.
6. Confirm a deploy by reading the version in the app header (not Settings).

### The reference files
- `files/Bartefy_Wireframes_v2.html` — **the spec.** 16 mobile screens.
- `files/Bartefy_Wireframes_Desktop_Tablet.html` — 5 desktop, 3 tablet.
- `Bartefy V5 Pilot.html` — copy and animation vocabulary, **not** layout.
- Where V5 and the wireframes disagree on structure, **the wireframe wins**.

---

## P0 — correctness, do these first

### 1. `photo-well.tsx` ships a bare English string
`src/components/ui/photo-well.tsx:47` renders `<span>Add photo</span>`.
Breaks the hard invariant "all user-visible copy goes through i18n". The key
**already exists** (`add.addPhoto` = "Add a photo", en.json:158) — the file just
never imports `useT`. Every non-EN user sees English.

`i18n-audit.mjs` cannot catch this: the string is not a key, so there is nothing
to report as missing. **Audit the other `ui/` atoms the same way** — the audit
script is blind to this whole class.

### 2. Sweep for the shared-query-key bug class
Two Offers black screens came from one cause: several components used the same
TanStack key but returned **different shapes** (a count vs an array). One key is
one cache entry, so whichever mounts first decides the shape and the other one
crashes.

Fixed for `barter.offers`. Checked on 8 Sep and currently **safe**: `['staff']`
(both boolean) and `['points','balance']` (both number). Re-check whenever a
query is added, and **always route new keys through the `keys` factory** in
`src/lib/cache/queryClient.ts` rather than writing an inline array — the factory
exists precisely to prevent this and was being bypassed.

---

## P1 — visible gaps against the wireframe

### 3. Chat header is missing distance (M1)
Both wireframes put **`~3 km apart`** in the chat header. The client header is
back arrow, avatar, name, ⋯. This is the fact you need when arranging a meet,
which is the next action from this screen.
Files: `src/screens/Chat/Chat.mobile.tsx`, `src/screens/Chat/ChatPane.tsx`.

### 4. Notifications: no message notifications (Nt1)
Four of the wireframe's five kinds are covered; "User B sent a message" is not.
Unread counts already exist (`useUnread`) but do not feed this list. This is a
third query, not an architecture change. `src/screens/Notifications.tsx:58`.

### 5. Notifications: no read/unread state (Nt2)
Deliberate — the file says a real table belongs with push/FCM v1. Leave it, but
know the screen is currently stateless.

### 6. AddItem "checking" state never appears (A1)
`src/screens/AddItem/sections.tsx:191`. Terminal states are built and correct;
the in-flight one is unreachable because no photo check runs yet. The branch is
written and ready — fine as long as it is known. **Not a bug, do not "fix" it.**

---

## P2 — verify before trusting

These were listed as open in the 6 Sep artifact and are **already done**.
Recorded so nobody re-does them:

- ~~M2 — swap pair in mobile chat header~~ — `SwapPair` is at `Chat.mobile.tsx:103`.
- ~~N4 — no entry point to Notifications~~ — the bell links it, `Topbar.tsx:133`.
- ~~R1 / P4 — points wallet / Rewards screen~~ — `Rewards.tsx` exists, linked
  from Profile at `/points`.
- ~~T2 — tablet two-pane for Matches~~ — `useTwoPane()` is live in `ChatPane`
  and `SwapsInbox.desktop`.

---

## P3 — the systematic pass that has never been done

**No screen has been compared to its wireframe artboard side by side.** Pieces
were ported as problems surfaced, not systematically. For each screen: open its
artboard, open the same screen in the app, screenshot both viewports in both
themes, and **measure rather than eyeball**.

Specifically unchecked: **every screen in dark theme** (now the default),
**Settings**, and **desktop at 1440** beyond Hunt. 14 of the pilot's 18
animations are ported but unused.

Open question for you: **309 i18n keys are defined but unused** (637 defined,
323 referenced). Some are unbuilt screens, some may be orphans from the V4
rebuild. Worth a pass to decide which are dead.

---

## TODO: write the testing guide for the team

**Not started.** A deliverable in its own right — a document the team follows to
test the app end to end. Notes below are the raw material, not the guide.

### What it has to cover
Per feature: the steps a tester follows, and what they should see. At minimum —

- **Sign in** — request a code, enter it, land in the app on the **first try**.
  (Regression: the code used to be rejected once and work after a refresh.)
- **Sign up** — name + email, and the optional invite field.
- **Invite** — open a link with `?invite=CODE`, confirm the field is prefilled,
  sign up, confirm the referral is recorded against the account.
- **Deck** (`/discover`) — the owner's **real name**, not "Swapper". Pass, undo,
  offer. Tap left/right thirds of the photo to step through photos. The ⚑ flag
  reports a listing. Arrow keys work on desktop.
- **Offers** — with offers pending, Matches → the "N waiting" row → the list
  renders. (Regression: this blanked twice, from two different causes.)
  Accept opens a chat; decline removes it.
- **List a find** (`/add`) — photos, category, condition, wants. Free tier is
  capped; confirm the limit message rather than a silent failure.
- **Chat** — send a message, arrange a meet, confirm the handover.
- **Points** (`/points`) — earn: list 20, offer accepted 60, swap completed 160,
  referral's first swap 400. Spend: Collector 600, Curator 1500, boost 75,
  eyeing 50, radius 120. **Never verified end to end — no award has been
  confirmed firing since the database wipe.** Have a tester list a find and
  check 20 points actually arrive.
- **Report / block** — reachable from the deck and from Item detail.
- **Version** — the header shows the build. Testers should quote it in every
  report.

### Two things testers must be told
1. **The app is a PWA and caches hard.** After a deploy the first load can still
   be the old build. Reload once before reporting anything.
2. **Quote the version from the header** in every bug report, or a report cannot
   be matched to a build.

### Practical notes
- Routes worth listing: `/discover` `/items` `/matches` `/offers` `/add`
  `/points` `/invite` `/profile` `/settings` `/notifications`.
  Nav is **Discover · Matches · My Items · ＋**, Profile behind the avatar.
- Test **both themes** — dark is the default — and both phone and desktop.
- Search, filters and Browse are **cut from the product**. Not missing. Say so
  in the guide or it will be reported as a bug every round.
- Decide the format with the user before writing: a page in the repo, or an
  artifact the team can open in a browser.

---

## Parked — server side (not now, client first)

1. **`server/` is not under version control.** Only `client/` is a git repo. The
   feed fix that restored real owner names exists **only on the Supabase server
   and in the local working tree**. A redeploy from a fresh checkout brings
   "Swapper" straight back. This is the riskiest item on the page.
2. `server/functions/search/index.ts` — same `profiles` → `profiles_public` fix
   is written but **not deployed**. Search is a deliberate product cut, so this
   was left alone on purpose.
3. **Source/CLI split** — functions live in `server/functions/` but the Supabase
   CLI expects `supabase/functions/`. A copy was staged there to deploy `feed`;
   those two locations will drift.
4. Known-open from CLAUDE.md: FCM legacy API is dead (needs v1 + OAuth2);
   `MAX_ACTIVE_ITEMS = 3` hardcoded instead of calling `entitlements()`; feed
   pagination uses integer offset; `notify-offer` / `notify-billing` invoked but
   never written; no image variant worker; `meeting_spots` unseeded;
   `profiles.is_staff` gate unimplemented; account deletion needs a
   service-role job; de/fr/es/lv packs are stubs.

---

## Shipped 2026-09-08 (this session)

All live on bartefy.com at v3.0.1.

| Fix | Commit | What it was |
|---|---|---|
| OTP rejected then worked after refresh | `5b0924c` | Guards released before React committed, so the effect re-sent a **consumed** code. The first call had already succeeded — people were told a good code was wrong. Now guarded **by value**, released on edit/resend/reset. |
| Offers black screen (1/2) | `186fedf` | Badge count and offers list shared a query key; the count (a number) won, `rows.map` threw. Split the keys via the `keys` factory. |
| Offers black screen (2/2) | `d731343` | The persisted IndexedDB cache still held the **old shape** with a 24h maxAge, so the fix was invisible to returning browsers. Added `buster: __APP_COMMIT__` **and** an `Array.isArray` guard at the read. |
| Invite link did nothing | `57ac205` | `?invite=CODE` was generated by the Invite screen and never read by signup. DB side was always correct. |
| Version badge + card clip | `a5fd3d0` | Version now in the Topbar on every screen; `pe-11` stops the report flag covering "30 days left". |
| "Swapper" instead of real names | *(server, deployed direct)* | The deployed `feed` function queried `profiles` under the caller's JWT, but migration 008 restricted that table to your own row. RLS returns **no rows, not an error**, so every card silently fell back to the literal "Swapper". Now reads `profiles_public`. |

### Two lessons worth keeping
- **RLS failures are silent.** An empty array is not an error. Any lookup of
  another user's row must go through `profiles_public`.
- **A shipped fix is not a delivered fix.** The persisted cache kept serving the
  old shape after the code was correct. Always ask what a *returning* browser
  will restore.
