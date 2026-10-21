import * as React from 'react';
import { cn } from '@/lib/utils';

export interface LabelProps extends React.LabelHTMLAttributes<HTMLLabelElement> {}

const Label = React.forwardRef<HTMLLabelElement, LabelProps>(({ className, ...props }, ref) => (
  <label
    ref={ref}
    className={cn('text-[10px] font-black uppercase tracking-widest text-black flex justify-between select-none', className)}
    {...props}
  />
));
Label.displayName = 'Label';

export { Label };
