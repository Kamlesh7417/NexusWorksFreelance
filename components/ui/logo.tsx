'use client';

import Image from 'next/image';
import Link from 'next/link';

interface LogoProps {
  size?: 'small' | 'medium' | 'large';
  withText?: boolean;
  className?: string;
}

export function Logo({ size = 'medium', withText = true, className = '' }: LogoProps) {
  // Define size dimensions
  const dimensions = {
    small: { width: 32, height: 32 },
    medium: { width: 48, height: 48 },
    large: { width: 64, height: 64 }
  };

  const { width, height } = dimensions[size];
  
  return (
    <Link href="/" className={`flex items-center gap-3 ${className}`}>
      <div className="relative">
        <Image 
          src="/images/nexusworks-logo.png" 
          alt="NexusWorks Logo" 
          width={width} 
          height={height}
          className="rounded-full"
        />
      </div>
      
      {withText && (
        <span className="font-bold text-2xl text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-purple-600">
          NexusWorks
        </span>
      )}
    </Link>
  );
}