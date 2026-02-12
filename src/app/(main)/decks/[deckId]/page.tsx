'use client';

import { use, useMemo, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import {
  ArrowLeft,
  Edit,
  Heart,
  Share2,
  Trash2,
  Layers,
  Calendar,
  Eye,
  EyeOff,
  Mail,
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

import { useDeck, useDeleteDeck } from '@/hooks/use-deck';
import { useToggleDeckLike } from '@/hooks/use-deck-like';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { useToast } from '@/components/ui/toast';
import { Container } from '@/components/layout/container';
import { ColorIdentityBadges } from '@/components/cards/color-identity-badges';
import { ManaCost } from '@/components/cards/mana-cost';
import { CommanderCard } from '@/components/cards/commander-card';
import { GroupedCardImageGrid } from '@/components/cards/card-image-grid';
import { DeckViewSkeleton } from '@/components/decks/deck-view-skeleton';
import { PdfExportButton } from '@/components/decks/pdf-export-button';
import { NewMessageDialog } from '@/components/messaging';
import { CollaboratorList } from '@/components/collaboration';
import { ReviewList } from '@/components/reviews';
import { ViewModeToggle, type ViewMode } from '@/components/ui/view-mode-toggle';
import { BackToTop } from '@/components/ui/back-to-top';
import {
  groupCardsByType,
  calculateManaCurve,
  calculateTotalCards,
  calculateAverageCmc,
} from '@/lib/deck-utils';
import { cn } from '@/lib/utils';
import type { DeckCard, Card as PrismaCard } from '@prisma/client';

interface PageProps {
  params: Promise<{ deckId: string }>;
}

type DeckCardWithCard = DeckCard & { card: PrismaCard };

export default function DeckViewPage({ params }: PageProps) {
  const { deckId } = use(params);
  const router = useRouter();
  const { data: session } = useSession();
  const { data, isLoading, error } = useDeck(deckId);
  const deleteDeck = useDeleteDeck();
  const { toggle: toggleLike, isPending: isLikePending } = useToggleDeckLike();
  const { toast } = useToast();

  // Dialog state for messaging
  const [showMessageDialog, setShowMessageDialog] = useState(false);

  // View mode state (text list vs image grid)
  const [viewMode, setViewMode] = useState<ViewMode>('text');

  // Memoize computed values - must be called before any early returns (rules of hooks)
  const deck = data?.deck;
  const isLiked = data?.isLiked ?? false;
  const cardGroups = useMemo<Record<string, DeckCardWithCard[]>>(() => {
    if (!deck) return {};
    return groupCardsByType(deck.cards, { sortBy: 'name' });
  }, [deck]);
  const manaCurve = useMemo(() => (deck ? calculateManaCurve(deck.cards) : {}), [deck]);
  const totalCards = useMemo(() => (deck ? calculateTotalCards(deck.cards) : 0), [deck]);
  const avgCmc = useMemo(
    () => (deck ? calculateAverageCmc(deck.cards) : { withoutLands: 0, withLands: 0 }),
    [deck]
  );

  const handleDelete = async () => {
    try {
      await deleteDeck.mutateAsync(deckId);
      router.push('/decks');
    } catch {
      toast('Failed to delete deck', 'error');
    }
  };

  const handleCopyUrl = () => {
    navigator.clipboard.writeText(window.location.href);
    toast('Link copied to clipboard', 'success');
  };

  const handleToggleLike = async () => {
    if (!session?.user) {
      toast('Sign in to like decks', 'error');
      return;
    }
    try {
      await toggleLike(deckId, isLiked);
    } catch {
      toast('Failed to update like', 'error');
    }
  };

  if (isLoading) {
    return (
      <div className="py-8">
        <Container>
          <DeckViewSkeleton />
        </Container>
      </div>
    );
  }

  if (error || !deck) {
    return (
      <div className="py-8">
        <Container className="max-w-4xl">
          <div className="py-12 text-center">
            <h1 className="text-2xl font-bold">Deck not found</h1>
            <p className="text-muted-foreground mt-2">
              This deck may have been deleted or you don&apos;t have permission to view it.
            </p>
            <Link href="/decks">
              <Button className="mt-4">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Decks
              </Button>
            </Link>
          </div>
        </Container>
      </div>
    );
  }

  const isOwner = session?.user?.id === deck.userId;
  const updatedAt = typeof deck.updatedAt === 'string' ? new Date(deck.updatedAt) : deck.updatedAt;

  // Get commander image
  const commanderImageUris = deck.commander?.imageUris as {
    normal?: string;
    art_crop?: string;
  } | null;
  const commanderImage = commanderImageUris?.art_crop || commanderImageUris?.normal;

  return (
    <div className="py-8">
      <Container>
        {/* Header */}
        <div className="mb-6">
          <Link
            href="/decks"
            className="text-muted-foreground hover:text-foreground inline-flex items-center text-sm"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Decks
          </Link>
        </div>

        {/* Hero Section with background image */}
        <div className="relative mb-8 overflow-hidden rounded-xl">
          {commanderImage && (
            <div className="absolute inset-0 opacity-15">
              <Image src={commanderImage} alt="" fill className="object-cover" />
            </div>
          )}
          <div className="relative p-6 md:p-8">
            <div className="flex flex-col gap-6 md:flex-row md:items-start md:justify-between">
              <div className="flex-1">
                <div className="mb-2 flex items-center gap-3">
                  <Badge variant="secondary">{deck.format}</Badge>
                  {deck.isPublic ? (
                    <Badge variant="outline" className="gap-1">
                      <Eye className="h-3 w-3" />
                      Public
                    </Badge>
                  ) : (
                    <Badge variant="outline" className="gap-1">
                      <EyeOff className="h-3 w-3" />
                      Private
                    </Badge>
                  )}
                </div>
                <h1 className="text-3xl font-bold tracking-tight md:text-4xl">{deck.name}</h1>
                {deck.commander && (
                  <p className="text-muted-foreground mt-2 text-lg">
                    Commanded by {deck.commander.name}
                  </p>
                )}
                {deck.description && (
                  <p className="text-muted-foreground mt-4 max-w-2xl">{deck.description}</p>
                )}
                <div className="mt-4 flex items-center gap-4">
                  <ColorIdentityBadges colors={deck.colorIdentity} size="lg" />
                </div>
              </div>

              {/* Owner Info */}
              <Link
                href={`/users/${deck.userId}`}
                className="flex items-center gap-3 transition-opacity hover:opacity-80"
              >
                <Avatar className="h-10 w-10">
                  <AvatarImage src={deck.user.image ?? undefined} />
                  <AvatarFallback>{deck.user.name?.charAt(0) ?? 'U'}</AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-medium hover:underline">{deck.user.name}</p>
                  <p className="text-muted-foreground text-sm">
                    Updated {formatDistanceToNow(updatedAt, { addSuffix: true })}
                  </p>
                </div>
              </Link>
            </div>

            {/* Stats Row */}
            <div className="mt-8 grid grid-cols-2 gap-3 lg:grid-cols-4">
              <div className="bg-background/60 flex items-center gap-3 rounded-lg p-3 shadow-sm backdrop-blur-sm">
                <div className="bg-primary/10 flex h-9 w-9 shrink-0 items-center justify-center rounded-full">
                  <Layers className="text-primary h-4 w-4" />
                </div>
                <div className="min-w-0">
                  <p className="text-lg font-bold sm:text-xl">{totalCards}</p>
                  <p className="text-muted-foreground text-xs">Total Cards</p>
                </div>
              </div>
              <div className="bg-background/60 flex items-center gap-3 rounded-lg p-3 shadow-sm backdrop-blur-sm">
                <div className="bg-primary/10 flex h-9 w-9 shrink-0 items-center justify-center rounded-full">
                  <span className="text-primary text-sm font-bold">⊘</span>
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-baseline gap-1.5">
                    <p className="text-lg font-bold sm:text-xl">{avgCmc.withoutLands.toFixed(2)}</p>
                    <p className="text-muted-foreground text-[10px]">
                      ({avgCmc.withLands.toFixed(2)})
                    </p>
                  </div>
                  <p className="text-muted-foreground text-xs">Avg. CMC</p>
                </div>
              </div>
              <div className="bg-background/60 flex items-center gap-3 rounded-lg p-3 shadow-sm backdrop-blur-sm">
                <div className="bg-primary/10 flex h-9 w-9 shrink-0 items-center justify-center rounded-full">
                  <Heart className="text-primary h-4 w-4" />
                </div>
                <div className="min-w-0">
                  <p className="text-lg font-bold sm:text-xl">{deck.favorites.length}</p>
                  <p className="text-muted-foreground text-xs">Likes</p>
                </div>
              </div>
              <div className="bg-background/60 flex items-center gap-3 rounded-lg p-3 shadow-sm backdrop-blur-sm">
                <div className="bg-primary/10 flex h-9 w-9 shrink-0 items-center justify-center rounded-full">
                  <Calendar className="text-primary h-4 w-4" />
                </div>
                <div className="min-w-0">
                  <p className="truncate text-lg font-bold sm:text-xl">
                    {formatDistanceToNow(updatedAt)}
                  </p>
                  <p className="text-muted-foreground text-xs">Last Updated</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Actions - separate section with image only inside pill */}
        <div className="mb-8 flex justify-center">
          <div className="relative overflow-hidden rounded-2xl sm:rounded-full">
            {/* Background image only inside the pill */}
            {commanderImage && (
              <div className="absolute inset-0 opacity-25">
                <Image src={commanderImage} alt="" fill className="object-cover object-bottom" />
              </div>
            )}
            <div className="relative flex flex-wrap items-center justify-center gap-2 px-4 py-2 backdrop-blur-sm sm:gap-3 sm:px-10">
              {isOwner && (
                <>
                  <Link href={`/decks/${deckId}/edit`}>
                    <button
                      className={cn(
                        'flex h-10 w-10 items-center justify-center rounded-full',
                        'bg-primary text-primary-foreground',
                        'shadow-primary/25 shadow-md',
                        'transition-all duration-200',
                        'hover:shadow-primary/30 hover:scale-110 hover:shadow-lg',
                        'active:scale-95 active:shadow-sm',
                        'focus-visible:ring-primary focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2'
                      )}
                      aria-label="Edit deck"
                    >
                      <Edit className="h-4 w-4" />
                    </button>
                  </Link>
                  <Dialog>
                    <DialogTrigger asChild>
                      <button
                        className={cn(
                          'flex h-10 w-10 items-center justify-center rounded-full',
                          'bg-destructive/10 text-destructive',
                          'shadow-destructive/10 shadow-md',
                          'transition-all duration-200',
                          'hover:bg-destructive/20 hover:shadow-destructive/20 hover:scale-110 hover:shadow-lg',
                          'active:scale-95 active:shadow-sm',
                          'focus-visible:ring-destructive focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2'
                        )}
                        aria-label="Delete deck"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Delete Deck</DialogTitle>
                        <DialogDescription>
                          Are you sure you want to delete &quot;{deck.name}&quot;? This action
                          cannot be undone.
                        </DialogDescription>
                      </DialogHeader>
                      <DialogFooter>
                        <Button
                          variant="destructive"
                          onClick={handleDelete}
                          disabled={deleteDeck.isPending}
                        >
                          {deleteDeck.isPending ? 'Deleting...' : 'Delete Deck'}
                        </Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                </>
              )}
              {!isOwner && session?.user && (
                <button
                  onClick={() => setShowMessageDialog(true)}
                  className={cn(
                    'flex h-10 w-10 items-center justify-center rounded-full',
                    'bg-primary text-primary-foreground',
                    'shadow-primary/25 shadow-md',
                    'transition-all duration-200',
                    'hover:shadow-primary/30 hover:scale-110 hover:shadow-lg',
                    'active:scale-95 active:shadow-sm',
                    'focus-visible:ring-primary focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2'
                  )}
                  aria-label="Message owner"
                >
                  <Mail className="h-4 w-4" />
                </button>
              )}
              <button
                onClick={handleCopyUrl}
                className={cn(
                  'flex h-10 w-10 items-center justify-center rounded-full',
                  'bg-primary text-primary-foreground',
                  'shadow-primary/25 shadow-md',
                  'transition-all duration-200',
                  'hover:shadow-primary/30 hover:scale-110 hover:shadow-lg',
                  'active:scale-95 active:shadow-sm',
                  'focus-visible:ring-primary focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2'
                )}
                aria-label="Share deck"
              >
                <Share2 className="h-4 w-4" />
              </button>
              <PdfExportButton
                deckName={deck.name}
                commander={deck.commander}
                cards={deck.cards}
                iconOnly
                variant="default"
                className={cn(
                  'h-10 w-10 rounded-full',
                  'bg-primary text-primary-foreground',
                  'shadow-primary/25 shadow-md',
                  'transition-all duration-200',
                  'hover:shadow-primary/30 hover:scale-110 hover:shadow-lg',
                  'active:scale-95 active:shadow-sm'
                )}
              />
              <button
                onClick={handleToggleLike}
                disabled={isLikePending}
                className={cn(
                  'flex h-10 w-10 items-center justify-center rounded-full',
                  'transition-all duration-200',
                  'focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2',
                  isLiked
                    ? 'bg-red-500 text-white shadow-md shadow-red-500/25 hover:scale-110 hover:shadow-lg hover:shadow-red-500/30 focus-visible:ring-red-500'
                    : 'bg-primary text-primary-foreground shadow-primary/25 hover:shadow-primary/30 focus-visible:ring-primary shadow-md hover:scale-110 hover:shadow-lg',
                  'active:scale-95 active:shadow-sm',
                  isLikePending && 'cursor-not-allowed opacity-50'
                )}
                aria-label={isLiked ? 'Unlike deck' : 'Like deck'}
              >
                <Heart className={cn('h-4 w-4', isLiked && 'fill-current')} />
              </button>
              {deck.favorites.length > 0 && (
                <span className="text-foreground/70 text-sm font-medium">
                  {deck.favorites.length}
                </span>
              )}
            </div>
          </div>
        </div>

        <div className="grid gap-8 lg:grid-cols-3">
          {/* Main Content - Card List */}
          <div className="space-y-6 lg:col-span-2">
            {/* Commander Section */}
            {deck.commander && (
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle>Commander</CardTitle>
                </CardHeader>
                <CardContent className="p-4 pt-0">
                  <CommanderCard
                    commander={{
                      name: deck.commander.name,
                      typeLine: deck.commander.typeLine,
                      manaCost: deck.commander.manaCost,
                      oracleText: deck.commander.oracleText,
                      imageUris: deck.commander.imageUris,
                    }}
                    variant="full"
                    className="border-0 p-0"
                  />
                </CardContent>
              </Card>
            )}

            {/* Card List Header with View Toggle */}
            {deck.cards.length > 0 && (
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold">Card List</h2>
                <ViewModeToggle mode={viewMode} onChange={setViewMode} />
              </div>
            )}

            {/* Card List - Text View */}
            {viewMode === 'text' &&
              Object.entries(cardGroups).map(([type, cards]) => (
                <Card key={type}>
                  <CardHeader className="pb-3">
                    <CardTitle className="flex items-center justify-between text-base">
                      <span>{type}</span>
                      <Badge variant="secondary">
                        {cards.reduce((acc, c) => acc + c.quantity, 0)}
                      </Badge>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <ul className="space-y-1">
                      {cards.map((deckCard) => (
                        <li
                          key={deckCard.card.name}
                          className="hover:bg-muted/50 flex items-center justify-between rounded px-2 py-1.5 text-sm transition-colors"
                        >
                          <span className="flex min-w-0 items-center gap-2">
                            <span className="text-muted-foreground w-5 shrink-0 text-right">
                              {deckCard.quantity}x
                            </span>
                            <span className="truncate">{deckCard.card.name}</span>
                          </span>
                          {deckCard.card.manaCost && (
                            <div className="ml-2 shrink-0">
                              <ManaCost cost={deckCard.card.manaCost} size="sm" />
                            </div>
                          )}
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              ))}

            {/* Card List - Image View */}
            {viewMode === 'image' && Object.keys(cardGroups).length > 0 && (
              <GroupedCardImageGrid cardGroups={cardGroups} />
            )}

            {deck.cards.length === 0 && (
              <Card>
                <CardContent className="py-12 text-center">
                  <Layers className="text-muted-foreground mx-auto h-12 w-12" />
                  <h3 className="mt-4 font-semibold">No cards yet</h3>
                  <p className="text-muted-foreground mt-2 text-sm">
                    This deck doesn&apos;t have any cards.
                  </p>
                  {isOwner && (
                    <Link href={`/decks/${deckId}/edit`}>
                      <Button className="mt-4">Add Cards</Button>
                    </Link>
                  )}
                </CardContent>
              </Card>
            )}
          </div>

          {/* Sidebar - Stats */}
          <div className="space-y-6">
            {/* Mana Curve */}
            <Card>
              <CardHeader>
                <CardTitle>Mana Curve</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex h-24 items-end justify-between gap-1 sm:h-32">
                  {['0', '1', '2', '3', '4', '5', '6', '7+'].map((cmc) => {
                    const count = manaCurve[cmc] || 0;
                    const maxCount = Math.max(...Object.values(manaCurve), 1);
                    const height = (count / maxCount) * 100;
                    return (
                      <div key={cmc} className="flex flex-1 flex-col items-center gap-1">
                        <div
                          className="bg-muted relative w-full rounded-t"
                          style={{ height: '100px' }}
                        >
                          <div
                            className="bg-primary absolute bottom-0 w-full rounded-t transition-all"
                            style={{ height: `${height}%` }}
                          />
                        </div>
                        <span className="text-muted-foreground text-xs">{cmc}</span>
                        <span className="text-xs font-medium">{count}</span>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>

            {/* Color Distribution */}
            <Card>
              <CardHeader>
                <CardTitle>Colors</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex justify-center gap-2">
                  <ColorIdentityBadges colors={deck.colorIdentity} size="lg" />
                </div>
                {deck.colorIdentity.length === 0 && (
                  <p className="text-muted-foreground mt-2 text-center text-sm">Colorless</p>
                )}
              </CardContent>
            </Card>

            {/* Tags */}
            {deck.tags.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Tags</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2">
                    {deck.tags.map(({ tag }) => (
                      <Badge key={tag.id} variant="secondary">
                        {tag.name}
                      </Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Collaborators */}
            <CollaboratorList deckId={deckId} isOwner={isOwner} />

            {/* Reviews */}
            <ReviewList deckId={deckId} deckOwnerId={deck.userId} />
          </div>
        </div>

        {/* Message Dialog */}
        <NewMessageDialog
          recipientId={deck.userId}
          recipientName={deck.user.name ?? undefined}
          open={showMessageDialog}
          onOpenChange={setShowMessageDialog}
        />
      </Container>

      {/* Back to Top */}
      <BackToTop />
    </div>
  );
}
