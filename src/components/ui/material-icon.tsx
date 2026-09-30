import type * as React from 'react'

import { MATERIAL_PATHS, type MaterialIconName } from './material-paths'

export type { MaterialIconName }

/** One Material Symbol, drawn inline (no icon font to load or flash).
 *  `name_fill` is the filled form -- see scripts/gen-material-icons.mjs. */
export function MaterialIcon({
  name,
  size = 24,
  className,
  style,
  ...rest
}: { name: MaterialIconName; size?: number | string } & Omit<React.SVGProps<SVGSVGElement>, 'name'>) {
  return (
    <svg
      aria-hidden="true"
      width={size}
      height={size}
      viewBox="0 -960 960 960"
      fill="currentColor"
      className={className}
      style={style}
      {...rest}
    >
      <path d={MATERIAL_PATHS[name]} />
    </svg>
  )
}
