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
      </NavigationMenuList>
    </NavigationMenu>
  );
}
