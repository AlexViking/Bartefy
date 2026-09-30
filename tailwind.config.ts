import type { Config } from 'tailwindcss';
import animate from 'tailwindcss-animate';

/** Bartefy Tailwind config.
 *  Colors come from shadcn-bridge.css; everything physical (radii, shadows,
 *  motion, hit targets) points straight at the existing tokens.css variables,
 *  so there is exactly one place to change a value.
 */
export default {
  darkMode: ['class'],
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        background: 'hsl(var(--background))',
        foreground: 'hsl(var(--foreground))',
        card: { DEFAULT: 'hsl(var(--card))', foreground: 'hsl(var(--card-foreground))' },
        popover: { DEFAULT: 'hsl(var(--popover))', foreground: 'hsl(var(--popover-foreground))' },
        primary: { DEFAULT: 'hsl(var(--primary))', foreground: 'hsl(var(--primary-foreground))' },
        secondary: { DEFAULT: 'hsl(var(--secondary))', foreground: 'hsl(var(--secondary-foreground))' },
        accent: { DEFAULT: 'hsl(var(--accent))', foreground: 'hsl(var(--accent-foreground))' },
        muted: { DEFAULT: 'hsl(var(--muted))', foreground: 'hsl(var(--muted-foreground))' },
        destructive: { DEFAULT: 'hsl(var(--destructive))', foreground: 'hsl(var(--destructive-foreground))' },
        border: 'hsl(var(--border))',
        input: 'hsl(var(--input))',
        ring: 'hsl(var(--ring))',
        selected: { DEFAULT: 'hsl(var(--selected))', foreground: 'hsl(var(--selected-foreground))' },
        /* The Brand Book's eleven, by name, for the places the mock names one
           directly (bg-coral on Add a find, bg-sun on points, text-forest on
           Mint). These do not flip with the theme -- they are the brand. */
        green: 'var(--green)',
        forest: 'var(--forest)',
        mint: 'var(--mint)',
        ink: 'var(--ink)',
        slate: 'var(--slate)',
        stone: 'var(--stone)',
        paper: 'var(--paper)',
        coral: 'var(--coral)',
        sun: 'var(--sun)',
        sky: 'var(--sky)',
        lilac: 'var(--lilac)',
        illo: {
          terracotta: 'hsl(var(--illo-terracotta))',
          denim: 'hsl(var(--illo-denim))',
          sage: 'hsl(var(--illo-sage))',
        },
      },
      fontFamily: {
        display: ['Outfit', 'system-ui', 'sans-serif'],
        body: ['Figtree', 'system-ui', 'sans-serif'],
      },
      fontSize: {
        // Brand Book §06.
        display: ['64px', { lineHeight: '1', fontWeight: '600' }],
        h2: ['32px', { lineHeight: '1.15', fontWeight: '500' }],
        h3: ['20px', { lineHeight: '1.3', fontWeight: '600' }],
        body: ['17px', { lineHeight: '1.6' }],
        caption: ['13px', { lineHeight: '1.4', letterSpacing: '0.04em', fontWeight: '500' }],
        // The approved V6 mock's scale, by the mock's own names, so its markup
        // ports without translating sizes. headline-* are Outfit, the rest
        // Figtree -- set the family with font-display / font-body.
        'headline-xl': ['40px', { lineHeight: '48px', fontWeight: '800' }],
        'headline-lg': ['32px', { lineHeight: '40px', fontWeight: '700' }],
        'headline-md': ['22px', { lineHeight: '30px', fontWeight: '600' }],
        'headline-sm': ['18px', { lineHeight: '26px', fontWeight: '600' }],
        'body-lg': ['18px', { lineHeight: '28px', fontWeight: '400' }],
        'body-md': ['15px', { lineHeight: '24px', fontWeight: '400' }],
        'body-sm': ['13px', { lineHeight: '20px', fontWeight: '400' }],
        'label-lg': ['14px', { lineHeight: '20px', letterSpacing: '0.02em', fontWeight: '700' }],
        'label-md': ['12px', { lineHeight: '16px', letterSpacing: '0.03em', fontWeight: '600' }],
        'label-sm': ['11px', { lineHeight: '14px', letterSpacing: '0.05em', fontWeight: '700' }],
        ticker: ['14px', { lineHeight: '18px', fontWeight: '700' }],
      },
      borderRadius: {
        sm: 'var(--radius-card-sm)',
        DEFAULT: 'var(--radius-card)',
        /* 8px: the V6 mocks' scale (Stitch: lg .5rem, xl .75rem), which every
           V6 screen was ported from. This was 16px, so each thumbnail, tile
           and row copied as rounded-lg drew twice as round as the mock --
           44px thumbnails came out as circles. 16px is rounded-2xl or
           rounded-card-lg. */
        lg: 'var(--radius-card-sm)',
        hero: 'var(--radius-hero)',
        pill: 'var(--radius-pill)',
        /* `rounded-card`, `rounded-card-sm` and `rounded-card-lg` are written
           in 42 places across the app and generated NOTHING -- the scale above
           is keyed sm/DEFAULT/lg, so every one of those elements has been
           rendering with square corners since the tokens landed. Nothing warns
           about a Tailwind class that matches no key: it is simply dropped.

           Aliased rather than rewritten at the call sites, because
           `rounded-card` reads better next to `bg-card` than `rounded` does,
           and a 42-file find-and-replace to fix a config gap is the wrong
           trade. */
        card: 'var(--radius-card)',
        'card-sm': 'var(--radius-card-sm)',
        'card-lg': 'var(--radius-card-lg)',
      },
      boxShadow: {
        card: 'var(--shadow-card)',
        float: 'var(--shadow-float)',
      },
      minHeight: { hit: 'var(--hit-min)' },
      minWidth: { hit: 'var(--hit-min)' },
      /* `size-hit` reads the shared spacing scale, not minHeight. Without this
         entry `size="icon"` collapsed to its padding, so every icon button in
         the app rendered below the 44px minimum. */
      spacing: { hit: 'var(--hit-min)' },
      transitionTimingFunction: { brand: 'var(--ease-out)' },
      transitionDuration: { fast: '140ms', med: '240ms' },
      keyframes: {
        // Ported from the V5 pilot. The overshoot curves are the point: a
        // scale that stops exactly at 1 reads as a state change, one that
        // passes 1.06 and settles reads as a thing arriving.
        'fade-in': { from: { opacity: '0' }, to: { opacity: '1' } },
        'sheet-up': { from: { transform: 'translateY(100%)' }, to: { transform: 'translateY(0)' } },
        // The workhorse: everything that enters a page uses this.
        'rise-in': {
          from: { opacity: '0', transform: 'translateY(12px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
        'pop-in': {
          '0%': { opacity: '0', transform: 'scale(.7)' },
          '60%': { transform: 'scale(1.06)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        },
        // A message landing, not a panel opening -- shorter and smaller.
        'bubble-in': {
          from: { opacity: '0', transform: 'translateY(10px) scale(.97)' },
          to: { opacity: '1', transform: 'translateY(0) scale(1)' },
        },
        // Confirmation. Overshoots hard, because this is the moment a swap
        // is done and it should feel like something happened.
        'tick-pop': {
          '0%': { transform: 'scale(1)' },
          '45%': { transform: 'scale(1.4)' },
          '100%': { transform: 'scale(1)' },
        },
        'point-pop': {
          '0%': { transform: 'scale(1)' },
          '40%': { transform: 'scale(1.18)' },
          '100%': { transform: 'scale(1)' },
        },
        'icon-wiggle': {
          '0%': { transform: 'rotate(0)' },
          '30%': { transform: 'rotate(-9deg)' },
          '60%': { transform: 'rotate(7deg)' },
          '100%': { transform: 'rotate(0)' },
        },
        'toast-in': {
          from: { opacity: '0', transform: 'translateY(14px) scale(.96)' },
          to: { opacity: '1', transform: 'translateY(0) scale(1)' },
        },
        // Idle motion. Slow and small on purpose: it should read as alive,
        // never as something asking to be looked at.
        'float-y': {
          '0%,100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-6px)' },
        },
        'card-float': {
          '0%,100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-10px)' },
        },
      },
      animation: {
        'fade-in': 'fade-in 140ms var(--ease-out)',
        'sheet-up': 'sheet-up 320ms cubic-bezier(0.2,1,0.3,1)',
        'rise-in': 'rise-in 320ms cubic-bezier(0.16,1,0.3,1) both',
        'pop-in': 'pop-in 420ms cubic-bezier(0.2,1.3,0.4,1) both',
        'bubble-in': 'bubble-in 260ms cubic-bezier(0.16,1,0.3,1) both',
        'tick-pop': 'tick-pop 380ms cubic-bezier(0.2,1.4,0.4,1)',
        'point-pop': 'point-pop 420ms cubic-bezier(0.16,1,0.3,1)',
        'icon-wiggle': 'icon-wiggle 420ms ease-out',
        'toast-in': 'toast-in 260ms cubic-bezier(0.2,1.3,0.4,1)',
        'float-y': 'float-y 2.4s ease-in-out infinite',
        'card-float': 'card-float 4.2s ease-in-out infinite',
      },
    },
  },
  plugins: [animate],
} satisfies Config;
