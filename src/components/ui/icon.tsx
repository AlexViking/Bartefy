import * as React from 'react'
import {
  ArrowLeft, ArrowRight, Bell, Camera, Check, ChevronDown, ChevronLeft, ChevronRight,
  Clock, Compass, Heart, Info, MapPin, MessageCircle, Package, Plus, RotateCcw, Search,
  Settings, ShieldAlert, Sparkles, Star, Trash2, User, X,
  type LucideProps,
} from 'lucide-react'

/** Named map, not a whole-library barrel import. The old Icon.tsx pulled every
 *  Lucide icon into the bundle. Add icons here as screens need them.
 */
const ICONS = {
  ArrowLeft, ArrowRight, Bell, Camera, Check, ChevronDown, ChevronLeft, ChevronRight,
  Clock, Compass, Heart, Info, MapPin, MessageCircle, Package, Plus, RotateCcw, Search,
  Settings, ShieldAlert, Sparkles, Star, Trash2, User, X,
} as const

export type IconName = keyof typeof ICONS

export interface IconProps extends LucideProps {
  name: IconName
}

export function Icon({ name, size = 20, strokeWidth = 2, ...props }: IconProps) {
  const C = ICONS[name] as React.ComponentType<LucideProps>
  if (!C) return null
  return <C size={size} strokeWidth={strokeWidth} {...props} />
}
