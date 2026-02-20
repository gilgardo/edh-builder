'use client';

import { Loader2, ArrowRight } from 'lucide-react';
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
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CardImage } from '@/components/cards/card-image';
import { ColorIdentityBadges } from '@/components/cards/color-identity-badges';
import type { CreateDeck } from '@/schemas/deck.schema';
import type { BasicLands } from '@/schemas/import.schema';
import type { ScryfallCard } from '@/types/scryfall.types';

interface DeckDetailsStepProps {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  form: UseFormReturn<CreateDeck, any, any>;
  selectedCommander: ScryfallCard;
  pendingBasicLands: BasicLands | null;
  formatValue: string;
  isPublicValue: boolean;
  isMutating: boolean;
  isError: boolean;
  onSubmit: (data: CreateDeck) => void;
  onBack: () => void;
  onEditBasicLands: () => void;
}

export function DeckDetailsStep({
  form,
  selectedCommander,
  pendingBasicLands,
  formatValue,
  isPublicValue,
  isMutating,
  isError,
  onSubmit,
  onBack,
  onEditBasicLands,
}: DeckDetailsStepProps) {
  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
      {/* Commander Preview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            Commander
            <Button type="button" variant="ghost" size="sm" onClick={onBack}>
              Change
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent className="flex gap-4">
          <CardImage card={selectedCommander} size="small" />
          <div>
            <h3 className="font-semibold">{selectedCommander.name}</h3>
            <p className="text-muted-foreground text-sm">{selectedCommander.type_line}</p>
            <div className="mt-2">
              <ColorIdentityBadges colors={selectedCommander.color_identity} />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Basic Lands Summary */}
      {pendingBasicLands && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between text-base">
              Basic Lands
              <Button type="button" variant="ghost" size="sm" onClick={onEditBasicLands}>
                Edit
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2 text-sm">
              {pendingBasicLands.plains > 0 && (
                <span className="px-2 py-1 bg-muted rounded">{pendingBasicLands.plains} Plains</span>
              )}
              {pendingBasicLands.island > 0 && (
                <span className="px-2 py-1 bg-muted rounded">{pendingBasicLands.island} Island</span>
              )}
              {pendingBasicLands.swamp > 0 && (
                <span className="px-2 py-1 bg-muted rounded">{pendingBasicLands.swamp} Swamp</span>
              )}
              {pendingBasicLands.mountain > 0 && (
                <span className="px-2 py-1 bg-muted rounded">{pendingBasicLands.mountain} Mountain</span>
              )}
              {pendingBasicLands.forest > 0 && (
                <span className="px-2 py-1 bg-muted rounded">{pendingBasicLands.forest} Forest</span>
              )}
              {pendingBasicLands.wastes > 0 && (
                <span className="px-2 py-1 bg-muted rounded">{pendingBasicLands.wastes} Wastes</span>
              )}
              {Object.values(pendingBasicLands).every((v) => v === 0) && (
                <span className="text-muted-foreground">No basic lands selected</span>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Deck Details Form */}
      <div className="space-y-4">
        <div>
          <Label htmlFor="name">Deck Name</Label>
          <Input
            id="name"
            {...form.register('name')}
            placeholder="My Awesome Deck"
            className="mt-1"
          />
          {form.formState.errors.name && (
            <p className="text-destructive mt-1 text-sm">
              {form.formState.errors.name.message}
            </p>
          )}
        </div>

        <div>
          <Label htmlFor="description">Description (optional)</Label>
          <Textarea
            id="description"
            {...form.register('description')}
            placeholder="Describe your deck strategy..."
            className="mt-1"
            rows={4}
          />
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <Label htmlFor="format">Format</Label>
            <Select
              value={formatValue}
              onValueChange={(v) =>
                form.setValue('format', v as 'COMMANDER' | 'BRAWL' | 'OATHBREAKER')
              }
            >
              <SelectTrigger className="mt-1">
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
            <Label htmlFor="visibility">Visibility</Label>
            <Select
              value={isPublicValue ? 'public' : 'private'}
              onValueChange={(v) => form.setValue('isPublic', v === 'public')}
            >
              <SelectTrigger className="mt-1">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="private">Private</SelectItem>
                <SelectItem value="public">Public</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* Submit */}
      <div className="flex gap-4">
        <Button type="button" variant="outline" onClick={onBack}>
          Back
        </Button>
        <Button type="submit" disabled={isMutating} className="flex-1 gap-2">
          {isMutating ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Creating...
            </>
          ) : (
            <>
              Create Deck
              <ArrowRight className="h-4 w-4" />
            </>
          )}
        </Button>
      </div>

      {isError && (
        <p className="text-destructive text-sm">Failed to create deck. Please try again.</p>
      )}
    </form>
  );
}
