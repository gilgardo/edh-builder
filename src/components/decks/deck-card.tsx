import Link from 'next/link';
import Image from 'next/image';
import { Heart, Layers, Lock } from 'lucide-react';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ColorIdentityBadges } from '@/components/cards/color-identity-badges';
import { cn } from '@/lib/utils';
import type { DeckListItem } from '@/hooks/use-decks';

interface DeckCardProps {
  deck: DeckListItem;
  className?: string;
}

export function DeckCard({ deck, className }: DeckCardProps) {
  const commanderImageUris = deck.commander?.imageUris;
  const commanderImage = commanderImageUris?.art_crop || commanderImageUris?.normal;
  const likesCount = deck.favorites?.length ?? 0;

  return (
    <Link href={`/decks/${deck.id}`}>
      <Card
        className={cn(
          'group hover:border-primary/50 overflow-hidden transition-all hover:shadow-lg',
          className
        )}
      >
        {/* Commander Image */}
        <div className="bg-muted relative aspect-4/3 overflow-hidden">
          {commanderImage ? (
            <Image
              src={commanderImage}
              alt={deck.commander?.name ?? 'Deck commander'}
              fill
              className="object-cover transition-transform group-hover:scale-105"
            />
          ) : (
            <div className="flex h-full items-center justify-center">
              <Layers className="text-muted-foreground h-12 w-12" />
            </div>
          )}
          {/* Gradient overlay */}
          <div className="absolute inset-0 bg-linear-to-t from-black/60 via-transparent to-transparent" />
          {/* Color identity badges */}
          <div className="absolute bottom-2 left-2">
            <ColorIdentityBadges colors={deck.colorIdentity} size="md" />
          </div>
          {/* Badges */}
          <div className="absolute top-2 right-2 flex items-center gap-1.5">
            {!deck.isPublic && (
              <span className="flex items-center gap-1 rounded-full bg-black/50 px-2 py-1 text-xs font-medium text-white">
                <Lock className="h-3 w-3" />
                Private
              </span>
            )}
            <span className="rounded-full bg-black/50 px-2 py-1 text-xs font-medium text-white">
              {deck.format}
            </span>
          </div>
        </div>

        <CardHeader className="pb-2">
          <h3 className="text-foreground group-hover:text-primary line-clamp-1 font-semibold">
            {deck.name}
          </h3>
          {deck.commander && (
            <p className="text-muted-foreground line-clamp-1 text-sm">{deck.commander.name}</p>
          )}
        </CardHeader>

        {deck.description && (
          <CardContent className="pb-2">
            <p className="text-muted-foreground line-clamp-2 text-sm">{deck.description}</p>
          </CardContent>
        )}

        <CardFooter className="text-muted-foreground flex items-center justify-between text-sm">
          <div className="flex items-center gap-2">
            <Avatar className="h-6 w-6">
              <AvatarImage src={deck.user.image ?? undefined} alt={deck.user.name ?? 'User'} />
              <AvatarFallback className="text-xs">
                {deck.user.name?.charAt(0) ?? 'U'}
              </AvatarFallback>
            </Avatar>
            <span className="truncate">{deck.user.name}</span>
          </div>
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1">
              <Layers className="h-4 w-4" />
              {deck._count.cards}
            </span>
            <span className="flex items-center gap-1">
              <Heart className="h-4 w-4" />
              {likesCount}
            </span>
          </div>
        </CardFooter>
      </Card>
    </Link>
  );
}

export function DeckCardSkeleton() {
  return (
    <Card className="overflow-hidden">
      <div className="bg-muted aspect-4/3 animate-pulse" />
      <CardHeader className="pb-2">
        <div className="bg-muted h-5 w-3/4 animate-pulse rounded" />
        <div className="bg-muted mt-1 h-4 w-1/2 animate-pulse rounded" />
      </CardHeader>
      <CardFooter className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="bg-muted h-6 w-6 animate-pulse rounded-full" />
          <div className="bg-muted h-4 w-20 animate-pulse rounded" />
        </div>
        <div className="flex items-center gap-3">
          <div className="bg-muted h-4 w-8 animate-pulse rounded" />
          <div className="bg-muted h-4 w-8 animate-pulse rounded" />
        </div>
      </CardFooter>
    </Card>
  );
}
