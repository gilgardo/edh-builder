'use client';

import { useState, useRef, useCallback } from 'react';
import { Search, Eye, X } from 'lucide-react';

import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useCardAutocomplete } from '@/hooks/use-card-search';
import { cn } from '@/lib/utils';

interface MobileCardSearchBarProps {
  value: string;
  onChange: (value: string) => void;
  onOpenFullSearch: () => void;
  onSelectSuggestion?: (suggestion: string) => void;
  className?: string;
}

export function MobileCardSearchBar({
  value,
  onChange,
  onOpenFullSearch,
  onSelectSuggestion,
  className,
}: MobileCardSearchBarProps) {
  const [isFocused, setIsFocused] = useState(false);
  const [lastSelectedValue, setLastSelectedValue] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const { data: suggestions = [], isLoading } = useCardAutocomplete(value);

  // Compute showSuggestions based on state - no effects needed
  const showSuggestions =
    isFocused &&
    suggestions.length > 0 &&
    value.length >= 2 &&
    value !== lastSelectedValue;

  const handleSuggestionClick = useCallback((suggestion: string) => {
    onChange(suggestion);
    setLastSelectedValue(suggestion);
    onSelectSuggestion?.(suggestion);
    inputRef.current?.blur();
  }, [onChange, onSelectSuggestion]);

  const handleClear = useCallback(() => {
    onChange('');
    setLastSelectedValue('');
    inputRef.current?.focus();
  }, [onChange]);

  const handleFocus = useCallback(() => {
    setIsFocused(true);
  }, []);

  const handleBlur = useCallback(() => {
    // Delay to allow click on suggestions
    setTimeout(() => setIsFocused(false), 150);
  }, []);

  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    onChange(e.target.value);
    // Reset lastSelectedValue when user types something different
    if (e.target.value !== lastSelectedValue) {
      setLastSelectedValue('');
    }
  }, [onChange, lastSelectedValue]);

  return (
    <div ref={containerRef} className={cn('relative', className)}>
      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            ref={inputRef}
            value={value}
            onChange={handleInputChange}
            onFocus={handleFocus}
            onBlur={handleBlur}
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

      {/* Autocomplete Dropdown */}
      {showSuggestions && (
        <div className="absolute top-full left-0 right-12 mt-1 z-50 bg-background border rounded-lg shadow-lg overflow-hidden">
          {isLoading ? (
            <div className="px-4 py-3 text-sm text-muted-foreground">
              Searching...
            </div>
          ) : (
            <ul className="max-h-64 overflow-auto">
              {suggestions.slice(0, 8).map((suggestion, index) => (
                <li key={index}>
                  <button
                    type="button"
                    onClick={() => handleSuggestionClick(suggestion)}
                    className="w-full px-4 py-2.5 text-left text-sm hover:bg-muted transition-colors border-b last:border-b-0"
                  >
                    {suggestion}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
