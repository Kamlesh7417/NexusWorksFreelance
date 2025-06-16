'use client';

import Image from 'next/image';
import Link from 'next/link';

interface LogoProps {
  size?: 'sm' | 'md' | 'lg';
  withText?: boolean;
}

export function Logo({ size = 'md', withText = true }: LogoProps) {
  const dimensions = {
    sm: { width: 32, height: 32 },
    md: { width: 48, height: 48 },
    lg: { width: 64, height: 64 }
  };

  const { width, height } = dimensions[size];

  return (
    <Link href="/" className="flex items-center gap-3">
      <div className="relative" style={{ width, height }}>
        <Image 
          src="/logo.png" 
          alt="NexusWorks Logo" 
          width={width} 
          height={height}
          className="rounded-lg"
        />
      </div>
      
      {withText && (
        <div className="flex flex-col">
          <span className="text-xl font-bold text-white">NexusWorks</span>
          <span className="text-xs text-gray-400">Where Innovation Meets Opportunity</span>
        </div>
      )}
    </Link>
  );
}