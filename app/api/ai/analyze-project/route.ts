import { NextRequest, NextResponse } from 'next/server';
import { QuantumAI } from '@/lib/openai';

export async function POST(request: NextRequest) {
  try {
    const { description, budget } = await request.json();

    if (!description) {
      return NextResponse.json(
        { error: 'Project description is required' },
        { status: 400 }
      );
    }

    const analysis = await QuantumAI.analyzeProject(description, budget);

    return NextResponse.json(analysis);
  } catch (error) {
    console.error('Project analysis API error:', error);
    return NextResponse.json(
      { error: 'Failed to analyze project' },
      { status: 500 }
    );
  }
}