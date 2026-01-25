import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';

import { cn } from '@/lib/utils';

const cardVariants = cva(
  'rounded-xl border text-card-foreground transition-all duration-200',
  {
    variants: {
      variant: {
        default: 'border-border bg-card shadow',
        elevated: 'border-border bg-card shadow-elevated',
        glass: 'glass-card',
        outline: 'border-border bg-transparent',
        ghost: 'border-transparent bg-transparent',
      },
      hover: {
        none: '',
        lift: 'hover-lift hover:shadow-elevated-lg',
        glow: 'hover-glow',
        scale: 'hover:scale-[1.02] active-scale',
        border: 'hover:border-primary/50',
      },
      gradient: {
        none: '',
        primary: 'gradient-border',
        azorius: 'gradient-border gradient-border-azorius',
        dimir: 'gradient-border gradient-border-dimir',
        rakdos: 'gradient-border gradient-border-rakdos',
        gruul: 'gradient-border gradient-border-gruul',
        selesnya: 'gradient-border gradient-border-selesnya',
        orzhov: 'gradient-border gradient-border-orzhov',
        izzet: 'gradient-border gradient-border-izzet',
        golgari: 'gradient-border gradient-border-golgari',
        boros: 'gradient-border gradient-border-boros',
        simic: 'gradient-border gradient-border-simic',
      },
    },
    defaultVariants: {
      variant: 'default',
      hover: 'none',
      gradient: 'none',
    },
  }
);

export interface CardProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof cardVariants> {
  /** Apply foil/holographic shimmer effect on hover */
  foil?: boolean;
}

const Card = React.forwardRef<HTMLDivElement, CardProps>(
  ({ className, variant, hover, gradient, foil, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(
        cardVariants({ variant, hover, gradient }),
        foil && 'foil-effect',
        className
      )}
      {...props}
    />
  )
);
Card.displayName = 'Card';

const CardHeader = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn('flex flex-col space-y-1.5 p-6', className)} {...props} />
  )
);
CardHeader.displayName = 'CardHeader';

const CardTitle = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn('font-semibold leading-none tracking-tight', className)} {...props} />
  )
);
CardTitle.displayName = 'CardTitle';

const CardDescription = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn('text-sm text-muted-foreground', className)} {...props} />
  )
);
CardDescription.displayName = 'CardDescription';

const CardContent = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => <div ref={ref} className={cn('p-6 pt-0', className)} {...props} />
);
CardContent.displayName = 'CardContent';

const CardFooter = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn('flex items-center p-6 pt-0', className)} {...props} />
  )
);
CardFooter.displayName = 'CardFooter';

export { Card, CardHeader, CardFooter, CardTitle, CardDescription, CardContent, cardVariants };
