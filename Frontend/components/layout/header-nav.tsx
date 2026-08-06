"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, X } from "lucide-react";
import { useState } from "react";

import { ProfileMenu } from "@/components/auth/profile-menu";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const NAV = [
  { href: "/trip/plan", label: "Plan" },
  { href: "/trip/results", label: "Demo" },
  { href: "/saved-trips", label: "Saved" },
];

type HeaderNavProps = {
  user: {
    email: string;
    displayName?: string | null;
  } | null;
};

export function HeaderNav({ user }: HeaderNavProps) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  return (
    <>
      <nav className="hidden items-center gap-1 md:flex">
        {NAV.map((item) => {
          const active =
            pathname === item.href || pathname.startsWith(`${item.href}/`);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "rounded-full px-3.5 py-1.5 text-sm transition-colors",
                active
                  ? "bg-secondary text-foreground"
                  : "text-muted-foreground hover:text-foreground hover:bg-secondary/70",
              )}
            >
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="hidden items-center gap-2 md:flex">
        {user ? (
          <>
            <Button variant="ghost" render={<Link href="/dashboard" />}>
              Dashboard
            </Button>
            <ProfileMenu email={user.email} displayName={user.displayName} />
          </>
        ) : (
          <>
            <Button variant="ghost" render={<Link href="/login" />}>
              Login
            </Button>
            <Button render={<Link href="/signup" />}>Sign Up</Button>
          </>
        )}
      </div>

      <Button
        variant="ghost"
        size="icon"
        className="md:hidden"
        onClick={() => setOpen((value) => !value)}
        aria-label="Toggle menu"
        aria-expanded={open}
      >
        {open ? <X /> : <Menu />}
      </Button>

      {open ? (
        <div className="border-border/70 bg-background/95 fixed inset-x-0 top-16 z-50 border-t backdrop-blur-xl md:hidden">
          <div className="mx-auto flex max-w-6xl flex-col gap-1 px-4 py-3 sm:px-6">
            {NAV.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setOpen(false)}
                className="text-foreground hover:bg-secondary rounded-xl px-3 py-2.5 text-sm"
              >
                {item.label}
              </Link>
            ))}

            <div className="mt-2 flex flex-col gap-2 border-t pt-3">
              {user ? (
                <>
                  <Button
                    variant="outline"
                    render={<Link href="/dashboard" />}
                    onClick={() => setOpen(false)}
                  >
                    Dashboard
                  </Button>
                  <div onClick={() => setOpen(false)}>
                    <ProfileMenu
                      email={user.email}
                      displayName={user.displayName}
                    />
                  </div>
                </>
              ) : (
                <>
                  <Button
                    variant="outline"
                    render={<Link href="/login" />}
                    onClick={() => setOpen(false)}
                  >
                    Login
                  </Button>
                  <Button
                    render={<Link href="/signup" />}
                    onClick={() => setOpen(false)}
                  >
                    Sign Up
                  </Button>
                </>
              )}
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
