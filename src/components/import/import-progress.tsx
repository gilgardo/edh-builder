'use client';

import { Button } from '@/components/ui/button';
import { Loader2, CheckCircle, AlertCircle, XCircle } from 'lucide-react';

interface ImportProgress {
  current: number;
  total: number;
  currentCardName: string;
  status: 'idle' | 'importing' | 'completed' | 'error';
  errors: Array<{ name: string; error: string }>;
}

interface ImportProgressProps {
  progress: ImportProgress;
  onCancel?: () => void;
  onRetry?: () => void;
  onComplete?: () => void;
}

export function ImportProgressComponent({
  progress,
  onCancel,
  onRetry,
  onComplete,
}: ImportProgressProps) {
  const percentage = progress.total > 0 ? Math.round((progress.current / progress.total) * 100) : 0;

  return (
    <div className="space-y-6">
      {/* Status header */}
      <div className="flex items-center gap-3">
        {progress.status === 'importing' && (
          <>
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
            <div>
              <p className="font-medium">Importing cards...</p>
              <p className="text-sm text-muted-foreground">
                Adding {progress.currentCardName || 'cards'} to your deck
              </p>
            </div>
          </>
        )}
        {progress.status === 'completed' && (
          <>
            <CheckCircle className="h-6 w-6 text-green-600" />
            <div>
              <p className="font-medium">Import complete</p>
              <p className="text-sm text-muted-foreground">
                Successfully added {progress.current} cards
              </p>
            </div>
          </>
        )}
        {progress.status === 'error' && (
          <>
            <AlertCircle className="h-6 w-6 text-destructive" />
            <div>
              <p className="font-medium">Import completed with errors</p>
              <p className="text-sm text-muted-foreground">
                Added {progress.current} of {progress.total} cards
              </p>
            </div>
          </>
        )}
      </div>

      {/* Progress bar */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-sm">
          <span>{progress.current} of {progress.total} cards</span>
          <span>{percentage}%</span>
        </div>
        <div className="h-2 bg-muted rounded-full overflow-hidden">
          <div
            className={`h-full transition-all duration-300 ${
              progress.status === 'error'
                ? 'bg-destructive'
                : progress.status === 'completed'
                  ? 'bg-green-600'
                  : 'bg-primary'
            }`}
            style={{ width: `${percentage}%` }}
          />
        </div>
      </div>

      {/* Current card */}
      {progress.status === 'importing' && progress.currentCardName && (
        <div className="p-3 rounded-md bg-muted/50 text-center">
          <p className="text-sm text-muted-foreground">Currently adding:</p>
          <p className="font-medium">{progress.currentCardName}</p>
        </div>
      )}

      {/* Errors */}
      {progress.errors.length > 0 && (
        <div className="space-y-2">
          <p className="text-sm font-medium text-destructive flex items-center gap-2">
            <XCircle className="h-4 w-4" />
            Failed to import {progress.errors.length} cards
          </p>
          <div className="max-h-[150px] overflow-y-auto space-y-1">
            {progress.errors.map((err, i) => (
              <div
                key={i}
                className="flex items-center justify-between text-xs p-2 rounded bg-destructive/10"
              >
                <span className="font-medium">{err.name}</span>
                <span className="text-muted-foreground">{err.error}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="flex items-center justify-end gap-2 pt-4 border-t border-border">
        {progress.status === 'importing' && onCancel && (
          <Button variant="outline" onClick={onCancel}>
            Cancel
          </Button>
        )}
        {progress.status === 'error' && onRetry && (
          <Button variant="outline" onClick={onRetry}>
            Retry Failed
          </Button>
        )}
        {(progress.status === 'completed' || progress.status === 'error') && onComplete && (
          <Button onClick={onComplete}>
            {progress.status === 'completed' ? 'View Deck' : 'Continue to Deck'}
          </Button>
        )}
      </div>
    </div>
  );
}
