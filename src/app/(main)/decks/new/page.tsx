'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Search, ArrowRight, Loader2 } from 'lucide-react';

import { useCreateDeck } from '@/hooks/use-decks';
import { useCardSearch } from '@/hooks/use-card-search';
import { useAddCardToDeck } from '@/hooks/use-deck-cards';
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
import { Container } from '@/components/layout/container';
import { CardImage } from '@/components/cards/card-image';
import { ColorIdentityBadges } from '@/components/cards/color-identity-badges';
import { Skeleton } from '@/components/ui/skeleton';
import type { ScryfallCard } from '@/types/scryfall.types';
import { useWatch } from 'react-hook-form';

const createDeckSchema = z.object({
  name: z.string().min(1, 'Deck name is required').max(100),
  description: z.string().max(2000).optional(),
  format: z.enum(['COMMANDER', 'BRAWL', 'OATHBREAKER']),
  isPublic: z.boolean(),
});

type CreateDeckForm = z.infer<typeof createDeckSchema>;

export default function CreateDeckPage() {
  const router = useRouter();
  const [step, setStep] = useState<'commander' | 'details'>('commander');
  const [selectedCommander, setSelectedCommander] = useState<ScryfallCard | null>(null);

  const createDeck = useCreateDeck();
  const addCardToDeck = useAddCardToDeck();

  const { cards, isLoading: isSearching, setQuery, params } = useCardSearch({ isCommander: true });
  const { query } = params;

  const form = useForm<CreateDeckForm>({
    resolver: zodResolver(createDeckSchema),
    defaultValues: {
      name: '',
      description: '',
      format: 'COMMANDER',
      isPublic: false,
    },
  });

  const [formatValue, isPublicValue] = useWatch({
    control: form.control,
    name: ['format', 'isPublic'],
  });

  const handleSelectCommander = (card: ScryfallCard) => {
    setSelectedCommander(card);
    form.setValue('name', `${card.name} Deck`);
    setStep('details');
  };

  const onSubmit = async (data: CreateDeckForm) => {
    if (!selectedCommander) return;

    try {
      // 1. Create the empty deck first
      const result = await createDeck.mutateAsync({
        name: data.name,
        description: data.description || undefined,
        format: data.format,
        isPublic: data.isPublic,
      });

      // 2. Add the commander to the deck (this syncs the card to DB and sets commanderId)
      await addCardToDeck.mutateAsync({
        deckId: result.deck.id,
        scryfallCard: selectedCommander,
        category: 'COMMANDER',
      });

      router.push(`/decks/${result.deck.id}/edit`);
    } catch (error) {
      console.error('Failed to create deck:', error);
    }
  };

  return (
    <div className="py-8">
      <Container className="max-w-4xl">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold tracking-tight">Create New Deck</h1>
          <p className="text-muted-foreground mt-2">
            {step === 'commander'
              ? 'Start by selecting your commander'
              : 'Fill in the details for your deck'}
          </p>
        </div>

        {/* Step indicator */}
        <div className="mb-8 flex items-center gap-4">
          <div
            className={`flex h-8 w-8 items-center justify-center rounded-full text-sm font-medium ${
              step === 'commander'
                ? 'bg-primary text-primary-foreground'
                : 'bg-muted text-muted-foreground'
            }`}
          >
            1
          </div>
          <div className="bg-border h-px flex-1" />
          <div
            className={`flex h-8 w-8 items-center justify-center rounded-full text-sm font-medium ${
              step === 'details'
                ? 'bg-primary text-primary-foreground'
                : 'bg-muted text-muted-foreground'
            }`}
          >
            2
          </div>
        </div>

        {/* Step 1: Commander Selection */}
        {step === 'commander' && (
          <div className="space-y-6">
            {/* Search */}
            <div className="relative">
              <Search className="text-muted-foreground absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2" />
              <Input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search for a legendary creature..."
                className="pl-10"
              />
            </div>

            {/* Selected Commander */}
            {selectedCommander && (
              <Card className="border-primary">
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    Selected Commander
                    <Button variant="ghost" size="sm" onClick={() => setSelectedCommander(null)}>
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
                    <Button className="mt-4 gap-2" onClick={() => setStep('details')}>
                      Continue
                      <ArrowRight className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Search Results */}
            {!selectedCommander && (
              <>
                {isSearching && (
                  <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
                    {Array.from({ length: 8 }).map((_, i) => (
                      <Skeleton key={i} className="aspect-488/680 rounded-lg" />
                    ))}
                  </div>
                )}

                {!isSearching && cards.length > 0 && (
                  <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
                    {cards.map((card) => (
                      <button
                        key={card.id}
                        type="button"
                        onClick={() => handleSelectCommander(card)}
                        className="group focus:ring-ring relative overflow-hidden rounded-lg transition-transform hover:scale-105 focus:ring-2 focus:outline-none"
                      >
                        <CardImage card={card} size="normal" />
                        <div className="absolute inset-x-0 bottom-0 bg-linear-to-t from-black/80 to-transparent p-2 opacity-0 transition-opacity group-hover:opacity-100">
                          <p className="truncate text-sm font-medium text-white">{card.name}</p>
                        </div>
                      </button>
                    ))}
                  </div>
                )}

                {!isSearching && query.length >= 2 && cards?.length === 0 && (
                  <div className="py-12 text-center">
                    <p className="text-muted-foreground">
                      No legendary creatures found matching &quot;{query}&quot;
                    </p>
                  </div>
                )}

                {!isSearching && query.length < 2 && !selectedCommander && (
                  <div className="py-12 text-center">
                    <p className="text-muted-foreground">
                      Enter a name to search for legendary creatures
                    </p>
                  </div>
                )}
              </>
            )}
          </div>
        )}

        {/* Step 2: Deck Details */}
        {step === 'details' && selectedCommander && (
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* Commander Preview */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  Commander
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => setStep('commander')}
                  >
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
              <Button type="button" variant="outline" onClick={() => setStep('commander')}>
                Back
              </Button>
              <Button type="submit" disabled={createDeck.isPending} className="flex-1 gap-2">
                {createDeck.isPending ? (
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

            {createDeck.isError && (
              <p className="text-destructive text-sm">Failed to create deck. Please try again.</p>
            )}
          </form>
        )}
      </Container>
    </div>
  );
}
