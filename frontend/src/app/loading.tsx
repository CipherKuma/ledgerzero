import { Skeleton } from "@/components/ui/skeleton";

export default function AppLoading() {
  return (
    <section className="lz-section">
      <div className="lz-container grid gap-6">
        <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_320px] lg:items-start">
          <div className="grid gap-4">
            <Skeleton className="h-4 w-28" />
            <Skeleton className="h-12 w-3/4" />
            <Skeleton className="h-20 w-full" />
          </div>
          <Skeleton className="aspect-[5/6] w-full rounded-xl" />
        </div>
        <div className="grid gap-4 md:grid-cols-3">
          {Array.from({ length: 3 }).map((_, index) => (
            <Skeleton key={index} className="h-20 w-full rounded-xl" />
          ))}
        </div>
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 3 }).map((_, index) => (
            <div key={index} className="overflow-hidden rounded-xl border bg-card/55">
              <Skeleton className="aspect-[4/3] w-full" />
              <div className="grid gap-3 p-4">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-6 w-2/3" />
                <Skeleton className="h-12 w-full" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
