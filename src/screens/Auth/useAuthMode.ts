import { useLocation } from 'react-router'

import type { AuthMode } from './useAuth'

/** Sign-up and sign-in are one screen serving two routes, so the mode comes
 *  from the path rather than a prop — createScreen renders platform layouts
 *  with no arguments, and threading a prop through it would make every other
 *  screen carry a parameter only this one uses.
 */
export function useAuthMode(): AuthMode {
  const { pathname } = useLocation()
  return pathname.startsWith('/signup') ? 'signup' : 'signin'
}
