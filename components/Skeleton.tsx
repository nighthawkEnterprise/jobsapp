export function Skeleton({ className }: { className?: string }) {
  return <div className={`animate-pulse rounded-lg bg-gray-100 ${className ?? ''}`} />;
}

export function SkeletonPipelineCard() {
  return (
    <div className="bg-white border border-gray-100 rounded-2xl p-5">
      <div className="flex gap-4 items-start">
        <Skeleton className="w-16 h-16 rounded-xl flex-none" />
        <div className="flex-grow space-y-2">
          <div className="flex items-center gap-2">
            <Skeleton className="w-8 h-8 rounded-lg flex-none" />
            <Skeleton className="h-4 w-48" />
          </div>
          <Skeleton className="h-3 w-36" />
          <div className="flex gap-2 pt-1">
            <Skeleton className="h-5 w-16 rounded-full" />
            <Skeleton className="h-5 w-24 rounded-full" />
          </div>
        </div>
        <div className="flex-none space-y-2">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-7 w-20 rounded-lg" />
        </div>
      </div>
    </div>
  );
}

export function SkeletonJobDetailHeader() {
  return (
    <div className="bg-white border border-gray-100 rounded-2xl shadow-sm p-8 mb-8 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
      <div className="flex-grow space-y-3">
        <Skeleton className="h-8 w-72" />
        <Skeleton className="h-5 w-48" />
        <div className="flex gap-3 pt-1">
          <Skeleton className="h-8 w-28 rounded-lg" />
          <Skeleton className="h-8 w-28 rounded-lg" />
        </div>
      </div>
      <Skeleton className="w-36 h-28 rounded-xl flex-none" />
    </div>
  );
}

export function SkeletonResumeCard() {
  return (
    <div className="p-4 flex items-center gap-3 border-b border-gray-100">
      <Skeleton className="w-9 h-9 rounded-lg flex-none" />
      <div className="flex-grow space-y-1.5">
        <Skeleton className="h-4 w-40" />
        <Skeleton className="h-3 w-24" />
      </div>
    </div>
  );
}

export function SkeletonStoryCard() {
  return (
    <div className="bg-white border border-gray-100 rounded-xl p-6 space-y-3">
      <Skeleton className="h-5 w-52" />
      <Skeleton className="h-3 w-full" />
      <Skeleton className="h-3 w-3/4" />
      <Skeleton className="h-3 w-full" />
      <Skeleton className="h-3 w-2/3" />
      <div className="flex gap-2 pt-1">
        <Skeleton className="h-5 w-16 rounded-full" />
        <Skeleton className="h-5 w-20 rounded-full" />
      </div>
    </div>
  );
}

export function SkeletonFormSection() {
  return (
    <div className="bg-white border border-gray-100 rounded-2xl p-6 space-y-4">
      <Skeleton className="h-5 w-32" />
      <Skeleton className="h-10 w-full rounded-xl" />
      <div className="flex gap-2 flex-wrap">
        <Skeleton className="h-6 w-20 rounded-full" />
        <Skeleton className="h-6 w-28 rounded-full" />
        <Skeleton className="h-6 w-16 rounded-full" />
      </div>
    </div>
  );
}
