"use client";

import { useState } from "react";
import { useWallet } from "@jup-ag/wallet-adapter";
import Link from "next/link";
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
  navigationMenuTriggerStyle,
} from "./navigation-menu";
import { cn } from "@workspace/ui/lib/utils";

interface NavMenuProps {
  className?: string;
}

export function NavMenu({ className }: NavMenuProps) {
  const { connected, connecting, disconnect, publicKey } = useWallet();

  // Format the public key for display
  const formatPublicKey = (key: any) => {
    if (!key) return "";
    const keyString = key.toString();
    return `${keyString.slice(0, 4)}...${keyString.slice(-4)}`;
  };

  const handleDisconnect = async () => {
    if (connected) {
      await disconnect();
    }
  };

  return (
    <NavigationMenu className={cn("z-50", className)}>
      <NavigationMenuList className="gap-2">
        <NavigationMenuItem>
          <NavigationMenuLink asChild>
            <Link
              href="/"
              className={cn(navigationMenuTriggerStyle(), "text-white")}
            >
              Home
            </Link>
          </NavigationMenuLink>
        </NavigationMenuItem>

        <NavigationMenuItem>
          <NavigationMenuTrigger className="text-white">
            Communities
          </NavigationMenuTrigger>
          <NavigationMenuContent>
            <div className="w-[220px] p-2 bg-zinc-900 rounded-lg">
              <NavigationMenuLink asChild>
                <Link
                  href="/communities"
                  className="text-white hover:bg-zinc-800 focus:bg-zinc-800 rounded-md p-2 w-full block"
                >
                  Browse Communities
                </Link>
              </NavigationMenuLink>
              <NavigationMenuLink asChild>
                <Link
                  href="/communities/popular"
                  className="text-white hover:bg-zinc-800 focus:bg-zinc-800 rounded-md p-2 w-full block"
                >
                  Popular
                </Link>
              </NavigationMenuLink>
              <NavigationMenuLink asChild>
                <Link
                  href="/communities/new"
                  className="text-white hover:bg-zinc-800 focus:bg-zinc-800 rounded-md p-2 w-full block"
                >
                  New Launches
                </Link>
              </NavigationMenuLink>
            </div>
          </NavigationMenuContent>
        </NavigationMenuItem>

        <NavigationMenuItem>
          <NavigationMenuLink asChild>
            <Link
              href="/launch"
              className={cn(navigationMenuTriggerStyle(), "text-white")}
            >
              Create Token
            </Link>
          </NavigationMenuLink>
        </NavigationMenuItem>

        {connected && (
          <NavigationMenuItem>
            <NavigationMenuTrigger className="text-white">
              <span className="flex items-center">
                <span className="size-2 rounded-full bg-green-500 mr-2"></span>
                {formatPublicKey(publicKey)}
              </span>
            </NavigationMenuTrigger>
            <NavigationMenuContent>
              <div className="w-[220px] p-2 bg-zinc-900 rounded-lg">
                <NavigationMenuLink asChild>
                  <Link
                    href="/profile"
                    className="text-white hover:bg-zinc-800 focus:bg-zinc-800 rounded-md p-2 w-full block"
                  >
                    My Profile
                  </Link>
                </NavigationMenuLink>
                <NavigationMenuLink asChild>
                  <Link
                    href="/portfolio"
                    className="text-white hover:bg-zinc-800 focus:bg-zinc-800 rounded-md p-2 w-full block"
                  >
                    My Portfolio
                  </Link>
                </NavigationMenuLink>
                <div className="h-px w-full bg-zinc-800 my-1"></div>
                <button
                  onClick={handleDisconnect}
                  className="text-red-400 hover:text-red-300 hover:bg-zinc-800/60 focus:bg-zinc-800/60 rounded-md p-2 w-full text-left text-sm"
                >
                  Disconnect Wallet
                </button>
              </div>
            </NavigationMenuContent>
          </NavigationMenuItem>
        )}
      </NavigationMenuList>
    </NavigationMenu>
  );
}
