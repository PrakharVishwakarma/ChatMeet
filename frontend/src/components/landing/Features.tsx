// frontend/src/components/landing/Features.tsx

export const Features = () => {
    const features = [
        {
            icon: (
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
            ),
            title: "HD Video Chat",
            description: "Crystal clear video calls with optimized quality for the best experience."
        },
        {
            icon: (
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
            ),
            title: "Lightning Fast",
            description: "Connect instantly with strangers worldwide in seconds, not minutes."
        },
        {
            icon: (
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
            ),
            title: "Anonymous & Safe",
            description: "No registration required. Your conversations are private and not recorded."
        }
    ];

    return (
        <div className="container mx-auto px-6 py-16">
            <div className="text-center mb-16">
                <h3 className="text-3xl md:text-4xl font-bold text-white mb-4">
                    Why Choose ChatRio?
                </h3>
                <p className="text-white/70 text-lg max-w-2xl mx-auto">
                    Experience the future of spontaneous connections with our cutting-edge platform
                </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
                {features.map((feature, index) => (
                    <div
                        key={index}
                        className="group bg-white/10 backdrop-blur-md rounded-2xl border border-white/20 p-8 hover:bg-white/15 transition-all duration-300 hover:scale-105 hover:shadow-2xl"
                    >
                        <div className="w-16 h-16 bg-gradient-to-r from-purple-500 to-blue-500 rounded-xl flex items-center justify-center mb-6 text-white group-hover:scale-110 transition-transform duration-300">
                            {feature.icon}
                        </div>

                        <h4 className="text-xl font-bold text-white mb-4">
                            {feature.title}
                        </h4>

                        <p className="text-white/70 leading-relaxed">
                            {feature.description}
                        </p>
                    </div>
                ))}
            </div>
        </div>
    );
};