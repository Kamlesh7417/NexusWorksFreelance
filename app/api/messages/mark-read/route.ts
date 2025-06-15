import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { getServerSession } from 'next-auth/next';

export async function POST(request: NextRequest) {
  try {
    // Get the session
    const session = await getServerSession();
    
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = session.user.id;
    const { messageId, messageIds } = await request.json();
    
    if (!messageId && !messageIds) {
      return NextResponse.json({ error: 'Missing message ID(s)' }, { status: 400 });
    }

    // Initialize Supabase client
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Mark message(s) as read
    let error;
    
    if (messageId) {
      // Mark single message as read
      const { error: updateError } = await supabase
        .from('messages')
        .update({ read: true })
        .eq('id', messageId)
        .eq('receiver_id', userId); // Ensure user can only mark their own messages as read
        
      error = updateError;
    } else if (messageIds && Array.isArray(messageIds)) {
      // Mark multiple messages as read
      const { error: updateError } = await supabase
        .from('messages')
        .update({ read: true })
        .in('id', messageIds)
        .eq('receiver_id', userId); // Ensure user can only mark their own messages as read
        
      error = updateError;
    }

    if (error) {
      console.error('Error marking message(s) as read:', error);
      return NextResponse.json({ error: 'Failed to mark message(s) as read' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Message API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}