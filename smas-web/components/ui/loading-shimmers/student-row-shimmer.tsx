import React from 'react'
import { TableCell, TableRow } from '@/components/ui/table' // Adjust path as needed
import Shimmer from './shimmer'


export default function StudentRowShimmer() {
  return (
    <TableRow className="hover:bg-transparent">
      {/* Name Column */}
      <TableCell>
        <Shimmer className="h-5 w-32" />
      </TableCell>

      {/* Email Column - hidden on mobile */}
      <TableCell className="hidden sm:table-cell">
        <Shimmer className="h-4 w-40" />
      </TableCell>

      {/* Department Badge Column */}
      <TableCell>
        <Shimmer className="h-6 w-20 rounded-full" />
      </TableCell>

      {/* Semester Column - hidden on md */}
      <TableCell className="hidden md:table-cell">
        <Shimmer className="h-4 w-12" />
      </TableCell>

      {/* Enrolled Courses Column - hidden on lg */}
      <TableCell className="hidden lg:table-cell">
        <div className="flex gap-1">
          <Shimmer className="h-5 w-14" />
          <Shimmer className="h-5 w-14" />
        </div>
      </TableCell>

      {/* Completed Courses Column - hidden on lg */}
      <TableCell className="hidden lg:table-cell">
        <Shimmer className="h-4 w-24" />
      </TableCell>

      {/* Actions Column */}
      <TableCell className="text-right">
        <div className="flex justify-end gap-1">
          <Shimmer className="h-8 w-8 rounded-md" />
          <Shimmer className="h-8 w-8 rounded-md" />
          <Shimmer className="h-8 w-8 rounded-md" />
        </div>
      </TableCell>
    </TableRow>
  )
}