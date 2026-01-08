import type { Metadata } from 'next';
import type { Route } from 'next';
import Link from 'next/link';

import { LoginButtons } from '@/components/auth/login-buttons';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export const metadata: Metadata = {
  title: 'Sign In',
  description: 'Sign in to EDH Builder to save your decks and join the community.',
};

export default function LoginPage() {
  return (
    <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center px-4 py-12">
      <div className="mx-auto w-full max-w-md">
        {/* Logo */}
        <div className="mb-8 flex justify-center">
          <Link href="/" className="flex items-center gap-2">
            <div className="flex gap-0.5">
              <span className="mana-badge mana-badge-w text-xs">W</span>
              <span className="mana-badge mana-badge-u text-xs">U</span>
              <span className="mana-badge mana-badge-b text-xs">B</span>
              <span className="mana-badge mana-badge-r text-xs">R</span>
              <span className="mana-badge mana-badge-g text-xs">G</span>
            </div>
            <span className="text-xl font-bold">EDH Builder</span>
          </Link>
        </div>

        <Card>
          <CardHeader className="text-center">
            <CardTitle className="text-2xl">Welcome back</CardTitle>
            <CardDescription>Sign in to your account to continue</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <LoginButtons callbackUrl="/decks" />

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t border-border" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-card px-2 text-muted-foreground">Or continue as guest</span>
              </div>
            </div>

            <p className="text-center text-sm text-muted-foreground">
              You can browse decks and build without signing in.{' '}
              <Link href="/decks" className="text-primary hover:underline">
                Browse decks
              </Link>
            </p>
          </CardContent>
        </Card>

        <p className="mt-6 text-center text-sm text-muted-foreground">
          By signing in, you agree to our{' '}
          <Link href={"/terms" as Route} className="text-primary hover:underline">
            Terms of Service
          </Link>{' '}
          and{' '}
          <Link href={"/privacy" as Route} className="text-primary hover:underline">
            Privacy Policy
          </Link>
          .
        </p>
      </div>
    </div>
  );
}
