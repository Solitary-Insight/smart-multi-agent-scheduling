"use client"

import React from 'react'
import { TableCell, TableRow } from '@/components/ui/table'
import Shimmer from './shimmer'

export default function AdminRowShimmer() {
  return (
    <TableRow className="hover:bg-transparent border-b border-white/5">
      {/* Identification (Name) Column */}
      <td className="px-8 py-6">
        <div className="space-y-2">
          {/* Main Name Shimmer */}
          <Shimmer className="h-5 w-40 bg-white/10" />
        </div>
      </td>

      {/* Email Address Column */}
      <td className="px-8 py-6">
        {/* Email Shimmer - slightly thinner and more transparent */}
        <Shimmer className="h-4 w-52 bg-white/5" />
      </td>

      {/* Actions Column (Right Aligned) */}
      <td className="px-8 py-6 text-right">
        <div className="flex justify-end gap-1 items-center">
          {/* The Action Dropdown Button Shimmer */}
          <Shimmer className="h-9 w-9 rounded-lg bg-white/10" />
          <Shimmer className="h-9 w-9 rounded-lg bg-white/10" />
          <Shimmer className="h-9 w-9 rounded-lg bg-white/10" />
        </div>
      </td>
    </TableRow>
  )
}