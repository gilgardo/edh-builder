'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useMoxfieldImport } from '@/hooks/use-deck-import';
import { Loader2, ExternalLink, AlertCircle, CheckCircle } from 'lucide-react';
import type { ImportPreview } from '@/schemas/import.schema';

interface MoxfieldImportProps {
  onPreviewReady: (preview: ImportPreview & { deckName?: string; description?: string }) => void;
}

export function MoxfieldImport({ onPreviewReady }: MoxfieldImportProps) {
  const [url, setUrl] = useState('');
  const moxfieldMutation = useMoxfieldImport();

  const handleFetch = async () => {
    if (!url.trim()) return;

    try {
      const result = await moxfieldMutation.mutateAsync(url);
      onPreviewReady(result);
    } catch {
      // Error handled by mutation state
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !moxfieldMutation.isPending) {
      handleFetch();
    }
  };

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <label className="text-sm font-medium">Moxfield Deck URL</label>
        <div className="flex gap-2">
          <Input
            type="url"
            placeholder="https://moxfield.com/decks/..."
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={moxfieldMutation.isPending}
            className="flex-1"
          />
          <Button
            onClick={handleFetch}
            disabled={!url.trim() || moxfieldMutation.isPending}
            className="shrink-0"
          >
            {moxfieldMutation.isPending ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Fetching
              </>
            ) : (
              'Fetch Deck'
            )}
          </Button>
        </div>
        <p className="text-xs text-muted-foreground">
          Paste a public Moxfield deck URL or deck ID
        </p>
      </div>

      {/* Error display */}
      {moxfieldMutation.isError && (
        <div className="flex items-start gap-2 p-3 rounded-md bg-destructive/10 text-destructive">
          <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
          <div>
            <p className="text-sm font-medium">Failed to fetch deck</p>
            <p className="text-xs mt-1">
              {moxfieldMutation.error?.message || 'Please check the URL and try again'}
            </p>
          </div>
        </div>
      )}

      {/* Success indicator */}
      {moxfieldMutation.isSuccess && (
        <div className="flex items-center gap-2 p-3 rounded-md bg-green-500/10 text-green-600 dark:text-green-400">
          <CheckCircle className="h-4 w-4" />
          <span className="text-sm">Deck fetched successfully</span>
        </div>
      )}

      {/* Info box */}
      <div className="p-4 rounded-md border border-border bg-muted/30">
        <h4 className="text-sm font-medium mb-2">Supported URL Formats</h4>
        <ul className="text-xs text-muted-foreground space-y-1">
          <li className="flex items-center gap-1">
            <ExternalLink className="h-3 w-3" />
            https://moxfield.com/decks/abc123
          </li>
          <li className="flex items-center gap-1">
            <ExternalLink className="h-3 w-3" />
            https://www.moxfield.com/decks/abc123/primer
          </li>
          <li className="flex items-center gap-1">
            <ExternalLink className="h-3 w-3" />
            abc123 (deck ID only)
          </li>
        </ul>
        <p className="text-xs text-muted-foreground mt-3">
          Note: Only public decks can be imported. Private decks will show an error.
        </p>
      </div>
    </div>
  );
}
