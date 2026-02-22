'use client';

import { createContext, useContext } from 'react';
import { FileText, Link as LinkIcon, PenLine } from 'lucide-react';
import LinkWithActiveState from '@/components/ui/link-with-active-state';

export type ImportMethod = 'scratch' | 'moxfield' | 'text';

const ActiveTabContext = createContext<ImportMethod>('scratch');

const TABS = [
  { value: 'scratch' as ImportMethod, icon: PenLine, label: 'From Scratch' },
  { value: 'moxfield' as ImportMethod, icon: LinkIcon, label: 'Moxfield' },
  { value: 'text' as ImportMethod, icon: FileText, label: 'Text List' },
];

interface ImportTabsProps {
  value: ImportMethod;
  onValueChange: (value: ImportMethod) => void;
  children: React.ReactNode;
}

export function ImportTabs({ value, onValueChange, children }: ImportTabsProps) {
  return (
    <ActiveTabContext.Provider value={value}>
      <div className="w-full">
        <div className="bg-muted mb-6 flex gap-1 rounded-lg p-1">
          {TABS.map((tab) => (
            <LinkWithActiveState
              key={tab.value}
              isActive={value === tab.value}
              icon={tab.icon}
              label={tab.label}
              onClick={() => onValueChange(tab.value)}
            />
          ))}
        </div>
        {children}
      </div>
    </ActiveTabContext.Provider>
  );
}

export function ImportTabsContent({
  value,
  children,
}: {
  value: ImportMethod;
  children: React.ReactNode;
}) {
  const active = useContext(ActiveTabContext);
  if (value !== active) return null;
  return <>{children}</>;
}
