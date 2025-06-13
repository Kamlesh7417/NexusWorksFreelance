import { NextRequest, NextResponse } from 'next/server';
import { QuantumAI } from '@/lib/openai';

export async function POST(request: NextRequest) {
  try {
    const { message, context } = await request.json();

    if (!message) {
      return NextResponse.json(
        { error: 'Message is required' },
        { status: 400 }
      );
    }

    const response = await QuantumAI.generateMentorResponse(message, context);

    return NextResponse.json({ response });
  } catch (error) {
    console.error('Mentor chat API error:', error);
    return NextResponse.json(
      { error: 'Failed to generate response' },
      { status: 500 }
    );
  }
}