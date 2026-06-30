import React from 'react'
import { TableCell, TableRow } from '@/components/ui/table'
import Shimmer from './shimmer' // Ensure this points to your base shimmer component

export default function MergeRowShimmer() {
  return (
    <TableRow className="hover:bg-transparent">
      {/* Merged Group Title Column */}
      <TableCell>
        <Shimmer className="h-5 w-48 rounded-md" />
      </TableCell>

      {/* Teacher Name Column */}
      <TableCell>
        <Shimmer className="h-5 w-32 rounded-md" />
      </TableCell>

      {/* Combined Course Badges Column */}
      <TableCell>
        <div className="flex flex-wrap gap-2">
          <Shimmer className="h-6 w-16 rounded-full" />
          <Shimmer className="h-6 w-16 rounded-full" />
          <Shimmer className="h-6 w-16 rounded-full" />
        </div>
      </TableCell>

      {/* Actions Column */}
      <TableCell className="text-right">
        <div className="flex justify-end gap-2">
          <Shimmer className="h-8 w-8 rounded-md" />
        </div>
      </TableCell>
    </TableRow>
  )
}