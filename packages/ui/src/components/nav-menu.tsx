"use client";

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
          <NavigationMenuLink asChild>
            <Link
              href="/chats"
              className={cn(navigationMenuTriggerStyle(), "text-white")}
            >
              Chats
            </Link>
          </NavigationMenuLink>
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

        <NavigationMenuItem>
          <NavigationMenuLink asChild>
            <Link
              href="/claim-royalties"
              className={cn(navigationMenuTriggerStyle(), "text-white")}
            >
              Claim Royalties
            </Link>
          </NavigationMenuLink>
        </NavigationMenuItem>
      </NavigationMenuList>
    </NavigationMenu>
  );
}
