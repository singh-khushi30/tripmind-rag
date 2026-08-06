import Link from "next/link";

import { HeaderNav } from "@/components/layout/header-nav";
import { createClient } from "@/lib/supabase/server";

export async function Header() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const displayName =
    (user?.user_metadata?.full_name as string | undefined) ?? null;

  return (
    <header className="border-border/70 bg-background/75 sticky top-0 z-50 border-b backdrop-blur-xl">
      <div className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between px-4 sm:px-6">
        <Link href="/" className="group flex items-center gap-2.5">
          <span className="bg-brand text-brand-foreground flex size-8 items-center justify-center rounded-xl text-xs font-semibold tracking-tight shadow-[var(--shadow-soft)]">
            TM
          </span>
          <span className="font-heading text-foreground text-xl tracking-tight">
            TripMind
          </span>
        </Link>

        <HeaderNav
          user={
            user
              ? {
                  email: user.email ?? "Account",
                  displayName,
                }
              : null
          }
        />
      </div>
    </header>
  );
}
