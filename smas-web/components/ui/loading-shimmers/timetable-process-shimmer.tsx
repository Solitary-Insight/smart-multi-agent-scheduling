import { Fragment, useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Shimmer from "./shimmer";

const stages = [
    "Analyzing course overlaps...",
    "Resolving teacher availability...",
    "Optimizing classroom capacity...",
    "Checking for credit hour violations...",
    "Finalizing slot assignments...",
];
import React from 'react'

function Heading() {
    return (
        <>
            <div className="relative flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-primary"></span>
            </div>
            <p className="text-sm font-bold tracking-tight text-foreground">
                Identities Agents Active
            </p>
        </>

    )
}


export function TimeTableProcessShimmer({
    stopAtLast = true,
    STAGES = stages,
    HeadingElement=Heading
  }) {
    const [stageIndex, setStageIndex] = useState(0);
  
    useEffect(() => {
      const interval = setInterval(() => {
        setStageIndex((prev) => {
          // Stop at last stage
          if (stopAtLast && prev === STAGES.length - 1) {
            return prev;
          }
          return (prev + 1) % STAGES.length;
        });
      }, 2000);
  
      return () => clearInterval(interval);
    }, [STAGES.length, stopAtLast]); 

    return (
        <div className="flex flex-col items-center justify-center py-12 px-6 bg-card rounded-2xl  ">
            {/* Mini Shimmer Grid - 5 Days x 3 Slots */}
            <div className="w-full max-w-md bg-border/50 p-2 rounded-xl mb-6 border border-border/50">
                <div className="grid grid-cols-6 gap-1.5 opacity-60">
                    {/* Header Row */}
                    <Shimmer className="h-4 w-full rounded bg-black/40" />
                    {[...Array(5)].map((_, i) => (
                        <Shimmer key={i} className="h-4 w-full rounded bg-muted-foreground/20" />
                    ))}

                    {/* Body Rows */}
                    {[...Array(3)].map((_, row) => (
                        <Fragment key={row}>
                            <Shimmer className="h-10 w-full rounded-md bg-muted/50" />
                            {[...Array(5)].map((_, col) => (
                                <div key={col} className="h-10 w-full bg-background rounded-md p-1 border border-dashed border-border/60">
                                    {/* Randomly "fill" some slots to look like it's being generated */}
                                    {(row + col) % 3 === 0 && <Shimmer className="h-full w-full rounded-sm opacity-30" />}
                                </div>
                            ))}
                        </Fragment>
                    ))}
                </div>
            </div>



            {/* Animated Text Section */}
            <div className="flex flex-col items-center space-y-2 text-center">
                <div className="flex items-center gap-2">

                    <HeadingElement />
                </div>

                <div className="h-5 overflow-hidden">
                    <AnimatePresence mode="wait">
                        <motion.p
                            key={STAGES[stageIndex]}
                            initial={{ y: 10, opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            exit={{ y: -10, opacity: 0 }}
                            transition={{ duration: 0.3 }}
                            className="text-xs font-mono text-muted-foreground"
                        >
                            {STAGES[stageIndex]}
                        </motion.p>
                    </AnimatePresence>
                </div>
            </div>
        </div>
    );
}






