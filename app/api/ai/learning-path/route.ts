import { NextRequest, NextResponse } from 'next/server';
import { QuantumAI } from '@/lib/openai';

export async function POST(request: NextRequest) {
  try {
    const { skill, currentLevel } = await request.json();

    if (!skill || !currentLevel) {
      return NextResponse.json(
        { error: 'Skill and current level are required' },
        { status: 400 }
      );
    }

    const learningPath = await QuantumAI.generateLearningPath(skill, currentLevel);

    return NextResponse.json({ learningPath });
  } catch (error) {
    console.error('Learning path API error:', error);
    return NextResponse.json(
      { error: 'Failed to generate learning path' },
      { status: 500 }
    );
  }
}