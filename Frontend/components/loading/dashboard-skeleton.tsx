import { Container } from "@/components/layout/container";
import { SkeletonBlock } from "@/components/loading/skeleton-block";

export function DashboardSkeleton() {
  return (
    <Container
      className="animate-in fade-in space-y-8 py-10 duration-300"
      aria-busy="true"
      aria-live="polite"
    >
      <div className="space-y-3">
        <SkeletonBlock className="h-9 w-56" />
        <SkeletonBlock className="h-5 w-80 max-w-full" />
        <p className="text-muted-foreground text-sm">Loading your saved trips…</p>
      </div>
      <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
        {Array.from({ length: 6 }).map((_, index) => (
          <SkeletonBlock key={index} className="h-56" />
        ))}
      </div>
    </Container>
  );
}
