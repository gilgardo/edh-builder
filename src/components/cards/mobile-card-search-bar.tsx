'use client';

import { useRef, useCallback } from 'react';
import { Search, Eye, X } from 'lucide-react';

import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface MobileCardSearchBarProps {
  value: string;
  onChange: (value: string) => void;
  onOpenFullSearch: () => void;
  className?: string;
}

export function MobileCardSearchBar({
  value,
  onChange,
  onOpenFullSearch,
  className,
}: MobileCardSearchBarProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const handleClear = useCallback(() => {
    onChange('');
    inputRef.current?.focus();
  }, [onChange]);

  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    onChange(e.target.value);
  }, [onChange]);

  return (
    <div ref={containerRef} className={cn('relative', className)}>
      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            ref={inputRef}
            value={value}
            onChange={handleInputChange}
            placeholder="Search cards..."
            className="pl-10 pr-10"
          />
          {value && (
            <button
              type="button"
              onClick={handleClear}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
        <Button
          variant="outline"
          size="icon"
          onClick={onOpenFullSearch}
          className="shrink-0"
          title="Open full search"
        >
          <Eye className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
