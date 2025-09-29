import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  // Return empty session since we're using Django authentication
  return NextResponse.json({
    authenticated: false,
    session: null
  });
}