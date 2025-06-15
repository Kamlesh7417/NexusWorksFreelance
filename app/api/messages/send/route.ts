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
    const { recipientId, projectId, content } = await request.json();
    
    if (!recipientId || !content) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Initialize Supabase client
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Send message
    const { data, error } = await supabase
      .from('messages')
      .insert({
        sender_id: userId,
        receiver_id: recipientId,
        project_id: projectId || null,
        content,
        read: false
      })
      .select(`
        *,
        sender:user_profiles!messages_sender_id_fkey(id, full_name, avatar_url, role),
        receiver:user_profiles!messages_receiver_id_fkey(id, full_name, avatar_url, role)
      `)
      .single();

    if (error) {
      console.error('Error sending message:', error);
      return NextResponse.json({ error: 'Failed to send message' }, { status: 500 });
    }

    return NextResponse.json({ success: true, message: data });
  } catch (error) {
    console.error('Message API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}