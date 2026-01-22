'use client';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="en">
      <body>
        <div className="flex min-h-screen flex-col items-center justify-center p-8 text-center">
          <h1 className="text-4xl font-bold">Something went wrong!</h1>
          <p className="mt-4 text-gray-600">{error.message || 'An unexpected error occurred'}</p>
          <button
            onClick={() => reset()}
            className="mt-6 rounded-md bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"
          >
            Try again
          </button>
        </div>
      </body>
    </html>
  );
}
