import { ChevronLeft, ChevronRight } from "lucide-react"
import { Button } from "@/components/ui/button"

export default function Paginator({
  totalItems = 0,
  currentPage = 1,
  itemsPerPage = 10,
  onPageChange,
  label = "Items",
}) {
  if (totalItems === 0) return null

  const totalPages = Math.ceil(totalItems / itemsPerPage)

  const start = Math.min(totalItems, (currentPage - 1) * itemsPerPage + 1)
  const end = Math.min(totalItems, currentPage * itemsPerPage)

  const pages = Array.from({ length: totalPages }, (_, i) => i + 1).slice(
    Math.max(0, currentPage - 3),
    Math.min(totalPages, currentPage + 2)
  )

  return (
    <div className="px-6 py-4 border-t border-border flex items-center justify-between flex-wrap gap-3">

      {/* Info */}
      <p className="text-sm text-muted-foreground font-medium">
        Showing{" "}
        <span className="text-primary font-bold">
          {start}-{end}
        </span>{" "}
        of{" "}
        <span className="text-primary font-bold">
          {totalItems}
        </span>{" "}
        {label}
      </p>

      {/* Controls */}
      <div className="flex items-center gap-1">

        {/* Prev */}
        <Button
          variant="outline"
          size="icon"
          className="h-9 w-9 rounded-lg"
          disabled={currentPage === 1}
          onClick={() => onPageChange(currentPage - 1)}
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>

        {/* Pages */}
        {pages.map((page) => (
          <Button
            key={page}
            variant={currentPage === page ? "default" : "outline"}
            className="h-9 w-9 rounded-lg text-xs font-semibold"
            onClick={() => onPageChange(page)}
          >
            {page}
          </Button>
        ))}

        {/* Next */}
        <Button
          variant="outline"
          size="icon"
          className="h-9 w-9 rounded-lg"
          disabled={currentPage === totalPages}
          onClick={() => onPageChange(currentPage + 1)}
        >
          <ChevronRight className="h-4 w-4" />
        </Button>

      </div>
    </div>
  )
}