"use client"

import { CheckCircle2, XCircle, Lock, LogOut, Clock } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { cn, generateHslColors, getNumberPosPostfixes } from "@/lib/utils"
import { motion } from "framer-motion"

// ... (Interface remains the same)

export function CourseCard({ index ,disabled_click, requireApproval, enrollment_open, course, allCourses, onSelect, onEnroll, onWithdraw }: CourseCardProps & { onWithdraw: (id: string | number) => void }) {
  const isCleared = course.enrollment_status === 'cleared'
  const isEnrolled = course.enrollment_status === 'enrolled'
  const isLocked = course.prerequisite_status !== 'cleared'
  const isRequested = course.enrollment_status === 'requested'
  const colors_crs = generateHslColors(course?.course_id)
  const colors_Dpt = generateHslColors(course?.department_id)

  return (
    <motion.div
    initial={{ opacity: 0, x: -20 }}
    animate={{ opacity: 1, x: 0 }}
    transition={{ delay: index * 0.15 }}>
    <div className={cn(
      "group flex flex-col gap-3 rounded-lg border border-border p-4 transition-all hover:shadow-sm sm:flex-row sm:items-center",
      isCleared ? "  border-green-500/70" : "hover:bg-accent/30"
    )}>

      {/* Dynamic Indicator Bar */}
      <div className={cn(
        "h-12 w-1 self-stretch rounded-full hidden sm:block",
        isCleared ? "bg-green-600" : isEnrolled ? "bg-primary" : "bg-muted"
      )} />

      <div className="flex-1 space-y-1">
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            className="text-sm font-semibold text-foreground hover:text-primary hover:underline underline-offset-4 transition-colors text-left"
            onClick={() => onSelect(course)}
          >
            {course.course_name}
          </button>
          <Badge variant="outline" style={{ borderColor: colors_crs?.border, color: colors_crs?.text }} className="text-[10px] h-5 px-1.5 font-mono">
            {course.course_code}
          </Badge>
          <Badge variant="outline" style={{ borderColor: colors_Dpt?.border, color: colors_Dpt?.text }} className="text-[10px] h-5 px-1.5 opacity-70" >
            {course?.department_code}
          </Badge>

        </div>

        <p className="text-xs text-muted-foreground">
          <span className="font-medium text-foreground/80">{course?.professor_name}</span>
          <span className="mx-2 opacity-30">|</span>
          {course.semester}{getNumberPosPostfixes(course.semester) } Semester
          <span className="mx-2 opacity-30">|</span>
          {course.credit_hours} Credits
        </p>

        {/* Prerequisites Row */}
        {course.prerequisites?.length > 0 && (
          <div className="flex flex-wrap items-center gap-1.5 pt-1">
            <span className="text-[10px] font-bold uppercase text-muted-foreground/60">Prerequisites:</span>
            {course.prerequisites.map((pId) => {
              const isPReqCleared = allCourses.some(c => c.course_code === pId && c.enrollment_status === 'cleared')
              return (
                <Badge
                  key={pId}
                  variant="outline"
                  className={cn(
                    "text-[10px] py-0 px-2 h-4 flex items-center gap-1",
                    isPReqCleared ? "border-green-500/40 text-black bg-green-500/50" : "border-destructive/30 text-destructive bg-destructive/5"
                  )}
                >
                  {isPReqCleared ? <CheckCircle2 className="h-2.5 w-2.5" /> : <Lock className="h-2.5 w-2.5" />}
                  {pId}
                </Badge>
              )
            })}
          </div>
        )}
      </div>

      {/* Action Area */}
      <div className="shrink-0 pt-2 sm:pt-0 flex items-center gap-2">
        {isCleared ? (
          <Badge className="bg-green-600 text-white px-4 py-1 h-8">
            <CheckCircle2 className="h-3.5 w-3.5 mr-1" /> Completed
          </Badge>

        ) : isEnrolled ? (
          <div className="flex items-center gap-2">
            <Badge className="bg-primary/10 text-primary border-primary/20 px-4 py-1 h-8">
              Enrolled
            </Badge>
            <Button
              variant="ghost"
              size="sm"
              disabled={disabled_click}
              className="h-8 px-2 text-destructive hover:bg-destructive/10"
              onClick={() => onWithdraw(course)}
            >
              <LogOut className="h-4 w-4 mr-1" />
              <span className="hidden lg:inline text-[11px] font-bold uppercase">
                Withdraw
              </span>
            </Button>
          </div>

        ) : isRequested ? (
          <div className="flex items-center gap-2">
            <Badge className="hover:bg-yellow-500/20 cursor-pointer bg-yellow-500/10 text-yellow-600 border-yellow-400/30 px-4 py-1 h-8">
              <Clock className="h-3.5 w-3.5 mr-1" />
              Requested
            </Badge>

            <Button
              variant="ghost"
              size="sm"
              disabled={disabled_click}
              className="h-8 px-2 text-destructive hover:bg-destructive/10"
              onClick={() => onWithdraw(course)} // or cancelRequest
            >
              Cancel
            </Button>
          </div>

        ) : (
          (enrollment_open || isLocked) ? (
            <Button
              size="sm"
              disabled={isLocked || disabled_click}
              onClick={() => onEnroll(course)}
              className="h-8 text-xs font-semibold px-4"
            >
              {isLocked ? (
                <><Lock className="mr-1.5 h-3 w-3" /> Locked</>
              ) : (
                requireApproval ? "Request for Enrollment" : "Enroll Course"
              )}
            </Button>
          ) : (
            <Badge className="h-9 px-4 bg-muted/50 text-muted-foreground">
              <Clock size={14} className="mr-1" />
              Enrollment Closed
            </Badge>
          )
        )}
      </div>
    </div>
    </motion.div>
  )
}