'use client';

import { useRef, useEffect, useState } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { useAnimations } from '@react-three/drei';
import { useSafeGLTF } from './use-safe-gltf';
import * as THREE from 'three';

export enum CharacterState {
  IDLE = 'idle',
  GREETING = 'greeting',
  EXPLAINING = 'explaining',
  POINTING = 'pointing',
  CELEBRATING = 'celebrating',
  THINKING = 'thinking',
  TRANSITIONING = 'transitioning'
}

interface CharacterControllerProps {
  modelPath?: string | null;
  position?: [number, number, number];
  scale?: [number, number, number];
  initialState?: CharacterState;
  characterType?: 'client-guide' | 'developer-guide' | 'ai-assistant';
  onStateChange?: (state: CharacterState) => void;
  onInteraction?: (type: 'hover' | 'click') => void;
}

export function CharacterController({
  modelPath = null,
  position = [0, 0, 0],
  scale = [1, 1, 1],
  initialState = CharacterState.IDLE,
  characterType = 'client-guide',
  onStateChange,
  onInteraction
}: CharacterControllerProps) {
  const group = useRef<THREE.Group>(null);
  const [currentState, setCurrentState] = useState<CharacterState>(initialState);
  const [isHovered, setIsHovered] = useState(false);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  
  // Load 3D model safely
  const { scene, animations, isLoading, error, hasModel } = useSafeGLTF(modelPath);
  const { actions, mixer } = useAnimations(animations, group);
  
  const { camera, gl } = useThree();

  // Handle state transitions
  useEffect(() => {
    if (actions && mixer) {
      // Stop all current animations
      Object.values(actions).forEach(action => action?.stop());
      
      // Play animation based on current state
      const animationName = getAnimationForState(currentState);
      if (actions[animationName]) {
        actions[animationName]?.reset().fadeIn(0.5).play();
      }
      
      onStateChange?.(currentState);
    }
  }, [currentState, actions, mixer, onStateChange]);

  // Eye tracking effect
  useFrame((state) => {
    if (group.current && isHovered) {
      // Simple eye tracking - rotate head slightly toward mouse
      const head = group.current.getObjectByName('Head');
      if (head) {
        head.rotation.y = THREE.MathUtils.lerp(
          head.rotation.y,
          (mousePosition.x - 0.5) * 0.3,
          0.1
        );
        head.rotation.x = THREE.MathUtils.lerp(
          head.rotation.x,
          -(mousePosition.y - 0.5) * 0.2,
          0.1
        );
      }
    }
    
    // Update animation mixer
    if (mixer) {
      mixer.update(state.clock.getDelta());
    }
  });

  const handlePointerMove = (event: any) => {
    if (event.point) {
      setMousePosition({
        x: (event.point.x + 1) / 2,
        y: (event.point.y + 1) / 2
      });
    }
  };

  const handlePointerEnter = () => {
    setIsHovered(true);
    if (currentState === CharacterState.IDLE) {
      setCurrentState(CharacterState.GREETING);
    }
    onInteraction?.('hover');
  };

  const handlePointerLeave = () => {
    setIsHovered(false);
    if (currentState === CharacterState.GREETING) {
      setCurrentState(CharacterState.IDLE);
    }
  };

  const handleClick = () => {
    setCurrentState(CharacterState.CELEBRATING);
    onInteraction?.('click');
    
    // Return to idle after celebration
    setTimeout(() => {
      setCurrentState(CharacterState.IDLE);
    }, 2000);
  };

  // Public methods for external control
  const transitionTo = (newState: CharacterState) => {
    setCurrentState(CharacterState.TRANSITIONING);
    setTimeout(() => setCurrentState(newState), 300);
  };

  // Expose controller methods
  useEffect(() => {
    if (group.current) {
      (group.current as any).characterController = {
        transitionTo,
        getCurrentState: () => currentState,
        playAnimation: (name: string) => actions[name]?.play(),
        stopAnimation: (name: string) => actions[name]?.stop()
      };
    }
  }, [currentState, actions]);

  return (
    <group
      ref={group}
      position={position}
      scale={scale}
      onPointerMove={handlePointerMove}
      onPointerEnter={handlePointerEnter}
      onPointerLeave={handlePointerLeave}
      onClick={handleClick}
    >
      {scene && hasModel && !error ? (
        <primitive object={scene.clone()} />
      ) : (
        // Fallback geometry when model is not available
        <FallbackCharacter 
          state={currentState} 
          isHovered={isHovered} 
          characterType={characterType}
        />
      )}
    </group>
  );
}

// Fallback character using basic geometry
function FallbackCharacter({ 
  state, 
  isHovered, 
  characterType = 'client-guide' 
}: { 
  state: CharacterState; 
  isHovered: boolean;
  characterType?: string;
}) {
  const meshRef = useRef<THREE.Mesh>(null);
  const groupRef = useRef<THREE.Group>(null);
  
  // Character type specific colors
  const getCharacterColors = () => {
    switch (characterType) {
      case 'client-guide':
        return {
          primary: '#00e6ff',
          secondary: '#0066cc',
          accent: '#00ccff'
        };
      case 'developer-guide':
        return {
          primary: '#9333ea',
          secondary: '#7c3aed',
          accent: '#a855f7'
        };
      case 'ai-assistant':
        return {
          primary: '#06b6d4',
          secondary: '#0891b2',
          accent: '#22d3ee'
        };
      default:
        return {
          primary: '#00e6ff',
          secondary: '#0066cc',
          accent: '#00ccff'
        };
    }
  };
  
  const colors = getCharacterColors();
  
  useFrame((frameState) => {
    if (meshRef.current && groupRef.current) {
      // Simple animations based on state
      switch (state) {
        case CharacterState.GREETING:
          meshRef.current.rotation.y = Math.sin(frameState.clock.elapsedTime * 2) * 0.3;
          groupRef.current.position.y = Math.sin(frameState.clock.elapsedTime * 3) * 0.05;
          break;
        case CharacterState.CELEBRATING:
          meshRef.current.position.y = Math.sin(frameState.clock.elapsedTime * 8) * 0.2;
          meshRef.current.rotation.z = Math.sin(frameState.clock.elapsedTime * 4) * 0.1;
          groupRef.current.scale.setScalar(1 + Math.sin(frameState.clock.elapsedTime * 6) * 0.1);
          break;
        case CharacterState.POINTING:
          meshRef.current.rotation.x = -0.2;
          meshRef.current.rotation.y = 0.3;
          break;
        case CharacterState.EXPLAINING:
          meshRef.current.rotation.y = Math.sin(frameState.clock.elapsedTime * 1.5) * 0.2;
          groupRef.current.position.y = Math.sin(frameState.clock.elapsedTime * 2) * 0.03;
          break;
        case CharacterState.THINKING:
          meshRef.current.rotation.x = 0.1;
          groupRef.current.position.y = Math.sin(frameState.clock.elapsedTime * 1) * 0.02;
          break;
        default:
          meshRef.current.rotation.y = Math.sin(frameState.clock.elapsedTime * 0.5) * 0.1;
          meshRef.current.position.y = 0;
          meshRef.current.rotation.x = 0;
          meshRef.current.rotation.z = 0;
          groupRef.current.scale.setScalar(1);
          groupRef.current.position.y = 0;
      }
      
      // Hover effect
      if (isHovered) {
        groupRef.current.scale.setScalar(1.1);
      } else if (state !== CharacterState.CELEBRATING) {
        groupRef.current.scale.setScalar(1);
      }
    }
  });

  return (
    <group ref={groupRef}>
      {/* Body */}
      <mesh ref={meshRef} position={[0, 0, 0]}>
        <capsuleGeometry args={[0.3, 1.2, 4, 8]} />
        <meshStandardMaterial 
          color={colors.primary}
          emissive={colors.secondary}
          emissiveIntensity={0.2}
          roughness={0.3}
          metalness={0.1}
        />
      </mesh>
      
      {/* Head */}
      <mesh position={[0, 0.8, 0]}>
        <sphereGeometry args={[0.25, 16, 16]} />
        <meshStandardMaterial 
          color={colors.accent}
          emissive={colors.secondary}
          emissiveIntensity={0.3}
          roughness={0.2}
          metalness={0.2}
        />
      </mesh>
      
      {/* Eyes */}
      <mesh position={[-0.1, 0.85, 0.2]}>
        <sphereGeometry args={[0.03, 8, 8]} />
        <meshStandardMaterial color="#ffffff" emissive="#ffffff" emissiveIntensity={0.5} />
      </mesh>
      <mesh position={[0.1, 0.85, 0.2]}>
        <sphereGeometry args={[0.03, 8, 8]} />
        <meshStandardMaterial color="#ffffff" emissive="#ffffff" emissiveIntensity={0.5} />
      </mesh>
      
      {/* Character type specific accessories */}
      {characterType === 'developer-guide' && (
        <>
          {/* Laptop/Code symbol */}
          <mesh position={[0.4, 0.3, 0]}>
            <boxGeometry args={[0.15, 0.1, 0.02]} />
            <meshStandardMaterial color="#1f2937" emissive="#374151" emissiveIntensity={0.3} />
          </mesh>
        </>
      )}
      
      {characterType === 'ai-assistant' && (
        <>
          {/* Floating particles */}
          <mesh position={[0.3, 1.2, 0.2]}>
            <sphereGeometry args={[0.02, 8, 8]} />
            <meshStandardMaterial color={colors.primary} emissive={colors.primary} emissiveIntensity={0.8} />
          </mesh>
          <mesh position={[-0.2, 1.1, -0.1]}>
            <sphereGeometry args={[0.015, 8, 8]} />
            <meshStandardMaterial color={colors.accent} emissive={colors.accent} emissiveIntensity={0.8} />
          </mesh>
        </>
      )}
    </group>
  );
}

function getAnimationForState(state: CharacterState): string {
  switch (state) {
    case CharacterState.GREETING:
      return 'wave';
    case CharacterState.EXPLAINING:
      return 'talk';
    case CharacterState.POINTING:
      return 'point';
    case CharacterState.CELEBRATING:
      return 'celebrate';
    case CharacterState.THINKING:
      return 'think';
    default:
      return 'idle';
  }
}

// Note: Model preloading is handled by useSafeGLTF hook