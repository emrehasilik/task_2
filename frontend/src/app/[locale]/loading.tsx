export default function Loading() {
  return (
    <div className="page-shell py-16" aria-busy="true" aria-label="Loading">
      <div className="h-4 w-28 animate-pulse rounded-full bg-sage" />
      <div className="mt-5 h-14 max-w-xl animate-pulse rounded-2xl bg-sage/70" />
      <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 8 }).map((_, index) => (
          <div key={index} className="overflow-hidden rounded-3xl border border-line bg-surface">
            <div className="aspect-[4/3] animate-pulse bg-sage/70" />
            <div className="space-y-3 p-5">
              <div className="h-4 w-20 animate-pulse rounded bg-sage" />
              <div className="h-6 w-3/4 animate-pulse rounded bg-sage" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
