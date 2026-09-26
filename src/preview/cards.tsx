import * as React from 'react'
import ReactDOM from 'react-dom/client'

import '@/styles/tokens.css'
import '@/styles/global.css'
import '@/styles/shadcn-bridge.css'
import '@/i18n'

import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Icon } from '@/components/ui/icon'
import { Progress } from '@/components/ui/progress'
import { Separator } from '@/components/ui/separator'
import { Stat } from '@/components/ui/stat'
import { ToneBadge } from '@/components/ui/tone-badge'
import { PlatformProvider } from '@/lib/platform'

/** Card reference.
 *
 *  Every composition shadcn's Card supports, at its real rendered size, so a
 *  card can be CHOSEN rather than invented. Each sample reports its own
 *  measured height and padding, because the argument for using a component is
 *  that its spacing is already decided -- and that only helps if the numbers
 *  are visible.
 */

/** Measures its own rendered box, so no size here is a claim -- it is read
 *  back off the DOM after layout. */
function Measured({
  label,
  note,
  width,
  children,
}: {
  label: string
  note: string
  width: number
  children: React.ReactNode
}) {
  const ref = React.useRef<HTMLDivElement>(null)
  const [size, setSize] = React.useState<string>('')

  React.useLayoutEffect(() => {
    const el = ref.current?.firstElementChild as HTMLElement | null
    if (!el) return
    const r = el.getBoundingClientRect()
    const cs = getComputedStyle(el)
    setSize(
      `${Math.round(r.width)}×${Math.round(r.height)}px · padding ${cs.paddingTop || '0px'}`,
    )
  }, [width])

  return (
    <figure className="m-0 flex flex-col gap-2">
      <figcaption className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
        <span className="font-display text-[12px] font-bold uppercase tracking-[0.1em]">
          {label}
        </span>
        <span className="font-display text-[11px] tabular-nums text-muted-foreground">
          {size}
        </span>
        <span className="w-full text-[12px] leading-snug text-muted-foreground">{note}</span>
      </figcaption>
      <div ref={ref} style={{ width }}>
        {children}
      </div>
    </figure>
  )
}

const SIDEBAR = 340 // 4 of 12 columns at 1440 — the tile slot
const BANNER = 1100 // 12 of 12 — the wide slot

function Gallery() {
  const [theme, setTheme] = React.useState<'light' | 'dark'>('light')
  React.useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme)
  }, [theme])

  return (
    <div className="min-h-screen bg-background p-6 text-foreground">
      <header className="mb-6 flex items-center justify-between gap-3 border-b border-border/[0.14] pb-4">
        <div>
          <h1 className="font-display text-[24px] font-bold">Card reference</h1>
          <p className="text-[14px] text-muted-foreground">
            Every shadcn Card composition, at real measured size. Sizes are read
            from the DOM, not written by hand.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setTheme((t) => (t === 'light' ? 'dark' : 'light'))}
          className="rounded-card-sm border border-border/[0.14] bg-card px-3 py-2 font-display text-[13px] font-semibold"
        >
          {theme === 'light' ? 'Dark theme' : 'Light theme'}
        </button>
      </header>

      <div className="flex flex-col gap-9">
        {/* ------------------------------------------------ stock ---- */}
        <section className="flex flex-col gap-5">
          <h2 className="font-display text-[15px] font-bold uppercase tracking-[0.1em] text-muted-foreground">
            A · Stock shadcn — what you get untouched
          </h2>

          <Measured
            label="Full stack"
            width={SIDEBAR}
            note="Header + Content + Footer. p-6 throughout — 24px. This is the roomy desktop default, and it is why the organisms overrode it."
          >
            <Card>
              <CardHeader>
                <CardTitle>Expiring offers</CardTitle>
                <CardDescription>
                  Trades cancel automatically after 24 hours.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">Two offers waiting.</p>
              </CardContent>
              <CardFooter className="gap-2">
                <Button variant="ghost" size="sm">
                  Pass
                </Button>
                <Button variant="primary" size="sm">
                  Review
                </Button>
              </CardFooter>
            </Card>
          </Measured>

          <Measured
            label="Header only"
            width={SIDEBAR}
            note="The lightest stock card. Still 24px padding top and bottom."
          >
            <Card>
              <CardHeader>
                <CardTitle>Streak: 4 days active</CardTitle>
                <CardDescription>Next bonus in 14h 22m.</CardDescription>
              </CardHeader>
            </Card>
          </Measured>
        </section>

        {/* -------------------------------------------- compacted ---- */}
        <section className="flex flex-col gap-5">
          <h2 className="font-display text-[15px] font-bold uppercase tracking-[0.1em] text-muted-foreground">
            B · Same parts, Bartefy density
          </h2>
          <p className="max-w-[70ch] text-[13px] text-muted-foreground">
            Identical components with <code>p-4</code> instead of{' '}
            <code>p-6</code>, and the title on the display face. This is what a
            re-branded Card would give by default, the way{' '}
            <code>Button</code> was re-branded — no override at the call site.
          </p>

          <Measured
            label="Full stack · compact"
            width={SIDEBAR}
            note="Header + Content + Footer at 16px. Same structure, fits a 4-of-12 sidebar."
          >
            <Card>
              <CardHeader className="p-4 pb-2">
                <CardTitle className="font-display text-[16px] font-bold">
                  Expiring offers
                </CardTitle>
                <CardDescription className="text-[12px] leading-snug">
                  Trades cancel automatically after 24 hours.
                </CardDescription>
              </CardHeader>
              <CardContent className="p-4 pt-0">
                <p className="text-[12px] text-muted-foreground">Two offers waiting.</p>
              </CardContent>
              <CardFooter className="gap-2 p-4 pt-0">
                <Button variant="ghost" size="sm" className="h-auto px-3 py-1 text-[11px]">
                  Pass
                </Button>
                <Button variant="primary" size="sm" className="h-auto px-3 py-1 text-[11px]">
                  Review
                </Button>
              </CardFooter>
            </Card>
          </Measured>

          <Measured
            label="Header + badge"
            width={SIDEBAR}
            note="A title row with a status pill. CardHeader handles the stack; ToneBadge is the pill."
          >
            <Card>
              <CardHeader className="p-4">
                <div className="flex items-start justify-between gap-2">
                  <CardTitle className="font-display text-[16px] font-bold">
                    Expiring offers
                  </CardTitle>
                  <ToneBadge tone="brass">1 urgent</ToneBadge>
                </div>
                <CardDescription className="text-[12px] leading-snug">
                  Trades cancel automatically after 24 hours.
                </CardDescription>
              </CardHeader>
            </Card>
          </Measured>

          <Measured
            label="Header + Separator + Content"
            width={SIDEBAR}
            note="Separator instead of a hand-drawn border. One atom, correct colour in both themes."
          >
            <Card>
              <CardHeader className="p-4 pb-3">
                <CardTitle className="font-display text-[16px] font-bold">My table</CardTitle>
              </CardHeader>
              <Separator />
              <CardContent className="p-4">
                <div className="flex gap-5">
                  <Stat value="4" label="live" />
                  <Stat value="2" label="idle" />
                </div>
              </CardContent>
            </Card>
          </Measured>
        </section>

        {/* ----------------------------------------------- shapes ---- */}
        <section className="flex flex-col gap-5">
          <h2 className="font-display text-[15px] font-bold uppercase tracking-[0.1em] text-muted-foreground">
            C · The three shapes the organisms actually need
          </h2>

          <Measured
            label="Banner — wide"
            width={BANNER}
            note="One row: icon, text, and a trailing group. The streak's wide variant is this shape."
          >
            <Card className="flex flex-wrap items-center justify-between gap-4 p-4">
              <div className="flex min-w-0 flex-1 items-center gap-3">
                <span className="grid size-11 shrink-0 place-items-center rounded-card bg-brand-coral text-on-accent">
                  <Icon name="Flame" size={22} aria-hidden />
                </span>
                <div className="flex min-w-0 flex-col">
                  <span className="font-display text-[16px] font-bold leading-tight">
                    Streak: 4 days active
                  </span>
                  <span className="text-[12px] leading-tight text-muted-foreground">
                    Next bonus in 14h 22m.
                  </span>
                </div>
              </div>
              <div className="flex shrink-0 gap-2">
                {['D1', 'D2', 'D3'].map((d) => (
                  <span
                    key={d}
                    className="grid w-[52px] place-items-center rounded-card-sm bg-card py-2 font-display text-[11px] font-bold shadow-[var(--shadow-card)]"
                  >
                    {d}
                  </span>
                ))}
              </div>
            </Card>
          </Measured>

          <Measured
            label="List card — tile"
            width={SIDEBAR}
            note="Header, then a list of rows. Each row is its own small card. Expiring Offers is this shape."
          >
            <Card>
              <CardHeader className="p-4 pb-2">
                <div className="flex items-start justify-between gap-2">
                  <CardTitle className="font-display text-[16px] font-bold">
                    Expiring offers
                  </CardTitle>
                  <ToneBadge tone="brass">1 urgent</ToneBadge>
                </div>
              </CardHeader>
              <CardContent className="flex flex-col gap-2 p-4 pt-0">
                {['Levi’s Type III Denim', 'Mid-Century Teak Planter'].map((title) => (
                  <div
                    key={title}
                    className="flex items-center gap-2.5 rounded-card bg-card p-3 shadow-[var(--shadow-card)]"
                  >
                    <span className="grid size-10 shrink-0 place-items-center rounded-card-sm bg-muted text-muted-foreground">
                      <Icon name="Package" size={16} aria-hidden />
                    </span>
                    <span className="min-w-0 flex-1 font-display text-[13px] font-bold leading-tight">
                      {title}
                    </span>
                  </div>
                ))}
              </CardContent>
            </Card>
          </Measured>

          <Measured
            label="Strip — compact"
            width={SIDEBAR}
            note="One line. No header, no footer — a CardContent on its own, or no parts at all."
          >
            <Card className="flex items-center gap-2.5 p-3">
              <span className="grid size-8 shrink-0 place-items-center rounded-card-sm bg-brand-coral text-on-accent">
                <Icon name="Flame" size={16} aria-hidden />
              </span>
              <span className="min-w-0 flex-1 font-display text-[13px] font-semibold">
                4-day streak
              </span>
              <span className="font-display text-[13px] font-bold text-state-settled">+5</span>
            </Card>
          </Measured>

          <Measured
            label="Meter card"
            width={SIDEBAR}
            note="Header, Progress, caption. What Tier & Perks and the streak tile both need."
          >
            <Card>
              <CardHeader className="p-4 pb-3">
                <CardTitle className="font-display text-[16px] font-bold">Hunter tier</CardTitle>
                <CardDescription className="text-[12px]">6 of 6 live finds</CardDescription>
              </CardHeader>
              <CardContent className="p-4 pt-0">
                <Progress value={100} className="h-1.5" />
              </CardContent>
            </Card>
          </Measured>
        </section>
      </div>
    </div>
  )
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <PlatformProvider>
      <Gallery />
    </PlatformProvider>
  </React.StrictMode>,
)
