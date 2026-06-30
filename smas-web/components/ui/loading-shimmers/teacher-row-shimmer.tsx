import React from 'react'
import { TableCell, TableRow } from '@/components/ui/table'
import Shimmer from './shimmer'

export default function TeacherRowShimmer() {
  return (
    <TableRow className="hover:bg-transparent">
      {/* Name Column */}
      <TableCell>
        <Shimmer className="h-5 w-32" />
      </TableCell>

      {/* Email Column - hidden on mobile */}
      <TableCell className="hidden sm:table-cell">
        <Shimmer className="h-4 w-44" />
      </TableCell>

      {/* Department Badges Column - mapping multiple small badges */}
      <TableCell>
        <div className="flex flex-wrap gap-1">
          <Shimmer className="h-5 w-10 rounded-md" />
          <Shimmer className="h-5 w-10 rounded-md" />
        </div>
      </TableCell>

      {/* Priority Days Badges - hidden on md */}
      <TableCell className="hidden md:table-cell">
        <div className="flex flex-wrap gap-1">
          <Shimmer className="h-5 w-12 rounded-md" />
          <Shimmer className="h-5 w-12 rounded-md" />
          <Shimmer className="h-5 w-12 rounded-md" />
        </div>
      </TableCell>

      {/* Class Count Column - hidden on lg */}
      <TableCell className="hidden lg:table-cell">
        <Shimmer className="h-4 w-8" />
      </TableCell>

      {/* Actions Column */}
      <TableCell className="text-right">
        <div className="flex justify-end gap-1">
          {/* Edit Button Shimmer */}
          <Shimmer className="h-8 w-8 rounded-md" />
          {/* Delete Button Shimmer */}
          <Shimmer className="h-8 w-8 rounded-md" />
          <Shimmer className="h-8 w-8 rounded-md" />
        </div>
      </TableCell>
    </TableRow>
  )
}