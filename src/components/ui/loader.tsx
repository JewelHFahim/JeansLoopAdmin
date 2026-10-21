import * as React from 'react';
import { cn } from '@/lib/utils';
import { Loader2 } from 'lucide-react';

interface LoaderProps {
  className?: string;
  text?: string;
  variant?: 'inline' | 'page';
}

export function Loader({ className, text = 'Processing...', variant = 'inline' }: LoaderProps) {
  if (variant === 'page') {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center gap-4 bg-white">
        <div className="w-12 h-12 border-4 border-black border-t-transparent animate-spin" />
        <p className="text-[10px] font-black uppercase tracking-[0.3em] text-black animate-pulse">
          {text}
        </p>
      </div>
    );
  }

  return (
    <div className={cn('inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider', className)}>
      <Loader2 className="w-4 h-4 animate-spin text-current" />
      {text && <span>{text}</span>}
    </div>
  );
}
