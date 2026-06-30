import Shimmer from "./shimmer";

export function ResourceStateBoxShimmer() {
  return (
    <div className="rounded-lg border p-3 space-y-3">
      
      {/* Title */}
      <p className="text-xs font-medium text-muted-foreground">Resources Available</p>

      {/* Rows */}
      <div className="space-y-2">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div key={i} className="flex items-center justify-between">
            {/* Label (vary width for realism) */}
            <Shimmer
              className={`h-4 ${
                i % 2 === 0 ? "w-20" : "w-28"
              }`}
            />

            {/* Value */}
            <Shimmer className="h-4 w-8" />
          </div>
        ))}
      </div>
    </div>
  );
}