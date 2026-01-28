'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { useTextImport } from '@/hooks/use-deck-import';
import { Loader2, AlertCircle, CheckCircle, Info } from 'lucide-react';
import type { ImportPreview } from '@/schemas/import.schema';

interface TextImportProps {
  onPreviewReady: (preview: ImportPreview) => void;
}

const PLACEHOLDER_TEXT = `Commander:
1 Atraxa, Praetors' Voice

Creatures (30):
1 Birds of Paradise
1 Llanowar Elves
4 Forest
3 Island

// Comments are ignored
# Hash comments too

Instants:
1 Counterspell
1 Path to Exile`;

export function TextImport({ onPreviewReady }: TextImportProps) {
  const [text, setText] = useState('');
  const textMutation = useTextImport();

  const handleParse = async () => {
    if (!text.trim()) return;

    try {
      const result = await textMutation.mutateAsync(text);
      onPreviewReady(result);
    } catch {
      // Error handled by mutation state
    }
  };

  const handlePaste = async () => {
    try {
      const clipboardText = await navigator.clipboard.readText();
      setText(clipboardText);
    } catch {
      // Clipboard access may fail in some browsers
    }
  };

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <label className="text-sm font-medium">Deck List</label>
          <Button variant="ghost" size="sm" onClick={handlePaste} className="text-xs h-7">
            Paste from Clipboard
          </Button>
        </div>
        <Textarea
          placeholder={PLACEHOLDER_TEXT}
          value={text}
          onChange={(e) => setText(e.target.value)}
          disabled={textMutation.isPending}
          className="min-h-[300px] font-mono text-sm"
        />
        <div className="flex items-center justify-between">
          <p className="text-xs text-muted-foreground">
            {text.split('\n').filter((l) => l.trim()).length} lines
          </p>
          <Button
            onClick={handleParse}
            disabled={!text.trim() || textMutation.isPending}
          >
            {textMutation.isPending ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Parsing
              </>
            ) : (
              'Parse Deck List'
            )}
          </Button>
        </div>
      </div>

      {/* Error display */}
      {textMutation.isError && (
        <div className="flex items-start gap-2 p-3 rounded-md bg-destructive/10 text-destructive">
          <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
          <div>
            <p className="text-sm font-medium">Failed to parse deck list</p>
            <p className="text-xs mt-1">
              {textMutation.error?.message || 'Please check the format and try again'}
            </p>
          </div>
        </div>
      )}

      {/* Success indicator */}
      {textMutation.isSuccess && (
        <div className="flex items-center gap-2 p-3 rounded-md bg-green-500/10 text-green-600 dark:text-green-400">
          <CheckCircle className="h-4 w-4" />
          <span className="text-sm">Deck list parsed successfully</span>
        </div>
      )}

      {/* Format guide */}
      <div className="p-4 rounded-md border border-border bg-muted/30">
        <div className="flex items-center gap-2 mb-2">
          <Info className="h-4 w-4 text-muted-foreground" />
          <h4 className="text-sm font-medium">Supported Formats</h4>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs text-muted-foreground">
          <div>
            <p className="font-medium mb-1">Card Lines</p>
            <ul className="space-y-0.5">
              <li><code>1 Card Name</code></li>
              <li><code>1x Card Name</code></li>
              <li><code>Card Name</code> (assumes 1)</li>
              <li><code>1 Card Name (SET) 123</code> (Arena)</li>
            </ul>
          </div>
          <div>
            <p className="font-medium mb-1">Category Headers</p>
            <ul className="space-y-0.5">
              <li><code>Commander:</code></li>
              <li><code>Creatures (30):</code></li>
              <li><code>{'// Sideboard'}</code></li>
              <li><code>{'# Comments ignored'}</code></li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
