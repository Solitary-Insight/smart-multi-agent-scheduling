"use client"

import { useAuth } from "@/lib/auth-context"
import {
  getStudentById,
  getCourseById,
  getTeacherById,
  getClassroomById,
  getTimeSlotById,
  getDepartmentById,
  getScheduleForStudent,
  getNotificationsForUser,
  DAYS,
} from "@/lib/data"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { BookOpen, Calendar, Clock, AlertTriangle, Inbox, GraduationCap, Layers, Sparkles, MapPin, Building, User, Clock1, CircleCheck, User2Icon } from "lucide-react"
import { useEffect, useMemo, useState } from "react"
import { CourseController } from "@/lib/api-controllers/course.controller"
import { toast } from "sonner"
import { cn, formatTimeTo12Hour, generateHslColors, getNumberPosPostfixes } from "@/lib/utils"
import { motion } from "framer-motion"
import { Skeleton } from "../ui/skeleton"
import StudentController from "@/lib/api-controllers/student-controller"
import ScheduleController from "@/lib/api-controllers/schedule.controller"
import GenericController from "@/lib/api-controllers/generic-controller"

export function StudentDashboard() {
  const { user } = useAuth()
  if (!user) return null


  const [courses, setCourses] = useState([])
  const [isBusy, setisBusy] = useState(true) // Global loading
  const [isRequesting, setisRequesting] = useState(false) // Global loading
  const [student, setStudent] = useState(null)
  const [classes, setTodayClasses] = useState({})

  const [today_info, setTodayInfo] = useState({})




  // Get today's day name

  const enrolled_courses = useMemo(() => {
    return courses.filter(c => c.status == 'enrolled')
  }, [courses])


  const todays_classes = useMemo(() => {
 console.log('today_info', today_info)
    return Object.values(classes).filter(c => c.isScheduledToday && new Date(c.slot_datetime).getDate()==new Date(c.current_date).getDate() ) 
  }, [today_info])
  useEffect(() => {
    async function loadData() {
      setisBusy(true)
      await Promise.all([
        new StudentController().getStudentById({
          id: user.id,
          onSuccess: (student) => { setStudent(student) },
          onFailed: (err) => { console.log('get-enrolled-err', err) }
        }),
        new GenericController().getTodayInfo({
          onSuccess: (data) => { setTodayInfo(data) },
          onFailed: (err) => { console.log('err', err) }
        }),
        new ScheduleController().getStudentTodaysSchedule({
          student_id: user.id,
          onSuccess: (data) => {
            setTodayClasses(Object.fromEntries((data.classes ?? []).map(c=>{
              const slot_key = `${c.day}-${c.start_time}-${c.end_time}-${c.classroom_id}-${c.class_type}`;
              return [slot_key,c]
            })))
          },
          onFailed: (err) => { console.log('get-enrolled-err', err) }
        }),
        new CourseController().getStudentCourses({
          student_id: user.id,
          onSuccess: (courses) => { setCourses(courses) },
          onFailed: (err) => { console.log('get-enrolled-err', err) }
        })
      ]).finally(() => {
        setisBusy(false)

      })
    }

    loadData()
  }, [])

  return (
    <div className="space-y-6">
      <StudentDashboardHeader student={student} isBusy={isBusy} />

      {/* Stats Cards */}

      <StudentStatsGrid todays_classes={todays_classes} enrolled_courses={enrolled_courses} courses={courses} isBusy={isBusy} />

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Today's Classes */}
        <Card>
          <CardHeader className="pb-1">
            <CardTitle className="text-base">Today&apos;s Classes ({today_info?.dayName ?? "..."})</CardTitle>
            <CardDescription>Your schedule for today</CardDescription>
          </CardHeader>
          <CardContent>
            <TodaysClassesList todays_classes={todays_classes} isBusy={isBusy} />
          </CardContent>
        </Card>

        {/* Enrolled Courses */}
        <Card >
          <CardHeader className="pb-1" >
            <CardTitle className="text-base">Enrolled Courses</CardTitle>
            <CardDescription>Your currently enrolled course </CardDescription>
          </CardHeader>
          <CardContent>
            <EnrolledCoursesList enrolled_courses={enrolled_courses} isBusy={isBusy} > </EnrolledCoursesList>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}


function EnrolledCoursesList({ enrolled_courses, isBusy }) {

  // 1. LOADING STATE (Shimmer)
  if (isBusy) {
    return (
      <div className="space-y-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className="flex items-center gap-4 rounded-xl border border-border/50 p-3">
            <Skeleton className="h-12 w-1.5 rounded-full" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-4 w-[60%]" />
              <Skeleton className="h-3 w-[40%]" />
            </div>
            <Skeleton className="h-6 w-16 rounded-md" />
          </div>
        ))}
      </div>
    )
  }

  // 2. EMPTY STATE
  if (!enrolled_courses || enrolled_courses.length === 0) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col items-center justify-center py-12 px-4 rounded-2xl border-2 border-dashed border-muted/30 bg-muted/5">
        <div className="p-4 bg-background rounded-full shadow-sm mb-4">
          <Inbox className="w-8 h-8 text-muted-foreground/40" />
        </div>
        <h3 className="text-sm font-black uppercase tracking-widest text-foreground">No Enrolments</h3>
        <p className="text-xs text-muted-foreground mt-1 text-center max-w-[200px]">
          You haven't been registered for any courses in this term yet.
        </p>
      </motion.div>
    )
  }

  // 3. ACTUAL CONTENT
  return (
    <div className="space-y-3 p-1">
      {enrolled_courses.map((course) => {
        if (!course) return null
        const colors = generateHslColors(course.course_code)

        return (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            key={course.id}
            className="group relative flex items-center gap-4 rounded-xl border border-border/50 bg-card/50 p-3 shadow-sm transition-all hover:shadow-md hover:border-primary/30 hover:bg-card"
          >
            {/* Dynamic Color Accent */}
            <div
              className="h-10 w-1.5 rounded-full shadow-sm transition-transform group-hover:scale-y-110"
              style={{ backgroundColor: colors?.border || 'var(--primary)' }}
            />

            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <p className="text-sm font-black text-foreground truncate tracking-tight">
                  {course.course_name}
                </p>
              </div>

              <div className="flex items-center gap-3 mt-1 text-[11px] font-bold text-muted-foreground/70 uppercase tracking-tighter">
                <span className="flex items-center gap-1">
                  <User className="w-3 h-3 text-primary/60" />
                  {course?.teacher_name || "TBA"}
                </span>
                <span className="flex items-center gap-1">
                  <Clock1 className="w-3 h-3 text-primary/60" />
                  {course.credit_hours} Credit Hour{(course.credit_hours ?? 0) > 1 ? "s" : ""}
                </span>
              </div>
            </div>

            {/* Premium Badge */}
            <Badge
              style={{
                backgroundColor: `${colors?.border}15`, // 15% opacity version for background
                borderColor: colors?.border,
                color: colors?.text
              }}
              variant="outline"
              className="text-[10px] font-black px-2 py-0.5  border-2 uppercase tracking-tighter"
            >
              {course.course_code}
            </Badge>
          </motion.div>
        )
      })}
    </div>
  )
}


function StudentDashboardHeader({ student, isBusy }) {
  // Dynamic greeting based on time of day

  if (isBusy) {
    return (
      <div className="relative overflow-hidden rounded-xl border border-border/50 bg-muted/10 p-4">
        <div className="space-y-3">
          <Skeleton className="h-5 w-24 rounded-full" />
          <Skeleton className="h-8 w-1/3 rounded-lg" />
          <div className="flex gap-4">
            <Skeleton className="h-4 w-28" />
            <Skeleton className="h-4 w-28" />
          </div>
        </div>
      </div>
    )
  }

  // 2. NULL STATE
  if (!student) return null

  // Dynamic greeting logic
  const hour = new Date().getHours()
  const greeting = hour < 12 ? "Good Morning" : hour < 18 ? "Good Afternoon" : "Good Evening"

  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
      className="relative overflow-hidden rounded-xl border border-border/50 bg-gradient-to-br from-primary/5 via-background to-background p-4 shadow-sm"
    >
      {/* Subtle Glow Effect */}
      <div className="absolute -right-4 -top-4 h-24 w-24 rounded-full bg-primary/10 blur-2xl pointer-events-none" />

      <div className="relative flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1.5">
          {/* Greeting Badge */}
          <div className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-2.5 py-0.5 text-[9px] font-black uppercase tracking-widest text-primary border border-primary/10">
            <Sparkles className="h-3 w-3" />
            {greeting}
          </div>

          {/* Welcome Text */}
          <h1 className="text-xl font-black tracking-tighter text-foreground">
            Welcome back, <span className="text-primary">{student.name || "Student"}</span>
          </h1>

          {/* Metadata Row */}
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px] font-bold text-muted-foreground/70 uppercase tracking-tight">
            {/* Department */}
            <div className="flex items-center gap-1.5">
              <Building className="h-3.5 w-3.5 text-primary/60" />
              <span>{student?.department_name || "Department Not Set"}</span>
            </div>

            <div className="h-1 w-1 rounded-full bg-muted-foreground/30 hidden md:block" />

            {/* Semester */}
            <div className="flex items-center gap-1.5">
              <GraduationCap className="h-3.5 w-3.5 text-primary/60" />
              <span>
                {student.semester || 0}{getNumberPosPostfixes(student.semester || 0)} Semester
              </span>
            </div>
          </div>
        </div>


      </div>
    </motion.div>
  )
}


export function TodaysClassesList({ todays_classes, isBusy }) {
  // 1. LOADING STATE
  if (isBusy) {
    return (
      <div className="space-y-3">
        {[1, 2].map((i) => (
          <div key={i} className="flex items-center gap-3 rounded-xl border border-border/50 p-3">
            <Skeleton className="h-10 w-1 rounded-full" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-4 w-1/2" />
              <Skeleton className="h-3 w-3/4" />
            </div>
            <Skeleton className="h-6 w-16 rounded-md" />
          </div>
        ))}
      </div>
    )
  }

  // 2. NO CLASSES TODAY SCENARIO
  if (!todays_classes || todays_classes.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-10 px-4 rounded-xl border-2 border-dashed border-muted/20 bg-muted/5">
        <div className="mb-3 rounded-full bg-background p-3 shadow-sm">
          <Inbox className="h-6 w-6 text-muted-foreground/40" />
        </div>
        <h3 className="text-xs font-black uppercase tracking-widest text-foreground">No Classes Today</h3>
        <p className="text-[11px] text-muted-foreground mt-1 text-center font-medium">
          Your Friday looks clear. Enjoy the break!
        </p>
      </div>
    )
  }

  // 3. ACTUAL CONTENT
  return (
    <div className="space-y-3">
      {todays_classes.map((entry, index) => {
        const colors = generateHslColors(entry.course_codes)

        return (
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.1 }}
            key={entry.id}
            className="group relative flex items-center gap-3 rounded-xl border border-border/50 bg-card/50 p-1.5 shadow-sm transition-all hover:shadow-md hover:border-primary/30 hover:bg-card"
          >
            {/* High-Contrast Status Bar */}
            <div
              className="h-10 w-1 rounded-full shadow-sm transition-transform group-hover:scale-y-110"
              style={{ backgroundColor: colors?.border || 'var(--primary)' }}
            />

            <div className="flex-1 min-w-0 flex flex-col gap-1.5 py-0.5">
              {/* Header: Course & Status */}
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 overflow-hidden">
                  <span className="text-sm font-black text-foreground tracking-tight truncate leading-none">
                    {entry?.course_names} 
                  </span>
                  {entry?.class_type === "rescheduled" && (
                    <Badge
                      className="h-4 border-none text-orange-600 bg-orange-500/10 text-[8px] font-black uppercase tracking-widest px-1.5"
                    >
                      Rescheduled
                    </Badge>
                  )}
                </div>
              </div>

              {/* Primary Info: Timeline & Building */}
              <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
                {/* Clean Time Range */}
                <div className="flex flex-wrap items-center gap-2 text-warning">
                  {/* Time Range Section */}
                  <div className="flex items-center gap-1.5 bg-warning/5 px-2 py-1 rounded-lg border border-warning/10">
                    <Clock className="h-3.5 w-3.5 shrink-0" />

                    <div className="flex items-center gap-2 tabular-nums">
                      {/* Start Time */}
                      <span className="text-[10px] font-black uppercase tracking-tighter whitespace-nowrap">
                        {formatTimeTo12Hour(entry.start_time)}
                      </span>

                      {/* Stylized Horizontal Divider */}
                      <div className="relative flex items-center w-6 sm:w-8 group">
                        <div className="h-[1.5px] w-full bg-gradient-to-r from-warning/60 via-warning/20 to-warning/60 rounded-full" />
                        <div className="absolute left-1/2 -translate-x-1/2 h-1.5 w-1.5 rounded-full bg-warning/40 ring-2 ring-warning/10" />
                      </div>

                      {/* End Time */}
                      <span className="text-[10px] font-black uppercase tracking-tighter whitespace-nowrap">
                        {formatTimeTo12Hour(entry.end_time)}
                      </span>
                    </div>
                  </div>

                  {/* Separator Pipe */}

                  {/* Teacher Section */}
                  <div className="flex items-center gap-2 opacity-80 hover:opacity-100 transition-all cursor-default">
                    <div className="flex items-center gap-1.5 rounded-full bg-primary/5 px-2 py-1 border border-primary/10">
                      <User2Icon className="text-primary h-3.5 w-3.5" />
                      <span className="text-[9px] font-black uppercase tracking-widest text-foreground/80 truncate max-w-[120px]">
                        {entry?.teacher_name}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Location: Building & Lab/Room */}
                <div className="flex items-center gap-1.5 text-muted-foreground/80">
                  <Building className="h-3.5 w-3.5 text-primary/60" />
                  <span className="text-[10px] font-bold uppercase tracking-tight truncate">
                    {entry?.building}
                    <span className="mx-1.5 opacity-30">|</span>
                    <span className="text-foreground/80 font-black">{entry?.classroom}</span>
                  </span>
                </div>
              </div>

              {/* Secondary Info: Faculty (Visible on larger mobile/desktop) */}

            </div>

            {/* Course Code Badge */}
            <Badge
              variant="outline"
              style={{ borderColor: colors?.border, color: colors?.text }}

              className="text-[10px]  font-black px-2 py-0.5 rounded-lg  text-foreground border border-border/50"
            >
              {entry?.course_codes}
            </Badge>

          </motion.div>
        )
      })}
    </div>
  )
}


function StudentStatsGrid({ enrolled_courses, todays_classes, courses, isBusy }) {

  // STATS CONFIGURATION
  const stats = [
    {
      label: "Enrolled Courses",
      value: enrolled_courses?.length || 0,
      icon: BookOpen,
      color: "text-primary",
      bg: "bg-primary/10",
    },
    {
      label: "Classes Today",
      value: todays_classes?.length || 0,
      icon: Calendar,
      color: "text-blue-500",
      bg: "bg-blue-500/10",
    },
    {
      label: "Rescheduled",
      value: todays_classes?.filter(tc => tc.class_type === 'rescheduled').length || 0,
      icon: Clock,
      color: "text-orange-500",
      bg: "bg-orange-500/10",
    },
    {
      label: "Completed",
      value: courses?.filter(c => c.status === 'completed').length || 0,
      icon: CircleCheck,
      color: "text-green-500",
      bg: "bg-green-500/10",
    },
  ]

  return (
    <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
      {stats.map((stat, index) => (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.15 }}
        >

          <Card key={index} className="overflow-hidden border-none shadow-sm bg-card/50 backdrop-blur-sm">
            <CardContent className="p-4 flex items-center gap-4">
              {isBusy ? (
                <>
                  <Skeleton className="h-10 w-10 rounded-xl" />
                  <div className="space-y-2 flex-1">
                    <Skeleton className="h-6 w-1/2" />
                    <Skeleton className="h-3 w-3/4" />
                  </div>
                </>
              ) : (
                <>
                  {/* Icon Container */}
                  <div className={cn(
                    "flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl transition-transform hover:scale-110 duration-300",
                    stat.bg
                  )}>
                    <stat.icon className={cn("h-6 w-6", stat.color)} />
                  </div>

                  {/* Text Content */}
                  <div className="min-w-0">
                    <p className="text-2xl font-black tracking-tighter text-foreground leading-none">
                      {stat.value}
                    </p>
                    <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60 mt-1 truncate">
                      {stat.label}
                    </p>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </motion.div>
      ))}
    </div>
  )
}