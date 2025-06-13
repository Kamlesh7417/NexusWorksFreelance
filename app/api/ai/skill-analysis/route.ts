import { NextRequest, NextResponse } from 'next/server';
import { QuantumAI } from '@/lib/openai';

export async function POST(request: NextRequest) {
  try {
    const { currentSkills, targetRole } = await request.json();

    if (!currentSkills || !targetRole) {
      return NextResponse.json(
        { error: 'Current skills and target role are required' },
        { status: 400 }
      );
    }

    const analysis = await QuantumAI.analyzeSkillGap(currentSkills, targetRole);

    return NextResponse.json(analysis);
  } catch (error) {
    console.error('Skill analysis API error:', error);
    return NextResponse.json(
      { error: 'Failed to analyze skills' },
      { status: 500 }
    );
  }
}