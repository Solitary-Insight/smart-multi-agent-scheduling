import React from "react";
import { TableCell, TableRow } from "@/components/ui/table"; // adjust path if needed
import Shimmer from "./shimmer"; // your shimmer component
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export default function BreakRowShimmer({ days = [], departments = [] }) {
  return (
    <TableRow className="hover:bg-transparent">
      {/* Break Label & Time */}
      <TableCell>
        <div className="flex flex-col gap-1">
          <Shimmer className="h-5 w-24" /> {/* Break label */}
          <Shimmer className="h-4 w-32" /> {/* Time */}
          <Shimmer className="h-3 w-20" /> {/* Duration */}
        </div>
      </TableCell>

      {/* Days Column */}
      <TableCell>
        <div className="flex flex-wrap gap-1">
          {Array(3)
            .fill(0)
            .map((_, idx) => (
              <Shimmer key={idx} className="h-6 w-12 rounded-full" />
            ))}
        </div>
      </TableCell>

      {/* Departments Column */}
      <TableCell>
        <div className="flex flex-wrap gap-1">
          {Array(2)
            .fill(0)
            .map((_, idx) => (
              <Shimmer key={idx} className="h-6 w-16 rounded-full" />
            ))}
        </div>
      </TableCell>

      {/* Actions Column */}
      <TableCell className="text-right">
        <div className="flex justify-end gap-1">
          <Shimmer className="h-8 w-8 rounded-md" />
          <Shimmer className="h-8 w-8 rounded-md" />
        </div>
      </TableCell>
    </TableRow>
  );
}