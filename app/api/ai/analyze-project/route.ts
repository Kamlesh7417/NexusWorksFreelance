import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(request: NextRequest) {
  try {
    const { description, budget } = await request.json();

    if (!description) {
      return NextResponse.json(
        { error: 'Project description is required' },
        { status: 400 }
      );
    }

    // Prepare the prompt for OpenAI
    const prompt = `
      As a quantum AI project analyst, analyze this project description and provide a comprehensive breakdown:
      
      Project: ${description}
      Budget: ${budget || 'Not specified'}
      
      Provide analysis in this JSON format:
      {
        "complexity": "simple|moderate|complex|expert",
        "estimatedHours": number,
        "suggestedPrice": number,
        "requiredSkills": ["skill1", "skill2"],
        "jiraStories": [
          {
            "id": "PROJ-001",
            "title": "Story title",
            "description": "Detailed description",
            "storyPoints": number,
            "priority": "low|medium|high",
            "acceptanceCriteria": ["criteria1", "criteria2"]
          }
        ],
        "riskFactors": ["risk1", "risk2"]
      }
      
      Consider quantum computing principles, AI integration, and futuristic tech stack requirements.
    `;

    // Call OpenAI API
    const response = await openai.chat.completions.create({
      model: 'gpt-4',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.7,
    });

    const content = response.choices[0]?.message?.content;
    if (!content) {
      throw new Error('No response from AI');
    }

    // Parse the JSON response
    try {
      const analysis = JSON.parse(content);
      return NextResponse.json(analysis);
    } catch (error) {
      console.error('Error parsing AI response:', error);
      return NextResponse.json(
        { error: 'Failed to parse AI response' },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Project analysis API error:', error);
    return NextResponse.json(
      { error: 'Failed to analyze project' },
      { status: 500 }
    );
  }
}