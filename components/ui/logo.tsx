'use client';

import Link from 'next/link';

interface LogoProps {
  size?: 'small' | 'medium' | 'large';
  withTagline?: boolean;
}

export function Logo({ size = 'medium', withTagline = false }: LogoProps) {
  // Size mapping
  const sizeClasses = {
    small: 'text-2xl',
    medium: 'text-3xl md:text-4xl',
    large: 'text-4xl md:text-5xl lg:text-6xl'
  };

  return (
    <Link href="/" className="flex flex-col items-center">
      <h1 className={`font-bold ${sizeClasses[size]} bg-gradient-to-r from-cyan-400 to-blue-600 bg-clip-text text-transparent`}>
        NexusWorks
      </h1>
      {withTagline && (
        <p className="text-sm md:text-base text-gray-400 mt-1">
          Where Innovation Meets Opportunity
        </p>
      )}
    </Link>
  );
}