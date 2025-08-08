interface SkeletonProps {
  className?: string;
  variant?: 'text' | 'rectangular' | 'circular';
  width?: string | number;
  height?: string | number;
  animation?: 'pulse' | 'wave';
}

export function Skeleton({ 
  className = '', 
  variant = 'rectangular', 
  width, 
  height, 
  animation = 'pulse' 
}: SkeletonProps) {
  const baseClasses = 'bg-gray-200';
  
  const variantClasses = {
    text: 'rounded',
    rectangular: 'rounded-md',
    circular: 'rounded-full'
  };

  const animationClasses = {
    pulse: 'animate-pulse',
    wave: 'animate-pulse'
  };

  const style: React.CSSProperties = {};
  if (width) style.width = typeof width === 'number' ? `${width}px` : width;
  if (height) style.height = typeof height === 'number' ? `${height}px` : height;

  return (
    <div 
      className={`${baseClasses} ${variantClasses[variant]} ${animationClasses[animation]} ${className}`}
      style={style}
    />
  );
}

// Skeleton específicos para diferentes elementos
export function TextSkeleton({ lines = 1, className = '' }: { lines?: number; className?: string }) {
  return (
    <div className={`space-y-2 ${className}`}>
      {Array.from({ length: lines }).map((_, index) => (
        <Skeleton 
          key={index}
          variant="text" 
          height={16}
          width={index === lines - 1 ? '75%' : '100%'}
        />
      ))}
    </div>
  );
}

export function CardSkeleton({ className = '' }: { className?: string }) {
  return (
    <div className={`bg-white p-6 rounded-lg shadow ${className}`}>
      <Skeleton height={24} width="40%" className="mb-4" />
      <TextSkeleton lines={3} />
      <div className="mt-4 flex space-x-2">
        <Skeleton height={36} width={80} />
        <Skeleton height={36} width={100} />
      </div>
    </div>
  );
}

export function KPISkeleton({ className = '' }: { className?: string }) {
  return (
    <div className={`bg-white p-6 rounded-lg shadow ${className}`}>
      <div className="flex items-center justify-between mb-2">
        <Skeleton height={20} width="60%" />
        <Skeleton variant="circular" width={32} height={32} />
      </div>
      <Skeleton height={32} width="80%" className="mb-2" />
      <Skeleton height={16} width="40%" />
    </div>
  );
}

export function FormSkeleton({ className = '' }: { className?: string }) {
  return (
    <div className={`space-y-6 ${className}`}>
      {/* Form fields */}
      {Array.from({ length: 3 }).map((_, index) => (
        <div key={index} className="space-y-2">
          <Skeleton height={16} width="25%" />
          <Skeleton height={40} width="100%" />
        </div>
      ))}
      
      {/* Buttons */}
      <div className="flex space-x-4">
        <Skeleton height={40} width={120} />
        <Skeleton height={40} width={100} />
      </div>
    </div>
  );
}

export function TableSkeleton({ rows = 5, cols = 4, className = '' }: { 
  rows?: number; 
  cols?: number; 
  className?: string; 
}) {
  return (
    <div className={`space-y-3 ${className}`}>
      {/* Header */}
      <div className="grid gap-4" style={{ gridTemplateColumns: `repeat(${cols}, 1fr)` }}>
        {Array.from({ length: cols }).map((_, index) => (
          <Skeleton key={index} height={20} width="70%" />
        ))}
      </div>
      
      {/* Rows */}
      {Array.from({ length: rows }).map((_, rowIndex) => (
        <div key={rowIndex} className="grid gap-4" style={{ gridTemplateColumns: `repeat(${cols}, 1fr)` }}>
          {Array.from({ length: cols }).map((_, colIndex) => (
            <Skeleton key={colIndex} height={16} width="90%" />
          ))}
        </div>
      ))}
    </div>
  );
}
