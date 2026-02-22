'use client';

import Image from 'next/image';
import { Search, Loader2, ArrowRight } from 'lucide-react';
import type { UseFormReturn } from 'react-hook-form';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { CardImage } from '@/components/cards/card-image';
import { ColorIdentityBadges } from '@/components/cards/color-identity-badges';
import { Skeleton } from '@/components/ui/skeleton';
import type { CreateDeck } from '@/schemas/deck.schema';
import type { BasicLands } from '@/schemas/import.schema';
import type { ScryfallCard } from '@/types/scryfall.types';
import { cn } from '@/lib/utils';

function CardBackPlaceholder() {
  return (
    <Image
      src="/mtg-back.jpeg"
      alt="MTG card back"
      fill
      className="object-cover"
      draggable={false}
    />
  );
}

function landsSummary(lands: BasicLands | null): string {
  if (!lands) return '';
  const parts: string[] = [];
  if (lands.plains > 0) parts.push(`${lands.plains} Plains`);
  if (lands.island > 0) parts.push(`${lands.island} Island`);
  if (lands.swamp > 0) parts.push(`${lands.swamp} Swamp`);
  if (lands.mountain > 0) parts.push(`${lands.mountain} Mountain`);
  if (lands.forest > 0) parts.push(`${lands.forest} Forest`);
  if (lands.wastes > 0) parts.push(`${lands.wastes} Wastes`);
  return parts.join(', ');
}

interface ScratchFormProps {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  form: UseFormReturn<CreateDeck, any, any>;
  selectedCommander: ScryfallCard | null;
  cards: ScryfallCard[];
  query: string;
  isSearching: boolean;
  pendingBasicLands: BasicLands | null;
  formatValue: string;
  isPublicValue: boolean;
  isMutating: boolean;
  isError: boolean;
  onQueryChange: (query: string) => void;
  onSelectCommander: (card: ScryfallCard) => void;
  onClearCommander: () => void;
  onSubmit: (data: CreateDeck) => void;
  onEditBasicLands: () => void;
}

export function ScratchForm({
  form,
  selectedCommander,
  cards,
  query,
  isSearching,
  pendingBasicLands,
  formatValue,
  isPublicValue,
  isMutating,
  isError,
  onQueryChange,
  onSelectCommander,
  onClearCommander,
  onSubmit,
  onEditBasicLands,
}: ScratchFormProps) {
  const showResults = query.length >= 3;

  const landTotal = pendingBasicLands
    ? Object.values(pendingBasicLands).reduce((sum, n) => sum + n, 0)
    : 0;

  const handleCardSelect = (card: ScryfallCard) => {
    onSelectCommander(card);
    onQueryChange('');
  };

  return (
    <form onSubmit={form.handleSubmit(onSubmit)}>
      <div className="flex flex-col gap-8 md:flex-row md:items-start">
        {/* ── Commander frame ── */}
        <div className="mx-auto w-44 shrink-0 sm:w-52 md:w-60 md:sticky md:top-6">
          <div
            className={cn(
              'relative w-full aspect-[488/680] overflow-hidden rounded-xl transition-all duration-300',
              selectedCommander
                ? 'ring-2 ring-primary shadow-lg shadow-primary/20'
                : 'ring-1 ring-border'
            )}
          >
            {selectedCommander ? (
              <CardImage
                key={selectedCommander.id}
                card={selectedCommander}
                size="large"
                priority
              />
            ) : (
              <CardBackPlaceholder />
            )}
          </div>

          {/* Commander meta — below the frame */}
          {selectedCommander && (
            <div className="mt-3 space-y-1 text-center">
              <p className="truncate px-1 text-sm font-semibold leading-tight">
                {selectedCommander.name}
              </p>
              <p className="text-muted-foreground line-clamp-2 px-1 text-xs leading-tight">
                {selectedCommander.type_line}
              </p>
              <div className="flex justify-center pt-0.5">
                <ColorIdentityBadges colors={selectedCommander.color_identity} size="sm" />
              </div>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="mt-1 h-7 text-xs"
                onClick={onClearCommander}
              >
                Change
              </Button>
            </div>
          )}
        </div>

        {/* ── Form side ── */}
        <div className="min-w-0 flex-1 space-y-5">
          {/* Commander search */}
          <div>
            <Label className="mb-1.5 block">Commander</Label>
            <div className="relative">
              <Search className="text-muted-foreground pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2" />
              <Input
                value={query}
                onChange={(e) => onQueryChange(e.target.value)}
                placeholder="Search for a legendary creature…"
                className="pl-10"
                autoComplete="off"
              />
            </div>

            {/* Inline results panel */}
            {showResults && (
              <div className="bg-card border-border mt-1.5 overflow-hidden rounded-lg border shadow-lg">
                {isSearching && (
                  <div className="grid grid-cols-3 gap-2 p-3 sm:grid-cols-4">
                    {Array.from({ length: 8 }).map((_, i) => (
                      <Skeleton key={i} className="aspect-[488/680] rounded-md" />
                    ))}
                  </div>
                )}

                {!isSearching && cards.length > 0 && (
                  <div className="max-h-72 overflow-y-auto">
                    <div className="grid grid-cols-3 gap-2 p-3 sm:grid-cols-4">
                      {cards.map((card) => (
                        <button
                          key={card.id}
                          type="button"
                          onClick={() => handleCardSelect(card)}
                          className="focus:ring-ring group relative overflow-hidden rounded-md transition-transform hover:scale-105 focus:ring-2 focus:outline-none"
                        >
                          <CardImage card={card} size="normal" />
                          <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 to-transparent p-1.5 opacity-0 transition-opacity group-hover:opacity-100">
                            <p className="truncate text-[10px] font-medium leading-tight text-white">
                              {card.name}
                            </p>
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {!isSearching && cards.length === 0 && (
                  <div className="py-8 text-center">
                    <p className="text-muted-foreground text-sm">
                      No legendary creatures found for &quot;{query}&quot;
                    </p>
                  </div>
                )}
              </div>
            )}

            {!showResults && !selectedCommander && (
              <p className="text-muted-foreground mt-1.5 text-xs">
                Type at least 3 characters to search legendary creatures
              </p>
            )}
          </div>

          {/* Deck Name */}
          <div>
            <Label htmlFor="name">Deck Name</Label>
            <Input
              id="name"
              {...form.register('name')}
              placeholder="My Awesome Deck"
              className="mt-1.5"
            />
            {form.formState.errors.name && (
              <p className="text-destructive mt-1 text-sm">
                {form.formState.errors.name.message}
              </p>
            )}
          </div>

          {/* Description */}
          <div>
            <Label htmlFor="description">
              Description{' '}
              <span className="text-muted-foreground font-normal">(optional)</span>
            </Label>
            <Textarea
              id="description"
              {...form.register('description')}
              placeholder="Describe your deck strategy…"
              className="mt-1.5"
              rows={3}
            />
          </div>

          {/* Format + Visibility */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Format</Label>
              <Select
                value={formatValue}
                onValueChange={(v) =>
                  form.setValue('format', v as 'COMMANDER' | 'BRAWL' | 'OATHBREAKER')
                }
              >
                <SelectTrigger className="mt-1.5">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="COMMANDER">Commander</SelectItem>
                  <SelectItem value="BRAWL">Brawl</SelectItem>
                  <SelectItem value="OATHBREAKER">Oathbreaker</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Visibility</Label>
              <Select
                value={isPublicValue ? 'public' : 'private'}
                onValueChange={(v) => form.setValue('isPublic', v === 'public')}
              >
                <SelectTrigger className="mt-1.5">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="private">Private</SelectItem>
                  <SelectItem value="public">Public</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Basic Lands — only visible after a commander is chosen */}
          {selectedCommander && (
            <div className="border-border flex items-center justify-between rounded-lg border px-4 py-3">
              <div>
                <p className="text-sm font-medium">Basic Lands</p>
                <p className="text-muted-foreground mt-0.5 text-xs">
                  {landTotal > 0 ? landsSummary(pendingBasicLands) : 'None selected'}
                </p>
              </div>
              <Button type="button" variant="outline" size="sm" onClick={onEditBasicLands}>
                {landTotal > 0 ? 'Edit' : 'Add'}
              </Button>
            </div>
          )}

          {/* Submit */}
          <div className="pt-1">
            <Button
              type="submit"
              disabled={!selectedCommander || isMutating}
              className="w-full gap-2"
            >
              {isMutating ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Creating…
                </>
              ) : (
                <>
                  Create Deck
                  <ArrowRight className="h-4 w-4" />
                </>
              )}
            </Button>

            {isError && (
              <p className="text-destructive mt-2 text-center text-sm">
                Failed to create deck. Please try again.
              </p>
            )}

            {!selectedCommander && (
              <p className="text-muted-foreground mt-2 text-center text-xs">
                Select a commander to continue
              </p>
            )}
          </div>
        </div>
      </div>
    </form>
  );
}
