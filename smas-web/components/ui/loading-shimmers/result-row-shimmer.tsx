import React from 'react'
import { TableCell, TableRow } from '@/components/ui/table'
import { Checkbox } from '@/components/ui/checkbox'
import Shimmer from './shimmer' // Adjust this path to your Shimmer/Skeleton base

export default function ResultRowShimmer() {
  return (
    <TableRow className="hover:bg-transparent">
      {/* Checkbox Column */}
      <TableCell>
        <div className="h-4 w-4 rounded border border-muted flex items-center justify-center">
             <Shimmer className="h-full w-full rounded" />
        </div>
      </TableCell>

      {/* Name and Email Column */}
      <TableCell>
        <div className="flex flex-col gap-1.5">
          <Shimmer className="h-4 w-32 rounded" />
          <Shimmer className="h-3 w-44 rounded" />
        </div>
      </TableCell>

      {/* Dept and Semester Stack Column */}
      <TableCell>
        <div className="flex flex-col gap-2">
          <Shimmer className="h-5 w-16 rounded-md" />
          <Shimmer className="h-5 w-14 rounded-md" />
        </div>
      </TableCell>

      {/* Course Badges Column */}
      <TableCell>
        <div className="flex flex-wrap gap-1.5 max-w-[300px]">
          <Shimmer className="h-5 w-16 rounded-md" />
          <Shimmer className="h-5 w-12 rounded-md" />
          <Shimmer className="h-5 w-20 rounded-md" />
          <Shimmer className="h-5 w-14 rounded-md" />
        </div>
      </TableCell>

      {/* Action Buttons Column */}
      <TableCell className="text-right">
        <div className="flex justify-end gap-2">
          <Shimmer className="h-8 w-8 rounded-md" />
          <Shimmer className="h-8 w-8 rounded-md" />
        </div>
      </TableCell>
    </TableRow>
  )
}