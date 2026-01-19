'use client';

import { useQuery } from '@tanstack/react-query';
import { getCardPrintings } from '@/services/scryfall';

export function useCardPrintings(oracleId: string | null) {
  return useQuery({
    queryKey: ['cardPrintings', oracleId],
    queryFn: () => getCardPrintings(oracleId!),
    enabled: !!oracleId,
    staleTime: 1000 * 60 * 60, // 1 hour
  });
}
