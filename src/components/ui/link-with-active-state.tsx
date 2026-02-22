import Link from 'next/link';
import type { ComponentType } from 'react';
import type { Route } from 'next';
import { cn } from '@/lib/utils';

interface LinkWithActiveStateProps {
  isActive: boolean;
  icon: ComponentType<{ className?: string }>;
  label: string;
  href?: Route;
  onClick?: () => void;
}

export default function LinkWithActiveState({
  isActive,
  icon: Icon,
  label,
  href,
  onClick,
}: LinkWithActiveStateProps) {
  const className = cn(
    'flex items-center gap-2 rounded-md px-3 py-1.5 text-sm font-medium transition-colors',
    isActive
      ? 'bg-primary text-primary-foreground'
      : 'text-muted-foreground hover:bg-muted hover:text-foreground'
  );

  if (href) {
    return (
      <Link href={href} className={className}>
        <Icon className="h-4 w-4" />
        {label}
      </Link>
    );
  }

  return (
    <button type="button" onClick={onClick} className={className}>
      <Icon className="h-4 w-4" />
      {label}
    </button>
  );
}
