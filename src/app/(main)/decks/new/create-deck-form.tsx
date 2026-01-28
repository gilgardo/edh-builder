'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Search, ArrowRight, Loader2 } from 'lucide-react';

import { useCreateDeck } from '@/hooks/use-decks';
import { useCardSearch } from '@/hooks/use-card-search';
import { useAddCardToDeck } from '@/hooks/use-deck-cards';
import { useImportDeck, getResolvedCards } from '@/hooks/use-deck-import';
import { useBasicLands, useAddBasicLands } from '@/hooks/use-basic-lands';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/components/ui/toast';
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
import {
  ImportTabs,
  ImportTabsContent,
  MoxfieldImport,
  TextImport,
  ImportPreviewComponent,
  ImportProgressComponent,
  BasicLandModal,
  type ImportMethod,
} from '@/components/import';
import type { ScryfallCard } from '@/types/scryfall.types';
import type { ImportPreview, BasicLands } from '@/schemas/import.schema';

const createDeckSchema = z.object({
  name: z.string().min(1, 'Deck name is required').max(100),
  description: z.string().max(2000).optional(),
  format: z.enum(['COMMANDER', 'BRAWL', 'OATHBREAKER']),
  isPublic: z.boolean(),
});

type CreateDeckFormData = z.infer<typeof createDeckSchema>;
type ColorIdentity = 'W' | 'U' | 'B' | 'R' | 'G';

interface ImportProgress {
  current: number;
  total: number;
  currentCardName: string;
  status: 'idle' | 'importing' | 'completed' | 'error';
  errors: Array<{ name: string; error: string }>;
}

export function CreateDeckForm() {
  const router = useRouter();
  const { toast } = useToast();

  // Import method state
  const [importMethod, setImportMethod] = useState<ImportMethod>('scratch');
  const [importPreview, setImportPreview] = useState<
    (ImportPreview & { deckName?: string; description?: string }) | null
  >(null);
  const [importProgress, setImportProgress] = useState<ImportProgress | null>(null);
  const [createdDeckId, setCreatedDeckId] = useState<string | null>(null);

  // From scratch state
  const [step, setStep] = useState<'commander' | 'details'>('commander');
  const [selectedCommander, setSelectedCommander] = useState<ScryfallCard | null>(null);
  const [showBasicLandModal, setShowBasicLandModal] = useState(false);
  const [pendingBasicLands, setPendingBasicLands] = useState<BasicLands | null>(null);

  // Hooks
  const createDeck = useCreateDeck();
  const addCardToDeck = useAddCardToDeck();
  const importDeck = useImportDeck();
  const addBasicLands = useAddBasicLands();
  const { cards, isLoading: isSearching, setQuery, params } = useCardSearch({ isCommander: true });
  const { query } = params;

  // Get basic land cards for the selected commander's color identity
  const commanderColorIdentity = (selectedCommander?.color_identity || []) as ColorIdentity[];
  const { data: basicLandCards } = useBasicLands(commanderColorIdentity);

  const form = useForm<CreateDeckFormData>({
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

  // Handle commander selection - show basic land modal
  const handleSelectCommander = (card: ScryfallCard) => {
    setSelectedCommander(card);
    form.setValue('name', `${card.name} Deck`);
    // Show basic land modal after selecting commander
    setShowBasicLandModal(true);
  };

  const handleBasicLandConfirm = (lands: BasicLands) => {
    setPendingBasicLands(lands);
    setShowBasicLandModal(false);
    setStep('details');
  };

  const handleBasicLandSkip = () => {
    setPendingBasicLands(null);
    setShowBasicLandModal(false);
    setStep('details');
  };

  // Handle import preview ready
  const handleImportPreviewReady = (
    preview: ImportPreview & { deckName?: string; description?: string }
  ) => {
    setImportPreview(preview);
    // Pre-fill form if deck name is available
    if (preview.deckName) {
      form.setValue('name', preview.deckName);
    }
    if (preview.description) {
      form.setValue('description', preview.description);
    }
  };

  // Handle import confirmation
  const handleImportConfirm = async (preview: ImportPreview) => {
    const formData = form.getValues();

    try {
      // Create the deck first
      const result = await createDeck.mutateAsync({
        name: formData.name || preview.deckName || 'Imported Deck',
        description: formData.description,
        format: formData.format,
        isPublic: formData.isPublic,
      });

      setCreatedDeckId(result.deck.id);

      // Get resolved cards for import
      const resolvedCards = getResolvedCards(preview);

      // Import cards with progress
      await importDeck.mutateAsync({
        deckId: result.deck.id,
        cards: resolvedCards,
        onProgress: setImportProgress,
      });
    } catch {
      toast('Failed to import deck. Please try again.', 'error');
      setImportProgress(null);
    }
  };

  // Handle import complete
  const handleImportComplete = () => {
    if (createdDeckId) {
      router.push(`/decks/${createdDeckId}/edit`);
    }
  };

  // Handle from scratch form submit
  const onSubmit = async (data: CreateDeckFormData) => {
    if (!selectedCommander) return;

    try {
      const result = await createDeck.mutateAsync({
        name: data.name,
        description: data.description || undefined,
        format: data.format,
        isPublic: data.isPublic,
      });

      // Add commander
      await addCardToDeck.mutateAsync({
        deckId: result.deck.id,
        scryfallCard: selectedCommander,
        category: 'COMMANDER',
      });

      // Add basic lands if any were selected
      if (pendingBasicLands && basicLandCards) {
        const landCardMap = new Map<'plains' | 'island' | 'swamp' | 'mountain' | 'forest' | 'wastes', ScryfallCard>();
        for (const landCard of basicLandCards) {
          if (landCard.scryfallCard) {
            landCardMap.set(landCard.key, landCard.scryfallCard);
          }
        }

        if (landCardMap.size > 0) {
          await addBasicLands.mutateAsync({
            deckId: result.deck.id,
            lands: pendingBasicLands,
            landCards: landCardMap,
          });
        }
      }

      router.push(`/decks/${result.deck.id}/edit`);
    } catch {
      toast('Failed to create deck. Please try again.', 'error');
    }
  };

  // Reset import state when changing methods
  const handleMethodChange = (method: ImportMethod) => {
    setImportMethod(method);
    setImportPreview(null);
    setImportProgress(null);
    setCreatedDeckId(null);
  };

  // If showing import progress, render that
  if (importProgress) {
    return (
      <div className="py-8">
        <Container className="max-w-2xl">
          <div className="mb-8">
            <h1 className="text-3xl font-bold tracking-tight">Importing Deck</h1>
          </div>
          <Card>
            <CardContent className="pt-6">
              <ImportProgressComponent
                progress={importProgress}
                onComplete={handleImportComplete}
              />
            </CardContent>
          </Card>
        </Container>
      </div>
    );
  }

  // If showing import preview, render that
  if (importPreview) {
    return (
      <div className="py-8">
        <Container className="max-w-3xl">
          <div className="mb-8">
            <h1 className="text-3xl font-bold tracking-tight">Preview Import</h1>
            <p className="text-muted-foreground mt-2">
              Review the cards before importing to your new deck
            </p>
          </div>

          {/* Deck Details Form (simplified) */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Deck Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="name">Deck Name</Label>
                <Input
                  id="name"
                  {...form.register('name')}
                  placeholder="My Awesome Deck"
                  className="mt-1"
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
            </CardContent>
          </Card>

          {/* Import Preview */}
          <Card>
            <CardContent className="pt-6">
              <ImportPreviewComponent
                preview={importPreview}
                onConfirm={handleImportConfirm}
                onCancel={() => setImportPreview(null)}
                isImporting={createDeck.isPending || importDeck.isPending}
              />
            </CardContent>
          </Card>
        </Container>
      </div>
    );
  }

  return (
    <div className="py-8">
      <Container className="max-w-4xl">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold tracking-tight">Create New Deck</h1>
          <p className="text-muted-foreground mt-2">
            {importMethod === 'scratch'
              ? step === 'commander'
                ? 'Start by selecting your commander'
                : 'Fill in the details for your deck'
              : importMethod === 'moxfield'
                ? 'Import a deck from Moxfield'
                : 'Paste your deck list'}
          </p>
        </div>

        {/* Import Method Tabs */}
        <ImportTabs value={importMethod} onValueChange={handleMethodChange}>
          {/* From Scratch */}
          <ImportTabsContent value="scratch">
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
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setSelectedCommander(null)}
                        >
                          Change
                        </Button>
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="flex gap-4">
                      <CardImage card={selectedCommander} size="small" />
                      <div>
                        <h3 className="font-semibold">{selectedCommander.name}</h3>
                        <p className="text-muted-foreground text-sm">
                          {selectedCommander.type_line}
                        </p>
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

                    {!isSearching && query.length >= 3 && cards?.length === 0 && (
                      <div className="py-12 text-center">
                        <p className="text-muted-foreground">
                          No legendary creatures found matching &quot;{query}&quot;
                        </p>
                      </div>
                    )}

                    {!isSearching && query.length < 3 && !selectedCommander && (
                      <div className="py-12 text-center">
                        <p className="text-muted-foreground">
                          {query.length > 0
                            ? 'Type at least 3 characters to search'
                            : 'Enter a name to search for legendary creatures'}
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

                {/* Basic Lands Summary */}
                {pendingBasicLands && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center justify-between text-base">
                        Basic Lands
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => setShowBasicLandModal(true)}
                        >
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
                  <Button type="button" variant="outline" onClick={() => setStep('commander')}>
                    Back
                  </Button>
                  <Button
                    type="submit"
                    disabled={createDeck.isPending || addBasicLands.isPending}
                    className="flex-1 gap-2"
                  >
                    {createDeck.isPending || addBasicLands.isPending ? (
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
                  <p className="text-destructive text-sm">
                    Failed to create deck. Please try again.
                  </p>
                )}
              </form>
            )}

            {/* Basic Land Modal */}
            <BasicLandModal
              open={showBasicLandModal}
              onOpenChange={setShowBasicLandModal}
              colorIdentity={commanderColorIdentity}
              onConfirm={handleBasicLandConfirm}
              onSkip={handleBasicLandSkip}
            />
          </ImportTabsContent>

          {/* Moxfield Import */}
          <ImportTabsContent value="moxfield">
            <Card>
              <CardContent className="pt-6">
                <MoxfieldImport onPreviewReady={handleImportPreviewReady} />
              </CardContent>
            </Card>
          </ImportTabsContent>

          {/* Text Import */}
          <ImportTabsContent value="text">
            <Card>
              <CardContent className="pt-6">
                <TextImport onPreviewReady={handleImportPreviewReady} />
              </CardContent>
            </Card>
          </ImportTabsContent>
        </ImportTabs>
      </Container>
    </div>
  );
}
