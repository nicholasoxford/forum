import { FC } from "react";
import { motion } from "framer-motion";

interface FooterProps {
  companyName?: string;
}

export const Footer: FC<FooterProps> = ({ companyName = "YourToken" }) => (
  <motion.footer
    initial={{ opacity: 0 }}
    whileInView={{ opacity: 1 }}
    viewport={{ once: true }}
    transition={{ duration: 0.5 }}
    className="py-12 text-sm text-muted-foreground"
  >
    © {new Date().getFullYear()} {companyName}. All rights reserved.
  </motion.footer>
);
