import React from "react"
import { TableCell, TableRow } from "@/components/ui/table"
import Shimmer from "./shimmer"

export default function ClassroomRowShimmer() {
  return (
    <TableRow className="hover:bg-transparent">

      {/* Classroom Name */}
      <TableCell>
        <Shimmer className="h-5 w-24 rounded-md" />
      </TableCell>

      {/* Building */}
      <TableCell>
        <Shimmer className="h-4 w-28" />
      </TableCell>

      {/* Type Badge */}
      <TableCell>
        <Shimmer className="h-5 w-16 rounded-md" />
      </TableCell>

      {/* Capacity */}
      <TableCell className="hidden sm:table-cell">
        <Shimmer className="h-4 w-10" />
      </TableCell>

      {/* Equipments */}
      <TableCell className="hidden md:table-cell">
        <div className="flex flex-wrap gap-1">
          <Shimmer className="h-5 w-14 rounded-md" />
          <Shimmer className="h-5 w-14 rounded-md" />
          <Shimmer className="h-5 w-14 rounded-md" />
        </div>
      </TableCell>

      {/* Actions */}
      <TableCell className="text-right">
        <div className="flex justify-end gap-1">
          <Shimmer className="h-8 w-8 rounded-md" />
          <Shimmer className="h-8 w-8 rounded-md" />
        </div>
      </TableCell>

    </TableRow>
  )
}