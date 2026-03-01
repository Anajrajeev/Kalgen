import { ReactNode } from 'react';
import { cn } from '../../utils/cn';

type BadgeTone = 'neutral' | 'success' | 'warning' | 'error' | 'info';

interface BadgeProps {
  children: ReactNode;
  tone?: BadgeTone;
  className?: string;
}

export function Badge({ children, tone = 'neutral', className }: BadgeProps) {
  const tones: Record<BadgeTone, string> = {
    neutral: 'bg-AgriNiti-bg text-AgriNiti-text-muted border border-AgriNiti-border',
    success: 'bg-AgriNiti-success/10 text-AgriNiti-success border border-AgriNiti-success/40',
    warning: 'bg-AgriNiti-warning/10 text-AgriNiti-warning border border-AgriNiti-warning/40',
    error: 'bg-AgriNiti-error/10 text-AgriNiti-error border border-AgriNiti-error/40',
    info: 'bg-AgriNiti-accent-blue/10 text-AgriNiti-accent-blue border border-AgriNiti-accent-blue/40'
  };

  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full px-3 py-1 text-sm font-medium',
        tones[tone],
        className
      )}
    >
      {children}
    </span>
  );
}

