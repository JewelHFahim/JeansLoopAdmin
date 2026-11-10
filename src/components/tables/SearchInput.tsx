'use client';

import { useState, useEffect, useRef } from 'react';
import { Search, X, Loader2 } from 'lucide-react';
import { useDebounce } from '@/hooks/useDebounce';

interface SearchInputProps {
  placeholder?: string;
  initialValue?: string;
  value?: string;
  onDebouncedChange: (value: string) => void;
  isLoading?: boolean;
  className?: string;
}

export function SearchInput({
  placeholder = 'SEARCH REGISTRY...',
  initialValue = '',
  value: controlledValue,
  onDebouncedChange,
  isLoading = false,
  className = '',
}: SearchInputProps) {
  const [value, setValue] = useState(controlledValue !== undefined ? controlledValue : initialValue);
  const debounced = useDebounce(value, 400);

  const callbackRef = useRef(onDebouncedChange);
  useEffect(() => {
    callbackRef.current = onDebouncedChange;
  });

  // Sync external controlled value updates (e.g. on Reset Filters)
  useEffect(() => {
    if (controlledValue !== undefined && controlledValue !== value) {
      setValue(controlledValue);
    }
  }, [controlledValue]);

  // Sync initialValue updates if controlledValue is not used
  useEffect(() => {
    if (initialValue !== undefined && controlledValue === undefined && initialValue !== value) {
      setValue(initialValue);
    }
  }, [initialValue, controlledValue]);

  useEffect(() => {
    callbackRef.current(debounced);
  }, [debounced]);

  const handleClear = () => {
    setValue('');
    callbackRef.current('');
  };

  return (
    <div className={`relative ${className}`}>
      <input
        type="text"
        placeholder={placeholder}
        value={value}
        onChange={(e) => setValue(e.target.value)}
        className="w-full h-10 bg-white border-2 border-black rounded-none text-xs sm:text-[10px] font-bold px-3 py-2 pl-9 pr-8 outline-none focus:bg-black focus:text-white transition-all placeholder:text-neutral-400 placeholder:font-normal"
      />
      <div className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none text-current">
        {isLoading ? (
          <Loader2 className="w-3.5 h-3.5 animate-spin" />
        ) : (
          <Search className="w-3.5 h-3.5 text-neutral-500" />
        )}
      </div>
      {value && (
        <button
          type="button"
          onClick={handleClear}
          className="absolute right-2.5 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-black p-1"
          aria-label="Clear search"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      )}
    </div>
  );
}
