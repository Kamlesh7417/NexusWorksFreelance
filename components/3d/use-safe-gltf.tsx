'use client';

import { useState, useEffect } from 'react';
import { useGLTF } from '@react-three/drei';

interface SafeGLTFResult {
  scene: THREE.Group | null;
  animations: THREE.AnimationClip[];
  isLoading: boolean;
  error: string | null;
  hasModel: boolean;
}

export function useSafeGLTF(path: string | null): SafeGLTFResult {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [hasModel, setHasModel] = useState(false);
  const [modelExists, setModelExists] = useState<boolean | null>(null);

  // Check if model exists first
  useEffect(() => {
    if (!path) {
      setModelExists(false);
      setIsLoading(false);
      setHasModel(false);
      return;
    }

    const checkModelExists = async () => {
      try {
        const response = await fetch(path, { method: 'HEAD' });
        setModelExists(response.ok);
        if (!response.ok) {
          setError(`Model not found: ${path}`);
          setIsLoading(false);
        }
      } catch (err) {
        setModelExists(false);
        setError(`Failed to check model: ${err}`);
        setIsLoading(false);
      }
    };

    checkModelExists();
  }, [path]);

  // Load model only if it exists
  let gltfResult: any = { scene: null, animations: [] };
  
  if (modelExists === true && path) {
    try {
      gltfResult = useGLTF(path);
      
      useEffect(() => {
        if (gltfResult.scene) {
          setHasModel(true);
          setIsLoading(false);
          setError(null);
        }
      }, [gltfResult.scene]);
      
    } catch (err) {
      useEffect(() => {
        setError(`Failed to load model: ${err}`);
        setIsLoading(false);
        setHasModel(false);
      }, []);
    }
  } else if (modelExists === false || !path) {
    // Model doesn't exist or no path provided, use fallback
    useEffect(() => {
      setHasModel(false);
      setIsLoading(false);
    }, []);
  }

  return {
    scene: gltfResult.scene || null,
    animations: gltfResult.animations || [],
    isLoading,
    error,
    hasModel
  };
}