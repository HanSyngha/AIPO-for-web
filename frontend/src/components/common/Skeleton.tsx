import { memo } from 'react';

interface SkeletonProps {
  className?: string;
  variant?: 'text' | 'circular' | 'rectangular';
  width?: string | number;
  height?: string | number;
  count?: number;
}

function Skeleton({
  className = '',
  variant = 'rectangular',
  width,
  height,
  count = 1,
}: SkeletonProps) {
  const baseClasses = 'skeleton animate-pulse';

  const variantClasses = {
    text: 'rounded',
    circular: 'rounded-full',
    rectangular: 'rounded-lg',
  };

  const style: React.CSSProperties = {};
  if (width) style.width = typeof width === 'number' ? `${width}px` : width;
  if (height) style.height = typeof height === 'number' ? `${height}px` : height;

  if (count === 1) {
    return (
      <div
        className={`${baseClasses} ${variantClasses[variant]} ${className}`}
        style={style}
      />
    );
  }

  return (
    <>
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className={`${baseClasses} ${variantClasses[variant]} ${className}`}
          style={style}
        />
      ))}
    </>
  );
}

export default memo(Skeleton);

// Preset skeleton components for common use cases
export const SkeletonCard = memo(function SkeletonCard() {
  return (
    <div className="card p-4 space-y-3">
      <Skeleton height={20} width="60%" />
      <Skeleton height={16} />
      <Skeleton height={16} width="80%" />
    </div>
  );
});

export const SkeletonListItem = memo(function SkeletonListItem() {
  return (
    <div className="flex items-center gap-3 p-3">
      <Skeleton variant="circular" width={40} height={40} />
      <div className="flex-1 space-y-2">
        <Skeleton height={16} width="50%" />
        <Skeleton height={14} width="30%" />
      </div>
    </div>
  );
});

export const SkeletonNote = memo(function SkeletonNote() {
  return (
    <div className="space-y-4">
      <Skeleton height={32} width="40%" />
      <div className="space-y-2">
        <Skeleton height={16} />
        <Skeleton height={16} />
        <Skeleton height={16} width="90%" />
      </div>
      <Skeleton height={120} className="mt-4" />
      <div className="space-y-2">
        <Skeleton height={16} />
        <Skeleton height={16} width="85%" />
        <Skeleton height={16} width="70%" />
      </div>
    </div>
  );
});

export const SkeletonTree = memo(function SkeletonTree() {
  return (
    <div className="p-3 space-y-2">
      <Skeleton height={28} />
      <div className="pl-4 space-y-2">
        <Skeleton height={28} />
        <Skeleton height={28} />
        <div className="pl-4 space-y-2">
          <Skeleton height={28} />
          <Skeleton height={28} />
        </div>
      </div>
      <Skeleton height={28} />
      <div className="pl-4 space-y-2">
        <Skeleton height={28} />
      </div>
    </div>
  );
});
