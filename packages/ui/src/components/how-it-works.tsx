import { FC } from "react";
import { motion } from "framer-motion";
import { Card, CardContent } from "./card";

export const HowItWorks: FC = () => (
  <section className="flex flex-col gap-8 max-w-4xl">
    <motion.h2
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5 }}
      className="text-3xl font-semibold text-center"
    >
      How It Works
    </motion.h2>
    <div className="grid md:grid-cols-3 gap-6">
      {[
        {
          title: "Buy the Token",
          desc: "Acquire ≥100 tokens on any DEX supporting SPL‑22 to qualify.",
        },
        {
          title: "Join the Chat",
          desc: "Connect your wallet & receive a Telegram invite link instantly.",
        },
        {
          title: "Earn Hourly Rewards",
          desc: "Transfer fees accrue with every swap; we airdrop them to holders hourly via Vertigo.",
        },
      ].map(({ title, desc }, index) => (
        <motion.div
          key={title}
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: index * 0.2 }}
        >
          <Card className="rounded-2xl shadow shadow-muted">
            <CardContent className="p-6 flex flex-col gap-3">
              <h3 className="text-xl font-medium">{title}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                {desc}
              </p>
            </CardContent>
          </Card>
        </motion.div>
      ))}
    </div>
  </section>
);
