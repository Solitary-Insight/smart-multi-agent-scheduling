"use client"

import { useState } from "react"
import {
    GraduationCap,
    AlertCircle,
    Info,
    ArrowRight,
    ChevronDown,
    ChevronUp,
    Check,
    X
} from "lucide-react"
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { cn, generateHslColors } from "@/lib/utils"

export function CourseDetailDialog({ selectedCourse, courses, setSelectedCourse, handleWithdraw, handleEnroll }) {
    const [isExpanded, setIsExpanded] = useState(false);

    if (!selectedCourse) return null;

    const isLocked = selectedCourse.prerequisite_status === 'pending';
    const isEnrolled = selectedCourse.enrollment_status === 'enrolled';
    const isCleared = selectedCourse.enrollment_status === 'cleared';
    const isRequested = selectedCourse.enrollment_status === 'requested';


    const fullDescription = selectedCourse.description || "Description for this course is not available.";
    const shouldTruncate = fullDescription.length > 120;
    const displayDescription = isExpanded ? fullDescription : fullDescription.slice(0, 120) + "...";

    const colors = generateHslColors(selectedCourse.department_code)

    return (
        <Dialog open={!!selectedCourse} onOpenChange={() => setSelectedCourse(null)}>
            <DialogContent className="max-w-[95vw] sm:max-w-[420px] p-0 gap-0 overflow-hidden border-none shadow-2xl rounded-2xl">

                {/* Header Section */}
                <div className="bg-primary/[0.03] p-5 pb-3 border-b">
                    {/* THE COMPACT ONE-LINER */}
                    <div className="flex flex-wrap items-center gap-x-2 gap-y-1 mb-2 text-[10px] font-bold uppercase tracking-wider text-muted-foreground/80">
                        <Badge variant="outline" style={{ borderColor: colors?.border, color: colors?.text }} className="text-xs font-mono">
                            {selectedCourse.department_code}
                        </Badge>
                        <span className="opacity-30">•</span>
                        <span className="text-primary font-mono bg-primary/10 px-1.5 py-0.5 rounded">{selectedCourse.course_code}</span>
                        <span className="opacity-30">•</span>
                        <span>Sem {selectedCourse.semester}</span>
                        <span className="opacity-30">•</span>
                        <span className="text-foreground">{selectedCourse.credit_hours} Credits</span>
                    </div>

                    <DialogHeader>
                        <DialogTitle className="text-2xl font-bold tracking-tight leading-tight">
                            {selectedCourse.course_name}
                        </DialogTitle>
                    </DialogHeader>
                </div>

                <div className="p-5 pt-4 space-y-4">
                    {/* Instructor: Full Width for Max Legibility */}
                    <div className="flex items-center gap-3 bg-muted/40 p-3 rounded-xl border border-border/50">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-background border shadow-sm">
                            <GraduationCap className="h-5 w-5 text-primary" />
                        </div>
                        <div className="min-w-0">
                            <p className="text-[10px] font-bold uppercase text-muted-foreground tracking-widest leading-none mb-1">Instructor</p>
                            <p className="text-base font-semibold text-foreground truncate">
                                {selectedCourse.professor_name}
                            </p>
                        </div>
                    </div>

                    {/* Description with See More */}
                    <div className="space-y-1">
                        <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase text-muted-foreground/70">
                            <Info className="h-3.5 w-3.5" /> Course Abstract
                        </div>
                        <p className="text-sm leading-relaxed text-muted-foreground">
                            {shouldTruncate ? displayDescription : fullDescription}
                            {shouldTruncate && (
                                <button
                                    onClick={() => setIsExpanded(!isExpanded)}
                                    className="ml-1.5 text-primary font-bold hover:underline inline-flex items-center gap-0.5"
                                >
                                    {isExpanded ? <>See Less <ChevronUp className="h-3 w-3" /></> : <>See More <ChevronDown className="h-3 w-3" /></>}
                                </button>
                            )}
                        </p>
                    </div>

                    {/* Prerequisites: Error State */}
                    {isLocked && (
                        <div className="rounded-xl border border-destructive/20 bg-destructive/5 p-3.5">
                            <div className="flex items-center gap-2 font-bold text-destructive text-[10px] uppercase mb-2.5">
                                <AlertCircle className="h-4 w-4" /> Prerequisites Required
                            </div>
                            <div className="flex flex-wrap gap-1.5">
                                {selectedCourse.prerequisites.map(preCode => {
                                    const target = courses.find(c => c.course_code === preCode);
                                    const isReady = target?.isCompleted;
                                    return (
                                        <Badge
                                            key={preCode}
                                            variant={`${isReady ? 'success' : 'error'}`}
                                        //   className={cn(
                                        //     "text-[10px] py-0.5 px-2 font-medium",
                                        //     isReady ? "text-green-700 bg-green-100/50 border-green-200" : "text-destructive bg-white border-destructive/20"
                                        //   )}
                                        >
                                            {preCode} {isReady ? <Check className="h-4 w-4"></Check> : <X className="h-4 w-4"></X>}
                                        </Badge>
                                    );
                                })}
                            </div>
                        </div>
                    )}

                    {/* Action Button */}
                    <div className="pt-1">
                        {isCleared ? (
                            <Button
                                size="lg"
                                className="w-full h-12 text-base font-bold bg-green-600 hover:bg-green-700"
                                disabled
                            >
                                Course Completed
                            </Button>

                        ) : isEnrolled ? (
                            <Button
                                size="lg"
                                variant="destructive"
                                className="w-full h-12 text-base font-bold"
                                disabled={isLocked}
                                onClick={() => {
                                    handleWithdraw(selectedCourse)
                                    setSelectedCourse(null)
                                }}
                            >
                                <span className="flex items-center gap-2">
                                    Withdraw Enrollment <ArrowRight className="h-5 w-5" />
                                </span>
                            </Button>

                        ) : isRequested ? (
                            <div className="space-y-2">
                                <Button
                                    size="lg"
                                    className="w-full h-12 text-base font-bold bg-yellow-500/90 hover:bg-yellow-500 text-white"
                                    disabled
                                >
                                    Request Pending Approval
                                </Button>

                                <Button
                                    size="sm"
                                    variant="ghost"
                                    className="w-full text-destructive"
                                    onClick={() => {
                                        handleWithdraw(selectedCourse) // or cancelRequest
                                        setSelectedCourse(null)
                                    }}
                                >
                                    Cancel Request
                                </Button>
                            </div>

                        ) : (
                            <Button
                                size="lg"
                                className={cn(
                                    "w-full h-12 text-base font-bold transition-all shadow-md active:scale-[0.98]",
                                    "shadow-primary/10"
                                )}
                                disabled={isLocked}
                                onClick={() => {
                                    handleEnroll(selectedCourse)
                                    setSelectedCourse(null)
                                }}
                            >
                                {isLocked ? (
                                    "Enrollment Locked"
                                ) : (
                                    <span className="flex items-center gap-2">
                                        Confirm Enrollment <ArrowRight className="h-5 w-5" />
                                    </span>
                                )}
                            </Button>
                        )}

                        <button
                            onClick={() => setSelectedCourse(null)}
                            className="mt-3 w-full text-center text-[10px] font-bold text-muted-foreground/40 hover:text-foreground uppercase tracking-[0.2em]"
                        >
                            Close
                        </button>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    )
}