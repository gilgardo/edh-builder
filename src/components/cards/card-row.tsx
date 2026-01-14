import { Button } from '@/components/ui/button';
import { ManaCost } from '@/components/cards/mana-cost';
import { Plus, Trash2 } from 'lucide-react';
import type { DisplayCard } from '@/types/cards';

type CardRowProps = {
  card: DisplayCard;
  quantity?: number;
  variant?: 'deck' | 'search';
  onAction?: (id: string) => void;
  isPending?: boolean;
  className?: string;
};

export function CardRow({
  card,
  quantity,
  variant = 'deck',
  onAction,
  isPending,
  className,
}: CardRowProps) {
  const isDeck = variant === 'deck';
  const isSearch = variant === 'search';

  return (
    <div
      className={`hover:bg-muted/50 group flex items-center justify-between rounded px-2 py-1.5 ${className ?? ''}`}
    >
      <div className="flex min-w-0 flex-1 items-center gap-2">
        {isDeck && quantity && (
          <span className="text-muted-foreground w-5 text-sm">{quantity}x</span>
        )}

        {card.manaCost && <ManaCost cost={card.manaCost} size="sm" />}

        <span className="truncate text-sm font-medium">{card.name}</span>
      </div>

      <div className="flex items-center gap-2 opacity-0 transition-opacity group-hover:opacity-100">
        {isDeck && (
          <Button
            variant="ghost"
            size="icon"
            className="text-destructive h-6 w-6"
            onClick={() => onAction?.(card.id)}
            disabled={isPending}
          >
            <Trash2 className="h-3 w-3" />
          </Button>
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
