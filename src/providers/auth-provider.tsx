'use client';

import { SessionProvider } from 'next-auth/react';
import { type ReactNode } from 'react';

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  return (
    <SessionProvider
      // Refetch session on window focus to keep session fresh
      refetchOnWindowFocus={true}
      // Set base path for auth API routes
      basePath="/api/auth"
    >
      {children}
    </SessionProvider>
  );
}
