// frontend/src/components/landing/CTA.tsx

interface CTAProps {
    onGetStarted: () => void;
}

export const CTA = ({ onGetStarted }: CTAProps) => {
    return (
        <div className="container mx-auto px-6 py-20">
            <div className="bg-gradient-to-r from-purple-500/20 to-blue-500/20 backdrop-blur-md rounded-3xl border border-white/20 shadow-2xl p-12 text-center max-w-4xl mx-auto">
                <h3 className="text-3xl md:text-4xl font-bold text-white mb-6">
                    Ready to meet someone new?
                </h3>

                <p className="text-xl text-white/80 mb-10 max-w-2xl mx-auto">
                    Join thousands of people already connecting on ChatMeet.
                    Your next interesting conversation is just one click away.
                </p>

                <div className="flex flex-col sm:flex-row items-center justify-center gap-6">
                    <button
                        onClick={onGetStarted}
                        className="group relative px-10 py-4 bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600 text-white text-lg font-semibold rounded-xl shadow-xl hover:shadow-purple-500/25 transition-all duration-300 hover:scale-105 active:scale-95 overflow-hidden hover:cursor-pointer"
                    >
                        <span className="relative z-10 flex items-center">
                            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                            </svg>
                            Start Now - It's Free!
                        </span>
                        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000"></div>
                    </button>

                    <div className="flex items-center text-white/60 text-sm">
                        <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                        No registration required
                    </div>
                </div>

                {/* Trust Indicators */}
                <div className="mt-12 flex flex-wrap items-center justify-center gap-8 text-white/40">
                    <div className="flex items-center space-x-2">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                        </svg>
                        <span>Secure & Private</span>
                    </div>
                    <div className="flex items-center space-x-2">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9v-9m0 9c-1.657 0-3-4.03-3-9s1.343-9 3-9m0 9c1.657 0 3 4.03 3 9s-1.343 9-3 9" />
                        </svg>
                        <span>Available Worldwide</span>
                    </div>
                    <div className="flex items-center space-x-2 ">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                        </svg>
                        <span>Instant Connection</span>
                    </div>
                </div>
            </div>

            {/* Footer */}
            <div className="mt-16 text-center">
                <p className="text-white/50 text-sm">
                    © 2025 ChatMeet. Connecting people, one conversation at a time.
                </p>
            </div>
        </div>
    );
};