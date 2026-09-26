import * as React from 'react'
import ReactDOM from 'react-dom/client'

// Same order as main.tsx: global.css defines @layer base and must precede the
// bridge so layer order stays base < components < utilities.
import '@/styles/tokens.css'
import '@/styles/global.css'
import '@/styles/shadcn-bridge.css'
import '@/i18n'

import {
  StreakOrganism,
  STREAK_DEMO,
  STREAK_SPEC,
  type StreakVariant,
} from '@/components/organisms/StreakOrganism'
import {
  ExpiringOffersOrganism,
  OFFERS_DEMO,
  OFFERS_SPEC,
  type OffersVariant,
} from '@/components/organisms/ExpiringOffersOrganism'
import type { AnyOrganismSpec, SizeVariant } from '@/layout/organism'
import { PlatformProvider } from '@/lib/platform'
import { setAnalyticsUser } from '@/lib/analytics'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { EventInspector } from './EventInspector'
import i18n from 'i18next'
import { I18nextProvider, initReactI18next } from 'react-i18next'
import enPack from '@/i18n/locales/en.json'

/** Organism gallery.
 *
 *  Renders each V6 organism at every size variant, on every platform width,
 *  in both themes -- using the REAL component, not a copy. A hand-rewritten
 *  preview proves nothing: it can look right while the shipped component is
 *  broken. This mounts the same module a screen would.
 *
 *  It also shows the two contracts that make an organism integratable:
 *  its DATA PIPELINE (what feeds it) and its INTERACTION TARGETS (what it
 *  emits) -- and a live event stream so a click can be checked against the
 *  payload the Analytics UI will actually receive.
 */

/* The gallery must never write to the real events table. setAnalyticsUser is
 * never called with an id, so flush() drops every queued event -- while the
 * dev tap still fires, which is what the inspector reads. Belt and braces:
 * each organism is also mounted with track={false} except the live one. */
setAnalyticsUser(null)

/* TWO pinned instances so both languages render SIMULTANEOUSLY.
 *
 * The point is to see them beside each other, because that is how a layout
 * problem shows itself -- Georgian has no uppercase at all and its words run
 * longer, so a label that fits in English can wrap or clip.
 *
 * Neither uses the app's shared instance, and neither uses cloneInstance():
 * a clone SHARES the resource store, so changeLanguage on the clone fired on
 * the original too and rendered Georgian in both columns. The app's own
 * instance is also under a LanguageDetector that can switch it at any time.
 *
 * Two independent createInstance() calls, each pinned with `lng` and no
 * detector, is the only arrangement where the columns cannot drift.
 */
const enI18n = i18n.createInstance()
void enI18n.use(initReactI18next).init({
  resources: { en: { translation: enPack } },
  lng: 'en',
  fallbackLng: 'en',
  interpolation: { escapeValue: false },
  returnNull: false,
})

const kaI18n = i18n.createInstance()
void kaI18n.use(initReactI18next).init({
  resources: { en: { translation: enPack } },
  lng: 'ka',
  // Keys the KA pack does not define fall back to English rather than
  // rendering a raw key -- the same behaviour the app has.
  fallbackLng: 'en',
  interpolation: { escapeValue: false },
  returnNull: false,
})
void import('@/i18n/locales/ka.json').then((pack) => {
  kaI18n.addResourceBundle('ka', 'translation', pack.default, true, true)
  void kaI18n.changeLanguage('ka')
})

const PLATFORMS = [
  { id: 'mobile', label: 'Mobile', width: 390, cols: 4, gap: 12 },
  { id: 'tablet', label: 'Tablet', width: 768, cols: 8, gap: 16 },
  { id: 'desktop', label: 'Desktop', width: 1440, cols: 12, gap: 24 },
] as const

type PlatformId = (typeof PLATFORMS)[number]['id']

/** Every organism in the gallery: its spec, and how to render one. Adding an
 *  organism is one entry here -- the platform/variant/language/arm matrix is
 *  generic. */
/** Lifecycle states, shown only where an organism declares them. */
const STATES = [
  { id: 'running', label: 'STATE · mid-cycle' },
  { id: 'ready', label: 'STATE A · day 1 unclaimed' },
  { id: 'complete', label: 'STATE B · 7-day complete' },
] as const

const ORGANISMS = [
  {
    states: STATES,
    spec: STREAK_SPEC as unknown as AnyOrganismSpec,
    render: (p: RenderArgs) => (
      <StreakOrganism
        {...STREAK_DEMO_PROPS}
        state={p.state as 'ready' | 'running' | 'complete'}
        claimable={2}
        cycleTotal={34}
        resetsIn="8h 12m"
        variant={p.variant as StreakVariant}
        col={1}
        span={p.span}
        row={1}
        arm={p.arm}
        platformOverride={p.platform}
        tone={p.tone}
        track={p.track}
      />
    ),
  },
  {
    spec: OFFERS_SPEC as unknown as AnyOrganismSpec,
    render: (p: RenderArgs) => (
      <ExpiringOffersOrganism
        offers={OFFERS_DEMO}
        variant={p.variant as OffersVariant}
        col={1}
        span={p.span}
        row={1}
        arm={p.arm}
        platformOverride={p.platform}
        tone={p.tone}
        track={p.track}
      />
    ),
  },
]

const DEFAULT_PLATFORM: PlatformId =
  typeof window === 'undefined'
    ? 'desktop'
    : window.innerWidth < 768
      ? 'mobile'
      : window.innerWidth < 1024
        ? 'tablet'
        : 'desktop'

interface RenderArgs {
  state?: string
  variant: string
  span: number
  platform: PlatformId
  tone: 'coral' | 'attention'
  arm: string
  track: boolean
}

function minSpan(spec: AnyOrganismSpec, v: SizeVariant, p: PlatformId) {
  return spec.variants[v]?.minSpan[p] ?? null
}

/* ------------------------------------------------------------ the spec -- */

function SpecPanel({ spec }: { spec: AnyOrganismSpec }) {
  const src = spec.data.source
  return (
    <section className="flex flex-col gap-4 rounded-card border border-border/[0.14] bg-card p-4">
      <div>
        <h2 className="font-display text-[17px] font-bold">{spec.id}</h2>
        <p className="text-[13px] text-muted-foreground">{spec.describe}</p>
      </div>

      {/* --- pipeline --- */}
      <div className="flex flex-col gap-1.5">
        <h3 className="font-display text-[11px] font-bold uppercase tracking-[0.12em] text-muted-foreground">
          Data pipeline
        </h3>
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="rounded-card-sm bg-foreground/[0.06] px-2 py-1 font-display text-[12px] font-semibold">
            {src.kind}
          </span>
          {src.kind === 'rpc' && (
            <code className="rounded bg-foreground/[0.06] px-1.5 py-1 text-[12px]">
              {src.fn}()
            </code>
          )}
          {src.kind === 'table' && (
            <code className="rounded bg-foreground/[0.06] px-1.5 py-1 text-[12px]">
              {src.from}
            </code>
          )}
          <code className="rounded bg-foreground/[0.06] px-1.5 py-1 text-[12px]">
            key: {JSON.stringify(spec.data.queryKey)}
          </code>
          {spec.data.unavailable && (
            <span className="rounded-card-sm bg-destructive/[0.12] px-2 py-1 font-display text-[12px] font-bold text-destructive">
              no backend yet
            </span>
          )}
        </div>
        {src.kind === 'mock' && (
          <p className="text-[12.5px] leading-snug text-muted-foreground">
            <b className="font-semibold">Mocked because:</b> {src.because}
          </p>
        )}
      </div>

      {/* --- targets --- */}
      <div className="flex flex-col gap-1.5">
        <h3 className="font-display text-[11px] font-bold uppercase tracking-[0.12em] text-muted-foreground">
          Emits {spec.targets.length} targets
        </h3>
        <ul className="m-0 flex list-none flex-col gap-1 p-0">
          {spec.targets.map((t) => (
            <li key={t.id} className="flex items-baseline gap-2 text-[12.5px]">
              <span
                className={`shrink-0 rounded px-1.5 py-0.5 font-display text-[10px] font-bold uppercase ${
                  t.kind === 'convert'
                    ? 'bg-accent text-accent-foreground'
                    : t.kind === 'click'
                      ? 'bg-primary/[0.14] text-primary'
                      : 'bg-foreground/[0.06] text-muted-foreground'
                }`}
              >
                {t.kind}
              </span>
              <code className="shrink-0 text-[12px]">{t.id}</code>
              <span className="text-muted-foreground">{t.describe}</span>
            </li>
          ))}
        </ul>
      </div>
    </section>
  )
}

/* ------------------------------------------------------------- frames -- */

function Frame({
  platform,
  variant,
  spec,
  render,
  states,
}: {
  platform: (typeof PLATFORMS)[number]
  variant: string
  spec: AnyOrganismSpec
  states?: readonly { id: string; label: string }[]
  render: (p: RenderArgs) => React.ReactNode
}) {
  const span = minSpan(spec, variant as SizeVariant, platform.id)

  if (span == null) {
    return (
      <figure className="m-0 flex flex-col gap-2">
        <figcaption className="flex items-baseline gap-2 font-display text-[11px] font-bold uppercase tracking-[0.12em] text-muted-foreground">
          <span>{variant}</span>
          <span className="opacity-50">not supported on {platform.label}</span>
        </figcaption>
        <div className="rounded-card border border-dashed border-border/[0.2] p-4 text-[13px] text-muted-foreground">
          The grid picks another variant here.
        </div>
      </figure>
    )
  }

  return (
    <figure className="m-0 flex flex-col gap-2">
      <figcaption className="flex items-baseline gap-2 font-display text-[11px] font-bold uppercase tracking-[0.12em] text-muted-foreground">
        <span>{variant}</span>
        <span className="opacity-50">
          {span}/{platform.cols} cols · min span
        </span>
      </figcaption>

      {/* A real grid at the platform's column count, so the organism is
          measured in the space it will actually get. */}
      <div
        className="max-w-full overflow-x-auto rounded-card border border-border/[0.14] bg-background p-3"
      >
        <div style={{ width: platform.width, maxWidth: '100%' }}>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: `repeat(${platform.cols}, minmax(0, 1fr))`,
            gap: platform.gap,
          }}
        >
          <div style={{ gridColumn: `span ${span}` }} className="flex flex-col gap-3">
            {(['coral', 'attention'] as const).map((tone) => (
              <div key={tone} className="flex flex-col gap-2">
                <span className="font-display text-[10px] font-bold uppercase tracking-[0.12em] text-muted-foreground">
                  {tone === 'coral' ? 'ARM A · coral' : 'ARM B · attention red'}
                </span>
                {(states ?? [{ id: undefined, label: '' }]).map((st) => (
                  <div key={st.id} className="flex flex-col gap-1.5">
                    {st.label && st.id !== 'running' && (
                      <span className="font-display text-[10px] font-bold uppercase tracking-[0.1em] text-muted-foreground">
                        {st.label}
                      </span>
                    )}
                    <I18nextProvider i18n={enI18n}>
                      {render({ variant, span, platform: platform.id, tone, state: st.id,
                        arm: tone === 'coral' ? 'a' : 'b', track: true })}
                    </I18nextProvider>
                  </div>
                ))}
                <I18nextProvider i18n={kaI18n}>
                  {render({ variant, span, platform: platform.id, tone,
                    arm: tone === 'coral' ? 'a' : 'b', track: false })}
                </I18nextProvider>
              </div>
            ))}
          </div>
        </div>
        </div>
      </div>
    </figure>
  )
}

const STREAK_DEMO_PROPS = {
  days: STREAK_DEMO,
  streak: 4,
  claimedToday: 5,
  rampTotal: 34,
  nextUnlockIn: '14h 22m',
} as const

function Gallery() {
  const [theme, setTheme] = React.useState<'light' | 'dark'>('light')

  React.useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme)
  }, [theme])

  return (
    <div className="min-h-screen bg-background p-5 text-foreground">
      <header className="mb-5 flex flex-wrap items-center justify-between gap-3 border-b border-border/[0.14] pb-4">
        <div>
          <h1 className="font-display text-[24px] font-bold">Organism gallery</h1>
          <p className="text-[14px] text-muted-foreground">
            Real components · placement, pipeline and instrumentation · click
            anything to see what it emits
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

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_380px] lg:items-start">
        <main className="flex min-w-0 flex-col gap-7">
          <Tabs defaultValue={ORGANISMS[0].spec.id}>
            <TabsList className="mb-4">
              {ORGANISMS.map((o) => (
                <TabsTrigger key={o.spec.id} value={o.spec.id}>
                  {o.spec.id}
                </TabsTrigger>
              ))}
            </TabsList>

            {ORGANISMS.map((o) => (
              <TabsContent key={o.spec.id} value={o.spec.id}>
                <div className="flex flex-col gap-7">
                  <SpecPanel spec={o.spec} />
                  <Tabs defaultValue={DEFAULT_PLATFORM}>
                    <TabsList className="mb-3">
                      {PLATFORMS.map((p) => (
                        <TabsTrigger key={p.id} value={p.id}>
                          {p.label} · {p.width}
                        </TabsTrigger>
                      ))}
                    </TabsList>
                    {PLATFORMS.map((p) => (
                      <TabsContent key={p.id} value={p.id}>
                        <div className="flex flex-col gap-5 overflow-x-auto">
                          {Object.keys(o.spec.variants).map((v) => (
                            <Frame
                              key={v}
                              platform={p}
                              variant={v}
                              spec={o.spec}
                              render={o.render}
                              states={'states' in o ? o.states : undefined}
                            />
                          ))}
                        </div>
                      </TabsContent>
                    ))}
                  </Tabs>
                </div>
              </TabsContent>
            ))}
          </Tabs>
        </main>

        <div className="lg:sticky lg:top-5 lg:max-h-[calc(100vh-40px)]">
          <EventInspector />
        </div>
      </div>
    </div>
  )
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    {/* usePlatform stamps every event with the real resolved platform, so the
        provider is required -- without it the hook throws. */}
    <PlatformProvider>
      <Gallery />
    </PlatformProvider>
  </React.StrictMode>,
)
