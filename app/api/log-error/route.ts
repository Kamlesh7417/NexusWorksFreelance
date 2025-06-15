import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../auth/[...nextauth]/options';

export async function POST(request: NextRequest) {
  try {
    // Get the error data from the request
    const errorData = await request.json();
    
    // Get the user session if available
    const session = await getServerSession(authOptions);
    
    // Add user information if available
    const enrichedErrorData = {
      ...errorData,
      userId: session?.user?.id || 'unauthenticated',
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV || 'development'
    };
    
    // In a production environment, you would send this to your error tracking service
    // Example: await sendToErrorTrackingService(enrichedErrorData);
    
    // Log to console for now
    console.error('[Server Error Log]', JSON.stringify(enrichedErrorData, null, 2));
    
    // Return success response
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error logging error:', error);
    return NextResponse.json({ error: 'Failed to log error' }, { status: 500 });
  }
}