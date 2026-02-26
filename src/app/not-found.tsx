import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-900 via-blue-900 to-slate-900 flex items-center justify-center px-4">
      <div className="text-center max-w-md">
        <div className="flex items-center justify-center w-20 h-20 bg-gradient-to-br from-blue-500 to-cyan-400 rounded-2xl mx-auto mb-8">
          <span className="text-white font-bold text-2xl leading-none">One<br/>FTV</span>
        </div>
        <h1 className="text-8xl font-bold text-white mb-4">404</h1>
        <h2 className="text-2xl font-semibold text-slate-300 mb-4">Page Not Found</h2>
        <p className="text-slate-400 mb-8">
          The page you&apos;re looking for doesn&apos;t exist or has been moved.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link
            href="/"
            className="px-8 py-3 bg-gradient-to-r from-blue-500 to-cyan-400 text-slate-900 rounded-lg font-bold text-lg hover:shadow-lg hover:shadow-blue-500/50 transition-all hover:scale-105"
          >
            Go Home
          </Link>
          <Link
            href="/tournaments"
            className="px-8 py-3 border-2 border-blue-400 text-blue-300 rounded-lg font-bold text-lg hover:bg-blue-400/10 transition-all"
          >
            View Tournaments
          </Link>
        </div>
      </div>
    </div>
  );
}
