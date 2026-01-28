'use client';

import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { FileText, Link, PenLine } from 'lucide-react';

export type ImportMethod = 'scratch' | 'moxfield' | 'text';

interface ImportTabsProps {
  value: ImportMethod;
  onValueChange: (value: ImportMethod) => void;
  children: React.ReactNode;
}

export function ImportTabs({ value, onValueChange, children }: ImportTabsProps) {
  return (
    <Tabs value={value} onValueChange={(v) => onValueChange(v as ImportMethod)} className="w-full">
      <TabsList className="grid w-full grid-cols-3 mb-6">
        <TabsTrigger value="scratch" className="flex items-center gap-2">
          <PenLine className="h-4 w-4" />
          <span className="hidden sm:inline">From Scratch</span>
          <span className="sm:hidden">New</span>
        </TabsTrigger>
        <TabsTrigger value="moxfield" className="flex items-center gap-2">
          <Link className="h-4 w-4" />
          <span className="hidden sm:inline">Moxfield</span>
          <span className="sm:hidden">URL</span>
        </TabsTrigger>
        <TabsTrigger value="text" className="flex items-center gap-2">
          <FileText className="h-4 w-4" />
          <span className="hidden sm:inline">Text List</span>
          <span className="sm:hidden">Text</span>
        </TabsTrigger>
      </TabsList>
      {children}
    </Tabs>
  );
}

export function ImportTabsContent({
  value,
  children,
}: {
  value: ImportMethod;
  children: React.ReactNode;
}) {
  return <TabsContent value={value}>{children}</TabsContent>;
}

export { TabsContent };
