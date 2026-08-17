import { useNavigate, useLocation } from 'react-router'
import logoUrl from '@/assets/bartefy-logo-lockup.png'
import { Avatar } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Icon } from '@/components/ui/icon'
import { DESTINATIONS, ADD_DESTINATION } from '@/navigation/destinations'
import { useAuthStore } from '@/store/auth'
import { cn } from '@/lib/utils'

/** Desktop shell. Same four destinations in the same order as the tab bar. */
export function DesktopNav({ city = 'Berlin', radiusKm = 10 }: { city?: string; radiusKm?: number }) {
  const navigate = useNavigate()
  const { pathname } = useLocation()
  const session = useAuthStore((s) => s.session)
  const email = session?.user?.email ?? ''

  return (
    <>
      <div className="hidden h-[68px] shrink-0 lg:block" />
      <header className="fixed inset-x-0 top-0 z-50 hidden items-center justify-between border-b border-border/[0.14] bg-popover px-7 py-2 lg:flex">
        <div className="flex items-center gap-[30px]">
          <img
            src={logoUrl}
            alt="Bartefy"
            className="h-[52px] cursor-pointer"
            onClick={() => navigate('/hunt')}
          />
          <nav className="flex items-center gap-[30px]">
            {DESTINATIONS.map((d) => {
              const active = pathname.startsWith(d.path)
              return (
                <button
                  key={d.id}
                  type="button"
                  onClick={() => navigate(d.path)}
                  aria-current={active ? 'page' : undefined}
                  className={cn(
                    'border-b-[2.5px] pb-[3px] font-display text-base font-semibold transition-colors duration-fast ease-brand',
                    active ? 'border-primary text-primary' : 'border-transparent text-foreground hover:text-primary',
                  )}
                >
                  {d.label}
                </button>
              )
            })}
          </nav>
        </div>

        <div className="flex items-center gap-3.5">
          <button
            type="button"
            className="flex min-h-hit items-center gap-1.5 rounded-pill border-[1.5px] border-border/[0.14] bg-card px-3.5 font-body text-sm text-foreground"
          >
            <Icon name="MapPin" size={15} className="text-primary" />
            {city} {'\u00b7'} {radiusKm} km
            <Icon name="ChevronDown" size={13} className="text-muted-foreground" />
          </button>
          <Button onClick={() => navigate(ADD_DESTINATION.path)}>{ADD_DESTINATION.label}</Button>
          <Avatar name={email} initials={(email[0] ?? 'M').toUpperCase()} size={40} className="cursor-pointer" onClick={() => navigate('/profile')} />
        </div>
      </header>
    </>
  )
}
