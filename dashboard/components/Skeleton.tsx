import { classNames } from '@/lib/utils';

interface SkeletonProps {
  className?: string;
  width?: string | number;
  height?: string | number;
  rounded?: boolean;
}

export function Skeleton({ className, width, height, rounded }: SkeletonProps) {
  return (
    <div
      className={classNames('skeleton', rounded && 'rounded-full', className)}
      style={{ width, height }}
    />
  );
}

export function SkeletonRow({ columns = 4 }: { columns?: number }) {
  return (
    <div className="flex items-center gap-4 py-3 px-4">
      {Array.from({ length: columns }).map((_, i) => (
        <Skeleton key={i} height={14} className="flex-1" />
      ))}
    </div>
  );
}

export function SkeletonCard() {
  return (
    <div className="surface p-5">
      <Skeleton height={12} width="40%" className="mb-3" />
      <Skeleton height={28} width="60%" className="mb-2" />
      <Skeleton height={10} width="30%" />
    </div>
  );
}
