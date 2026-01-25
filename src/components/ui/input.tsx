import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';

import { cn } from '@/lib/utils';

const inputVariants = cva(
  'flex w-full rounded-md border px-3 py-2 text-base transition-all duration-200 file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground/70 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50 md:text-sm',
  {
    variants: {
      variant: {
        default: 'border-border bg-transparent shadow-sm focus-visible:ring-2 focus-visible:ring-ring focus-visible:border-primary/50',
        filled: 'border-transparent bg-muted/50 focus-visible:bg-muted/70 focus-visible:ring-2 focus-visible:ring-ring',
        ghost: 'border-transparent bg-transparent focus-visible:bg-muted/30 focus-visible:ring-1 focus-visible:ring-ring',
        outline: 'border-border bg-transparent focus-visible:ring-2 focus-visible:ring-ring focus-visible:border-primary',
      },
      inputSize: {
        default: 'h-9',
        sm: 'h-8 text-xs px-2.5',
        lg: 'h-11 text-base px-4',
      },
      glow: {
        none: '',
        primary: 'focus-visible:shadow-[0_0_0_3px_rgba(124,58,237,0.15)]',
        accent: 'focus-visible:shadow-[0_0_0_3px_rgba(20,184,166,0.15)]',
      },
    },
    defaultVariants: {
      variant: 'default',
      inputSize: 'default',
      glow: 'primary',
    },
  }
);

export interface InputProps
  extends Omit<React.ComponentProps<'input'>, 'size'>,
    VariantProps<typeof inputVariants> {}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, variant, inputSize, glow, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(inputVariants({ variant, inputSize, glow, className }))}
        ref={ref}
        {...props}
      />
    );
  }
);
Input.displayName = 'Input';

export { Input, inputVariants };
