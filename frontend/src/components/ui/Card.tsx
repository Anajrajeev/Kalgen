import { ReactNode } from 'react';
import { cn } from '../../utils/cn';

interface CardProps {
  children: ReactNode;
  className?: string;
}

export function Card({ children, className }: CardProps) {
  return (
    <div className={cn('bg-AgriNiti-surface border border-AgriNiti-border rounded-2xl shadow-soft-card', className)}>
      {children}
    </div>
  );
}

