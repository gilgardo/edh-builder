'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { ManaCost } from '@/components/cards/mana-cost';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Plus, Trash2, MoreVertical, Images, Hash, ArrowRight } from 'lucide-react';
import type { DisplayCard } from '@/types/cards';
import type { CardCategory } from '@/schemas/deck.schema';
import { isBasicLand } from '@/types/scryfall.types';
import { cn } from '@/lib/utils';

type CardRowProps = {
  card: DisplayCard;
  quantity?: number;
  category?: CardCategory;
  variant?: 'deck' | 'search';
  onAction?: (id: string) => void;
  onHover?: (card: DisplayCard | null) => void;
  onChangePrinting?: (card: DisplayCard) => void;
  onChangeQuantity?: (card: DisplayCard, quantity: number) => void;
  onMoveToCategory?: (card: DisplayCard, category: CardCategory) => void;
  isPending?: boolean;
  className?: string;
};

export function CardRow({
  card,
  quantity,
  category = 'MAIN',
  variant = 'deck',
  onAction,
  onHover,
  onChangePrinting,
  onChangeQuantity,
  onMoveToCategory,
  isPending,
  className,
}: CardRowProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const isDeck = variant === 'deck';
  const isSearch = variant === 'search';

  // Check if this card has invalid quantity (more than 1 copy of non-basic land)
  const hasInvalidQuantity =
    isDeck && quantity && quantity > 1 && !isBasicLand(card);

  const handleIncrement = () => {
    if (onChangeQuantity && quantity) {
      onChangeQuantity(card, quantity + 1);
    }
  };

  const handleDecrement = () => {
    if (onChangeQuantity && quantity && quantity > 1) {
      onChangeQuantity(card, quantity - 1);
    }
  };

  return (
    <div
      className={cn(
        'hover:bg-muted/50 group flex items-center justify-between rounded px-2 py-1.5 cursor-pointer',
        hasInvalidQuantity && 'bg-amber-500/10 hover:bg-amber-500/20',
        className
      )}
      onMouseEnter={() => onHover?.(card)}
      onMouseLeave={() => onHover?.(null)}
    >
      <div className="flex min-w-0 flex-1 items-center gap-2">
        {isDeck && quantity && (
          <span
            className={cn(
              'w-5 text-sm',
              hasInvalidQuantity
                ? 'font-semibold text-amber-600 dark:text-amber-400'
                : 'text-muted-foreground'
            )}
          >
            {quantity}x
          </span>
        )}

        {card.manaCost && <ManaCost cost={card.manaCost} size="sm" />}

        <span className="truncate text-sm font-medium">{card.name}</span>
      </div>

      <div className={cn(
        'flex items-center gap-1 transition-opacity',
        isMenuOpen ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
      )}>
        {isDeck && (
          <>
            {/* Kebab menu */}
            <DropdownMenu open={isMenuOpen} onOpenChange={setIsMenuOpen}>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6 text-muted-foreground hover:text-foreground"
                  onClick={(e) => e.stopPropagation()}
                >
                  <MoreVertical className="h-3.5 w-3.5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                {onChangePrinting && (
                  <DropdownMenuItem
                    onClick={(e) => {
                      e.stopPropagation();
                      onChangePrinting(card);
                    }}
                  >
                    <Images className="mr-2 h-4 w-4" />
                    Switch Printing
                  </DropdownMenuItem>
                )}

                {onChangeQuantity && (
                  <DropdownMenuItem
                    onClick={(e) => e.stopPropagation()}
                    className="flex items-center justify-between"
                  >
                    <div className="flex items-center">
                      <Hash className="mr-2 h-4 w-4" />
                      Quantity
                    </div>
                    <div className="flex items-center gap-1">
                      <Button
                        variant="outline"
                        size="icon"
                        className="h-5 w-5"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDecrement();
                        }}
                        disabled={isPending || (quantity ?? 1) <= 1}
                      >
                        -
                      </Button>
                      <span className="w-5 text-center text-sm">{quantity}</span>
                      <Button
                        variant="outline"
                        size="icon"
                        className="h-5 w-5"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleIncrement();
                        }}
                        disabled={isPending}
                      >
                        +
                      </Button>
                    </div>
                  </DropdownMenuItem>
                )}

                {onMoveToCategory && (
                  <>
                    <DropdownMenuSeparator />
                    {category !== 'CONSIDERING' ? (
                      <DropdownMenuItem
                        onClick={(e) => {
                          e.stopPropagation();
                          onMoveToCategory(card, 'CONSIDERING');
                        }}
                      >
                        <ArrowRight className="mr-2 h-4 w-4" />
                        Move to Considering
                      </DropdownMenuItem>
                    ) : (
                      <DropdownMenuItem
                        onClick={(e) => {
                          e.stopPropagation();
                          onMoveToCategory(card, 'MAIN');
                        }}
                      >
                        <ArrowRight className="mr-2 h-4 w-4" />
                        Move to Main
                      </DropdownMenuItem>
                    )}
                    {category !== 'SIDEBOARD' && (
                      <DropdownMenuItem
                        onClick={(e) => {
                          e.stopPropagation();
                          onMoveToCategory(card, 'SIDEBOARD');
                        }}
                      >
                        <ArrowRight className="mr-2 h-4 w-4" />
                        Move to Sideboard
                      </DropdownMenuItem>
                    )}
                  </>
                )}

                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={(e) => {
                    e.stopPropagation();
                    onAction?.(card.id);
                  }}
                  className="text-destructive focus:text-destructive"
                  disabled={isPending}
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  Remove
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </>
        )}
        {isSearch && (
          <Button
            variant="ghost"
            size="icon"
            className="text-primary h-6 w-6"
            onClick={() => onAction?.(card.id)}
            disabled={isPending}
          >
            <Plus className="h-3 w-3" />
          </Button>
        )}
      </div>
    </div>
  );
}
