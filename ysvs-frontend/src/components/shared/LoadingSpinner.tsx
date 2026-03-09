import type { CSSProperties } from 'react';
import { cn } from '@/lib/utils';

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  text?: string;
}

interface InlineLoaderProps {
  className?: string;
}

export function LoadingSpinner({
  size = 'md',
  className,
  text,
}: LoadingSpinnerProps) {
  const sizeTokens = {
    sm: {
      orbit: '2.25rem',
      pulse: '2.75rem',
    },
    md: {
      orbit: '3rem',
      pulse: '3.5rem',
    },
    lg: {
      orbit: '4rem',
      pulse: '4.5rem',
    },
  };

  const activeSize = sizeTokens[size];

  return (
    <div
      role="status"
      aria-live="polite"
      aria-label={text || 'نحضّر المحتوى'}
      style={
        {
          '--loader-orbit-size': activeSize.orbit,
          '--loader-pulse-width': activeSize.pulse,
        } as CSSProperties
      }
      className={cn('ysvs-loader flex flex-col items-center justify-center gap-3', className)}
    >
      <div className="ysvs-loader-orbit" aria-hidden="true">
        <span className="ysvs-loader-ring ysvs-loader-ring--outer" />
        <span className="ysvs-loader-ring ysvs-loader-ring--inner" />
        <span className="ysvs-loader-core" />
      </div>

      <div className="ysvs-loader-pulse" aria-hidden="true">
        <span className="ysvs-loader-pulse-bar" />
        <span className="ysvs-loader-pulse-bar" />
        <span className="ysvs-loader-pulse-bar" />
        <span className="ysvs-loader-pulse-bar" />
        <span className="ysvs-loader-pulse-bar" />
      </div>

      {text && <p className="text-sm font-medium text-muted-foreground">{text}</p>}
    </div>
  );
}

export function PageLoader() {
  return (
    <div className="flex min-h-[400px] items-center justify-center rounded-2xl bg-gradient-to-b from-primary-50/60 via-background to-background p-8 dark:from-primary-950/30 dark:via-background dark:to-background">
      <LoadingSpinner size="lg" text="نحضّر الصفحة..." />
    </div>
  );
}

export function FullPageLoader() {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm">
      <LoadingSpinner size="lg" text="نحضّر البيانات..." />
    </div>
  );
}

export function InlineLoader({ className }: InlineLoaderProps) {
  return (
    <span
      aria-hidden="true"
      style={
        {
          '--loader-orbit-size': '1rem',
        } as CSSProperties
      }
      className={cn('ysvs-loader ysvs-inline-loader inline-flex items-center justify-center', className)}
    >
      <span className="ysvs-loader-orbit">
        <span className="ysvs-loader-ring ysvs-loader-ring--outer" />
        <span className="ysvs-loader-ring ysvs-loader-ring--inner" />
        <span className="ysvs-loader-core" />
      </span>
    </span>
  );
}
