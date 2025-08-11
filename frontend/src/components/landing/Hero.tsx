// frontend/src/components/landing/Hero.tsx

interface HeroProps {
  onGetStarted: () => void;
}

export const Hero = ({ onGetStarted }: HeroProps) => {
  return (
    <div className="container mx-auto px-6 py-20">
      <div className="text-center max-w-4xl mx-auto">
        {/* Logo/Brand */}
        <div className="flex items-center justify-center mb-8">
          <div className="w-16 h-16 bg-gradient-to-r from-purple-500 to-blue-500 rounded-2xl flex items-center justify-center mr-4 shadow-lg">
            <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
            </svg>
          </div>
          <h1 className="text-5xl md:text-6xl font-bold bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
            ChatMeet
          </h1>
        </div>

        {/* Main Headline */}
        <h2 className="text-3xl md:text-5xl font-bold text-white mb-6 leading-tight">
          Connect with
          <span className="bg-gradient-to-r from-yellow-400 to-orange-400 bg-clip-text text-transparent"> strangers </span>
          worldwide
        </h2>

        {/* Subtitle */}
        <p className="text-xl md:text-2xl text-white/80 mb-12 leading-relaxed max-w-2xl mx-auto">
          Experience spontaneous video conversations with people from around the globe.
          Safe, anonymous, and instantly connecting.
        </p>

        {/* CTA Button */}
        <button
          onClick={onGetStarted}
          className="group relative px-12 py-4 bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600 text-white text-xl font-semibold rounded-2xl shadow-2xl hover:shadow-purple-500/25 transition-all duration-300 hover:scale-105 active:scale-95 overflow-hidden hover:cursor-pointer"
        >
          <span className="relative z-10 flex items-center justify-center">
            <svg className="w-6 h-6 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
            </svg>
            Start Chatting Now
          </span>

          {/* Button shine effect */}
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000"></div>
        </button>

        {/* Quick Stats */}
        <div className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-8 max-w-2xl mx-auto">
          <div className="text-center">
            <div className="text-3xl font-bold text-white mb-2">🌍</div>
            <div className="text-white/60 text-sm">Global Connections</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-white mb-2">⚡</div>
            <div className="text-white/60 text-sm">Instant Matching</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-white mb-2">🔒</div>
            <div className="text-white/60 text-sm">Private & Secure</div>
          </div>
        </div>
      </div>
    </div>
  );
};