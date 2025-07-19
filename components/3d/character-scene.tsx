'use client';

import { Suspense, useRef, useState, useEffect } from 'react';
import { Canvas } from '@react-three/fiber';
import { Environment, OrbitControls, PerspectiveCamera, Html } from '@react-three/drei';
import { CharacterController, CharacterState } from './character-controller';
import * as THREE from 'three';

interface CharacterSceneProps {
  characterType?: 'client-guide' | 'developer-guide' | 'ai-assistant';
  environment?: 'homepage' | 'dashboard' | 'marketplace';
  interactionMode?: 'passive' | 'interactive' | 'guided-tour';
  className?: string;
  onCharacterReady?: (controller: any) => void;
  autoRotate?: boolean;
  showControls?: boolean;
}

export function CharacterScene({
  characterType = 'client-guide',
  environment = 'homepage',
  interactionMode = 'interactive',
  className = '',
  onCharacterReady,
  autoRotate = false,
  showControls = false
}: CharacterSceneProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [currentState, setCurrentState] = useState<CharacterState>(CharacterState.IDLE);
  const [performanceLevel, setPerformanceLevel] = useState<'low' | 'medium' | 'high'>('high');
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Performance monitoring
  useEffect(() => {
    const monitor = new PerformanceMonitor();
    monitor.onPerformanceChange = (level) => {
      setPerformanceLevel(level);
    };
    
    return () => monitor.cleanup();
  }, []);

  const handleCharacterInteraction = (type: 'hover' | 'click') => {
    if (interactionMode === 'passive') return;
    
    // Add haptic feedback for mobile
    if ('vibrate' in navigator) {
      navigator.vibrate(50);
    }
    
    // Analytics tracking
    trackCharacterInteraction(characterType, type, environment);
  };

  const getCharacterModel = () => {
    // For now, return null to use fallback geometry
    // Replace with actual model paths when models are available
    switch (characterType) {
      case 'client-guide':
        return null; // '/models/business-character.glb';
      case 'developer-guide':
        return null; // '/models/developer-character.glb';
      case 'ai-assistant':
        return null; // '/models/ai-character.glb';
      default:
        return null; // '/models/character-basic.glb';
    }
  };

  const getEnvironmentPreset = () => {
    switch (environment) {
      case 'homepage':
        return 'city';
      case 'dashboard':
        return 'studio';
      case 'marketplace':
        return 'warehouse';
      default:
        return 'city';
    }
  };

  return (
    <div className={`relative w-full h-full ${className}`}>
      <Canvas
        ref={canvasRef}
        shadows
        dpr={performanceLevel === 'high' ? [1, 2] : 1}
        performance={{ min: 0.5 }}
        className="w-full h-full"
        gl={{
          antialias: performanceLevel !== 'low',
          alpha: true,
          powerPreference: 'high-performance'
        }}
      >
        <Suspense fallback={<LoadingFallback />}>
          {/* Lighting setup */}
          <SceneLighting environment={environment} quality={performanceLevel} />
          
          {/* Environment */}
          <Environment 
            preset={getEnvironmentPreset()} 
            background={false}
            blur={performanceLevel === 'low' ? 1 : 0.5}
          />
          
          {/* Camera */}
          <PerspectiveCamera
            makeDefault
            position={[0, 1.5, 4]}
            fov={50}
            near={0.1}
            far={100}
          />
          
          {/* Character */}
          <CharacterController
            modelPath={getCharacterModel()}
            characterType={characterType}
            position={[0, -1, 0]}
            scale={[1, 1, 1]}
            onStateChange={setCurrentState}
            onInteraction={handleCharacterInteraction}
          />
          
          {/* Interactive elements based on environment */}
          <EnvironmentProps environment={environment} />
          
          {/* Controls */}
          {showControls && (
            <OrbitControls
              enablePan={false}
              enableZoom={false}
              enableRotate={autoRotate}
              autoRotate={autoRotate}
              autoRotateSpeed={0.5}
              maxPolarAngle={Math.PI / 2}
              minPolarAngle={Math.PI / 3}
            />
          )}
        </Suspense>
      </Canvas>
      
      {/* Loading overlay */}
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/20 backdrop-blur-sm">
          <div className="nexus-card p-6 flex flex-col items-center gap-4">
            <div className="w-8 h-8 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin" />
            <span className="text-white text-sm">Loading 3D Character...</span>
          </div>
        </div>
      )}
      
      {/* Character state indicator */}
      <div className="absolute top-4 left-4 nexus-card px-3 py-2">
        <div className="flex items-center gap-2">
          <div className={`w-2 h-2 rounded-full ${getStateColor(currentState)}`} />
          <span className="text-white text-xs capitalize">
            {currentState.replace('_', ' ')}
          </span>
        </div>
      </div>
      
      {/* Performance indicator */}
      {performanceLevel !== 'high' && (
        <div className="absolute top-4 right-4 nexus-card px-3 py-2">
          <span className="text-yellow-400 text-xs">
            Performance: {performanceLevel}
          </span>
        </div>
      )}
    </div>
  );
}

// Scene lighting component
function SceneLighting({ environment, quality }: { environment: string; quality: string }) {
  return (
    <>
      <ambientLight intensity={0.4} />
      <directionalLight
        position={[10, 10, 5]}
        intensity={1}
        castShadow={quality !== 'low'}
        shadow-mapSize-width={quality === 'high' ? 2048 : 1024}
        shadow-mapSize-height={quality === 'high' ? 2048 : 1024}
      />
      <pointLight position={[-10, -10, -10]} intensity={0.3} color="#00e6ff" />
      <spotLight
        position={[0, 10, 0]}
        angle={0.3}
        penumbra={1}
        intensity={0.5}
        castShadow={quality !== 'low'}
        color="#ffffff"
      />
    </>
  );
}

// Environment-specific props and decorations
function EnvironmentProps({ environment }: { environment: string }) {
  switch (environment) {
    case 'homepage':
      return (
        <>
          {/* Floating UI elements */}
          <FloatingUIElement position={[2, 1, -1]} type="dashboard" />
          <FloatingUIElement position={[-2, 0.5, -1]} type="chart" />
        </>
      );
    case 'dashboard':
      return (
        <>
          {/* Code snippets and data visualizations */}
          <FloatingUIElement position={[1.5, 2, 0]} type="code" />
          <FloatingUIElement position={[-1.5, 1.5, 0]} type="graph" />
        </>
      );
    default:
      return null;
  }
}

// Floating UI elements that characters can interact with
function FloatingUIElement({ 
  position, 
  type 
}: { 
  position: [number, number, number]; 
  type: 'dashboard' | 'chart' | 'code' | 'graph' 
}) {
  const meshRef = useRef<THREE.Mesh>(null);
  
  return (
    <mesh ref={meshRef} position={position}>
      <planeGeometry args={[1, 0.6]} />
      <meshStandardMaterial
        color="#00e6ff"
        transparent
        opacity={0.3}
        emissive="#0066cc"
        emissiveIntensity={0.2}
      />
      <Html
        transform
        occlude
        position={[0, 0, 0.01]}
        style={{
          width: '200px',
          height: '120px',
          background: 'rgba(0, 230, 255, 0.1)',
          border: '1px solid rgba(0, 230, 255, 0.3)',
          borderRadius: '8px',
          backdropFilter: 'blur(10px)',
          padding: '8px',
          fontSize: '10px',
          color: 'white'
        }}
      >
        <div className="text-center">
          <div className="font-semibold mb-1">{type.toUpperCase()}</div>
          <div className="text-xs opacity-70">Interactive Element</div>
        </div>
      </Html>
    </mesh>
  );
}

// Loading fallback component
function LoadingFallback() {
  return (
    <Html center>
      <div className="flex items-center gap-2 text-white">
        <div className="w-4 h-4 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin" />
        <span>Loading...</span>
      </div>
    </Html>
  );
}

// Performance monitoring class
class PerformanceMonitor {
  private frameCount = 0;
  private lastTime = performance.now();
  private fps = 60;
  public onPerformanceChange?: (level: 'low' | 'medium' | 'high') => void;
  private intervalId?: NodeJS.Timeout;

  constructor() {
    this.startMonitoring();
  }

  private startMonitoring() {
    this.intervalId = setInterval(() => {
      const currentTime = performance.now();
      const deltaTime = currentTime - this.lastTime;
      this.fps = 1000 / deltaTime;
      this.lastTime = currentTime;

      // Determine performance level
      let level: 'low' | 'medium' | 'high';
      if (this.fps < 20) {
        level = 'low';
      } else if (this.fps < 40) {
        level = 'medium';
      } else {
        level = 'high';
      }

      this.onPerformanceChange?.(level);
    }, 1000);
  }

  cleanup() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
    }
  }
}

// Utility functions
function getStateColor(state: CharacterState): string {
  switch (state) {
    case CharacterState.IDLE:
      return 'bg-gray-400';
    case CharacterState.GREETING:
      return 'bg-green-400';
    case CharacterState.EXPLAINING:
      return 'bg-blue-400';
    case CharacterState.POINTING:
      return 'bg-yellow-400';
    case CharacterState.CELEBRATING:
      return 'bg-purple-400';
    case CharacterState.THINKING:
      return 'bg-cyan-400';
    default:
      return 'bg-gray-400';
  }
}

function trackCharacterInteraction(
  characterType: string,
  interactionType: string,
  environment: string
) {
  // Analytics tracking - replace with your analytics service
  console.log('Character Interaction:', {
    character: characterType,
    interaction: interactionType,
    environment,
    timestamp: new Date().toISOString()
  });
}