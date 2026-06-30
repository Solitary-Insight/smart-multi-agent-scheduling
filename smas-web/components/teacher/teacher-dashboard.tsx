"use client"

import { useAuth } from "@/lib/auth-context"
import {
  getTeacherById,
  getScheduleForTeacher,
  getCourseById,
  getClassroomById,
  getTimeSlotById,
  getDepartmentById,
  getNotificationsForUser,
  students,
  rescheduleRequests,
  DAYS,
} from "@/lib/data"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { BookOpen, Building, Calendar, CalendarOff, ChevronRight, Clock, GraduationCap, Inbox, Sparkles, User2Icon, Users } from "lucide-react"
import { useEffect, useMemo, useState } from "react"
import ScheduleController from "@/lib/api-controllers/schedule.controller"
import { cn, formatTimeTo12Hour, generateHslColors } from "@/lib/utils"
import { motion } from "framer-motion"
import { Skeleton } from "../ui/skeleton"
import GenericController from "@/lib/api-controllers/generic-controller"
import { TeacherController } from "@/lib/api-controllers/teacher.controller"

export function TeacherDashboard() {
  const { user } = useAuth()
  if (!user) return null

  const teacher = getTeacherById(user.id)
  if (!teacher) return null

  // indicators 
  const [isBusy, setIsBusy] = useState(true)
  const [classes, setClasses] = useState([])
  const [week_days, setWeekDays] = useState()
  const [teacherStats, setTeacherStas] = useState({})
const [today_info,setTodayInfo]=useState({})

  const todays_classes = useMemo(() => {
    const day_map = {};
    const slots = {};

    // 1. Process all classes to build the day_map and group by slots
    classes.forEach(c => {
      const day_key = c.day;
      const slot_key = `${c.day_name}-${c.start_time}-${c.end_time}-${c.classroom_id}-${c.class_type}`;
        if (!day_map[day_key]) day_map[day_key] = []

        if (!slots[slot_key]) {
          day_map[day_key].push(c)
          slots[slot_key] = { ...c };
        }
       
      

      // Only process for "Today" if the flag is set

    });
    setWeekDays(day_map)

    return Object.values(slots).filter(s => new Date(s.slot_datetime).getDate()==new Date(s.current_date).getDate()  );
  }, [classes]);


  // API CALLINGS 
  useEffect(() => {
    async function loadData() {
      await Promise.all([
        new ScheduleController().getTeacherTodaysSchedule({
          teacher_id: user.id,
          onSuccess: (data) => { setClasses(data.classes ?? []) },
          onFailed: (err) => { console.log('err', err) }
        }),
        new GenericController().getTodayInfo({
          onSuccess: (data) => { setTodayInfo(data) },
          onFailed: (err) => { console.log('err', err) }
        }),
        new TeacherController().getTeacherStats({
          teacher_id: user.id,
          onSuccess: (stats) => { setTeacherStas(stats.data ?? {}) },
          onFailed: (err) => { console.log('err', err) }
        }),
        new GenericController().getAllWeekDays({
          onSuccess: (data) => { },
          onFailed: (err) => { console.log('err', err) }
        })
      ]).finally(() => {
        setIsBusy(false)
      })
    }

    loadData()
  }, [])



  return (
    <div className="space-y-6">
      <TeacherDashboardHeader teacherStats={teacherStats} isBusy={isBusy} />

      <TeacherStatsGrid  teacherStats={teacherStats} todays_classes={todays_classes} isBusy={isBusy} />

      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="pb-2">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Today&apos;s Classes ({today_info?.dayName??"..."})</CardTitle>
            <CardDescription>Your teaching schedule for today</CardDescription>
          </CardHeader>
          <TodaysClasses todayClasses={todays_classes} isBusy={isBusy} />
        </Card>

        <Card className="pb-2">
          <CardHeader className="pb-1">
            <CardTitle className="text-base">Weekly Overview</CardTitle>
            <CardDescription>Classes across all departments</CardDescription>
          </CardHeader>
          <WeeklyOverview week_days={week_days} todayName={today_info?.dayName??"..."} isBusy={isBusy} />
        </Card>
      </div>
    </div>
  )
}


function TeacherStatsGrid({ teacherStats, todays_classes, isBusy }) {

  // 1. Calculate the sum of students efficiently
  const totalStudents = (teacherStats?.courses ?? []).reduce(
    (sum, course) => sum + Number(course.enrolled_students || 0),
    0
  );

  // 2. STATS CONFIGURATION
  const stats = [
    {
      label: "Courses Teaching",
      value: (teacherStats?.courses ?? []).length,
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
      label: "Pending Reschedules",
      value: teacherStats?.pending_schedule ?? 0,
      icon: Clock,
      color: "text-orange-500",
      bg: "bg-orange-500/10",
    },
    {
      label: "Total Students",
      value: totalStudents,
      icon: Users,
      color: "text-green-500",
      bg: "bg-green-500/10",
    },
  ]

  return (
    <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
      {stats.map((stat, index) => (
        <motion.div
          key={index}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.1 }}
        >
          <Card className="overflow-hidden border-none shadow-sm bg-card/50 backdrop-blur-sm">
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

function TeacherDashboardHeader({ teacherStats, isBusy }) {
  // 1. LOADING STATE
  if (isBusy) {
    return (
      <div className="relative overflow-hidden rounded-xl border border-border/50 bg-muted/10 p-4">
        <div className="space-y-3">
          <Skeleton className="h-5 w-24 rounded-full" />
          <Skeleton className="h-8 w-1/3 rounded-lg" />
          <div className="flex gap-4">
            <Skeleton className="h-4 w-48" />
          </div>
        </div>
      </div>
    )
  }

  // 2. NULL STATE
  if (!teacherStats?.info) return null

  // Dynamic greeting logic
  const hour = new Date().getHours()
  const greeting = hour < 12 ? "Good Morning" : hour < 18 ? "Good Afternoon" : "Good Evening"

  // Extract department names
  const departments = (teacherStats.departments ?? [])
    .map((d) => d?.department_name)
    .filter(Boolean)
    .join(" • ")

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
            Welcome back, <span className="text-primary">{teacherStats.info?.name || "Teacher"}</span>
          </h1>

          {/* Metadata Row */}
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px] font-bold text-muted-foreground/70 uppercase tracking-tight">
            {/* Departments */}
            <div className="flex items-center gap-1.5">
              <Building className="h-3.5 w-3.5 text-primary/60" />
              <span>{departments || "Faculty Member"}</span>
            </div>
          </div>
        </div>


      </div>
    </motion.div>
  )
}

function TodaysClasses({ todayClasses, isBusy }) {

  // 1. LOADING STATE (Matches the complex card layout)
  if (isBusy) {
    return (
      <CardContent className="pb-1 space-y-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="relative flex flex-col gap-3 rounded-xl border border-border/50 bg-muted/5 p-4 shadow-sm">
            {/* Accent Bar Skeleton */}
            <Skeleton className="absolute left-0 top-1/2 -translate-y-1/2 h-12 w-1 rounded-r-full" />

            {/* Header Skeleton */}
            <div className="flex justify-between items-center gap-4">
              <Skeleton className="h-5 w-1/2 rounded-md" />
              <div className="flex gap-1">
                <Skeleton className="h-4 w-12 rounded-md" />
                <Skeleton className="h-4 w-12 rounded-md" />
              </div>
            </div>

            {/* Time Pill Skeleton */}
            <div className="flex items-center gap-3">
              <Skeleton className="h-7 w-40 rounded-lg" />
              <Skeleton className="h-4 w-24 rounded-full" />
            </div>

            {/* Bottom Row Skeleton */}
            <div className="pt-2 border-t border-border/40 flex gap-4">
              <Skeleton className="h-3 w-32" />
              <Skeleton className="h-3 w-24" />
            </div>
          </div>
        ))}
      </CardContent>
    )
  }

  // 2. NO CLASSES SCENARIO
  if (!todayClasses || todayClasses.length === 0) {
    return (
      <CardContent className="flex flex-col items-center justify-center py-12 border-2 border-dashed border-muted/20 rounded-xl bg-muted/5 m-4">
        <div className="p-3 bg-background rounded-full shadow-sm mb-3">
          <Inbox className="h-6 w-6 text-muted-foreground/40" />
        </div>
        <p className="text-xs font-black uppercase tracking-widest text-muted-foreground">
          No classes scheduled today
        </p>
      </CardContent>
    )
  }

  return (
    <CardContent className="pb-1">
      <div className="space-y-1">
        {todayClasses.map((entry, index) => {
          const colors = generateHslColors(entry.id)
          const courseCodes = entry.course_codes.split(',').map(c => c.trim())
          const isCombined = courseCodes.length > 1
          return (
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
              key={entry.id}
              className="group relative flex flex-col gap-3 rounded-xl border border-border/50 bg-card/50 p-3 shadow-sm transition-all hover:shadow-md hover:border-primary/30"
            >
              {/* Dynamic Accent Bar */}
              <div
                className="absolute left-1 top-1/2 -translate-y-1/2 h-12 w-1 rounded-full transition-transform group-hover:scale-y-125"
                style={{ backgroundColor: colors?.text || 'var(--primary)' }}
              />

              {/* Header: Course Name & Codes */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div className="flex items-center gap-2 overflow-hidden">
                  <h4 className="text-sm font-black text-foreground tracking-tight truncate">
                    {entry?.course_names}
                  </h4>
                  {entry.class_type === 'rescheduled' && (
                    <Badge className="h-4 border-none text-orange-600 bg-orange-500/10 text-[8px] font-black uppercase tracking-widest">
                      Rescheduled
                    </Badge>
                  )}
                </div>

                <div className="flex flex-wrap gap-1">
                  {courseCodes.map((code) => {
                    const colors = generateHslColors(code)
                    return <Badge
                      key={code}
                      style={{ borderColor: colors?.text, color: colors?.text }}
                      variant="outline"
                      className="text-[10px] font-bold px-1.5 py-0  border-border/60"
                    >
                      {code}
                    </Badge>
                  })}
                </div>
              </div>

              {/* Timeline & Teacher Row */}
              <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-warning">
                <div className="flex items-center gap-1.5 bg-warning/5 px-2 py-1 rounded-lg border border-warning/10">
                  <Clock className="h-3.5 w-3.5 shrink-0" />
                  <div className="flex items-center gap-2 tabular-nums">
                    <span className="text-[10px] font-black uppercase tracking-tighter">
                      {formatTimeTo12Hour(entry.start_time)}
                    </span>
                    {/* Horizontal Divider */}
                    <div className="relative flex items-center w-6 sm:w-8">
                      <div className="h-[1.5px] w-full bg-gradient-to-r from-warning/60 via-warning/20 to-warning/60" />
                      <div className="absolute left-1/2 -translate-x-1/2 h-1.5 w-1.5 rounded-full bg-warning/40 ring-2 ring-warning/10" />
                    </div>
                    <span className="text-[10px] font-black uppercase tracking-tighter">
                      {formatTimeTo12Hour(entry.end_time)}
                    </span>
                  </div>
                </div>

                {/* <div className="hidden sm:block h-3 w-[1px] bg-border" /> */}

                <div className="flex items-center gap-1.5 text-muted-foreground/80">
                  <GraduationCap className="h-3.5 w-3.5 text-primary/60" />
                  <span className="text-[12px] font-bold uppercase tracking-tight">
                    {entry.total_students} <span className="font-medium text-[12px] lowercase text-muted-foreground/60">students enrolled</span>
                  </span>
                </div>
              </div>

              {/* Location & Strength Row */}
              <div className="flex flex-wrap items-center gap-x-4 gap-y-2 pt-1 border-t border-border/40">
                <div className="flex items-center gap-1.5 text-muted-foreground/80">
                  <Building className="h-3.5 w-3.5 text-primary/60" />
                  <span className="text-[10px] font-bold uppercase tracking-tight">
                    {entry?.building} <span className="mx-1 text-border">|</span>
                    <span className="text-foreground font-black">{entry?.classroom}</span>
                  </span>
                </div>

                {isCombined && (
                  <div className="flex items-center gap-1 px-2 py-0.5 rounded-md bg-primary/5 border border-primary/10 text-[9px] font-black uppercase tracking-tighter text-success whitespace-nowrap">
                    Combined
                  </div>
                )}
              </div>
            </motion.div>
          )
        })}
      </div>
    </CardContent>
  )
}



function WeeklyOverview({ week_days, todayName, isBusy }) {

  // 1. LOADING STATE
  if (isBusy) {
    return (
      <CardContent className="pb-1 space-y-1">
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="flex items-center justify-between rounded-xl border border-border/50 p-3 bg-muted/5">
            <Skeleton className="h-4 w-20" />
            <div className="flex gap-1.5">
              <Skeleton className="h-2 w-2 rounded-full" />
              <Skeleton className="h-2 w-2 rounded-full" />
              <Skeleton className="h-2 w-2 rounded-full" />
            </div>
          </div>
        ))}
      </CardContent>
    )
  }

  // 2. NO DATA / EMPTY STATE
  const hasData = week_days && Object.keys(week_days).length > 0;
  const totalClasses = hasData ? Object.values(week_days).flat().length : 0;

  if (!hasData || totalClasses === 0) {

    return (
      <CardContent className="flex flex-col items-center justify-center py-12 border-2 border-dashed border-muted/20 rounded-xl bg-muted/5 m-4">
        <div className="p-3 bg-background rounded-full shadow-sm mb-3">
          <CalendarOff className="h-6 w-6 text-muted-foreground/40" />
        </div>
        <p className="text-xs font-black uppercase tracking-widest text-muted-foreground">
          No classes scheduled today
        </p>
        <p className="text-[11px] text-muted-foreground mt-1 text-center font-medium max-w-[180px]">
          There are no classes registered for this week yet.
        </p>
      </CardContent>
    )


  }

  return (
    <CardContent className="p-3">
      <div className="space-y-2">
        {Object.entries(week_days).map(([day, cls], index) => {
          const isToday = day === todayName
          const classCount = cls?.length || 0

          return (
            <motion.div
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.05 }}
              key={day}
              className={cn(
                "group relative flex items-center justify-between rounded-xl border p-3 transition-all duration-300",
                isToday
                  ? "border-primary/40 bg-primary/5 shadow-sm"
                  : "border-border/50 bg-card/50 hover:bg-card hover:border-border"
              )}
            >
              {/* Today's Indicator Sidebar */}
              {isToday && (
                <div className="absolute left-0 top-1/2 -translate-y-1/2 h-8 w-1 rounded-r-full bg-primary animate-pulse" />
              )}

              <div className="flex items-center gap-3">
                {/* Day Avatar */}
                <div className={cn(
                  "flex h-8 w-8 items-center justify-center rounded-lg border text-[10px] font-black uppercase tracking-tighter transition-colors",
                  isToday
                    ? "bg-primary text-primary-foreground border-primary"
                    : "bg-muted/30 text-muted-foreground border-border/50 group-hover:bg-muted/50"
                )}>
                  {day.substring(0, 2)}
                </div>

                <div className="flex flex-col">
                  <span className={cn(
                    "text-xs font-black uppercase tracking-tight",
                    isToday ? "text-primary" : "text-foreground"
                  )}>
                    {day}
                  </span>
                  <span className="text-[10px] font-bold text-muted-foreground/60 uppercase tracking-widest leading-none mt-0.5">
                    {classCount} {classCount === 1 ? 'Class' : 'Classes'}
                  </span>
                </div>
              </div>

              {/* Visual Density Tracker (Optimized) */}
              <div className="flex items-center">
                <div className="flex -space-x-1.5 overflow-hidden">
                  {cls.slice(0, 6).map((c) => {
                    const colors = generateHslColors(c.course_code || c.id)
                    return (
                      <div
                        key={c.id}
                        className="h-2.5 w-2.5 rounded-full border border-background shadow-sm"
                        style={{ backgroundColor: colors?.text || 'var(--primary)' }}
                        title={c.course_names}
                      />
                    )
                  })}
                  {classCount > 6 && (
                    <div className="flex h-3 w-3 translate-x-1 items-center justify-center rounded-full bg-muted text-[7px] font-black text-muted-foreground border border-background">
                      +
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          )
        })}
      </div>
    </CardContent>
  )
}