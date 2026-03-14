'use client';

export default function UnderConstruction() {
  return (
    <div className="fixed inset-0 z-50 bg-gradient-to-br from-gray-950 via-gray-900 to-gray-950 flex items-center justify-center p-6 overflow-hidden">
      {/* Subtle background grid */}
      <div className="absolute inset-0 opacity-5" style={{
        backgroundImage: 'radial-gradient(circle at 1px 1px, white 1px, transparent 0)',
        backgroundSize: '40px 40px'
      }} />

      {/* Animated glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full bg-amber-500/5 blur-3xl animate-pulse" />

      <div className="relative z-10 text-center max-w-lg mx-auto">
        {/* Logo */}
        <h1 className="text-5xl md:text-7xl font-black text-white mb-2 tracking-tight">
          One<span className="text-amber-400">FTV</span>
        </h1>

        {/* Ball animation */}
        <div className="my-10 h-28 relative flex items-end justify-center">
          {/* Shadow */}
          <div className="absolute bottom-0 w-12 h-3 bg-white/10 rounded-full blur-sm" style={{
            animation: 'shadow 1.5s ease-in-out infinite'
          }} />
          {/* Ball */}
          <div className="text-5xl md:text-6xl absolute" style={{
            animation: 'bounce-ball 1.5s ease-in-out infinite'
          }}>
            ⚽
          </div>
          {/* Kick foot - appears at bottom */}
          <div className="text-3xl absolute bottom-0 -right-4 md:right-16" style={{
            animation: 'kick 1.5s ease-in-out infinite'
          }}>
            🦶
          </div>
        </div>

        {/* Main message */}
        <h2 className="text-2xl md:text-3xl font-bold text-white mb-3">
          Site em Construção
        </h2>
        <p className="text-lg text-gray-400 mb-2">Coming Soon</p>

        {/* Tagline */}
        <p className="text-gray-500 text-sm md:text-base mt-6 leading-relaxed">
          A plataforma de torneios de futevôlei está chegando 🏐
        </p>

        {/* Decorative dots */}
        <div className="flex items-center justify-center gap-2 mt-10">
          <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
          <span className="w-2 h-2 rounded-full bg-amber-400/60 animate-pulse" style={{ animationDelay: '0.3s' }} />
          <span className="w-2 h-2 rounded-full bg-amber-400/30 animate-pulse" style={{ animationDelay: '0.6s' }} />
        </div>
      </div>

      <style jsx>{`
        @keyframes bounce-ball {
          0%, 100% {
            bottom: 0;
            animation-timing-function: ease-out;
          }
          15% {
            bottom: 90px;
            animation-timing-function: ease-in;
          }
          40% {
            bottom: 0;
            animation-timing-function: ease-out;
          }
          55% {
            bottom: 50px;
            animation-timing-function: ease-in;
          }
          70% {
            bottom: 0;
            animation-timing-function: ease-out;
          }
          80% {
            bottom: 20px;
            animation-timing-function: ease-in;
          }
          90% {
            bottom: 0;
          }
        }
        @keyframes kick {
          0%, 8% {
            transform: rotate(0deg) translateX(0);
            opacity: 1;
          }
          5% {
            transform: rotate(-30deg) translateX(-10px);
            opacity: 1;
          }
          15%, 100% {
            opacity: 0;
            transform: rotate(0deg);
          }
        }
        @keyframes shadow {
          0%, 100% {
            transform: scale(1);
            opacity: 0.3;
          }
          15% {
            transform: scale(0.5);
            opacity: 0.1;
          }
          40% {
            transform: scale(1);
            opacity: 0.3;
          }
          55% {
            transform: scale(0.7);
            opacity: 0.2;
          }
          70% {
            transform: scale(1);
            opacity: 0.3;
          }
        }
      `}</style>
    </div>
  );
}
