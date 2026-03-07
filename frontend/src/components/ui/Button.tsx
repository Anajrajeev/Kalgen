import { ButtonHTMLAttributes } from 'react';
import { cn } from '../../utils/cn';

type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
}

export function Button({ variant = 'primary', className, ...props }: ButtonProps) {
  const base =
    'inline-flex items-center justify-center rounded-lg px-6 py-3 text-base font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-AgriNiti-primary focus:ring-offset-2 focus:ring-offset-AgriNiti-bg disabled:opacity-60 disabled:cursor-not-allowed';

  const variants: Record<ButtonVariant, string> = {
    primary: 'bg-AgriNiti-primary text-white hover:bg-AgriNiti-primary-hover shadow-sm',
    secondary:
      'border border-AgriNiti-border bg-white text-AgriNiti-text hover:bg-AgriNiti-bg shadow-sm',
    ghost: 'text-AgriNiti-text-muted hover:bg-AgriNiti-bg',
    danger: 'bg-red-600 text-white hover:bg-red-700 shadow-sm'
  };

  return <button className={cn(base, variants[variant], className)} {...props} />;
}

