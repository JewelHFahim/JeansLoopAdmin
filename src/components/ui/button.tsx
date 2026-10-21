import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const buttonVariants = cva(
  'inline-flex items-center justify-center whitespace-nowrap text-xs font-black uppercase tracking-widest transition-all focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-black disabled:pointer-events-none disabled:opacity-50 select-none cursor-pointer',
  {
    variants: {
      variant: {
        default: 'bg-black text-white hover:bg-neutral-800 active:scale-95 shadow-[4px_4px_0px_0px_rgba(0,0,0,0.2)]',
        destructive: 'bg-red-600 text-white hover:bg-red-700 active:scale-95',
        outline: 'border-2 border-black bg-white text-black hover:bg-black hover:text-white',
        secondary: 'bg-neutral-100 text-black hover:bg-neutral-200',
        ghost: 'hover:bg-neutral-100 text-black',
        link: 'text-black underline-offset-4 hover:underline normal-case font-bold tracking-normal',
      },
      size: {
        default: 'h-11 px-6 py-2',
        sm: 'h-9 px-4 text-[10px]',
        lg: 'h-14 px-8 text-sm',
        icon: 'h-10 w-10 p-0',
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
    VariantProps<typeof buttonVariants> {}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, ...props }, ref) => {
    return (
      <button className={cn(buttonVariants({ variant, size, className }))} ref={ref} {...props} />
    );
  }
);
Button.displayName = 'Button';

export { Button, buttonVariants };
