import { FC } from "react";
import { motion } from "framer-motion";
import { Card, CardContent } from "./card";

export const StatsBar: FC = () => (
  <motion.section
    initial={{ opacity: 0, scale: 0.95 }}
    whileInView={{ opacity: 1, scale: 1 }}
    viewport={{ once: true }}
    transition={{ duration: 0.5 }}
    className="grid grid-cols-2 md:grid-cols-4 gap-4 w-full max-w-5xl"
  >
    {["Holders", "Hourly Yield", "24h Volume", "Fees Distributed"].map(
      (label, index) => (
        <motion.div
          key={label}
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: index * 0.1 }}
        >
          <Card className="rounded-2xl shadow">
            <CardContent className="p-6 flex flex-col items-center">
              <span className="text-2xl font-bold">––</span>
              <span className="text-sm text-muted-foreground mt-1">
                {label}
              </span>
            </CardContent>
          </Card>
        </motion.div>
      )
    )}
  </motion.section>
);
