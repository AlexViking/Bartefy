# Bartefy — work queue

**Updated:** 2026-09-13 · **Live:** v3.0.2 (`cfd16d9`) on bartefy.com
**Migrations 036-041 all applied** to production and verified there.

---

## OPEN — start here

### 1. "You get" blank in the chat header — UNRESOLVED
Reported with a screenshot. Verified as the participant (Anri) that the embed
returns both item titles, so migration 038 works and the data is reachable.
But the screenshot still showed **40px thumbnails**, which were changed to
56px in the same commit as the fix — so it looked like a cached build.
**Never confirmed after a hard reload.** Ask for a fresh screenshot first
rather than re-debugging from scratch.

### 2. Multi offer untested end to end
040 is applied and `make_multi_offer` answers correctly (P0017 on a bad
count). No real multi offer has been sent. Needs: like a find → toggle
"Offer several finds" → pick 2-4 → confirm the owner sees them grouped and is
charged 150 once.

### 3. `MAX_ACTIVE_ITEMS = 3` hardcoded — highest-value bug
`server/functions/get-r2-upload-urls` caps listings at 3 instead of calling
`entitlements()`. **Paid tiers do not actually get more listings**, so someone
can buy Collector or Curator and receive nothing.

### 4. FCM is dead
notify-match and notify-message use the deprecated endpoint. Push does
nothing. Needs FCM v1 + OAuth2.

### 5. `server/` and `database/` exist on ONE disk
Local-only is a settled decision — do not propose a remote again. But
single-copy is a different risk from local-only; even a periodic archive
would close it.

---

## Smaller

- **`keys.thread` is dead** — its only writer was deleted. The remaining
  invalidator sits in a `swaps` subscription, and edge functions DO still
  write `swaps`, so check before pruning either.
- **Arrange at 1920** — the 560px column sits left of centre because the pane
  starts after the rail. A two-column split was tried and was worse
  (an 800px button stranded from its form); reverted.
- **Settings "Show the guidance again"** also replays the whole welcome tour.
  A nudges-only reset would be kinder.
- **One profile had `name = null`** (`sushiclubge@gmail.com`), which is what
  renders "Someone" in the chat header. Worth checking whether signup is
  failing to save names, or it recurs with every new tester.
- **309+ i18n keys defined but unused** — some are unbuilt screens, some are
  orphans. Worth a pass to decide which are dead.

---

## Testing

`database/maintenance/` has three scripts:

| File | What it does |
|---|---|
| `inspect_before_reset.sql` | **read-only**, 8 queries. Run this first. |
| `reset_test_swaps.sql` | clears offers/matches/messages **and swipes**, frees items |
| `fix_stuck_match.sql` | repairs an item stuck active inside an open match |

**The swipe delete is essential.** `get_feed` hides anything you have already
swiped, so clearing offers and matches returns the ITEMS but not the DECK —
one account had swiped 43 of 44 finds and the reset looked like it had done
nothing.

Note the Supabase SQL editor only shows the **last** statement's results;
select a single block to see the others.

---

## Verifying UI work

- `npm run build` and `tsc` do **not** catch layout bugs. Drive the app with
  Puppeteer at 390x844 and 1440x900.
- **The theme key is `bartefy.theme`, not `theme`.** Setting the wrong one
  silently screenshots dark twice and looks like a design that works in both.
  Assert `getComputedStyle(document.body).backgroundColor` actually differs:
  dark `rgb(19,19,17)`, light `rgb(248,243,227)`.
- **tsc is not a syntax gate.** It has passed on non-compiling JSX and on a
  missing import that `npm run build` caught. Run tsc AND eslint AND build.
- **Ask the user for the Settings build stamp** before concluding a fix is
  not working. Three times this session a "broken" call was a cached build or
  a test that could never have passed.

---

## Product decisions — do not re-litigate

- **A plain like is private.** It is an offer row nobody is shown; two
  mirrored ones form a match with no accept step. Super (50) and multi (150)
  buy attention instead of patience.
- **Strict pairing** for mutual matches — the exact mirror only.
  `barter_matches` needs a concrete item pair.
- **Four rows, never a bundle.** The engine is 1-to-1 throughout.
- Items publish IMMEDIATELY; moderation is an audit after the fact.
- Search, filters and Browse are a deliberate cut.
- `items.public_id` is for URLs; the bigint is for FKs.
