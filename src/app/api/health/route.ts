import { NextResponse } from 'next/server';

export const dynamic = "force-dynamic";

const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

export async function GET() {
  try {
    const backendRes = await fetch(`${BACKEND_URL}/health`, {
      cache: 'no-store',
      signal: AbortSignal.timeout(3000),
    });
    const backendOk = backendRes.ok;
    return NextResponse.json({
      status: 'ok',
      frontend: 'healthy',
      backend: backendOk ? 'connected' : 'unreachable',
    });
  } catch {
    return NextResponse.json({
      status: 'degraded',
      frontend: 'healthy',
      backend: 'offline_or_unreachable',
    });
  }
}
