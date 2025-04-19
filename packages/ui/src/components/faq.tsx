import { FC } from "react";
import { motion } from "framer-motion";

export const FAQ: FC = () => (
  <motion.section
    initial={{ opacity: 0, y: 20 }}
    whileInView={{ opacity: 1, y: 0 }}
    viewport={{ once: true }}
    transition={{ duration: 0.5 }}
    className="max-w-3xl flex flex-col gap-6"
  >
    <h2 className="text-3xl font-semibold text-center">FAQ</h2>
    <ul className="flex flex-col gap-4">
      <li>
        <strong>Where do the rewards come from?</strong> Each token swap
        triggers the SPL‑22 Transfer Fee extension; collected fees accumulate in
        a fee vault until Vertigo distributes them hourly.
      </li>
      <li>
        <strong>Can I leave at any time?</strong> Absolutely. Sell your tokens
        and the site will automatically revoke chat access.
      </li>
      <li>
        <strong>Is the contract audited?</strong> Yes, by two independent Solana
        auditors. Reports will be published before launch.
      </li>
    </ul>
  </motion.section>
);
