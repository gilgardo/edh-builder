import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Login',
  description: 'Sign in to EDH Builder',
};

export default function LoginPage() {
  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="mx-auto w-full max-w-md space-y-6 p-6">
        <div className="text-center">
          <h1 className="text-3xl font-bold">Welcome back</h1>
          <p className="mt-2 text-muted-foreground">Sign in to your account</p>
        </div>
        <div className="rounded-lg border border-border bg-card p-6">
          <p className="text-center text-muted-foreground">
            Authentication coming soon...
          </p>
        </div>
      </div>
    </div>
  );
}
