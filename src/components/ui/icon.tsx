import type * as React from 'react'

import { MaterialIcon } from './material-icon'
import { MATERIAL_PATHS, type MaterialIconName } from './material-paths'

/** The app's icon. V6 draws Material Symbols everywhere (the Stitch mocks);
 *  the names below are the ones screens already used, each mapped to the
 *  symbol the mock draws for that job. Add a name here, and the symbol to
 *  scripts/gen-material-icons.mjs if it is new.
 */
const ICONS = {
  ArrowLeft: 'arrow_back',
  ArrowRight: 'arrow_forward',
  Bell: 'notifications',
  Camera: 'photo_camera',
  Check: 'check',
  ChevronDown: 'expand_more',
  ChevronLeft: 'chevron_left',
  ChevronRight: 'chevron_right',
  ChevronUp: 'expand_less',
  Clock: 'schedule',
  Compass: 'explore',
  Globe: 'language',
  Heart: 'favorite',
  Info: 'info',
  MapPin: 'location_on',
  MessageCircle: 'chat_bubble',
  MessageSquareText: 'chat',
  Package: 'inventory_2',
  Plus: 'add',
  RotateCcw: 'autorenew',
  Search: 'search',
  Settings: 'settings',
  ShieldAlert: 'shield_person',
  ShieldOff: 'remove_moderator',
  Sparkles: 'auto_awesome',
  Star: 'star',
  Sun: 'light_mode',
  Moon: 'dark_mode',
  Trash2: 'delete',
  User: 'person',
  X: 'close',
  Minus: 'remove',
  Layers: 'layers',
  Menu: 'menu',
  ChartColumn: 'bar_chart',
  Mail: 'mail',
  MailOpen: 'drafts',
  Mic: 'mic',
  Play: 'play_arrow',
  Pause: 'pause',
  BadgeCheck: 'verified',
  Dot: 'circle',
  // Categories -- one per entry in CATEGORIES (lib/taxonomy.ts).
  Armchair: 'chair',
  Baby: 'child_care',
  Bike: 'pedal_bike',
  Book: 'menu_book',
  CookingPot: 'cooking',
  Gem: 'diamond',
  Hammer: 'handyman',
  Laptop: 'devices',
  Music: 'music_note',
  Palette: 'palette',
  Shapes: 'extension',
  Shirt: 'apparel',
  Sofa: 'weekend',
  Sprout: 'yard',
  // Shell.
  Handshake: 'handshake',
  Coins: 'toll',
  Flame: 'local_fire_department',
  CirclePlus: 'add_circle',
  PanelLeftClose: 'left_panel_close',
  PanelLeftOpen: 'left_panel_open',
  LogOut: 'logout',
  Languages: 'translate',
  EllipsisVertical: 'more_vert',
  Lock: 'lock',
  CircleCheck: 'check_circle',
  GalleryVerticalEnd: 'style',
  ImagePlus: 'add_photo_alternate',
  UserPlus: 'group_add',
  ShieldCheck: 'verified_user',
  // Discover.
  Zap: 'bolt',
  TrendingUp: 'trending_up',
  Undo2: 'undo',
  Maximize2: 'open_in_full',
  Navigation: 'near_me',
  Flag: 'flag',
  AlarmClock: 'alarm',
  Store: 'table_restaurant',
  Shield: 'shield',
  ArrowLeftRight: 'sync_alt',
} as const satisfies Record<string, MaterialIconName>

export type IconName = keyof typeof ICONS

export interface IconProps extends Omit<React.SVGProps<SVGSVGElement>, 'name'> {
  name: IconName
  size?: number | string
  /** The symbol's filled form, where the mock draws one (FILL 1). */
  filled?: boolean
  /** Ignored: Material Symbols have a fixed weight. Kept so old call sites compile. */
  strokeWidth?: number | string
}

export function Icon({ name, size = 20, filled = false, strokeWidth: _sw, ...props }: IconProps) {
  const base = ICONS[name]
  if (!base) return null
  const fill = `${base}_fill`
  const symbol = filled && fill in MATERIAL_PATHS ? (fill as MaterialIconName) : base
  return <MaterialIcon name={symbol} size={size} {...props} />
}
