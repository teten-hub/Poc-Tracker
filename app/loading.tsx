import { ShieldAlert } from 'lucide-react';

export default function Loading() {
  return (
    <div className="min-h-screen bg-slate-50 bg-[radial-gradient(#cbd5e1_1px,transparent_1px)] [background-size:24px_24px] text-slate-800 font-sans pb-12">
      <header className="sticky top-0 z-50 bg-white/70 backdrop-blur-xl border-b border-white/50 shadow">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-gradient-to-br from-indigo-500 to-violet-600 rounded-xl">
              <ShieldAlert className="text-white w-5 h-5" />
            </div>
            <h1 className="text-xl font-extrabold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-slate-900 to-slate-700">
              PoC Tracker
            </h1>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 mt-10">
        <div className="mb-8">
          <div className="h-10 bg-slate-200 rounded-lg w-1/3 animate-pulse"></div>
          <div className="h-6 bg-slate-200 rounded-lg w-1/2 mt-2 animate-pulse"></div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-10">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-32 bg-white/80 rounded-2xl border border-white/50 shadow-sm animate-pulse"></div>
          ))}
        </div>

        <div className="h-14 bg-white/60 rounded-2xl mb-8 animate-pulse"></div>

        <div className="space-y-5">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="animate-pulse bg-white/80 p-6 rounded-2xl border border-white shadow-sm flex flex-col md:flex-row gap-6">
              <div className="flex-1 w-full space-y-4">
                <div className="h-6 bg-slate-200 rounded-full w-28"></div>
                <div className="h-4 bg-slate-200 rounded w-full max-w-xl"></div>
                <div className="h-4 bg-slate-200 rounded w-2/3"></div>
              </div>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
