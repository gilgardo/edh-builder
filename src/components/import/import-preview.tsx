'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import type { ImportPreview, CardResolution } from '@/schemas/import.schema';
import { AlertCircle, CheckCircle, AlertTriangle, Trash2, Edit2, X } from 'lucide-react';

interface ImportPreviewProps {
  preview: ImportPreview & { deckName?: string; description?: string };
  onConfirm: (preview: ImportPreview) => void;
  onCancel: () => void;
  isImporting?: boolean;
}

export function ImportPreviewComponent({
  preview,
  onConfirm,
  onCancel,
  isImporting,
}: ImportPreviewProps) {
  const [editingCard, setEditingCard] = useState<string | null>(null);
  const [cards, setCards] = useState(preview.cards);
  const [commander, setCommander] = useState(preview.commander);

  // Group cards by category
  const groupedCards = cards.reduce(
    (acc, card) => {
      const category = card.category || 'MAIN';
      if (!acc[category]) acc[category] = [];
      acc[category].push(card);
      return acc;
    },
    {} as Record<string, CardResolution[]>
  );

  const resolvedCount = cards.filter((c) => c.resolved).length + (commander?.resolved ? 1 : 0);
  const unresolvedCount = cards.filter((c) => !c.resolved).length + (commander && !commander.resolved ? 1 : 0);
  const totalCards = cards.reduce((sum, c) => sum + c.quantity, 0) + (commander ? 1 : 0);

  const handleRemoveCard = (cardName: string, category: string) => {
    setCards((prev) => prev.filter((c) => !(c.name === cardName && c.category === category)));
  };

  const handleUpdateCardName = (oldName: string, newName: string, category: string) => {
    setCards((prev) =>
      prev.map((c) => (c.name === oldName && c.category === category ? { ...c, name: newName, resolved: false } : c))
    );
    setEditingCard(null);
  };

  const handleConfirm = () => {
    onConfirm({
      ...preview,
      cards,
      commander,
      resolvedCount,
      unresolvedCount,
      totalCards,
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">
            {preview.deckName || 'Imported Deck'}
          </h3>
          <p className="text-sm text-muted-foreground">
            {totalCards} cards ({resolvedCount} resolved, {unresolvedCount} unresolved)
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground px-2 py-1 bg-muted rounded">
            via {preview.source}
          </span>
        </div>
      </div>

      {/* Warnings */}
      {preview.warnings.length > 0 && (
        <div className="p-3 rounded-md bg-yellow-500/10 border border-yellow-500/20">
          <div className="flex items-center gap-2 mb-2">
            <AlertTriangle className="h-4 w-4 text-yellow-600" />
            <span className="text-sm font-medium text-yellow-600">Warnings</span>
          </div>
          <ul className="text-xs text-yellow-600 space-y-1">
            {preview.warnings.map((warning, i) => (
              <li key={i}>{warning}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Commander */}
      {commander && (
        <div className="p-3 rounded-md border border-border">
          <h4 className="text-sm font-medium mb-2">Commander</h4>
          <CardRow
            card={commander}
            isEditing={editingCard === `commander-${commander.name}`}
            onEdit={() => setEditingCard(`commander-${commander.name}`)}
            onCancelEdit={() => setEditingCard(null)}
            onUpdateName={(newName) => {
              setCommander({ ...commander, name: newName, resolved: false });
              setEditingCard(null);
            }}
            onRemove={() => setCommander(undefined)}
          />
        </div>
      )}

      {/* Card list by category */}
      <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2">
        {Object.entries(groupedCards).map(([category, categoryCards]) => (
          <div key={category}>
            <h4 className="text-sm font-medium mb-2 flex items-center gap-2">
              {category}
              <span className="text-xs text-muted-foreground">
                ({categoryCards.reduce((sum, c) => sum + c.quantity, 0)})
              </span>
            </h4>
            <div className="space-y-1">
              {categoryCards.map((card) => (
                <CardRow
                  key={`${category}-${card.name}`}
                  card={card}
                  isEditing={editingCard === `${category}-${card.name}`}
                  onEdit={() => setEditingCard(`${category}-${card.name}`)}
                  onCancelEdit={() => setEditingCard(null)}
                  onUpdateName={(newName) => handleUpdateCardName(card.name, newName, category)}
                  onRemove={() => handleRemoveCard(card.name, category)}
                />
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Actions */}
      <div className="flex items-center justify-between pt-4 border-t border-border">
        <Button variant="outline" onClick={onCancel} disabled={isImporting}>
          Cancel
        </Button>
        <Button onClick={handleConfirm} disabled={isImporting || resolvedCount === 0}>
          {isImporting ? 'Importing...' : `Import ${resolvedCount} Cards`}
        </Button>
      </div>
    </div>
  );
}

interface CardRowProps {
  card: CardResolution;
  isEditing: boolean;
  onEdit: () => void;
  onCancelEdit: () => void;
  onUpdateName: (newName: string) => void;
  onRemove: () => void;
}

function CardRow({
  card,
  isEditing,
  onEdit,
  onCancelEdit,
  onUpdateName,
  onRemove,
}: CardRowProps) {
  const [editValue, setEditValue] = useState(card.name);

  if (isEditing) {
    return (
      <div className="flex items-center gap-2 p-2 rounded bg-muted/50">
        <Input
          value={editValue}
          onChange={(e) => setEditValue(e.target.value)}
          className="flex-1 h-8"
          autoFocus
          onKeyDown={(e) => {
            if (e.key === 'Enter') onUpdateName(editValue);
            if (e.key === 'Escape') onCancelEdit();
          }}
        />
        <Button size="sm" variant="ghost" onClick={() => onUpdateName(editValue)}>
          Save
        </Button>
        <Button size="sm" variant="ghost" onClick={onCancelEdit}>
          <X className="h-4 w-4" />
        </Button>
      </div>
    );
  }

  return (
    <div
      className={`flex items-center justify-between p-2 rounded text-sm ${
        card.resolved ? 'bg-muted/30' : 'bg-destructive/10'
      }`}
    >
      <div className="flex items-center gap-2 flex-1 min-w-0">
        {card.resolved ? (
          <CheckCircle className="h-4 w-4 text-green-600 shrink-0" />
        ) : (
          <AlertCircle className="h-4 w-4 text-destructive shrink-0" />
        )}
        <span className="font-medium">{card.quantity}x</span>
        <span className="truncate">{card.name}</span>
        {!card.resolved && card.suggestions && card.suggestions.length > 0 && (
          <span className="text-xs text-muted-foreground">
            (did you mean: {card.suggestions[0]}?)
          </span>
        )}
      </div>
      <div className="flex items-center gap-1 shrink-0">
        {!card.resolved && (
          <Button size="icon" variant="ghost" className="h-7 w-7" onClick={onEdit}>
            <Edit2 className="h-3 w-3" />
          </Button>
        )}
        <Button
          size="icon"
          variant="ghost"
          className="h-7 w-7 text-destructive hover:text-destructive"
          onClick={onRemove}
        >
          <Trash2 className="h-3 w-3" />
        </Button>
      </div>
    </div>
  );
}
