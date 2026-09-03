import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const buttonVariants = cva(
  'inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-lg font-semibold transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--mk-primary)] focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50',
  {
    variants: {
      variant: {
        default: 'bg-[var(--mk-primary)] text-white hover:opacity-90 active:scale-[0.98]',
        destructive: 'bg-[var(--mk-destructive,red)] text-white hover:opacity-90 active:scale-[0.98]',
        outline: 'border-2 border-[var(--mk-border)] bg-[var(--mk-surface)] hover:bg-[var(--mk-surface-hover)] active:scale-[0.98]',
        secondary: 'bg-[var(--mk-secondary)] text-[var(--mk-secondary-foreground)] hover:opacity-90 active:scale-[0.98]',
        ghost: 'hover:bg-[var(--mk-surface-hover)] active:scale-[0.98]',
        link: 'text-[var(--mk-primary)] underline-offset-4 hover:underline',
      },
      size: {
        default: 'h-12 px-6 py-3 text-base',
        sm: 'h-10 px-4 text-sm',
        lg: 'h-16 px-8 py-4 text-lg',
        kiosk: 'h-20 px-12 py-5 text-xl min-w-[200px] rounded-2xl',
        icon: 'h-12 w-12',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  loading?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, loading, children, ...props }, ref) => {
    return (
      <button
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        disabled={loading || props.disabled}
        {...props}
      >
        {loading && (
          <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-current" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
        )}
        {children}
      </button>
    );
  }
);
Button.displayName = 'Button';

export { Button, buttonVariants };
