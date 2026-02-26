export default function Loading() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-900 via-blue-900 to-slate-900 flex items-center justify-center">
      <div className="text-center">
        <div className="relative">
          <div className="w-16 h-16 border-4 border-blue-400/20 rounded-full"></div>
          <div className="w-16 h-16 border-4 border-transparent border-t-cyan-400 rounded-full animate-spin absolute top-0 left-0"></div>
        </div>
        <p className="text-slate-400 mt-6 text-sm font-medium">Loading...</p>
      </div>
    </div>
  );
}
