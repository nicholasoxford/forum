import { FC, useMemo } from "react";
import { motion } from "framer-motion";
import { Card, CardContent } from "./card";
import { Button } from "./button";
import { WalletButton } from "./wallet-connect/index";

interface AccessCardProps {
  connected: boolean;
  hasToken: boolean;
  loading: boolean;
  minRequiredBalance?: number;
  tgBotUsername?: string;
}

export const AccessCard: FC<AccessCardProps> = ({
  connected,
  hasToken,
  loading,
  minRequiredBalance = 100,
  tgBotUsername = "MyTokenAirdropBot",
}) => {
  // Memoize tgLink to avoid re-generating on every render
  const tgLink = useMemo(
    () => `https://t.me/${tgBotUsername}?start=${btoa("verify-" + Date.now())}`,
    [tgBotUsername]
  );

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5 }}
    >
      <Card className="rounded-2xl max-w-lg w-full shadow-xl">
        <CardContent className="p-8 flex flex-col items-center gap-4 text-center">
          {!connected && <WalletButton />}
          {connected &&
            (loading ? (
              <p className="text-sm text-muted-foreground">Checking balance…</p>
            ) : hasToken ? (
              <a href={tgLink} target="_blank" rel="noopener noreferrer">
                <Button className="px-8 py-4 text-lg rounded-2xl">
                  Join Private Telegram
                </Button>
              </a>
            ) : (
              <p className="text-sm text-destructive leading-relaxed">
                You need at least {minRequiredBalance} tokens to access the
                chat.
              </p>
            ))}
        </CardContent>
      </Card>
    </motion.div>
  );
};
