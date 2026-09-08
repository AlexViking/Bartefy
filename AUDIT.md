# Bartefy — MVP & wireframe audit

**Date:** 2026-09-09 · **Audited against:** `files/Bartefy_MVP_Scope.xlsx`
(20 P0 + 9 P1) and `files/Bartefy_Wireframes_v2.html` (16 screens).
**Live:** v3.0.1 on bartefy.com.

Every line below was checked against the code or the live database, not against
the spreadsheet's own Status column — that column reads "Not started" for all 29
rows and has never been maintained. Ignore it.

---

## Headline

**The core loop is built and works.** Sign up → list → swipe → offer → accept →
chat → complete runs end to end, and all 16 wireframe screens exist as real
files. What is missing is not the loop — it is the things that let you *judge*
and *maintain* the loop.

- **P0: 17 of 20 done.** Three genuinely missing.
- **P1: 6 of 9 done.** Three missing.
- **Wireframe: 16 of 16 screens exist.** Gaps are within screens, not whole ones.

---

## P0 — the three that are missing

### 1. Analytics / event tracking — NOTHING EXISTS
Scope says: *"Signup, list, swipe, offer, accept, message, complete all tracked.
Can't judge MVP without it."*

Verified absent three ways: no provider in `package.json` (no PostHog, Mixpanel,
Amplitude, Segment), no `track()` calls anywhere in `src/`, and no `events` or
`analytics_events` table on the live database (both 404).

**This is the single biggest gap.** The scope sheet's definition of done is
"the loop runs end-to-end **and you can measure every step**", and the success
metric is the match → trade completion rate. None of it is measurable today.
Everything else on this page is a feature; this is the ability to know whether
the product works at all.

### 2. Edit an item — NO PATH AT ALL
Scope says: *"User can change or remove their own listing."* **Remove** works
(`deleteItem`, soft-delete to `status='deleted'`). **Change** does not exist:
no `/edit` route, no `updateItem` mutation, and `AddItem` cannot open an
existing item. (`existingUploadId` in `useAddItem.ts:121` is photo-retry, not
editing.)

A user who mistypes a title or picks the wrong category must delete and relist,
which loses the item's age and any eyeing on it.

### 3. AI prohibited-content check — NOT BUILT
Scope: *"On upload, image is scanned; prohibited content is held in a review
queue, not published."* Marked P1 in the sheet but it gates a P0 acceptance
criterion — "appears in deck **after AI check**".

The client half is ready and waiting: `AddItem/sections.tsx:191` has the `held`
branch written, with a comment saying no check runs yet. The admin review queue
exists. Only the scan itself is missing. **Do not "fix" the unreachable
`checking` state — it is unreachable because nothing produces it yet.**

---

## P1 — the three that are missing

### 4. Category browse
*"User can view one category at a time."* No category picker in the deck.
Related: search, filters and Browse were deliberately **cut** — confirm whether
category browse went with them or is still wanted. **Needs your call.**

### 5. Distance shown in chat
*"Chat shows rough distance between users."* Both wireframes put `~3 km apart`
in the chat header; the client header is back arrow, avatar, name, ⋯. This is
the fact you need at the moment you are arranging a meet.

### 6. Message notifications
Four of the wireframe's five notification kinds are covered; "User B sent a
message" is not. Unread counts already exist (`useUnread`) but do not feed the
list. A third query, not an architecture change.

---

## Verified DONE (do not rebuild)

**P0:** sign up / log in · set city (`home_city`, written in onboarding) ·
create item · my items · swipe deck · rich item card (photo, category,
condition, location, owner + trust score) · report from card (the ⚑ flag) ·
offer → accept → match · matches list with states · 1:1 chat · mark complete ·
concurrent-completion cascade (`016_offer_accept_rpcs.sql:253` cancels rival
offers **and** rival matches, soft-cancel) · report item + user · block with
reason (silent, no notification) · **admin / moderation panel** · soft-delete
policy · image hosting (R2) · responsive web.

**P1:** invite code at signup (captured **and** now prefilled from
`?invite=CODE`) · manage blocked users · trust score (completed trades) ·
public profile (no points shown — correct per spec) · points wallet ·
notifications screen.

### Two CLAUDE.md entries are now stale
- **`profiles.is_staff` "not implemented"** — it exists, is queried in
  `AppShell` and `useReportQueue`, and one user has it set to true on the live
  database. The admin gate works.
- **Points "never verified"** — `points_balance` returns a real balance, so
  awards do fire.

---

## Wireframe v2 — all 16 screens exist

Sign up · Browse deck · List an item · Offer & accept · Matches · Chat → trade ·
"No longer available" · My profile · Public profile · Rewards & points · Invite
friends · Block user · Report · Blocked users · Notifications · Admin.

Screen 7 ("No longer available") exists as a **notification**
(`notif.goneTitle`, rendered in `Notifications.tsx:93`) and as the SQL cascade,
but not as a distinct screen state. Worth checking against the artboard whether
the wireframe wants more than a notification.

**Never systematically checked:** no screen has been compared to its artboard
side by side. Unverified: every screen in **dark theme** (now the default),
**Settings**, and **desktop at 1440** beyond Hunt. 14 of the pilot's 18
animations are ported but unused.

---

## Deliberate — not gaps

From the scope sheet's own "Deferred & Cut" tab, so nobody reports these as
bugs: voice messages, AI photo-vs-description matching, referral **payout**
(capture now, pay later), formal offer bundling, Bartefy Plus, credits/boosts,
wishlist + alerts, radius expansion, advanced filters/rewind, verification
badges, payments, native apps — all **deferred**. Peer star ratings, notifying
a blocked user, platform shipping, cash between users, multi-city launch — all
**cut, permanently**.

Product decisions made since: search, filters and Browse were cut; nav is
Discover · Matches · My Items · ＋.

---

## Launch prerequisite — not a feature

The scope sheet is blunt: *"Solve the cold start: seed the first few hundred
listings in one Tbilisi niche before opening the doors. A swipe app with 12
items feels dead and never recovers."*

**The live database currently has 4 items.** Nothing in the codebase can fix
that — it is an operations problem, and by the sheet's own framing it is a
launch blocker rather than a backlog item.

---

## Recommended order

1. **Analytics** — without it you cannot tell whether anything else worked.
2. **Edit an item** — a plain hole in a P0 the users will hit immediately.
3. **Distance in chat** — small, and it sits on the highest-intent screen.
4. **Message notifications** — completes the notification set.
5. **AI photo check** — the client and admin halves already wait for it.
6. **Category browse** — only after you confirm it survived the filters cut.
