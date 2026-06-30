import { Card, CardContent, CardHeader } from "@/components/ui/card";
import Shimmer from "./shimmer";
import { Fragment } from "react";

export function LoadingTimetableShimmer({ count = 7, showHeader = true ,filter_length=4}) {
    return (

        <Card>
            <CardHeader className="space-y-6 pt-4">
                {/* Filters Grid Shimmer */}
                {showHeader==true && <div className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-${filter_length} gap-4`}>
                    {[...new Array(filter_length)].map((i) => (
                        <div key={i} className="space-y-2">
                            <Shimmer className="h-3 w-20 ml-1" /> {/* Label */}
                            <Shimmer className="h-10 w-full" />   {/* Input/Select */}
                        </div>
                    ))}
                </div>
                }
            </CardHeader>

            <CardContent className="md:p-x-2 p-x-2">
                <div className="relative overflow-hidden rounded-lg border border-border">
                    {/* Grid Header Shimmer */}
                    <div
                        className="grid gap-1 p-1 bg-border"
                        style={{ gridTemplateColumns: `repeat(8, minmax(120px, 1fr))` }}
                    >
                        {/* Top Row: Time Slot + 7 Days */}
                        <Shimmer className="h-10 w-full rounded-lg bg-black/20" />
                        {[...Array(7)].map((_, i) => (
                            <Shimmer key={i} className="h-10 w-full rounded-md" />
                        ))}

                        {/* Rows: Mimicking Time Slots and Day Cells */}
                        {[...Array(5)].map((_, rowIdx) => (
                            <Fragment key={rowIdx}>
                                {/* Time Column Placeholder */}
                                <div className="flex flex-col items-center justify-center p-2 bg-muted/30 rounded-lg space-y-2">
                                    <Shimmer className="h-3 w-8" />
                                    <Shimmer className="h-6 w-12" />
                                    <Shimmer className="h-3 w-8" />
                                </div>

                                {/* Empty Day Cell Placeholders */}
                                {[...Array(count)].map((_, colIdx) => (
                                    <div key={colIdx} className="p-2 border border-dashed border-muted rounded-xl flex flex-col justify-between h-[110px]">
                                        <div className="flex justify-between">
                                            <Shimmer className="h-4 w-8 rounded-full" />
                                            <Shimmer className="h-3 w-3 rounded-full" />
                                        </div>
                                        <div className="space-y-2">
                                            <Shimmer className="h-3 w-full" />
                                            <Shimmer className="h-3 w-2/3" />
                                        </div>
                                        <div className="flex gap-2">
                                            <Shimmer className="h-3 w-3 rounded-full" />
                                            <Shimmer className="h-3 w-16" />
                                        </div>
                                    </div>
                                ))}
                            </Fragment>
                        ))}
                    </div>
                </div>
            </CardContent>
        </Card>

    );
}