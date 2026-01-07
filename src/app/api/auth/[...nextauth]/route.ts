import { handlers } from '@/lib/auth';
import { NextRequest, NextResponse } from 'next/server';

// Wrap handlers to catch errors and return JSON instead of HTML error pages
async function wrappedHandler(
  handler: (req: NextRequest) => Promise<Response>,
  req: NextRequest
): Promise<Response> {
  try {
    return await handler(req);
  } catch (error) {
    console.error('[Auth Error]', error);

    // Return JSON error response instead of HTML
    return NextResponse.json(
      {
        error: 'AuthConfigError',
        message:
          error instanceof Error
            ? error.message
            : 'Authentication is not properly configured. Please check environment variables.',
      },
      { status: 500 }
    );
  }
}

export async function GET(req: NextRequest) {
  return wrappedHandler(handlers.GET, req);
}

export async function POST(req: NextRequest) {
  return wrappedHandler(handlers.POST, req);
}
