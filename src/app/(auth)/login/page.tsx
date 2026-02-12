import type { Metadata } from 'next';
import type { Route } from 'next';
import Link from 'next/link';
import Image from 'next/image';
import { LoginForm } from '@/components/auth/login-form';
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
          <Link href="/" className="flex items-center gap-3">
            <Image src="/logo-v2.png" alt="EDH Builder" width={56} height={56} className="h-14 w-14" />
            <span className="text-xl font-bold">EDH Builder</span>
          </Link>
        </div>

        <Card>
          <CardHeader className="text-center">
            <CardTitle className="text-2xl">Welcome back</CardTitle>
            <CardDescription>Sign in to your account to continue</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Email/Password Form */}
            <LoginForm callbackUrl="/decks" />

            {/* Divider */}
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t border-border" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-card px-2 text-muted-foreground">Or continue with</span>
              </div>
            </div>

            {/* OAuth Buttons */}
            <LoginButtons callbackUrl="/decks" />

            {/* Guest browsing */}
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
          <Link href={'/terms' as Route} className="text-primary hover:underline">
            Terms of Service
          </Link>{' '}
          and{' '}
          <Link href={'/privacy' as Route} className="text-primary hover:underline">
            Privacy Policy
          </Link>
          .
        </p>
      </div>
    </div>
  );
}
