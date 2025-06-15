import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { getServerSession } from 'next-auth/next';

export async function GET(request: NextRequest) {
  try {
    // Get the session
    const session = await getServerSession();
    
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = session.user.id;
    const url = new URL(request.url);
    const otherUserId = url.searchParams.get('userId');
    const limit = parseInt(url.searchParams.get('limit') || '50');

    // Initialize Supabase client
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    if (otherUserId) {
      // Get messages between two users
      const { data, error } = await supabase
        .from('messages')
        .select(`
          *,
          sender:user_profiles!messages_sender_id_fkey(id, full_name, avatar_url, role),
          receiver:user_profiles!messages_receiver_id_fkey(id, full_name, avatar_url, role),
          project:projects(id, title)
        `)
        .or(`and(sender_id.eq.${userId},receiver_id.eq.${otherUserId}),and(sender_id.eq.${otherUserId},receiver_id.eq.${userId})`)
        .order('created_at', { ascending: true })
        .limit(limit);

      if (error) {
        console.error('Error fetching messages:', error);
        return NextResponse.json({ error: 'Failed to fetch messages' }, { status: 500 });
      }

      return NextResponse.json({ messages: data });
    } else {
      // Get all messages for user
      const { data, error } = await supabase
        .from('messages')
        .select(`
          *,
          sender:user_profiles!messages_sender_id_fkey(id, full_name, avatar_url, role),
          receiver:user_profiles!messages_receiver_id_fkey(id, full_name, avatar_url, role),
          project:projects(id, title)
        `)
        .or(`sender_id.eq.${userId},receiver_id.eq.${userId}`)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) {
        console.error('Error fetching messages:', error);
        return NextResponse.json({ error: 'Failed to fetch messages' }, { status: 500 });
      }

      return NextResponse.json({ messages: data });
    }
  } catch (error) {
    console.error('Message API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

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

    // Rate limiting check - prevent spam
    const { count, error: countError } = await supabase
      .from('messages')
      .select('*', { count: 'exact', head: true })
      .eq('sender_id', userId)
      .gt('created_at', new Date(Date.now() - 60000).toISOString()); // Last minute
      
    if (countError) {
      console.error('Rate limit check error:', countError);
      return NextResponse.json({ error: 'Failed to check rate limit' }, { status: 500 });
    }
    
    // Limit to 10 messages per minute
    if (count && count >= 10) {
      return NextResponse.json({ error: 'Rate limit exceeded. Please try again later.' }, { status: 429 });
    }

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