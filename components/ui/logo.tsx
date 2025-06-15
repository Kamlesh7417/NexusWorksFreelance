'use client';

import Image from 'next/image';
import Link from 'next/link';

interface LogoProps {
  size?: 'small' | 'medium' | 'large';
  withText?: boolean;
  className?: string;
}

export function Logo({ size = 'medium', withText = true, className = '' }: LogoProps) {
  // Size mapping
  const sizeMap = {
    small: { width: 32, height: 32, textClass: 'text-lg' },
    medium: { width: 48, height: 48, textClass: 'text-2xl' },
    large: { width: 64, height: 64, textClass: 'text-3xl' }
  };

  const { width, height, textClass } = sizeMap[size];

  return (
    <Link href="/" className={`flex items-center gap-3 ${className}`}>
      <div className="relative">
        <Image 
          src="/images/nexusworks-logo.png" 
          alt="NexusWorks Logo" 
          width={width} 
          height={height}
          className="rounded-full"
          priority
        />
      </div>
      
      {withText && (
        <h1 className={`font-bold ${textClass} text-white`}>
          NexusWorks
        </h1>
      )}
    </Link>
  );
}