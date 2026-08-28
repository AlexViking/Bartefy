import * as React from 'react'
import { useTranslation } from 'react-i18next'

/** Every visible string in Bartefy renders through <T>.
 *
 *  Two things happen at once:
 *   1. The string is translated by i18next (plurals, interpolation, fallbacks).
 *   2. The rendered element carries `data-i18n="<key>"` in the DOM.
 *
 *  That attribute is the point. It makes translation state inspectable in
 *  devtools, lets QA script a sweep for untranslated nodes, and gives external
 *  translation tooling a handle on real rendered copy rather than source code.
 *
 *      <T k="hunt.empty.title" />
 *      <T k="hunt.empty.body" values={{ radius: 10 }} />
 *      <T k="swap.status" as="span" className="text-muted-foreground" />
 */
export interface TProps extends Omit<React.HTMLAttributes<HTMLElement>, 'children'> {
  /** Translation key, e.g. "hunt.empty.title". */
  k: string
  /** Interpolation values, e.g. {{ radius }} in the EN string. */
  values?: Record<string, string | number>
  /** Element to render. Defaults to a span so <T> is inline-safe anywhere. */
  as?: keyof JSX.IntrinsicElements
  /** Shown if the key is missing entirely — prefer fixing en.json instead. */
  fallback?: string
}

export function T({ k, values, as: Tag = 'span', fallback, ...rest }: TProps) {
  const { t } = useTranslation()
  const text = t(k, { ...values, defaultValue: fallback ?? k })

  if (import.meta.env.DEV && text === k) {
    console.warn(`[i18n] Missing key "${k}" — add it to src/i18n/locales/en.json`)
  }

  return (
    <Tag data-i18n={k} {...rest}>
      {text}
    </Tag>
  )
}

/** For places that need a plain string rather than an element: placeholders,
 *  aria-labels, document titles, toast bodies.
 *
 *  Prefer <T> wherever a DOM node is acceptable — a string cannot carry the
 *  data-i18n attribute, so it is invisible to the translation sweep.
 */
export function useT() {
  const { t, i18n } = useTranslation()
  return {
    t: (k: string, values?: Record<string, string | number>) =>
      t(k, { ...values, defaultValue: k }),
    lang: i18n.language,
  }
}

/** Attribute-only helper: spread onto an element whose text is set another way,
 *  so the sweep still sees which key produced it.
 *
 *      <input placeholder={t('auth.email.placeholder')} {...i18nAttr('auth.email.placeholder')} />
 */
export function i18nAttr(k: string) {
  return { 'data-i18n': k }
}
