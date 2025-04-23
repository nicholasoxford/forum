import Link from "next/link";

export const Footer = () => {
  return (
    <footer className="w-full py-12 border-t border-zinc-800/20 dark:border-zinc-700/20 relative overflow-hidden">
      <div className="container mx-auto px-4">
        <div className="flex flex-col md:flex-row justify-between items-center gap-8">
          {/* Brand/Logo area with enhanced styling */}
          <div className="flex flex-col items-center md:items-start">
            <div className="font-display text-2xl font-bold text-zinc-900 dark:text-white mb-2 flex items-center">
              Groupy<span className="text-violet-500">.Fun</span>
              <div className="size-2 rounded-full bg-green-500 ml-2"></div>
            </div>
            <p className="text-sm text-zinc-500 dark:text-zinc-400">
              Building on <span className="text-secondary">Solana</span>
            </p>
          </div>

          {/* Links area with hover effects */}
          <div className="flex flex-col md:flex-row gap-8 md:gap-12">
            <div className="flex flex-col gap-2">
              <p className="font-semibold text-zinc-900 dark:text-white">
                Platform
              </p>
              <Link
                href="/tokens"
                className="text-sm text-zinc-600 dark:text-zinc-400 hover:text-violet-500 dark:hover:text-violet-400 transition-colors"
              >
                All Tokens
              </Link>
              <Link
                href="/buy-token"
                className="text-sm text-zinc-600 dark:text-zinc-400 hover:text-violet-500 dark:hover:text-violet-400 transition-colors"
              >
                Buy Tokens
              </Link>
              <a
                href="#"
                className="text-sm text-zinc-600 dark:text-zinc-400 hover:text-violet-500 dark:hover:text-violet-400 transition-colors"
              >
                Security
              </a>
            </div>
            <div className="flex flex-col gap-2">
              <p className="font-semibold text-zinc-900 dark:text-white">
                Resources
              </p>
              <a
                href="#"
                className="text-sm text-zinc-600 dark:text-zinc-400 hover:text-violet-500 dark:hover:text-violet-400 transition-colors"
              >
                Documentation
              </a>
              <a
                href="#"
                className="text-sm text-zinc-600 dark:text-zinc-400 hover:text-violet-500 dark:hover:text-violet-400 transition-colors"
              >
                API
              </a>
              <a
                href="#"
                className="text-sm text-zinc-600 dark:text-zinc-400 hover:text-violet-500 dark:hover:text-violet-400 transition-colors"
              >
                GitHub
              </a>
            </div>
            <div className="flex flex-col gap-2">
              <p className="font-semibold text-zinc-900 dark:text-white">
                Social
              </p>
              <a
                href="#"
                className="text-sm text-zinc-600 dark:text-zinc-400 hover:text-violet-500 dark:hover:text-violet-400 transition-colors"
              >
                Twitter
              </a>
              <a
                href="#"
                className="text-sm text-zinc-600 dark:text-zinc-400 hover:text-violet-500 dark:hover:text-violet-400 transition-colors"
              >
                Discord
              </a>
              <a
                href="#"
                className="text-sm text-zinc-600 dark:text-zinc-400 hover:text-violet-500 dark:hover:text-violet-400 transition-colors"
              >
                Telegram
              </a>
            </div>
          </div>
        </div>

        {/* Copyright with token symbol */}
        <div className="mt-12 text-center text-xs text-zinc-500 dark:text-zinc-500 flex items-center justify-center gap-2">
          © {new Date().getFullYear()} Groupy.Fun. All rights reserved.
          <span className="inline-block ml-1 text-xs px-1.5 py-0.5 bg-zinc-800/30 rounded-md">
            $TKN
          </span>
        </div>
      </div>

      {/* Enhanced token flow visual elements */}
      <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-violet-500/30 to-transparent"></div>
      <div className="absolute bottom-0 left-1/4 w-1 h-20 bg-gradient-to-t from-violet-500/20 to-transparent"></div>
      <div className="absolute bottom-0 right-1/4 w-1 h-30 bg-gradient-to-t from-violet-500/20 to-transparent"></div>

      {/* Animated dots */}
      <div className="absolute bottom-4 left-1/3 w-2 h-2 rounded-full bg-violet-500/30 animate-ping"></div>
      <div className="absolute bottom-8 right-1/3 w-2 h-2 rounded-full bg-violet-500/30 animate-ping animation-delay-500"></div>
    </footer>
  );
};
