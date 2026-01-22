'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

export interface DeckSettingsFormProps {
  deck: {
    id: string;
    name: string;
    description: string | null;
    format: string;
    isPublic: boolean;
  };
  onUpdate: (params: {
    deckId: string;
    data: { name?: string; description?: string; isPublic?: boolean };
  }) => void;
  isUpdating: boolean;
}

export function DeckSettingsForm({ deck, onUpdate, isUpdating }: DeckSettingsFormProps) {
  const [name, setName] = useState(deck.name);
  const [description, setDescription] = useState(deck.description ?? '');
  const [isPublic, setIsPublic] = useState(deck.isPublic);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdate({
      deckId: deck.id,
      data: { name, description, isPublic },
    });
  };

  return (
    <form onSubmit={handleSubmit} className="mt-6 space-y-4">
      <div>
        <Label htmlFor="name">Deck Name</Label>
        <Input id="name" value={name} onChange={(e) => setName(e.target.value)} className="mt-1" />
      </div>
      <div>
        <Label htmlFor="description">Description</Label>
        <Textarea
          id="description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className="mt-1"
          rows={4}
        />
      </div>
      <div>
        <Label htmlFor="visibility">Visibility</Label>
        <Select
          value={isPublic ? 'public' : 'private'}
          onValueChange={(v) => setIsPublic(v === 'public')}
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
      <Button type="submit" className="w-full" disabled={isUpdating}>
        {isUpdating ? 'Saving...' : 'Save Changes'}
      </Button>
    </form>
  );
}
