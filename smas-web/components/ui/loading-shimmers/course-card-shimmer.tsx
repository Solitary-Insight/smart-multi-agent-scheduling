import Shimmer from "./shimmer" // Your base shimmer component

export default function CourseCardShimmer() {
  return (
    <div className="flex flex-col gap-3 rounded-lg border border-border p-4 sm:flex-row sm:items-center">
      <div className="h-12 w-1 rounded-full bg-muted animate-pulse hidden sm:block" />
      <div className="flex-1 space-y-2">
        <div className="flex items-center gap-2">
          <Shimmer className="h-4 w-48 rounded" />
          <Shimmer className="h-4 w-12 rounded-full" />
        </div>
        <Shimmer className="h-3 w-64 rounded opacity-60" />
        <div className="flex gap-1.5 pt-1">
          <Shimmer className="h-4 w-16 rounded-full" />
          <Shimmer className="h-4 w-16 rounded-full" />
        </div>
      </div>
      <div className="shrink-0">
        <Shimmer className="h-8 w-24 rounded-md" />
      </div>
    </div>
  )
}