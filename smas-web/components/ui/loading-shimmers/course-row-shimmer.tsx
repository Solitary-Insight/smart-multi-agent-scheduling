import React from "react"
import { TableCell, TableRow } from "@/components/ui/table"
import Shimmer from "./shimmer"

export default function CourseRowShimmer() {
  return (
    <TableRow className="hover:bg-transparent">
      {/* Course Code */}
      <TableCell>
        <Shimmer className="h-5 w-16 rounded-md" />
      </TableCell>

      {/* Course Name */}
      <TableCell>
        <Shimmer className="h-5 w-40" />
      </TableCell>

      {/* Department Badge */}
      <TableCell className="hidden md:table-cell">
        <Shimmer className="h-5 w-14 rounded-md" />
      </TableCell>

      {/* Teacher Name */}
      <TableCell className="hidden sm:table-cell">
        <Shimmer className="h-4 w-32" />
      </TableCell>

      {/* Semester */}
      <TableCell className="hidden lg:table-cell">
        <Shimmer className="h-4 w-20" />
      </TableCell>

      {/* Credits */}
      <TableCell className="hidden lg:table-cell">
        <Shimmer className="h-4 w-10" />
      </TableCell>

      {/* Prerequisites Badges */}
      <TableCell className="hidden xl:table-cell">
        <div className="flex flex-wrap gap-1">
          <Shimmer className="h-5 w-12 rounded-md" />
          <Shimmer className="h-5 w-12 rounded-md" />
          <Shimmer className="h-5 w-12 rounded-md" />
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