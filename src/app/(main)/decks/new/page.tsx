import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Create Deck',
  description: 'Create a new Commander deck',
};

export default function CreateDeckPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <h1 className="mb-6 text-3xl font-bold">Create New Deck</h1>
      <div className="rounded-lg border border-border bg-card p-6">
        <p className="text-muted-foreground">Deck creation form coming soon...</p>
      </div>
    </div>
  );
}
