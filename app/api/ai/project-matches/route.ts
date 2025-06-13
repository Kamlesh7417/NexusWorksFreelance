import { NextRequest, NextResponse } from 'next/server';
import { QuantumAI } from '@/lib/openai';

export async function POST(request: NextRequest) {
  try {
    const { userSkills, preferences } = await request.json();

    if (!userSkills) {
      return NextResponse.json(
        { error: 'User skills are required' },
        { status: 400 }
      );
    }

    const matches = await QuantumAI.findProjectMatches(userSkills, preferences);

    return NextResponse.json({ matches });
  } catch (error) {
    console.error('Project matching API error:', error);
    return NextResponse.json(
      { error: 'Failed to find project matches' },
      { status: 500 }
    );
  }
}