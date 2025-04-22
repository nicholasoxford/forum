import Link from "next/link";

export const HowItWorksSection = () => {
  return (
    <section
      id="how-it-works"
      className="container py-16 md:py-20 w-full relative px-4 md:px-0"
    >
      <div className="mb-10 md:mb-16 text-center">
        <h2 className="font-display text-3xl md:text-4xl mb-4 text-center text-zinc-900 dark:text-white relative inline-block">
          How It Works
          <span className="absolute -bottom-2 left-1/2 w-12 h-1 bg-violet-500/40 -translate-x-1/2"></span>
        </h2>
        <p className="text-zinc-400 max-w-xl mx-auto text-sm md:text-base">
          Three simple steps to start earning passive income from your
          community.
        </p>
      </div>

      {/* Animated flow path (visible on md and up) with glowing effect */}
      <div className="hidden md:block absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[80%] h-px bg-gradient-to-r from-transparent via-violet-500/30 to-transparent">
        <div className="absolute top-1/2 left-0 w-4 h-4 -translate-y-1/2 rounded-full bg-violet-500/20 animate-ping"></div>
        <div className="absolute top-1/2 right-0 w-4 h-4 -translate-y-1/2 rounded-full bg-violet-500/20 animate-ping animation-delay-700"></div>
      </div>

      {/* Vertical connector line for mobile - with enhanced styling */}
      <div className="absolute left-1/2 -translate-x-1/2 top-[190px] bottom-32 w-px bg-gradient-to-b from-violet-500/30 via-violet-500/20 to-transparent md:hidden">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-3 h-3 rounded-full bg-violet-500/30 animate-ping"></div>
        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-3 h-3 rounded-full bg-violet-500/20 animate-ping animation-delay-1000"></div>
      </div>

      <div className="flex flex-col md:flex-row justify-around items-center gap-12 md:gap-8 relative z-10">
        {/* Step 1 - with enhanced hover and focus effects */}
        <div className="flex flex-col items-center text-center max-w-xs group">
          <div className="size-16 bg-black/30 border border-violet-500/30 rounded-full mb-6 relative overflow-hidden flex items-center justify-center shadow-lg shadow-violet-500/10 transition-transform group-hover:scale-110 duration-300 z-10 group-hover:border-violet-500/50 group-hover:shadow-violet-500/20">
            <div className="absolute inset-0 bg-gradient-to-br from-violet-500/20 to-violet-900/20 animate-pulse"></div>
            <span className="text-3xl font-display font-bold text-violet-400 relative z-10 group-hover:text-violet-300 transition-colors">
              1
            </span>
          </div>
          <h3 className="text-xl font-semibold mb-3 font-display text-zinc-100 group-hover:text-white transition-colors">
            Create Token
          </h3>
          <p className="text-zinc-400 font-sans leading-relaxed group-hover:text-zinc-300 transition-colors text-sm md:text-base">
            Launch your community token with built-in transfer fees that reward
            holders automatically.
          </p>
        </div>

        {/* Step flow connector + arrow with animation */}
        <div className="hidden md:flex flex-col items-center">
          <svg
            width="40"
            height="24"
            viewBox="0 0 40 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className="text-violet-500/60 group"
          >
            <path
              d="M39.0607 13.0607C39.6464 12.4749 39.6464 11.5251 39.0607 10.9393L29.5147 1.3934C28.9289 0.807611 27.9792 0.807611 27.3934 1.3934C26.8076 1.97919 26.8076 2.92893 27.3934 3.51472L35.8787 12L27.3934 20.4853C26.8076 21.0711 26.8076 22.0208 27.3934 22.6066C27.9792 23.1924 28.9289 23.1924 29.5147 22.6066L39.0607 13.0607ZM0 13.5H38V10.5H0V13.5Z"
              fill="currentColor"
              className="group-hover:text-violet-400 transition-colors"
            />
            <circle
              cx="20"
              cy="12"
              r="2"
              fill="currentColor"
              className="animate-ping opacity-50"
            />
          </svg>
        </div>

        {/* Mobile arrow down with animation */}
        <div className="md:hidden flex items-center text-violet-500/60 -mt-6 group">
          <svg
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className="group-hover:text-violet-400 transition-colors"
          >
            <path
              d="M12 19L12 5"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
            />
            <path
              d="M5 12L12 19L19 12"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <circle
              cx="12"
              cy="12"
              r="2"
              fill="currentColor"
              className="animate-ping opacity-50"
            />
          </svg>
        </div>

        {/* Step 2 - with enhanced hover and focus effects */}
        <div className="flex flex-col items-center text-center max-w-xs group">
          <div className="size-16 bg-black/30 border border-violet-500/30 rounded-full mb-6 relative overflow-hidden flex items-center justify-center shadow-lg shadow-violet-500/10 transition-transform group-hover:scale-110 duration-300 z-10 group-hover:border-violet-500/50 group-hover:shadow-violet-500/20">
            <div className="absolute inset-0 bg-gradient-to-br from-violet-500/20 to-violet-900/20 animate-pulse"></div>
            <span className="text-3xl font-display font-bold text-violet-400 relative z-10 group-hover:text-violet-300 transition-colors">
              2
            </span>
          </div>
          <h3 className="text-xl font-semibold mb-3 font-display text-zinc-100 group-hover:text-white transition-colors">
            Gate Community
          </h3>
          <p className="text-zinc-400 font-sans leading-relaxed group-hover:text-zinc-300 transition-colors text-sm md:text-base">
            Set token requirements for your Telegram group - only holders can
            join and participate.
          </p>
        </div>

        {/* Step flow connector + arrow with animation */}
        <div className="hidden md:flex flex-col items-center">
          <svg
            width="40"
            height="24"
            viewBox="0 0 40 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className="text-violet-500/60 group"
          >
            <path
              d="M39.0607 13.0607C39.6464 12.4749 39.6464 11.5251 39.0607 10.9393L29.5147 1.3934C28.9289 0.807611 27.9792 0.807611 27.3934 1.3934C26.8076 1.97919 26.8076 2.92893 27.3934 3.51472L35.8787 12L27.3934 20.4853C26.8076 21.0711 26.8076 22.0208 27.3934 22.6066C27.9792 23.1924 28.9289 23.1924 29.5147 22.6066L39.0607 13.0607ZM0 13.5H38V10.5H0V13.5Z"
              fill="currentColor"
              className="group-hover:text-violet-400 transition-colors"
            />
            <circle
              cx="20"
              cy="12"
              r="2"
              fill="currentColor"
              className="animate-ping opacity-50"
            />
          </svg>
        </div>

        {/* Mobile arrow down with animation */}
        <div className="md:hidden flex items-center text-violet-500/60 -mt-6 group">
          <svg
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className="group-hover:text-violet-400 transition-colors"
          >
            <path
              d="M12 19L12 5"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
            />
            <path
              d="M5 12L12 19L19 12"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <circle
              cx="12"
              cy="12"
              r="2"
              fill="currentColor"
              className="animate-ping opacity-50"
            />
          </svg>
        </div>

        {/* Step 3 - with enhanced hover and focus effects */}
        <div className="flex flex-col items-center text-center max-w-xs group">
          <div className="size-16 bg-black/30 border border-violet-500/30 rounded-full mb-6 relative overflow-hidden flex items-center justify-center shadow-lg shadow-violet-500/10 transition-transform group-hover:scale-110 duration-300 z-10 group-hover:border-violet-500/50 group-hover:shadow-violet-500/20">
            <div className="absolute inset-0 bg-gradient-to-br from-violet-500/20 to-violet-900/20 animate-pulse"></div>
            <span className="text-3xl font-display font-bold text-violet-400 relative z-10 group-hover:text-violet-300 transition-colors">
              3
            </span>
          </div>
          <h3 className="text-xl font-semibold mb-3 font-display text-zinc-100 group-hover:text-white transition-colors">
            Earn Passively
          </h3>
          <p className="text-zinc-400 font-sans leading-relaxed group-hover:text-zinc-300 transition-colors text-sm md:text-base">
            Every token transaction generates fees that are distributed hourly
            to all community members.
          </p>
        </div>
      </div>

      {/* Call to action - with enhanced hover effects */}
      <div className="mt-12 md:mt-16 text-center">
        <Link href="/launch">
          <button className="bg-violet-500 hover:bg-violet-600 text-white px-6 md:px-8 py-2.5 md:py-3 rounded-full text-base md:text-lg font-medium transition-all duration-300 hover:shadow-xl hover:shadow-violet-500/20 relative overflow-hidden group">
            <span className="relative z-10">Start Now</span>
            <span className="absolute inset-0 bg-gradient-to-r from-violet-600 to-violet-500 opacity-0 group-hover:opacity-100 transition-opacity"></span>
          </button>
        </Link>
        <p className="mt-4 text-zinc-500 text-xs md:text-sm">
          No coding required. Launch in minutes.
        </p>
      </div>

      {/* Curved flow path */}
      <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-violet-500/30 to-transparent"></div>
    </section>
  );
};
