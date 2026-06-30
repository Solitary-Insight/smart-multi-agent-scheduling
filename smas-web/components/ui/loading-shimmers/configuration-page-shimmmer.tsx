import Shimmer from "./shimmer";

export default function AdminConfigurationsShimmer() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-col gap-2">
          <Shimmer className="h-8 w-48 rounded" />
          <Shimmer className="h-4 w-64 rounded opacity-60" />
        </div>
        <Shimmer className="h-10 w-36 rounded-md" />
      </div>

      {/* Grid of Cards */}
      <div className="grid gap-6 lg:grid-cols-2">
        {Array.from({ length: 5 }).map((_, idx) => (
          <div
            key={idx}
            className="rounded-lg border border-border p-4 space-y-4 animate-pulse"
          >
            <div className="flex items-center gap-2">
              <Shimmer className="h-5 w-32 rounded" />
              <Shimmer className="h-4 w-12 rounded-full" />
            </div>
            <Shimmer className="h-3 w-48 rounded opacity-60" />
            <div className="grid gap-4 sm:grid-cols-2">
              <Shimmer className="h-8 w-full rounded" />
              <Shimmer className="h-8 w-full rounded" />
            </div>
            <div className="flex gap-2 mt-2">
              <Shimmer className="h-8 w-20 rounded-full" />
              <Shimmer className="h-8 w-20 rounded-full" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}