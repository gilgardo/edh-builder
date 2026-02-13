'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { Heart, Layers, Lock } from 'lucide-react';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { ColorIdentityBadges } from '@/components/cards/color-identity-badges';
import { getCardImageUrl } from '@/lib/card-image-url';
import { cn, getColorIdentityInfo } from '@/lib/utils';
import type { DeckListItem } from '@/hooks/use-decks';

interface DeckCardProps {
  deck: DeckListItem;
  className?: string;
}

export function DeckCard({ deck, className }: DeckCardProps) {
  const router = useRouter();
  const commanderImage = getCardImageUrl(deck.commander, 'art_crop') ?? getCardImageUrl(deck.commander, 'normal');
  const likesCount = deck.favorites?.length ?? 0;

  const colorInfo = getColorIdentityInfo(deck.colorIdentity);

  const handleCardClick = () => {
    router.push(`/decks/${deck.id}`);
  };

  return (
    <Card
      onClick={handleCardClick}
      role="link"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          handleCardClick();
        }
      }}
      variant="elevated"
      hover="lift"
      gradient={colorInfo.gradient}
      foil
      className={cn('group cursor-pointer overflow-hidden', className)}
    >
      {/* Commander Image */}
      <div className="bg-muted relative aspect-4/3 overflow-hidden">
        {commanderImage ? (
          <Image
            src={commanderImage}
            alt={deck.commander?.name ?? 'Deck commander'}
            fill
            className="object-cover transition-transform duration-300 group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full items-center justify-center bg-gradient-to-br from-muted to-muted/50">
            <Layers className="text-muted-foreground h-12 w-12" />
          </div>
        )}
        {/* Gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />

        {/* Color identity badges */}
        <div className="absolute bottom-2 left-2">
          <ColorIdentityBadges colors={deck.colorIdentity} size="md" />
        </div>

        {/* Top badges */}
        <div className="absolute top-2 right-2 flex items-center gap-1.5">
          {!deck.isPublic && (
            <Badge variant="muted" size="sm" className="bg-black/60 text-white border-0">
              <Lock className="mr-1 h-3 w-3" />
              Private
            </Badge>
          )}
          <Badge variant="muted" size="sm" className="bg-black/60 text-white border-0">
            {deck.format}
          </Badge>
        </div>

        {/* Guild name indicator for multi-color */}
        {deck.colorIdentity && deck.colorIdentity.length >= 2 && (
          <div className="absolute bottom-2 right-2">
            <Badge
              variant={`guild-${colorInfo.gradient}` as 'guild-azorius'}
              size="sm"
              className="opacity-90"
            >
              {colorInfo.name}
            </Badge>
          </div>
        )}
      </div>

      <CardHeader className="pb-2">
        <h3 className="text-foreground group-hover:text-primary line-clamp-1 font-semibold transition-colors">
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
        <Link
          href={`/users/${deck.user.id}`}
          onClick={(e) => e.stopPropagation()}
          className="flex items-center gap-2 transition-colors hover:text-foreground"
        >
          <Avatar className="h-6 w-6 ring-2 ring-background">
            <AvatarImage src={deck.user.image ?? undefined} alt={deck.user.name ?? 'User'} />
            <AvatarFallback className="text-xs bg-primary/10 text-primary">
              {deck.user.name?.charAt(0) ?? 'U'}
            </AvatarFallback>
          </Avatar>
          <span className="truncate hover:underline">{deck.user.name}</span>
        </Link>
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1">
            <Layers className="h-4 w-4" />
            {deck._count.cards}
          </span>
          <span className="flex items-center gap-1 text-rose-500">
            <Heart className="h-4 w-4" />
            {likesCount}
          </span>
        </div>
      </CardFooter>
    </Card>
  );
}

export function DeckCardSkeleton() {
  return (
    <Card variant="elevated" className="overflow-hidden">
      <div className="bg-muted aspect-4/3 animate-shimmer relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent" />
      </div>
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
