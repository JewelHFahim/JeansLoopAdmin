'use client';

import { useState, useEffect } from 'react';
import { Search, X, Loader2 } from 'lucide-react';
import { useDebounce } from '@/hooks/useDebounce';

interface SearchInputProps {
  placeholder?: string;
  initialValue?: string;
  onDebouncedChange: (value: string) => void;
  isLoading?: boolean;
  className?: string;
}

export function SearchInput({
  placeholder = 'SEARCH REGISTRY...',
  initialValue = '',
  onDebouncedChange,
  isLoading = false,
  className = '',
}: SearchInputProps) {
  const [value, setValue] = useState(initialValue);
  const debounced = useDebounce(value, 400);

  useEffect(() => {
    onDebouncedChange(debounced);
  }, [debounced, onDebouncedChange]);

  return (
    <div className={`relative ${className}`}>
      <input
        type="text"
        placeholder={placeholder}
        value={value}
        onChange={(e) => setValue(e.target.value)}
        className="w-full bg-white border-2 border-black rounded-none text-[10px] font-black uppercase px-3 py-2 pl-9 pr-8 outline-none focus:bg-black focus:text-white transition-all placeholder:text-neutral-300 placeholder:normal-case placeholder:font-normal"
      />
      <div className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none text-current">
        {isLoading ? (
          <Loader2 className="w-3.5 h-3.5 animate-spin" />
        ) : (
          <Search className="w-3.5 h-3.5" />
        )}
      </div>
      {value && (
        <button
          type="button"
          onClick={() => setValue('')}
          className="absolute right-2.5 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-black"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      )}
    </div>
  );
}
