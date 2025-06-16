'use client';

import { Zap } from 'lucide-react';
import Link from 'next/link';

interface LogoProps {
  size?: 'small' | 'medium' | 'large';
  variant?: 'default' | 'light';
}

export function Logo({ size = 'medium', variant = 'default' }: LogoProps) {
  const sizeClasses = {
    small: 'text-xl',
    medium: 'text-2xl',
    large: 'text-3xl'
  };

  const colorClasses = {
    default: 'text-cyan-400',
    light: 'text-white'
  };

  return (
    <Link href="/" className="flex items-center gap-2">
      <div className="w-10 h-10 bg-gradient-to-br from-cyan-400 to-blue-600 rounded-lg flex items-center justify-center">
        <Zap size={24} className="text-white" />
      </div>
      <span className={`font-bold ${sizeClasses[size]} ${colorClasses[variant]}`}>
        NexusWorks
      </span>
    </Link>
  );
}