'use client';

import { useState, useEffect } from 'react';
import { ArrowUp } from 'lucide-react';
import { cn } from '@/lib/utils';

interface BackToTopProps {
  /** Scroll threshold in pixels before the button appears */
  threshold?: number;
  className?: string;
}

/**
 * Floating back-to-top button that appears after scrolling past threshold
 */
export function BackToTop({ threshold = 400, className }: BackToTopProps) {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsVisible(window.scrollY > threshold);
    };

    // Check initial position
    handleScroll();

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [threshold]);

  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth',
    });
  };

  return (
    <button
      onClick={scrollToTop}
      aria-label="Back to top"
      className={cn(
        // Base styles
        'fixed z-50 flex items-center justify-center',
        'rounded-full bg-primary text-primary-foreground',
        'shadow-lg shadow-primary/25',
        'transition-all duration-300 ease-out',
        // Size - responsive
        'h-10 w-10 sm:h-12 sm:w-12',
        // Position - responsive
        'bottom-4 right-4 sm:bottom-6 sm:right-6 lg:bottom-8 lg:right-8',
        // Hover/active states
        'hover:scale-110 hover:shadow-xl hover:shadow-primary/30',
        'active:scale-95',
        // Focus states
        'focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2',
        // Visibility animation
        isVisible
          ? 'translate-y-0 opacity-100'
          : 'pointer-events-none translate-y-4 opacity-0',
        className
      )}
    >
      <ArrowUp className="h-5 w-5 sm:h-6 sm:w-6" />
    </button>
  );
}
