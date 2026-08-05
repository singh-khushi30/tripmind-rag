import { Container } from "@/components/layout/container";
import { SkeletonBlock } from "@/components/loading/skeleton-block";

export function TripResultsSkeleton() {
  return (
    <Container className="space-y-8 py-10">
      <div className="space-y-3">
        <SkeletonBlock className="h-4 w-28" />
        <SkeletonBlock className="h-10 w-72 max-w-full" />
        <SkeletonBlock className="h-5 w-full max-w-xl" />
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <SkeletonBlock className="h-40" />
        <SkeletonBlock className="h-40" />
      </div>

      <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_340px]">
        <div className="space-y-4">
          {Array.from({ length: 4 }).map((_, index) => (
            <SkeletonBlock key={index} className="h-36" />
          ))}
        </div>
        <div className="space-y-4">
          <SkeletonBlock className="h-64" />
          <SkeletonBlock className="h-48" />
          <SkeletonBlock className="h-40" />
        </div>
      </div>
    </Container>
  );
}
