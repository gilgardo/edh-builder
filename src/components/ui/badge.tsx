import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';

import { cn } from '@/lib/utils';

const badgeVariants = cva(
  'inline-flex items-center rounded-md border px-2.5 py-0.5 text-xs font-semibold transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2',
  {
    variants: {
      variant: {
        default: 'border-transparent bg-primary text-primary-foreground shadow hover:bg-primary/80',
        secondary: 'border-transparent bg-secondary text-secondary-foreground hover:bg-secondary/80',
        destructive: 'border-transparent bg-destructive text-destructive-foreground shadow hover:bg-destructive/80',
        outline: 'text-foreground border-border',
        success: 'border-transparent bg-emerald-500 text-white shadow hover:bg-emerald-600',
        warning: 'border-transparent bg-amber-500 text-black shadow hover:bg-amber-600',
        info: 'border-transparent bg-sky-500 text-white shadow hover:bg-sky-600',
        // Mana-colored variants
        'mana-w': 'border-transparent bg-mtg-white-500 text-mtg-black-800 shadow-sm',
        'mana-u': 'border-transparent bg-mtg-blue-500 text-white shadow-sm',
        'mana-b': 'border-transparent bg-mtg-black-500 text-mtg-white-500 shadow-sm',
        'mana-r': 'border-transparent bg-mtg-red-500 text-white shadow-sm',
        'mana-g': 'border-transparent bg-mtg-green-500 text-white shadow-sm',
        'mana-c': 'border-transparent bg-mtg-colorless-500 text-white shadow-sm',
        // Guild gradient variants
        'guild-azorius': 'border-transparent bg-gradient-to-r from-mtg-white-400 to-mtg-blue-500 text-white shadow-sm',
        'guild-dimir': 'border-transparent bg-gradient-to-r from-mtg-blue-500 to-mtg-black-400 text-white shadow-sm',
        'guild-rakdos': 'border-transparent bg-gradient-to-r from-mtg-black-400 to-mtg-red-500 text-white shadow-sm',
        'guild-gruul': 'border-transparent bg-gradient-to-r from-mtg-red-500 to-mtg-green-500 text-white shadow-sm',
        'guild-selesnya': 'border-transparent bg-gradient-to-r from-mtg-green-500 to-mtg-white-400 text-mtg-black-800 shadow-sm',
        'guild-orzhov': 'border-transparent bg-gradient-to-r from-mtg-white-400 to-mtg-black-400 text-white shadow-sm',
        'guild-izzet': 'border-transparent bg-gradient-to-r from-mtg-blue-500 to-mtg-red-500 text-white shadow-sm',
        'guild-golgari': 'border-transparent bg-gradient-to-r from-mtg-black-400 to-mtg-green-500 text-white shadow-sm',
        'guild-boros': 'border-transparent bg-gradient-to-r from-mtg-red-500 to-mtg-white-400 text-mtg-black-800 shadow-sm',
        'guild-simic': 'border-transparent bg-gradient-to-r from-mtg-green-500 to-mtg-blue-500 text-white shadow-sm',
        // Subtle/muted variants
        'muted': 'border-transparent bg-muted text-muted-foreground',
        'muted-primary': 'border-transparent bg-primary/10 text-primary',
        'muted-destructive': 'border-transparent bg-destructive/10 text-destructive',
        'muted-success': 'border-transparent bg-emerald-500/10 text-emerald-600 dark:text-emerald-400',
      },
      size: {
        default: 'px-2.5 py-0.5 text-xs',
        sm: 'px-2 py-px text-[10px]',
        lg: 'px-3 py-1 text-sm',
      },
      animation: {
        none: '',
        pulse: 'animate-pulse',
        glow: 'animate-glow',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
      animation: 'none',
    },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {
  /** Show a pulsing dot indicator */
  dot?: boolean;
}

function Badge({ className, variant, size, animation, dot, children, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant, size, animation }), className)} {...props}>
      {dot && (
        <span className="relative mr-1.5 flex h-2 w-2">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-current opacity-75" />
          <span className="relative inline-flex h-2 w-2 rounded-full bg-current" />
        </span>
      )}
      {children}
    </div>
  );
}

export { Badge, badgeVariants };
