export default function Loading() {
  return (
    <div className="min-h-screen bg-base text-text-base font-sans pb-12">
      <main className="max-w-7xl mx-auto px-4 sm:px-6 pt-8">
        {/* Page header skeleton */}
        <div className="flex items-center gap-3 mb-8 pb-5 border-b border-border">
          <div className="w-9 h-9 rounded-lg animate-shimmer"></div>
          <div className="space-y-2">
            <div className="h-7 w-56 rounded-md animate-shimmer"></div>
            <div className="h-4 w-40 rounded-md animate-shimmer"></div>
          </div>
        </div>

        {/* Metric row skeleton */}
        <div className="flex gap-6 mb-8 pb-6 border-b border-border">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="flex-1 flex flex-col gap-2">
              <div className="h-3 w-20 rounded animate-shimmer"></div>
              <div className="h-8 w-16 rounded animate-shimmer"></div>
            </div>
          ))}
        </div>

        {/* Search skeleton */}
        <div className="h-12 rounded-lg animate-shimmer mb-8"></div>

        {/* Table skeleton */}
        <div className="rounded-lg border border-border overflow-hidden">
          <div className="h-10 animate-shimmer border-b border-border"></div>
          {[...Array(6)].map((_, i) => (
            <div key={i} className="flex items-center gap-4 px-4 py-3 border-b border-border last:border-b-0">
              <div className="h-4 w-20 rounded animate-shimmer"></div>
              <div className="h-4 w-24 rounded animate-shimmer"></div>
              <div className="h-4 flex-1 rounded animate-shimmer"></div>
              <div className="h-5 w-12 rounded animate-shimmer"></div>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
