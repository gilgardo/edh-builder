'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm, useWatch } from 'react-hook-form';
import type { Resolver } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';

import { useCreateDeck } from '@/hooks/use-decks';
import { useCardSearch } from '@/hooks/use-card-search';
import { useAddCardToDeck } from '@/hooks/use-deck-cards';
import { useImportDeck, getResolvedCards } from '@/hooks/use-deck-import';
import { useBasicLands, useAddBasicLands } from '@/hooks/use-basic-lands';
import { Input } from '@/components/ui/input';
import { useToast } from '@/components/ui/toast';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Container } from '@/components/layout/container';
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
import type { ImportPreview, BasicLands, ImportProgress } from '@/schemas/import.schema';
import { CreateDeckSchema } from '@/schemas/deck.schema';
import type { CreateDeck, ColorIdentity } from '@/schemas/deck.schema';
import { CommanderStep } from './commander-step';
import { DeckDetailsStep } from './deck-details-step';

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

  const form = useForm<CreateDeck>({
    resolver: zodResolver(CreateDeckSchema) as Resolver<CreateDeck>,
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
      const result = await createDeck.mutateAsync({
        name: formData.name || preview.deckName || 'Imported Deck',
        description: formData.description,
        format: formData.format,
        isPublic: formData.isPublic,
      });

      setCreatedDeckId(result.deck.id);

      const resolvedCards = getResolvedCards(preview);

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
  const onSubmit = async (data: CreateDeck) => {
    if (createDeck.isPending || addCardToDeck.isPending || addBasicLands.isPending) return;
    if (!selectedCommander) return;

    try {
      const result = await createDeck.mutateAsync({
        name: data.name,
        description: data.description || undefined,
        format: data.format,
        isPublic: data.isPublic,
      });

      await addCardToDeck.mutateAsync({
        deckId: result.deck.id,
        scryfallCard: selectedCommander,
        category: 'COMMANDER',
      });

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
              <CommanderStep
                selectedCommander={selectedCommander}
                cards={cards}
                query={query}
                isSearching={isSearching}
                onQueryChange={setQuery}
                onSelectCommander={handleSelectCommander}
                onClearCommander={() => setSelectedCommander(null)}
                onContinue={() => setStep('details')}
              />
            )}

            {/* Step 2: Deck Details */}
            {step === 'details' && selectedCommander && (
              <DeckDetailsStep
                form={form}
                selectedCommander={selectedCommander}
                pendingBasicLands={pendingBasicLands}
                formatValue={formatValue}
                isPublicValue={isPublicValue}
                isMutating={createDeck.isPending || addCardToDeck.isPending || addBasicLands.isPending}
                isError={createDeck.isError}
                onSubmit={onSubmit}
                onBack={() => setStep('commander')}
                onEditBasicLands={() => setShowBasicLandModal(true)}
              />
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
