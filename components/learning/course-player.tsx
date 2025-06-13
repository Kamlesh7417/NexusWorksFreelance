'use client';

import { useState, useEffect, useRef } from 'react';
import { Play, Pause, SkipForward, SkipBack, Volume2, Maximize, BookOpen, Code, CheckCircle } from 'lucide-react';

interface Course {
  id: string;
  title: string;
  description: string;
  instructor: string;
  duration: number;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  modules: CourseModule[];
  progress: number;
  certificate?: string;
}

interface CourseModule {
  id: string;
  title: string;
  type: 'video' | 'interactive' | 'quiz' | 'coding';
  duration: number;
  content: string;
  completed: boolean;
  resources?: Resource[];
}

interface Resource {
  id: string;
  title: string;
  type: 'pdf' | 'code' | 'link';
  url: string;
}

export function CoursePlayer() {
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);
  const [currentModule, setCurrentModule] = useState<CourseModule | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [volume, setVolume] = useState(1);
  const videoRef = useRef<HTMLVideoElement>(null);

  const mockCourses: Course[] = [
    {
      id: 'quantum-101',
      title: 'Quantum Computing Fundamentals',
      description: 'Master the basics of quantum computing with hands-on quantum circuit design',
      instructor: 'Dr. Alexandra Quantum',
      duration: 1200, // 20 hours
      difficulty: 'beginner',
      progress: 35,
      modules: [
        {
          id: 'mod-1',
          title: 'Introduction to Qubits',
          type: 'video',
          duration: 180,
          content: 'https://example.com/quantum-intro.mp4',
          completed: true
        },
        {
          id: 'mod-2',
          title: 'Quantum Gates Interactive Lab',
          type: 'interactive',
          duration: 240,
          content: 'quantum-gates-simulator',
          completed: true
        },
        {
          id: 'mod-3',
          title: 'Superposition Quiz',
          type: 'quiz',
          duration: 60,
          content: 'superposition-quiz',
          completed: false
        },
        {
          id: 'mod-4',
          title: 'Build Your First Quantum Circuit',
          type: 'coding',
          duration: 300,
          content: 'quantum-circuit-coding',
          completed: false
        }
      ]
    },
    {
      id: 'ai-ml-advanced',
      title: 'Advanced AI/ML Engineering',
      description: 'Deep dive into neural networks, transformers, and production ML systems',
      instructor: 'Prof. Marcus Neural',
      duration: 2400, // 40 hours
      difficulty: 'advanced',
      progress: 12,
      modules: [
        {
          id: 'ai-mod-1',
          title: 'Transformer Architecture Deep Dive',
          type: 'video',
          duration: 360,
          content: 'https://example.com/transformers.mp4',
          completed: true
        },
        {
          id: 'ai-mod-2',
          title: 'Build a GPT Model from Scratch',
          type: 'coding',
          duration: 480,
          content: 'gpt-implementation',
          completed: false
        }
      ]
    }
  ];

  useEffect(() => {
    if (mockCourses.length > 0) {
      setSelectedCourse(mockCourses[0]);
      setCurrentModule(mockCourses[0].modules[0]);
    }
  }, []);

  const handlePlayPause = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
      } else {
        videoRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  const handleModuleComplete = (moduleId: string) => {
    if (!selectedCourse) return;

    const updatedCourse = {
      ...selectedCourse,
      modules: selectedCourse.modules.map(mod =>
        mod.id === moduleId ? { ...mod, completed: true } : mod
      )
    };

    const completedModules = updatedCourse.modules.filter(m => m.completed).length;
    updatedCourse.progress = (completedModules / updatedCourse.modules.length) * 100;

    setSelectedCourse(updatedCourse);
  };

  const nextModule = () => {
    if (!selectedCourse || !currentModule) return;

    const currentIndex = selectedCourse.modules.findIndex(m => m.id === currentModule.id);
    if (currentIndex < selectedCourse.modules.length - 1) {
      setCurrentModule(selectedCourse.modules[currentIndex + 1]);
    }
  };

  const previousModule = () => {
    if (!selectedCourse || !currentModule) return;

    const currentIndex = selectedCourse.modules.findIndex(m => m.id === currentModule.id);
    if (currentIndex > 0) {
      setCurrentModule(selectedCourse.modules[currentIndex - 1]);
    }
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'beginner': return 'text-green-400 bg-green-500/20';
      case 'intermediate': return 'text-yellow-400 bg-yellow-500/20';
      case 'advanced': return 'text-red-400 bg-red-500/20';
      default: return 'text-gray-400 bg-gray-500/20';
    }
  };

  const getModuleIcon = (type: string) => {
    switch (type) {
      case 'video': return <Play size={16} className="text-cyan-400" />;
      case 'interactive': return <Code size={16} className="text-purple-400" />;
      case 'quiz': return <BookOpen size={16} className="text-yellow-400" />;
      case 'coding': return <Code size={16} className="text-green-400" />;
      default: return <BookOpen size={16} className="text-gray-400" />;
    }
  };

  if (!selectedCourse || !currentModule) {
    return (
      <div className="nexus-card">
        <div className="flex items-center justify-center py-12">
          <div className="w-8 h-8 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="nexus-card">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-bold text-cyan-400">{selectedCourse.title}</h2>
          <p className="text-sm opacity-80">by {selectedCourse.instructor}</p>
        </div>
        <div className="flex items-center gap-2">
          <span className={`text-xs px-2 py-1 rounded-full ${getDifficultyColor(selectedCourse.difficulty)}`}>
            {selectedCourse.difficulty}
          </span>
          <span className="text-cyan-400 font-semibold">{selectedCourse.progress}% Complete</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Video Player / Content Area */}
        <div className="lg:col-span-2">
          <div className="bg-black rounded-lg overflow-hidden mb-4">
            {currentModule.type === 'video' ? (
              <div className="relative">
                <video
                  ref={videoRef}
                  className="w-full h-64 bg-black"
                  poster="/api/placeholder/800/400"
                  onTimeUpdate={(e) => {
                    const video = e.target as HTMLVideoElement;
                    setProgress((video.currentTime / video.duration) * 100);
                  }}
                >
                  <source src={currentModule.content} type="video/mp4" />
                  Your browser does not support the video tag.
                </video>
                
                {/* Video Controls */}
                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4">
                  <div className="flex items-center gap-4">
                    <button onClick={previousModule} className="text-white hover:text-cyan-400">
                      <SkipBack size={20} />
                    </button>
                    <button onClick={handlePlayPause} className="text-white hover:text-cyan-400">
                      {isPlaying ? <Pause size={24} /> : <Play size={24} />}
                    </button>
                    <button onClick={nextModule} className="text-white hover:text-cyan-400">
                      <SkipForward size={20} />
                    </button>
                    
                    <div className="flex-1 mx-4">
                      <div className="w-full bg-white/20 rounded-full h-1">
                        <div 
                          className="bg-cyan-400 h-1 rounded-full transition-all"
                          style={{ width: `${progress}%` }}
                        ></div>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <Volume2 size={16} className="text-white" />
                      <input
                        type="range"
                        min="0"
                        max="1"
                        step="0.1"
                        value={volume}
                        onChange={(e) => setVolume(parseFloat(e.target.value))}
                        className="w-16"
                      />
                    </div>
                    
                    <button className="text-white hover:text-cyan-400">
                      <Maximize size={16} />
                    </button>
                  </div>
                </div>
              </div>
            ) : currentModule.type === 'interactive' ? (
              <div className="h-64 bg-gradient-to-br from-purple-600 to-blue-600 flex items-center justify-center">
                <div className="text-center text-white">
                  <Code size={48} className="mx-auto mb-4" />
                  <h3 className="text-xl font-bold mb-2">Interactive Quantum Simulator</h3>
                  <p className="opacity-80">Drag and drop quantum gates to build circuits</p>
                  <button className="nexus-action-btn mt-4">Launch Simulator</button>
                </div>
              </div>
            ) : currentModule.type === 'coding' ? (
              <div className="h-64 bg-gradient-to-br from-green-600 to-teal-600 flex items-center justify-center">
                <div className="text-center text-white">
                  <Code size={48} className="mx-auto mb-4" />
                  <h3 className="text-xl font-bold mb-2">Coding Environment</h3>
                  <p className="opacity-80">Write and test your quantum algorithms</p>
                  <button className="nexus-action-btn mt-4">Open IDE</button>
                </div>
              </div>
            ) : (
              <div className="h-64 bg-gradient-to-br from-yellow-600 to-orange-600 flex items-center justify-center">
                <div className="text-center text-white">
                  <BookOpen size={48} className="mx-auto mb-4" />
                  <h3 className="text-xl font-bold mb-2">Knowledge Check</h3>
                  <p className="opacity-80">Test your understanding with interactive quizzes</p>
                  <button className="nexus-action-btn mt-4">Start Quiz</button>
                </div>
              </div>
            )}
          </div>

          {/* Module Info */}
          <div className="bg-white/5 rounded-lg p-4">
            <div className="flex items-center gap-3 mb-3">
              {getModuleIcon(currentModule.type)}
              <h3 className="font-semibold text-cyan-400">{currentModule.title}</h3>
              {currentModule.completed && (
                <CheckCircle size={16} className="text-green-400" />
              )}
            </div>
            
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-400">
                Duration: {Math.floor(currentModule.duration / 60)}m {currentModule.duration % 60}s
              </span>
              
              {!currentModule.completed && (
                <button
                  onClick={() => handleModuleComplete(currentModule.id)}
                  className="nexus-action-btn text-sm px-4 py-1"
                >
                  Mark Complete
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Course Modules Sidebar */}
        <div>
          <h3 className="font-semibold text-cyan-400 mb-4">Course Modules</h3>
          
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {selectedCourse.modules.map((module, index) => (
              <div
                key={module.id}
                onClick={() => setCurrentModule(module)}
                className={`p-3 rounded-lg border cursor-pointer transition-all ${
                  currentModule.id === module.id
                    ? 'bg-cyan-500/20 border-cyan-500/40'
                    : 'bg-white/5 border-white/10 hover:bg-white/10'
                }`}
              >
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-xs bg-white/10 px-2 py-1 rounded">
                    {index + 1}
                  </span>
                  {getModuleIcon(module.type)}
                  <span className="text-sm font-medium">{module.title}</span>
                  {module.completed && (
                    <CheckCircle size={14} className="text-green-400 ml-auto" />
                  )}
                </div>
                
                <div className="text-xs text-gray-400">
                  {Math.floor(module.duration / 60)}m • {module.type}
                </div>
              </div>
            ))}
          </div>

          {/* Course Progress */}
          <div className="mt-6 p-4 bg-gradient-to-r from-cyan-500/20 to-blue-500/20 rounded-lg border border-cyan-500/30">
            <h4 className="font-semibold text-cyan-400 mb-2">Course Progress</h4>
            <div className="w-full bg-white/10 rounded-full h-2 mb-2">
              <div 
                className="bg-gradient-to-r from-cyan-400 to-blue-500 h-2 rounded-full transition-all duration-1000"
                style={{ width: `${selectedCourse.progress}%` }}
              ></div>
            </div>
            <div className="text-sm text-gray-400">
              {selectedCourse.modules.filter(m => m.completed).length} of {selectedCourse.modules.length} modules completed
            </div>
          </div>

          {/* Certificate */}
          {selectedCourse.progress === 100 && (
            <div className="mt-4 p-4 bg-gradient-to-r from-gold-500/20 to-yellow-500/20 rounded-lg border border-yellow-500/30">
              <h4 className="font-semibold text-yellow-400 mb-2">Certificate Ready!</h4>
              <p className="text-sm opacity-80 mb-3">
                Congratulations! You've completed the course.
              </p>
              <button className="nexus-action-btn w-full !border-yellow-500/40 !text-yellow-400 hover:!bg-yellow-500/20">
                Download Certificate
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}