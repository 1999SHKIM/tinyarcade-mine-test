import type { ButtonHTMLAttributes, ReactNode } from 'react'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost'
  children: ReactNode
}

export function Button({
  variant = 'primary',
  className = '',
  children,
  ...props
}: ButtonProps) {
  const styles: Record<NonNullable<ButtonProps['variant']>, string> = {
    primary: 'bg-indigo-600 text-white hover:bg-indigo-700',
    secondary: 'bg-slate-200 text-slate-800 hover:bg-slate-300',
    danger: 'bg-rose-600 text-white hover:bg-rose-700',
    ghost: 'bg-transparent text-slate-700 hover:bg-slate-100',
  }

  return (
    <button
      className={`inline-flex items-center justify-center rounded-md px-3 py-1.5 text-sm font-medium transition-colors disabled:opacity-50 ${styles[variant]} ${className}`}
      {...props}
    >
      {children}
    </button>
  )
}
