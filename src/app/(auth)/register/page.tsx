import type { Metadata } from 'next';
import type { Route } from 'next';
import Link from 'next/link';
import Image from 'next/image';
import { RegisterForm } from '@/components/auth/register-form';
import { LoginButtons } from '@/components/auth/login-buttons';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export const metadata: Metadata = {
  title: 'Create Account',
  description: 'Create an EDH Builder account to save your decks and join the community.',
};

export default function RegisterPage() {
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
            <CardTitle className="text-2xl">Create an account</CardTitle>
            <CardDescription>Start building and sharing your Commander decks</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Registration Form */}
            <RegisterForm callbackUrl="/decks" />

            {/* Divider */}
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t border-border" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-card px-2 text-muted-foreground">Or sign up with</span>
              </div>
            </div>

            {/* OAuth Buttons */}
            <LoginButtons callbackUrl="/decks" />
          </CardContent>
        </Card>

        <p className="mt-6 text-center text-sm text-muted-foreground">
          By creating an account, you agree to our{' '}
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
