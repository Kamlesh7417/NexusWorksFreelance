import OpenAI from 'openai';

// Lazy initialization of OpenAI client
let openaiClient: OpenAI | null = null;

function getOpenAIClient(): OpenAI {
  if (!openaiClient) {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      throw new Error('OpenAI API key is not configured. Please set OPENAI_API_KEY in your environment variables.');
    }
    openaiClient = new OpenAI({ apiKey });
  }
  return openaiClient;
}

export interface ProjectAnalysis {
  complexity: 'simple' | 'moderate' | 'complex' | 'expert';
  estimatedHours: number;
  suggestedPrice: number;
  requiredSkills: string[];
  jiraStories: JiraStory[];
  riskFactors: string[];
}

export interface JiraStory {
  id: string;
  title: string;
  description: string;
  storyPoints: number;
  priority: 'low' | 'medium' | 'high';
  acceptanceCriteria: string[];
}

export interface SkillAnalysis {
  currentLevel: number;
  targetLevel: number;
  skillGap: number;
  learningPath: LearningModule[];
  estimatedTimeToTarget: string;
}

export interface LearningModule {
  title: string;
  description: string;
  duration: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  prerequisites: string[];
}

export interface ProjectMatch {
  projectId: string;
  matchScore: number;
  reasoning: string;
  skillAlignment: string[];
  missingSkills: string[];
}

export class QuantumAI {
  static async analyzeProject(description: string, budget?: string): Promise<ProjectAnalysis> {
    try {
      const openai = getOpenAIClient();
      
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

      const response = await openai.chat.completions.create({
        model: 'gpt-4',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.7,
      });

      const content = response.choices[0]?.message?.content;
      if (!content) throw new Error('No response from AI');

      return JSON.parse(content);
    } catch (error) {
      console.error('Project analysis error:', error);
      // Fallback response
      return {
        complexity: 'moderate',
        estimatedHours: 40,
        suggestedPrice: 2000,
        requiredSkills: ['JavaScript', 'React', 'Node.js'],
        jiraStories: [
          {
            id: 'PROJ-001',
            title: 'Project Setup and Architecture',
            description: 'Set up the basic project structure and architecture',
            storyPoints: 5,
            priority: 'high',
            acceptanceCriteria: ['Project structure created', 'Dependencies installed']
          }
        ],
        riskFactors: ['Timeline constraints', 'Technical complexity']
      };
    }
  }

  static async generateMentorResponse(userMessage: string, context?: string): Promise<string> {
    try {
      const openai = getOpenAIClient();
      
      const prompt = `
        You are a quantum AI mentor in the NexusWorks platform - a futuristic freelancing ecosystem. 
        You have access to quantum computing algorithms, neural interfaces, and advanced AI systems.
        
        User context: ${context || 'General inquiry'}
        User message: ${userMessage}
        
        Respond as a helpful AI mentor with:
        - Quantum computing insights when relevant
        - Practical freelancing advice
        - Project recommendations
        - Skill development guidance
        - Futuristic but actionable suggestions
        
        Keep responses concise (2-3 sentences) and maintain the quantum AI persona.
      `;

      const response = await openai.chat.completions.create({
        model: 'gpt-4',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.8,
        max_tokens: 150,
      });

      return response.choices[0]?.message?.content || 
        "Quantum algorithms suggest focusing on your core strengths while exploring emerging technologies. Would you like me to analyze your skill matrix?";
    } catch (error) {
      console.error('Mentor response error:', error);
      return "Neural pathways are recalibrating. Please try your query again in a moment.";
    }
  }

  static async analyzeSkillGap(currentSkills: string[], targetRole: string): Promise<SkillAnalysis> {
    try {
      const openai = getOpenAIClient();
      
      const prompt = `
        Analyze skill gap for quantum-enhanced career development:
        
        Current skills: ${currentSkills.join(', ')}
        Target role: ${targetRole}
        
        Provide analysis in JSON format:
        {
          "currentLevel": number (1-100),
          "targetLevel": number (1-100),
          "skillGap": number (1-100),
          "learningPath": [
            {
              "title": "Module title",
              "description": "Description",
              "duration": "X weeks",
              "difficulty": "beginner|intermediate|advanced",
              "prerequisites": ["prereq1"]
            }
          ],
          "estimatedTimeToTarget": "X months"
        }
      `;

      const response = await openai.chat.completions.create({
        model: 'gpt-4',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.7,
      });

      const content = response.choices[0]?.message?.content;
      if (!content) throw new Error('No response from AI');

      return JSON.parse(content);
    } catch (error) {
      console.error('Skill analysis error:', error);
      return {
        currentLevel: 65,
        targetLevel: 85,
        skillGap: 20,
        learningPath: [
          {
            title: 'Advanced Quantum Programming',
            description: 'Master quantum algorithms and implementation',
            duration: '6 weeks',
            difficulty: 'advanced',
            prerequisites: ['Basic Quantum Concepts']
          }
        ],
        estimatedTimeToTarget: '4 months'
      };
    }
  }

  static async findProjectMatches(userSkills: string[], preferences: any): Promise<ProjectMatch[]> {
    try {
      const openai = getOpenAIClient();
      
      const prompt = `
        Use quantum matching algorithms to find optimal project matches:
        
        User skills: ${userSkills.join(', ')}
        Preferences: ${JSON.stringify(preferences)}
        
        Available projects (simulate realistic options):
        1. AI Healthcare Dashboard - React, Node.js, AI/ML
        2. Quantum Encryption Protocol - Quantum Computing, Cryptography
        3. AR Product Visualization - AR/VR, 3D Graphics, React
        4. Blockchain Voting System - Blockchain, Smart Contracts, Security
        5. Social Media Analytics Tool - Data Science, Python, APIs
        
        Return top 3 matches in JSON format:
        [
          {
            "projectId": "proj_id",
            "matchScore": number (0-100),
            "reasoning": "Why this matches",
            "skillAlignment": ["matching skills"],
            "missingSkills": ["skills to develop"]
          }
        ]
      `;

      const response = await openai.chat.completions.create({
        model: 'gpt-4',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.7,
      });

      const content = response.choices[0]?.message?.content;
      if (!content) throw new Error('No response from AI');

      return JSON.parse(content);
    } catch (error) {
      console.error('Project matching error:', error);
      return [
        {
          projectId: 'ai-healthcare',
          matchScore: 92,
          reasoning: 'Perfect alignment with your AI and React skills',
          skillAlignment: ['React', 'JavaScript', 'AI/ML'],
          missingSkills: ['Healthcare domain knowledge']
        }
      ];
    }
  }

  static async generateLearningPath(skill: string, currentLevel: string): Promise<LearningModule[]> {
    try {
      const openai = getOpenAIClient();
      
      const prompt = `
        Generate a quantum-enhanced learning path for:
        Skill: ${skill}
        Current Level: ${currentLevel}
        
        Create 4-6 progressive learning modules in JSON format:
        [
          {
            "title": "Module title",
            "description": "What you'll learn",
            "duration": "X weeks",
            "difficulty": "beginner|intermediate|advanced",
            "prerequisites": ["prereq1", "prereq2"]
          }
        ]
        
        Focus on practical, industry-relevant skills with futuristic applications.
      `;

      const response = await openai.chat.completions.create({
        model: 'gpt-4',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.7,
      });

      const content = response.choices[0]?.message?.content;
      if (!content) throw new Error('No response from AI');

      return JSON.parse(content);
    } catch (error) {
      console.error('Learning path error:', error);
      return [
        {
          title: 'Quantum Fundamentals',
          description: 'Introduction to quantum computing principles',
          duration: '3 weeks',
          difficulty: 'beginner',
          prerequisites: ['Basic Mathematics']
        }
      ];
    }
  }

  static calculateDynamicPricing(basePrice: number, urgency: number, complexity: number): number {
    // Quantum pricing algorithm simulation
    const urgencyMultiplier = 1 + (urgency / 100);
    const complexityMultiplier = 1 + (complexity / 100);
    const quantumFactor = Math.random() * 0.1 + 0.95; // Slight randomization
    
    return Math.round(basePrice * urgencyMultiplier * complexityMultiplier * quantumFactor);
  }
}

// Export a function to get the OpenAI client instead of a direct instance
export default function getOpenAI(): OpenAI {
  return getOpenAIClient();
}