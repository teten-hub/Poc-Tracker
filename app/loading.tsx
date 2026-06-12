import { ShieldAlert } from 'lucide-react';

export default function Loading() {
  return (
    <div className="min-h-screen bg-base text-text-base font-sans pb-12">
      <main className="max-w-6xl mx-auto px-6 mt-10">
        <div className="mb-8">
          <div className="h-10 bg-surface rounded-lg w-1/3 animate-pulse"></div>
          <div className="h-6 bg-surface rounded-lg w-1/2 mt-2 animate-pulse"></div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-10">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-32 bg-neutral rounded-xl border border-border shadow-sm animate-pulse"></div>
          ))}
        </div>

        <div className="h-14 bg-neutral rounded-xl border border-border mb-8 animate-pulse"></div>

        <div className="space-y-5">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="animate-pulse bg-neutral p-6 rounded-xl border border-border shadow-sm flex flex-col md:flex-row gap-6">
              <div className="flex-1 w-full space-y-4">
                <div className="h-6 bg-surface rounded-full w-28"></div>
                <div className="h-4 bg-surface rounded w-full max-w-xl"></div>
                <div className="h-4 bg-surface rounded w-2/3"></div>
              </div>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
