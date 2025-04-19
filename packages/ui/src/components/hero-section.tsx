import { FC } from "react";
import { motion } from "framer-motion";
import { WalletButton } from "./wallet-connect/index";

export const HeroSection: FC = () => (
  <section className="flex flex-col items-center text-center gap-6 max-w-3xl">
    <motion.h1
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
      className="text-5xl md:text-6xl font-extrabold tracking-tight"
    >
      Earn <span className="text-primary">while you chat</span>.
    </motion.h1>
    <motion.p
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay: 0.2 }}
      className="text-lg md:text-xl text-muted-foreground"
    >
      Hold our token, join the private Telegram, and receive fee rewards every
      hour—just for being part of the conversation.
    </motion.p>
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay: 0.4 }}
    >
      <WalletButton className="mt-4" />
    </motion.div>
  </section>
);
