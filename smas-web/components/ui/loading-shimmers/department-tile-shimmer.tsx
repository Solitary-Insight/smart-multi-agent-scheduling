import React from 'react'
import Shimmer from './shimmer'

export default function DepartmentTileShimmer({ key }) {
    return (
        <div
            key={key}
            className="rounded-lg gap-2 flex flex-col  justify-between  border border-border bg-card p-4 transition-colors "
        >
            <div className="mb-2 flex  items-center gap-2">
                <Shimmer className="h-5 w-8 rounded-md" />

            </div>
            <Shimmer className="h-5 w-30 rounded-md" />
            <Shimmer className="h-5 w-24 rounded-md" />
            <div className="flex  justify-between  gap-3 text-xs text-muted-foreground">
                <div className="flex items-center flex-col">
                    <Shimmer className="h-4 w-4 rounded-md" />
                    <span>Courses </span>
                </div>
                <div className="flex items-center flex-col">
                    <Shimmer className="h-4 w-4 rounded-md" />
                    <span>Teachers </span>
                </div>
                <div className="flex items-center flex-col">
                    <Shimmer className="h-4 w-4 rounded-md" />
                    <span>Students </span>
                </div>

            </div>
        </div>
    )
}
