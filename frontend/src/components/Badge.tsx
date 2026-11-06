import type { ReactNode } from 'react'

interface BadgeProps {
  tone?: 'official' | 'user' | 'warning' | 'neutral'
  children: ReactNode
}

export function Badge({ tone = 'neutral', children }: BadgeProps) {
  const styles: Record<NonNullable<BadgeProps['tone']>, string> = {
    official: 'bg-indigo-100 text-indigo-700',
    user: 'bg-emerald-100 text-emerald-700',
    warning: 'bg-amber-100 text-amber-800',
    neutral: 'bg-slate-100 text-slate-700',
  }

  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${styles[tone]}`}>
      {children}
    </span>
  )
}
