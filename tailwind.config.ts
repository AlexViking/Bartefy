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
        illo: {
          terracotta: 'hsl(var(--illo-terracotta))',
          denim: 'hsl(var(--illo-denim))',
          sage: 'hsl(var(--illo-sage))',
        },
      },
      fontFamily: {
        display: ['Quicksand', 'system-ui', 'sans-serif'],
        body: ['Karla', 'system-ui', 'sans-serif'],
      },
      fontSize: {
        display: ['54px', { lineHeight: '1.1', fontWeight: '700' }],
        h2: ['32px', { lineHeight: '1.2', fontWeight: '700' }],
        h3: ['20px', { lineHeight: '1.3', fontWeight: '600' }],
        body: ['17px', { lineHeight: '1.6' }],
        caption: ['13px', { lineHeight: '1.4', letterSpacing: '0.18em', fontWeight: '700' }],
      },
      borderRadius: {
        sm: 'var(--radius-card-sm)',
        DEFAULT: 'var(--radius-card)',
        lg: 'var(--radius-card-lg)',
        hero: 'var(--radius-hero)',
        pill: 'var(--radius-pill)',
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
