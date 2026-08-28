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
        // gentle only: fades and short slides, no bounce, no scale
        'fade-in': { from: { opacity: '0' }, to: { opacity: '1' } },
        'sheet-up': { from: { transform: 'translateY(8px)', opacity: '0' }, to: { transform: 'translateY(0)', opacity: '1' } },
      },
      animation: {
        'fade-in': 'fade-in 140ms var(--ease-out)',
        'sheet-up': 'sheet-up 240ms var(--ease-out)',
      },
    },
  },
  plugins: [animate],
} satisfies Config;
