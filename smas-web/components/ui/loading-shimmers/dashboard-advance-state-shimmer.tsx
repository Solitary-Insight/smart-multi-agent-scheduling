import Shimmer from "./shimmer";

export function AdvanceStatRow({ label, value, isLoading }) {
    return (
      <div className="flex items-center justify-between">
        <span className="text-sm text-muted-foreground">{label}</span>
        {isLoading ? (
          <Shimmer className="h-4 w-10" />
        ) : (
          <span className="text-sm font-medium text-foreground">
            {value}
          </span>
        )}
      </div>
    )
  }