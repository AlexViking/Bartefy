import * as React from 'react'
import { createPortal } from 'react-dom'

import { TOPBAR_CONTEXT_ID } from './TopBar'

/** Put something in the top bar's middle, from a page.
 *
 *  The top bar is mounted once, above the router, so a page cannot pass it
 *  props. It renders an empty slot instead, and a page portals into it -- the
 *  content lives and dies with the page. Desktop and tablet only; the phone
 *  bar has no middle.
 */
export function TopBarContext({ children }: { children: React.ReactNode }) {
  const [slot, setSlot] = React.useState<HTMLElement | null>(null)
  React.useLayoutEffect(() => {
    setSlot(document.getElementById(TOPBAR_CONTEXT_ID))
  }, [])
  return slot ? createPortal(children, slot) : null
}
