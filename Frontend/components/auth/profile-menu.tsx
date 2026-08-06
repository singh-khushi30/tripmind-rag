"use client";

import Link from "next/link";
import { LayoutDashboard, LogOut, UserRound } from "lucide-react";

import { logoutAction } from "@/app/auth/actions";
import { Button, buttonVariants } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

type ProfileMenuProps = {
  email: string;
  displayName?: string | null;
};

export function ProfileMenu({ email, displayName }: ProfileMenuProps) {
  const label = displayName?.trim() || email;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        className={cn(
          buttonVariants({ variant: "outline" }),
          "max-w-[220px] gap-2",
        )}
      >
        <UserRound className="size-4 shrink-0" />
        <span className="truncate">{label}</span>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="min-w-56">
        <div className="text-muted-foreground px-2 py-1.5 text-xs">
          Signed in as
          <p className="text-foreground mt-0.5 truncate text-sm font-medium">
            {email}
          </p>
        </div>
        <DropdownMenuSeparator />
        <DropdownMenuItem render={<Link href="/dashboard" />}>
          <LayoutDashboard />
          Dashboard
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <form action={logoutAction}>
          <Button
            type="submit"
            variant="ghost"
            className="text-destructive hover:bg-destructive/10 hover:text-destructive h-8 w-full justify-start px-1.5"
          >
            <LogOut data-icon="inline-start" />
            Log out
          </Button>
        </form>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
