import React from "react"
import { TableCell, TableRow } from "@/components/ui/table"
import Shimmer from "./shimmer"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"

export default function DepartmentRowShimmer() {
  return (
    <TableRow className="hover:bg-transparent">
      {/* Department Name */}
      <TableCell>
        <Shimmer className="h-5 w-32 rounded-md" />
      </TableCell>

      {/* Department Code */}
      <TableCell>
        <Shimmer className="h-5 w-14 rounded-md" />
      </TableCell>

      {/* Head of Department */}
      <TableCell>
        <Shimmer className="h-5 w-24 rounded-md" />
      </TableCell>

      {/* Teachers Count */}
      <TableCell className="text-center">
        <Shimmer className="h-5 w-10 rounded-md mx-auto" />
      </TableCell>

      {/* Courses Count */}
      <TableCell className="text-center">
        <Shimmer className="h-5 w-10 rounded-md mx-auto" />
      </TableCell>

      {/* Students Count */}
      <TableCell className="text-center">
        <Shimmer className="h-5 w-10 rounded-md mx-auto" />
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