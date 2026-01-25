import * as React from 'react';
import { Slot } from '@radix-ui/react-slot';
import { cva, type VariantProps } from 'class-variance-authority';

import { cn } from '@/lib/utils';

const buttonVariants = cva(
  'inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 active-scale',
  {
    variants: {
      variant: {
        default: 'bg-primary text-primary-foreground shadow hover:bg-primary/90 hover:shadow-md',
        destructive: 'bg-destructive text-destructive-foreground shadow-sm hover:bg-destructive/90',
        outline: 'border border-border bg-background shadow-sm hover:bg-muted hover:text-foreground hover:border-primary/30',
        secondary: 'bg-secondary text-secondary-foreground shadow-sm hover:bg-secondary/80',
        ghost: 'hover:bg-muted hover:text-foreground',
        link: 'text-primary underline-offset-4 hover:underline',
        // MTG-themed variants
        shimmer: 'bg-primary text-primary-foreground shadow hover:bg-primary/90 btn-shimmer',
        gradient: 'bg-gradient-to-r from-primary to-accent text-white shadow-md hover:shadow-lg hover:brightness-110',
        'gradient-gold': 'bg-gradient-to-r from-amber-500 to-yellow-400 text-black shadow-md hover:shadow-lg hover:brightness-110',
        // Mana-colored variants
        'mana-w': 'bg-mtg-white-500 text-mtg-black-800 shadow-sm hover:bg-mtg-white-400 hover:shadow-md',
        'mana-u': 'bg-mtg-blue-500 text-white shadow-sm hover:bg-mtg-blue-400 hover:shadow-md',
        'mana-b': 'bg-mtg-black-500 text-mtg-white-500 shadow-sm hover:bg-mtg-black-400 hover:shadow-md',
        'mana-r': 'bg-mtg-red-500 text-white shadow-sm hover:bg-mtg-red-400 hover:shadow-md',
        'mana-g': 'bg-mtg-green-500 text-white shadow-sm hover:bg-mtg-green-400 hover:shadow-md',
        // Guild gradient buttons
        'guild-azorius': 'bg-gradient-to-r from-mtg-white-400 to-mtg-blue-500 text-white shadow-md hover:shadow-lg',
        'guild-dimir': 'bg-gradient-to-r from-mtg-blue-500 to-mtg-black-400 text-white shadow-md hover:shadow-lg',
        'guild-rakdos': 'bg-gradient-to-r from-mtg-black-400 to-mtg-red-500 text-white shadow-md hover:shadow-lg',
        'guild-gruul': 'bg-gradient-to-r from-mtg-red-500 to-mtg-green-500 text-white shadow-md hover:shadow-lg',
        'guild-selesnya': 'bg-gradient-to-r from-mtg-green-500 to-mtg-white-400 text-mtg-black-800 shadow-md hover:shadow-lg',
        'guild-orzhov': 'bg-gradient-to-r from-mtg-white-400 to-mtg-black-400 text-white shadow-md hover:shadow-lg',
        'guild-izzet': 'bg-gradient-to-r from-mtg-blue-500 to-mtg-red-500 text-white shadow-md hover:shadow-lg',
        'guild-golgari': 'bg-gradient-to-r from-mtg-black-400 to-mtg-green-500 text-white shadow-md hover:shadow-lg',
        'guild-boros': 'bg-gradient-to-r from-mtg-red-500 to-mtg-white-400 text-mtg-black-800 shadow-md hover:shadow-lg',
        'guild-simic': 'bg-gradient-to-r from-mtg-green-500 to-mtg-blue-500 text-white shadow-md hover:shadow-lg',
      },
      size: {
        default: 'h-9 px-4 py-2',
        sm: 'h-8 rounded-md px-3 text-xs',
        lg: 'h-11 rounded-md px-8 text-base',
        xl: 'h-12 rounded-lg px-10 text-base font-semibold',
        icon: 'h-9 w-9',
        'icon-sm': 'h-8 w-8',
        'icon-lg': 'h-11 w-11',
      },
      glow: {
        none: '',
        primary: 'hover-glow glow-primary',
        accent: 'hover-glow glow-accent',
        secondary: 'hover-glow glow-secondary',
        manaW: 'hover-glow glow-mana-w',
        manaU: 'hover-glow glow-mana-u',
        manaB: 'hover-glow glow-mana-b',
        manaR: 'hover-glow glow-mana-r',
        manaG: 'hover-glow glow-mana-g',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
      glow: 'none',
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, glow, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : 'button';
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, glow, className }))}
        ref={ref}
        {...props}
      />
    );
  }
);
Button.displayName = 'Button';

export { Button, buttonVariants };
