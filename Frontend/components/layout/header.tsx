import Link from "next/link";

export function Header() {
  return (
    <header className="border-border bg-background/95 supports-backdrop-filter:bg-background/80 sticky top-0 z-50 border-b backdrop-blur">
      <div className="mx-auto flex h-14 w-full max-w-6xl items-center px-4 sm:px-6">
        <Link
          href="/"
          className="text-foreground text-sm font-semibold tracking-tight"
        >
          TripMind
        </Link>
      </div>
    </header>
  );
}
