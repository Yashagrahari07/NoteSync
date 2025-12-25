import { FileText, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';

interface LogoProps {
  className?: string;
  showText?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

export function Logo({ className, showText = true, size = 'md' }: LogoProps) {
  const sizeClasses = {
    sm: 'w-8 h-8',
    md: 'w-10 h-10',
    lg: 'w-12 h-12',
  };

  const textSizeClasses = {
    sm: 'text-lg',
    md: 'text-xl',
    lg: 'text-2xl',
  };

  return (
    <div className={cn('flex items-center gap-2', className)}>
      <div className={cn(
        'relative bg-gradient-to-br from-[#2383e2] via-[#2383e2] to-[#1a73d1] rounded-xl flex items-center justify-center shadow-lg shadow-[#2383e2]/20',
        sizeClasses[size]
      )}>
        <FileText className="h-5 w-5 text-white" strokeWidth={2.5} />
        <div className="absolute -top-0.5 -right-0.5">
          <Sparkles className="h-3 w-3 text-[#2383e2] fill-white" />
        </div>
      </div>
      {showText && (
        <span className={cn(
          'font-bold bg-gradient-to-r from-[#2383e2] to-[#2383e2]/70 bg-clip-text text-transparent',
          textSizeClasses[size]
        )}>
          NoteSync
        </span>
      )}
    </div>
  );
}

