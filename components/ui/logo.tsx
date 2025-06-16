'use client';

import { Zap } from 'lucide-react';
import Link from 'next/link';

interface LogoProps {
  size?: 'small' | 'medium' | 'large';
}

export function Logo({ size = 'medium' }: LogoProps) {
  const sizeClasses = {
    small: 'text-xl',
    medium: 'text-2xl',
    large: 'text-4xl'
  };

  return (
    <Link href="/" className="flex items-center gap-2">
      <div className="bg-gradient-to-br from-cyan-400 to-blue-600 rounded-lg p-2 flex items-center justify-center">
        <Zap className={`text-white ${size === 'small' ? 'w-4 h-4' : size === 'medium' ? 'w-5 h-5' : 'w-8 h-8'}`} />
      </div>
      <span className={`font-bold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-600 ${sizeClasses[size]}`}>
        NexusWorks
      </span>
    </Link>
  );
}