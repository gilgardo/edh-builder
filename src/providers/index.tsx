'use client';

import { type ReactNode } from 'react';
import { QueryProvider } from './query-provider';
import { AuthProvider } from './auth-provider';
import { ToastProvider } from '@/components/ui/toast';

interface ProvidersProps {
  children: ReactNode;
}

export function Providers({ children }: ProvidersProps) {
  return (
    <AuthProvider>
      <QueryProvider>
        <ToastProvider>{children}</ToastProvider>
      </QueryProvider>
    </AuthProvider>
  );
}
