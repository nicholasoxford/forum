"use client";

import { useEffect } from "react";
import { HeroSection } from "@/components/landing/hero-section";
import { PopularChatsSection } from "@/components/landing/popular-chats-section";
import { HowItWorksSection } from "@/components/landing/how-it-works-section";
import { Footer } from "@/components/landing/footer";

export default function Home() {
  // Flow line logic - kept for now
  useEffect(() => {
    if (typeof window !== "undefined") {
      const flowLinesCount = 5;
      const container = document.querySelector("main");
      document.querySelectorAll(".flow-line").forEach((el) => el.remove());
      if (container) {
        for (let i = 0; i < flowLinesCount; i++) {
          const line = document.createElement("div");
          line.className = "flow-line";
          line.style.width = "100%";
          line.style.top = `${15 + i * 20}%`;
          line.style.animationDelay = `${i * 0.7}s`;
          container.appendChild(line);
        }
      }
    }
  }, []);

  return (
    <main className="after:orb token-flow-bg flex flex-col items-center text-zinc-800 dark:text-zinc-200 min-h-screen bg-black">
      {/* Use the imported HeroSection component */}
      <HeroSection />

      {/* Flow connector */}
      <div className="flow-connector relative">
        <div className="absolute top-1/2 left-1/2 w-3 h-3 rounded-full bg-violet-500/50 -translate-x-1/2 -translate-y-1/2 animate-ping"></div>
      </div>

      {/* Use the imported PopularChatsSection component */}
      <PopularChatsSection />

      {/* Flow connector */}
      <div className="flow-connector relative">
        <div className="absolute top-1/2 left-1/2 w-3 h-3 rounded-full bg-violet-500/50 -translate-x-1/2 -translate-y-1/2 animate-ping"></div>
      </div>

      {/* Use the imported HowItWorksSection component */}
      <HowItWorksSection />

      {/* Flow connector */}
      <div className="flow-connector relative">
        <div className="absolute top-1/2 left-1/2 w-3 h-3 rounded-full bg-violet-500/50 -translate-x-1/2 -translate-y-1/2 animate-ping"></div>
      </div>

      {/* Use the imported Footer component */}
      <Footer />
    </main>
  );
}
