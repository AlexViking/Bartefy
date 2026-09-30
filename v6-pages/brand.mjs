/* The Bartefy Brand Book palette and type, applied to a Stitch page's <head>.
 *
 * Alex, 2026-09-27: "consider only these colours" — the 11 named colours of
 * the Brand Book (v1.0, section 05). Nothing else. Every Stitch page names its
 * colours with the same Material-style tokens (primary, surface, on-surface…),
 * so re-pointing those tokens here repaints every page revision and every
 * organism sheet at once. The Stitch originals (S1–S4) are never touched.
 *
 * Used by apply-shell.mjs (page revisions) and build-revisions.mjs (sheets).
 */

// Brand Book §05 — the only colours allowed.
export const BRAND = {
  green: '#1B6B55', // Barter Green — leads (~25%)
  forest: '#0E3B30', // Deep Forest — pressed states, dark UI
  mint: '#D6EBDF', // Mint — tints, highlights
  ink: '#17191E', // Ink — text (~15%)
  slate: '#6B7079', // Slate — secondary text
  stone: '#EDEBE4', // Stone — surfaces
  paper: '#F5F4EF', // Paper — background (~50%)
  coral: '#EE8B6A', // Coral — Give
  sun: '#EDC857', // Sun — New match
  sky: '#7EB3DD', // Sky — Info
  lilac: '#AE9FDC', // Lilac — Community
  white: '#FFFFFF',
}
const B = BRAND

// Stitch token → brand colour. Rules from the book: Green leads and marks the
// one primary action; neutrals everywhere else; accents only where they mean
// something; text on an accent is Ink, never white.
export const TOKENS = {
  // The one loud action (Put on Table, Claim) and links.
  primary: B.green, 'on-primary': B.white, 'surface-tint': B.green,
  // Selected / active states: a Mint tint with Deep Forest text — calmer than
  // a second solid green next to the primary action.
  'primary-container': B.mint, 'on-primary-container': B.forest,
  'primary-fixed': B.mint, 'primary-fixed-dim': B.mint, 'on-primary-fixed': B.forest,
  'on-primary-fixed-variant': B.forest, // hover / pressed on primary
  'inverse-primary': B.mint,
  // Stitch's secondary was already a green: success, "confirmed", "live".
  secondary: B.green, 'on-secondary': B.white,
  'secondary-container': B.mint, 'on-secondary-container': B.forest,
  'secondary-fixed': B.mint, 'secondary-fixed-dim': B.mint,
  'on-secondary-fixed': B.forest, 'on-secondary-fixed-variant': B.forest,
  // Stitch's tertiary was gold: points, costs, streak dots. → Sun, Ink on it;
  // as a text/icon colour it becomes Ink (Sun on white has no contrast).
  tertiary: B.ink, 'on-tertiary': B.white,
  'tertiary-container': B.sun, 'on-tertiary-container': B.ink,
  'tertiary-fixed': B.sun, 'tertiary-fixed-dim': B.sun,
  'on-tertiary-fixed': B.ink, 'on-tertiary-fixed-variant': B.ink,
  // Urgency. The book has no red; Coral is its warmest colour. Used only as a
  // STATUS marker (expiring, unread), never a button. Ink text on it.
  error: B.coral, 'on-error': B.ink, 'error-container': B.coral, 'on-error-container': B.ink,
  // Neutrals: Paper page, white cards, Stone for fills and hairlines.
  background: B.paper, 'on-background': B.ink,
  surface: B.paper, 'surface-bright': B.paper, 'surface-dim': B.stone,
  'surface-container-lowest': B.white, 'surface-container-low': B.paper,
  'surface-container': B.stone, 'surface-container-high': B.stone, 'surface-container-highest': B.stone,
  'surface-variant': B.stone,
  'on-surface': B.ink, 'on-surface-variant': B.slate,
  outline: B.slate, 'outline-variant': B.stone,
  'inverse-surface': B.ink, 'inverse-on-surface': B.paper,
}

// Brand Book §06: Outfit for display, headings, numbers and buttons; Figtree
// for body, labels and listings.
const FONTS_LINK = '<link href="https://fonts.googleapis.com/css2?family=Figtree:wght@400;500;600;700&amp;family=Outfit:wght@500;600;700&amp;display=swap" rel="stylesheet">'

/** Re-points a Stitch <head> (or whole page) at the Brand Book. */
export function brandHead(html) {
  let s = html.replace(/"colors":\{[^}]*\}/, (m) => {
    const colors = JSON.parse(m.slice('"colors":'.length))
    for (const k of Object.keys(colors)) if (TOKENS[k]) colors[k] = TOKENS[k]
    // The brand names themselves, for the few places that need one directly
    // (bg-coral on "Add a find", ring-green, …).
    for (const [k, v] of Object.entries(BRAND)) colors[k] = v
    return '"colors":' + JSON.stringify(colors)
  })
  s = s.replace(/"fontFamily":\{[^}]*\}/, (m) => {
    const fam = JSON.parse(m.slice('"fontFamily":'.length))
    for (const k of Object.keys(fam)) fam[k] = [k.startsWith('headline') || k === 'ticker-number' ? 'Outfit' : 'Figtree', 'system-ui', 'sans-serif']
    fam.display = ['Outfit', 'system-ui', 'sans-serif']
    fam.sans = ['Figtree', 'system-ui', 'sans-serif']
    return '"fontFamily":' + JSON.stringify(fam)
  })
  s = s.replace(/<link href="https:\/\/fonts\.googleapis\.com\/css2\?family=Epilogue[^"]*" rel="stylesheet">/, FONTS_LINK)
  return s
}
