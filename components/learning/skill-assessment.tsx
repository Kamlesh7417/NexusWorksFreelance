'use client';

import { useState, useEffect } from 'react';
import { Brain, Clock, CheckCircle, X, Award, BarChart3 } from 'lucide-react';

interface Question {
  id: string;
  type: 'multiple-choice' | 'code' | 'drag-drop' | 'scenario';
  question: string;
  options?: string[];
  correctAnswer: string | number;
  explanation: string;
  difficulty: 'easy' | 'medium' | 'hard';
  category: string;
}

interface AssessmentResult {
  score: number;
  totalQuestions: number;
  timeSpent: number;
  skillLevel: 'beginner' | 'intermediate' | 'advanced' | 'expert';
  strengths: string[];
  weaknesses: string[];
  recommendations: string[];
  certificate?: string;
}

export function SkillAssessment() {
  const [selectedSkill, setSelectedSkill] = useState('quantum-computing');
  const [isAssessing, setIsAssessing] = useState(false);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [answers, setAnswers] = useState<Record<string, any>>({});
  const [timeRemaining, setTimeRemaining] = useState(1800); // 30 minutes
  const [result, setResult] = useState<AssessmentResult | null>(null);
  const [showExplanation, setShowExplanation] = useState(false);

  const skills = [
    { id: 'quantum-computing', name: 'Quantum Computing', duration: '30 min', questions: 20 },
    { id: 'ai-ml', name: 'AI/Machine Learning', duration: '45 min', questions: 30 },
    { id: 'blockchain', name: 'Blockchain Development', duration: '35 min', questions: 25 },
    { id: 'web-development', name: 'Web Development', duration: '40 min', questions: 28 },
    { id: 'data-science', name: 'Data Science', duration: '50 min', questions: 35 }
  ];

  const mockQuestions: Question[] = [
    {
      id: 'q1',
      type: 'multiple-choice',
      question: 'What is the fundamental unit of quantum information?',
      options: ['Bit', 'Qubit', 'Quantum Gate', 'Superposition'],
      correctAnswer: 1,
      explanation: 'A qubit (quantum bit) is the fundamental unit of quantum information, capable of existing in superposition states.',
      difficulty: 'easy',
      category: 'fundamentals'
    },
    {
      id: 'q2',
      type: 'multiple-choice',
      question: 'Which quantum gate creates superposition?',
      options: ['Pauli-X', 'Hadamard', 'CNOT', 'Pauli-Z'],
      correctAnswer: 1,
      explanation: 'The Hadamard gate creates an equal superposition of |0⟩ and |1⟩ states when applied to |0⟩.',
      difficulty: 'medium',
      category: 'gates'
    },
    {
      id: 'q3',
      type: 'code',
      question: 'Complete the Qiskit code to create a Bell state:',
      correctAnswer: 'qc.h(0)\nqc.cx(0, 1)',
      explanation: 'A Bell state is created by applying a Hadamard gate to the first qubit, then a CNOT gate.',
      difficulty: 'hard',
      category: 'programming'
    }
  ];

  useEffect(() => {
    if (isAssessing && timeRemaining > 0) {
      const timer = setInterval(() => {
        setTimeRemaining(prev => {
          if (prev <= 1) {
            finishAssessment();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      return () => clearInterval(timer);
    }
  }, [isAssessing, timeRemaining]);

  const startAssessment = () => {
    setQuestions(mockQuestions);
    setIsAssessing(true);
    setCurrentQuestion(0);
    setAnswers({});
    setTimeRemaining(1800);
    setResult(null);
  };

  const answerQuestion = (answer: any) => {
    setAnswers(prev => ({
      ...prev,
      [questions[currentQuestion].id]: answer
    }));
  };

  const nextQuestion = () => {
    if (currentQuestion < questions.length - 1) {
      setCurrentQuestion(prev => prev + 1);
      setShowExplanation(false);
    } else {
      finishAssessment();
    }
  };

  const previousQuestion = () => {
    if (currentQuestion > 0) {
      setCurrentQuestion(prev => prev - 1);
      setShowExplanation(false);
    }
  };

  const finishAssessment = () => {
    setIsAssessing(false);
    
    // Calculate results
    let correctAnswers = 0;
    questions.forEach(question => {
      if (answers[question.id] === question.correctAnswer) {
        correctAnswers++;
      }
    });

    const score = Math.round((correctAnswers / questions.length) * 100);
    const timeSpent = 1800 - timeRemaining;

    let skillLevel: 'beginner' | 'intermediate' | 'advanced' | 'expert' = 'beginner';
    if (score >= 90) skillLevel = 'expert';
    else if (score >= 75) skillLevel = 'advanced';
    else if (score >= 60) skillLevel = 'intermediate';

    const mockResult: AssessmentResult = {
      score,
      totalQuestions: questions.length,
      timeSpent,
      skillLevel,
      strengths: ['Quantum Fundamentals', 'Gate Operations'],
      weaknesses: ['Advanced Algorithms', 'Error Correction'],
      recommendations: [
        'Complete the Advanced Quantum Algorithms course',
        'Practice with quantum error correction exercises',
        'Join the Quantum Computing study group'
      ],
      certificate: score >= 70 ? 'quantum-computing-certified' : undefined
    };

    setResult(mockResult);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const getSkillLevelColor = (level: string) => {
    switch (level) {
      case 'expert': return 'text-purple-400 bg-purple-500/20';
      case 'advanced': return 'text-red-400 bg-red-500/20';
      case 'intermediate': return 'text-yellow-400 bg-yellow-500/20';
      case 'beginner': return 'text-green-400 bg-green-500/20';
      default: return 'text-gray-400 bg-gray-500/20';
    }
  };

  if (result) {
    return (
      <div className="nexus-card">
        <div className="text-center mb-6">
          <div className="w-16 h-16 bg-cyan-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <Award size={32} className="text-cyan-400" />
          </div>
          <h2 className="text-2xl font-bold text-cyan-400 mb-2">Assessment Complete!</h2>
          <p className="text-sm opacity-80">Your quantum computing skills have been evaluated</p>
        </div>

        {/* Score Display */}
        <div className="bg-gradient-to-r from-cyan-500/20 to-blue-500/20 rounded-lg p-6 mb-6 border border-cyan-500/30">
          <div className="text-center">
            <div className="text-4xl font-bold text-cyan-400 mb-2">{result.score}%</div>
            <div className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${getSkillLevelColor(result.skillLevel)}`}>
              {result.skillLevel.toUpperCase()}
            </div>
            <div className="text-sm text-gray-400 mt-2">
              {result.totalQuestions} questions • {Math.floor(result.timeSpent / 60)}m {result.timeSpent % 60}s
            </div>
          </div>
        </div>

        {/* Detailed Results */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          {/* Strengths */}
          <div className="bg-white/5 rounded-lg p-4">
            <h3 className="font-semibold text-green-400 mb-3 flex items-center gap-2">
              <CheckCircle size={16} />
              Strengths
            </h3>
            <div className="space-y-2">
              {result.strengths.map((strength, index) => (
                <div key={index} className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                  <span className="text-sm">{strength}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Areas for Improvement */}
          <div className="bg-white/5 rounded-lg p-4">
            <h3 className="font-semibold text-yellow-400 mb-3 flex items-center gap-2">
              <BarChart3 size={16} />
              Areas for Improvement
            </h3>
            <div className="space-y-2">
              {result.weaknesses.map((weakness, index) => (
                <div key={index} className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-yellow-400 rounded-full"></div>
                  <span className="text-sm">{weakness}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Recommendations */}
        <div className="bg-white/5 rounded-lg p-4 mb-6">
          <h3 className="font-semibold text-cyan-400 mb-3">Personalized Recommendations</h3>
          <div className="space-y-2">
            {result.recommendations.map((rec, index) => (
              <div key={index} className="flex items-start gap-2">
                <div className="w-2 h-2 bg-cyan-400 rounded-full mt-2"></div>
                <span className="text-sm">{rec}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Certificate */}
        {result.certificate && (
          <div className="bg-gradient-to-r from-yellow-500/20 to-orange-500/20 rounded-lg p-4 border border-yellow-500/30 mb-6">
            <div className="flex items-center gap-3">
              <Award size={24} className="text-yellow-400" />
              <div>
                <h3 className="font-semibold text-yellow-400">Certificate Earned!</h3>
                <p className="text-sm opacity-80">You've earned a Quantum Computing Proficiency Certificate</p>
              </div>
              <button className="nexus-action-btn ml-auto !border-yellow-500/40 !text-yellow-400 hover:!bg-yellow-500/20">
                Download Certificate
              </button>
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-4">
          <button
            onClick={() => {
              setResult(null);
              setIsAssessing(false);
            }}
            className="nexus-action-btn flex-1"
          >
            Take Another Assessment
          </button>
          <button className="nexus-action-btn flex-1">
            View Learning Path
          </button>
        </div>
      </div>
    );
  }

  if (isAssessing) {
    const question = questions[currentQuestion];
    
    return (
      <div className="nexus-card">
        {/* Assessment Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-xl font-bold text-cyan-400">Quantum Computing Assessment</h2>
            <p className="text-sm opacity-80">
              Question {currentQuestion + 1} of {questions.length}
            </p>
          </div>
          
          <div className="text-right">
            <div className="text-sm text-gray-400">Time Remaining</div>
            <div className={`font-bold ${timeRemaining < 300 ? 'text-red-400' : 'text-cyan-400'}`}>
              {formatTime(timeRemaining)}
            </div>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="w-full bg-white/10 rounded-full h-2 mb-6">
          <div 
            className="bg-gradient-to-r from-cyan-400 to-blue-500 h-2 rounded-full transition-all duration-300"
            style={{ width: `${((currentQuestion + 1) / questions.length) * 100}%` }}
          ></div>
        </div>

        {/* Question */}
        <div className="bg-white/5 rounded-lg p-6 mb-6">
          <div className="flex items-center gap-2 mb-4">
            <span className={`text-xs px-2 py-1 rounded-full ${
              question.difficulty === 'easy' ? 'bg-green-500/20 text-green-400' :
              question.difficulty === 'medium' ? 'bg-yellow-500/20 text-yellow-400' :
              'bg-red-500/20 text-red-400'
            }`}>
              {question.difficulty}
            </span>
            <span className="text-xs text-gray-400">{question.category}</span>
          </div>
          
          <h3 className="text-lg font-semibold mb-4">{question.question}</h3>

          {question.type === 'multiple-choice' && question.options && (
            <div className="space-y-3">
              {question.options.map((option, index) => (
                <button
                  key={index}
                  onClick={() => answerQuestion(index)}
                  className={`w-full text-left p-3 rounded-lg border transition-all ${
                    answers[question.id] === index
                      ? 'bg-cyan-500/20 border-cyan-500/40 text-cyan-400'
                      : 'bg-white/5 border-white/10 hover:bg-white/10'
                  }`}
                >
                  <span className="font-medium mr-3">{String.fromCharCode(65 + index)}.</span>
                  {option}
                </button>
              ))}
            </div>
          )}

          {question.type === 'code' && (
            <div>
              <textarea
                value={answers[question.id] || ''}
                onChange={(e) => answerQuestion(e.target.value)}
                placeholder="Enter your code here..."
                className="w-full h-32 bg-black rounded-lg p-3 font-mono text-sm text-white resize-none outline-none"
              />
            </div>
          )}
        </div>

        {/* Explanation */}
        {showExplanation && (
          <div className="bg-blue-500/20 rounded-lg p-4 mb-6 border border-blue-500/30">
            <h4 className="font-semibold text-blue-400 mb-2">Explanation</h4>
            <p className="text-sm">{question.explanation}</p>
          </div>
        )}

        {/* Navigation */}
        <div className="flex items-center justify-between">
          <button
            onClick={previousQuestion}
            disabled={currentQuestion === 0}
            className="nexus-back-btn disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Previous
          </button>

          <div className="flex gap-2">
            <button
              onClick={() => setShowExplanation(!showExplanation)}
              className="nexus-action-btn text-sm px-4 py-2"
            >
              {showExplanation ? 'Hide' : 'Show'} Explanation
            </button>
            
            <button
              onClick={nextQuestion}
              className="nexus-action-btn"
            >
              {currentQuestion === questions.length - 1 ? 'Finish Assessment' : 'Next Question'}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="nexus-card">
      <div className="text-center mb-6">
        <div className="w-16 h-16 bg-cyan-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
          <Brain size={32} className="text-cyan-400" />
        </div>
        <h2 className="text-2xl font-bold text-cyan-400 mb-2">Neural Skill Assessment</h2>
        <p className="text-sm opacity-80">Evaluate your skills and earn certifications</p>
      </div>

      {/* Skill Selection */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        {skills.map(skill => (
          <div
            key={skill.id}
            onClick={() => setSelectedSkill(skill.id)}
            className={`p-4 rounded-lg border cursor-pointer transition-all ${
              selectedSkill === skill.id
                ? 'bg-cyan-500/20 border-cyan-500/40'
                : 'bg-white/5 border-white/10 hover:bg-white/10'
            }`}
          >
            <h3 className="font-semibold text-cyan-400 mb-2">{skill.name}</h3>
            <div className="flex items-center gap-4 text-sm text-gray-400">
              <div className="flex items-center gap-1">
                <Clock size={14} />
                <span>{skill.duration}</span>
              </div>
              <div className="flex items-center gap-1">
                <Brain size={14} />
                <span>{skill.questions} questions</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Assessment Info */}
      <div className="bg-white/5 rounded-lg p-4 mb-6">
        <h3 className="font-semibold text-cyan-400 mb-3">Assessment Details</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
          <div>
            <div className="text-gray-400 mb-1">Format</div>
            <div>Multiple choice, coding, and scenario-based questions</div>
          </div>
          <div>
            <div className="text-gray-400 mb-1">Certification</div>
            <div>Earn a verified certificate with 70%+ score</div>
          </div>
          <div>
            <div className="text-gray-400 mb-1">Retakes</div>
            <div>Unlimited attempts with 24-hour cooldown</div>
          </div>
        </div>
      </div>

      {/* Start Assessment */}
      <div className="text-center">
        <button
          onClick={startAssessment}
          className="nexus-action-btn flex items-center gap-2 mx-auto"
        >
          <Brain size={16} />
          Start Assessment
        </button>
        <p className="text-xs text-gray-400 mt-2">
          Make sure you have a stable internet connection and 30+ minutes available
        </p>
      </div>
    </div>
  );
}