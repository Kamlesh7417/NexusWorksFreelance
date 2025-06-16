'use client';

import Image from 'next/image';
import Link from 'next/link';

interface LogoProps {
  size?: 'small' | 'medium' | 'large';
  withText?: boolean;
  className?: string;
}

export function Logo({ size = 'medium', withText = true, className = '' }: LogoProps) {
  // Define logo dimensions based on size
  const dimensions = {
    small: { width: 32, height: 32 },
    medium: { width: 48, height: 48 },
    large: { width: 64, height: 64 }
  };

  // Define text size based on logo size
  const textSize = {
    small: 'text-lg',
    medium: 'text-2xl',
    large: 'text-3xl'
  };

  return (
    <Link href="/" className={`flex items-center gap-3 ${className}`}>
      <div className="relative">
        <Image
          src="/images/nexusworks-logo.png"
          alt="NexusWorks Logo"
          width={dimensions[size].width}
          height={dimensions[size].height}
          className="rounded-lg"
          priority
        />
      </div>
      
      {withText && (
        <span className={`font-bold ${textSize[size]} text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-purple-600`}>
          NexusWorks
        </span>
      )}
    </Link>
  );
}