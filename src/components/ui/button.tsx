import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const buttonVariants = cva(
  'inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-lg font-semibold transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50',
  {
    variants: {
      variant: {
        default: 'bg-blue-600 text-white hover:bg-blue-700 active:scale-95',
        destructive: 'bg-red-600 text-white hover:bg-red-700 active:scale-95',
        outline: 'border-2 border-gray-300 bg-white hover:bg-gray-50 active:scale-95',
        secondary: 'bg-gray-200 text-gray-900 hover:bg-gray-300 active:scale-95',
        ghost: 'hover:bg-gray-100 active:scale-95',
        link: 'text-blue-600 underline-offset-4 hover:underline',
      },
      size: {
        default: 'h-12 px-6 py-3 text-base',
        sm: 'h-10 px-4 text-sm',
        lg: 'h-16 px-8 py-4 text-lg',
        xl: 'h-20 px-10 py-5 text-xl',
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
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, ...props }, ref) => {
    return (
      <button
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    );
  }
);
Button.displayName = 'Button';

export { Button, buttonVariants };
