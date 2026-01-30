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
import { DeckViewSkeleton } from '@/components/decks/deck-view-skeleton';
import { PdfExportButton } from '@/components/decks/pdf-export-button';
import { NewMessageDialog } from '@/components/messaging';
import { CollaboratorList } from '@/components/collaboration';
import { ReviewList } from '@/components/reviews';
import { groupCardsByType, calculateManaCurve, calculateTotalCards } from '@/lib/deck-utils';
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

  // Memoize computed values - must be called before any early returns (rules of hooks)
  const deck = data?.deck;
  const isLiked = data?.isLiked ?? false;
  const cardGroups = useMemo<Record<string, DeckCardWithCard[]>>(() => {
    if (!deck) return {};
    return groupCardsByType(deck.cards, { sortBy: 'name' });
  }, [deck]);
  const manaCurve = useMemo(
    () => (deck ? calculateManaCurve(deck.cards) : {}),
    [deck]
  );
  const totalCards = useMemo(
    () => (deck ? calculateTotalCards(deck.cards) : 0),
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

        {/* Hero Section */}
        <div className="from-primary/20 via-background to-background relative mb-8 overflow-hidden rounded-xl bg-linear-to-br">
          {commanderImage && (
            <div className="absolute inset-0 opacity-20">
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

              {/* Owner Info & Actions */}
              <div className="flex flex-col gap-4">
                <Link
                  href={`/users/${deck.userId}`}
                  className="flex items-center gap-3 hover:opacity-80 transition-opacity"
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

                <div className="flex flex-wrap gap-2">
                  {isOwner && (
                    <>
                      <Link href={`/decks/${deckId}/edit`}>
                        <Button variant="outline" size="sm">
                          <Edit className="mr-2 h-4 w-4" />
                          Edit
                        </Button>
                      </Link>
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button variant="outline" size="sm" className="text-destructive">
                            <Trash2 className="h-4 w-4" />
                          </Button>
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
                    <Button variant="outline" size="sm" onClick={() => setShowMessageDialog(true)}>
                      <Mail className="mr-2 h-4 w-4" />
                      Message
                    </Button>
                  )}
                  <Button variant="outline" size="sm" onClick={handleCopyUrl}>
                    <Share2 className="mr-2 h-4 w-4" />
                    Share
                  </Button>
                  <PdfExportButton
                    deckName={deck.name}
                    commander={deck.commander}
                    cards={deck.cards}
                  />
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleToggleLike}
                    disabled={isLikePending}
                  >
                    <Heart className={cn('h-4 w-4', isLiked && 'fill-red-500 text-red-500')} />
                    <span className="ml-2">{deck.favorites.length}</span>
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Stats Row */}
        <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardContent className="flex items-center gap-4 p-4">
              <div className="bg-primary/10 flex h-10 w-10 items-center justify-center rounded-full">
                <Layers className="text-primary h-5 w-5" />
              </div>
              <div>
                <p className="text-2xl font-bold">{totalCards}</p>
                <p className="text-muted-foreground text-sm">Total Cards</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="flex items-center gap-4 p-4">
              <div className="bg-primary/10 flex h-10 w-10 items-center justify-center rounded-full">
                <span className="text-primary text-lg font-bold">⊘</span>
              </div>
              <div>
                <p className="text-2xl font-bold">{deck.avgCmc?.toFixed(2) ?? '—'}</p>
                <p className="text-muted-foreground text-sm">Avg. CMC</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="flex items-center gap-4 p-4">
              <div className="bg-primary/10 flex h-10 w-10 items-center justify-center rounded-full">
                <Heart className="text-primary h-5 w-5" />
              </div>
              <div>
                <p className="text-2xl font-bold">{deck.favorites.length}</p>
                <p className="text-muted-foreground text-sm">Likes</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="flex items-center gap-4 p-4">
              <div className="bg-primary/10 flex h-10 w-10 items-center justify-center rounded-full">
                <Calendar className="text-primary h-5 w-5" />
              </div>
              <div>
                <p className="text-2xl font-bold">{formatDistanceToNow(updatedAt)}</p>
                <p className="text-muted-foreground text-sm">Last Updated</p>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-8 lg:grid-cols-3">
          {/* Main Content - Card List */}
          <div className="space-y-6 lg:col-span-2">
            {/* Commander Section */}
            {deck.commander && (
              <Card>
                <CardHeader>
                  <CardTitle>Commander</CardTitle>
                </CardHeader>
                <CardContent className="flex gap-4">
                  {commanderImageUris?.normal && (
                    <div className="relative aspect-488/680 w-32 overflow-hidden rounded-lg">
                      <Image
                        src={commanderImageUris.normal}
                        alt={deck.commander.name}
                        fill
                        className="object-cover"
                      />
                    </div>
                  )}
                  <div>
                    <h3 className="font-semibold">{deck.commander.name}</h3>
                    <p className="text-muted-foreground text-sm">{deck.commander.typeLine}</p>
                    {deck.commander.manaCost && (
                      <div className="mt-2">
                        <ManaCost cost={deck.commander.manaCost} />
                      </div>
                    )}
                    {deck.commander.oracleText && (
                      <p className="mt-2 text-sm whitespace-pre-line">
                        {deck.commander.oracleText}
                      </p>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Card List by Type */}
            {Object.entries(cardGroups).map(([type, cards]) => (
              <Card key={type}>
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center justify-between">
                    <span>{type}</span>
                    <Badge variant="secondary">
                      {cards.reduce((acc, c) => acc + c.quantity, 0)}
                    </Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-1">
                    {cards.map((deckCard) => (
                      <li
                        key={deckCard.card.name}
                        className="hover:bg-muted/50 flex items-center justify-between rounded px-2 py-1 text-sm"
                      >
                        <span className="flex items-center gap-2">
                          <span className="text-muted-foreground w-4">{deckCard.quantity}x</span>
                          <span>{deckCard.card.name}</span>
                        </span>
                        {deckCard.card.manaCost && (
                          <ManaCost cost={deckCard.card.manaCost} size="sm" />
                        )}
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            ))}

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
                <div className="flex h-32 items-end justify-between gap-1">
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
    </div>
  );
}
