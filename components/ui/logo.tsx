import { cn } from '@/lib/utils';

interface LogoProps {
  size?: 'small' | 'medium' | 'large';
  className?: string;
}

export function Logo({ size = 'medium', className }: LogoProps) {
  const sizeClasses = {
    small: 'w-8 h-8 text-sm',
    medium: 'w-10 h-10 text-base',
    large: 'w-12 h-12 text-lg'
  };

  return (
    <div className={cn('flex items-center gap-3', className)}>
      <div className={cn(
        'bg-gradient-to-br from-cyan-400 to-blue-600 rounded-xl flex items-center justify-center font-bold text-white transform-gpu hover:scale-105 transition-transform duration-300',
        sizeClasses[size]
      )}>
        N
      </div>
    </div>
  );
}