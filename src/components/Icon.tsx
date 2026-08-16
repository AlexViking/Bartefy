import React from 'react'
import { type LucideProps } from 'lucide-react'
import * as LucideIcons from 'lucide-react'

interface IconProps extends LucideProps {
  name: keyof typeof LucideIcons
}

export function Icon({ name, size = 20, ...props }: IconProps) {
  const LucideIcon = LucideIcons[name] as React.ComponentType<LucideProps>
  if (!LucideIcon) return null
  return <LucideIcon size={size} {...props} />
}
