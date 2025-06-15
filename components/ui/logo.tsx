'use client';

import Image from 'next/image';
import Link from 'next/link';

interface LogoProps {
  size?: 'small' | 'medium' | 'large';
  withText?: boolean;
}

export function Logo({ size = 'medium', withText = true }: LogoProps) {
  const dimensions = {
    small: { width: 32, height: 32 },
    medium: { width: 48, height: 48 },
    large: { width: 64, height: 64 },
  };

  return (
    <Link href="/" className="flex items-center gap-3">
      <div className="relative">
        <Image 
          src="/images/nexusworks-logo.png" 
          alt="NexusWorks Logo" 
          width={dimensions[size].width} 
          height={dimensions[size].height}
          className="rounded-full"
        />
      </div>
      {withText && (
        <span className="font-bold text-white text-xl">NexusWorks</span>
      )}
    </Link>
  );
}