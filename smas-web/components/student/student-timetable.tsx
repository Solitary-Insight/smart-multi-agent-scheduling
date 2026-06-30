"use client"

import { Fragment, useEffect, useMemo, useState } from "react"
import { useAuth } from "@/lib/auth-context"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  CalendarDays, CalendarX, Users, Clock, MapPin, Layers, Info,
  ChevronLeft, ChevronRight, UserStar, User, FilterX, Calendar, ClockAlert
} from "lucide-react"
import { formatDateOnly, formatTimeTo12Hour } from "@/lib/utils"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { AnimatePresence, motion } from "framer-motion"
import { toast } from "sonner"
import ScheduleController from "@/lib/api-controllers/schedule.controller"
import { Separator } from "../ui/separator"
import GenericController from "@/lib/api-controllers/generic-controller"
import { LoadingTimetableShimmer } from "../ui/loading-shimmers/loading-timetable-shimmer"
import { Button } from "../ui/button"
import { cn } from "@/lib/utils"

export function StudentTimetable() {
  const { user } = useAuth()
  const [timetables, setTimeTables] = useState([])
  const [week_days, setWeekDays] = useState({})
  const [isBusy, setisBusy] = useState(true)

  if (!user) return null

  useEffect(() => {
    async function loadData() {
      setisBusy(true)
      try {
        await Promise.all([
          new ScheduleController().getStudentTimeTable({
            student_id: user.id,
            onSuccess: (data) => setTimeTables(data.timetables),
            onFailed: () => toast.error("Failed to load timetable")
          }),
          new GenericController().getAllWeekDays({
            onSuccess: (data) => setWeekDays(Object.fromEntries(data.map(day => [day.id, day]))),
            onFailed: () => toast.error("Unable to load week data")
          }),
        ])
      } finally {
        setisBusy(false)
      }
    }
    loadData()
  }, [user.id])

  const timeSlots = useMemo(() => {
    return Array.from(
      new Set(timetables.map(t => `${t.start_time}-${t.end_time}`))
    ).sort()
  }, [timetables])

  return (
    <div className="space-y-4">
      <div className="space-y-1">
        <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
          Student Academic Timetable
        </h1>
        <p className="text-sm text-muted-foreground">
          View your enrolled courses schedules.
        </p>
      </div>
      {isBusy ? <LoadingTimetableShimmer showHeader={false} count={3} /> :
        <Card >
          <div className="flex flex-col">
            <CardHeader className="  m-0 pb-3 pt-4">
              {/* Header Title Section */}


              {/* Controls Grid */}


            </CardHeader>

            <CardContent className="md:p-x-2 p-x-1  ">
              {/* The outer container handles the scrollbar */}
              <div className="relative overflow-x-auto  p-2 rounded-lg border bg-muted/65 w-full">
                <div
                  className="inline-grid gap-1 p-1  bg-border w-full"
                  style={{
                    // min-width ensures the grid doesn't "squish" on small screens
                    minWidth: "900px",
                    gridTemplateColumns: `repeat(${Object.keys(week_days).length + 1}, minmax(120px, 1fr))`
                  }}
                >
                  {/* --- HEADER ROW --- */}
                  {/* Sticky Time Slot Header */}
                  <div className="sticky left-1 z-30 bg-black p-2 rounded-lg text-center text-xs font-medium text-white shadow-[2px_0_5px_rgba(0,0,0,0.2)]">
                    Time Slots
                  </div>

                  {/* Sticky Day Headers */}
                  {Object.entries(week_days).map(([key, value],ind) => (
                    <div
                    key={key+ind}
                    className={`
                  sticky top-0 z-10 p-2 text-center rounded-lg text-xs font-medium shadow-sm
                  ${value.is_holiday ? "bg-error text-black" : "bg-muted text-muted-foreground"}
              
                  ${value.stage === "present" ? "border-2 border-primary" : "border border-transparent"}
                `}
                  >
                    {value.name}
                  </div>
                  ))}
                  {(timeSlots.length === 0 ||
                    !timetables ||
                    timetables.length === 0) && (
                      <div
                        className="col-span-full flex flex-col items-center justify-center py-16 text-center"
                      >
                        <CalendarX size={40} className="text-muted-foreground mb-3 opacity-70" />

                        <h3 className="text-sm font-semibold text-foreground">
                          No timetable available
                        </h3>

                        <p className="text-xs text-muted-foreground mt-1 max-w-xs">
                          No slots or schedule found for the selected filters or configuration.
                        </p>
                      </div>
                    )}                  {/* --- BODY ROWS --- */}
                  {timeSlots.map((time, i) => {
                    const [start, end] = time.split("-");
                    return (

                      <Fragment key={`${start}-${end}-${i}`}>
                        {/* STICKY TIME COLUMN */}
                        {/* Note: sticky left-1 matches the p-1 of the container */}
                        <motion.div
                        className="sticky left-1 z-20"

                          initial={{ opacity: 0, x: 0, y: -30 }}
                          animate={{ opacity: 1, x: 0, y: 0 }}
                          transition={{ delay: i * 0.1 }}>
                          <div className="sticky left-1 z-20 relative flex flex-col items-center justify-center bg-muted/90 backdrop-blur-md p-1 sm:p-2 min-w-[60px] sm:min-w-[80px] rounded-lg shadow-[2px_0_5px_rgba(0,0,0,0.05)]">
                            <div className="flex flex-col items-center">
                              <span className="text-[9px] sm:text-[10px] uppercase text-muted-foreground/60 font-bold tracking-tighter">Start</span>
                              <span className="text-xs sm:text-sm font-bold text-foreground tabular-nums">
                                {formatTimeTo12Hour(start)}
                              </span>
                            </div>

                            <div className="relative flex flex-col items-center my-1 h-6 sm:h-8">
                              <div className="w-[1px] h-full bg-gradient-to-b from-primary/50 via-primary/20 to-transparent"></div>
                              <div className="absolute top-1/2 -translate-y-1/2 w-1.5 h-1.5 rounded-full bg-primary/30 ring-4 ring-primary/5"></div>
                            </div>

                            <div className="flex flex-col items-center">
                              <span className="text-[9px] sm:text-[11px] font-medium text-muted-foreground/80 tabular-nums">
                                {formatTimeTo12Hour(end)}
                              </span>
                              <span className="text-[8px] sm:text-[9px] uppercase text-muted-foreground/40 font-medium tracking-tight">End</span>
                            </div>
                          </div>
                        </motion.div>

                        {/* NORMAL DAY COLUMNS */}
                        {
                          Object.entries(week_days).map(([dayId, value], index) => (
                            <motion.div
                              initial={{ opacity: 0, x: 0, y: -30 }}
                              animate={{ opacity: 1, x: 0, y: 0 }}
                              transition={{ delay: index * 0.1 }}>
                              <DayCell
                                key={`${dayId}-${time}`}
                                day_name={value.name}
                                dayId={dayId}
                                start={start}
                                end={end}
                                filteredTimetable={timetables}
                                deptFilter={'all'}
                              />
                            </motion.div>
                          ))
                        }
                      </Fragment>

                    );
                  })}
                </div>
              </div>

              {/* Mobile Swipe Indicator (Optional) */}
              <div className="mt-2 text-center lg:hidden text-[10px] text-muted-foreground animate-pulse">
                ← Swipe to view full schedule →
              </div>
            </CardContent>
          </div>
        </Card >
      }
    </div >
  )
}
function DayCell({ dayId, dayName, day_name, start, end, filteredTimetable, deptFilter }) {
  const [index, setIndex] = useState(0);

  const entries = filteredTimetable.filter(
    (t) =>
      t.start_time?.trim() === start &&
      t.end_time?.trim() === end &&
      String(t.day_id) === String(dayId)
    // (t.department_ids ?? []).some((d) => (deptFilter == "all" || Number(d) === Number(deptFilter)))
  );

  // --- EMPTY STATE ---
  if (entries.length === 0) {
    return (
      <div className="min-h-[90px] sm:min-h-[110px] flex flex-col items-center justify-center border border-dashed border-muted-foreground/20 rounded-xl bg-muted/5 m-1 opacity-40 group hover:opacity-100 transition-opacity">
        <CalendarX size={18} className="text-error mb-1 group-hover:scale-110 transition-transform" />
        <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">No Class</span>
      </div>
    );
  }

  const next = (e) => {
    e.stopPropagation();
    setIndex((prev) => (prev + 1) % entries.length);
  };

  const prev = (e) => {
    e.stopPropagation();
    setIndex((prev) => (prev - 1 + entries.length) % entries.length);
  };

  const currentEntry = entries[index] ?? null;
  if (currentEntry)
    return (
      <Dialog>
        <DialogTrigger asChild>
          <div className={`group relative min-h-[90px] sm:min-h-[110px]  ${currentEntry.reschedule_id ? "border-red-400 bg-" : ""} w-full bg-card border border-border rounded-xl p-2 shadow-sm transition-all hover:shadow-lg hover:border-primary/30 cursor-pointer overflow-hidden active:scale-[0.98]
            `}>
            {/* Status Indicator Row: Top Right */}
            <div className="absolute top-2 right-2 flex items-center gap-1.5 z-10">
              {/* Combined Class Pulse Indicator */}
              {currentEntry?.slot_label === "combined" && (
                <div className="relative end-5 top-1 flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-orange-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-orange-600 shadow-sm" title="Combined Class"></span>
                </div>
              )}


            </div>
            {/* Rescheduled Badge - Responsive text size */}
            {currentEntry?.reschedule_id && (

              <span className="absolute bottom-1   end-1" title="Rescheduled Class">
                <ClockAlert className="w-4 h-4 text-red-400  mr-1    " />
              </span>
            )}
            {/* Header & Counter */}
            <div className="flex justify-between items-start mb-1">
              {entries.length > 1 ? (
                <Badge variant="secondary" className="text-[9px] gap-1 px-1.5 py-0 bg-primary/10 text-primary border-none">
                  <Layers size={10} /> {index + 1}/{entries.length}
                </Badge>
              ) : (
                <div className="h-4" />
              )}
              <Info size={12} className="text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>

            {/* Animated Card Content */}
            {currentEntry && (
              <div className="relative h-[60px] flex items-center ">
                <AnimatePresence mode="wait">
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -5 }}
                    transition={{ duration: 0.15 }}
                    className="w-full"
                  >
                    <h4 className="font-bold text-xs text-foreground leading-tight line-clamp-2">
                      {currentEntry.course_names}
                    </h4>
                    <p className="text-[11px] font-medium text-muted-foreground mt-1 truncate">
                      {currentEntry.classroom_name}
                    </p>
                  </motion.div>
                </AnimatePresence>
              </div>
            )}


            <div className="flex flex-wrap gap-2 text-muted-foreground">
              {/* Remove duplicate teacher names */}
              {[...new Set((currentEntry?.teacher_names ?? '').split(','))].map((teacher, i) => (
                <div key={i} className="flex items-center gap-1.5 text-[10px] font-medium">
                  <UserStar size={12} className="text-primary" />
                  {teacher}
                </div>
              ))}
            </div>

            {/* Time Footer */}
            <p className="text-[9px] text-muted-foreground font-mono mt-auto pt-1 ">
              {formatTimeTo12Hour(start)} - {formatTimeTo12Hour(end)}
            </p>
            {/* Navigation Controls */}
            {entries.length > 1 && (
              <div className="absolute inset-y-0 left-0 right-0 flex items-center justify-between px-1 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                <button onClick={prev} className="p-1 rounded-full bg-background border shadow-md pointer-events-auto hover:bg-primary hover:text-white transition-all transform hover:scale-110">
                  <ChevronLeft size={14} />
                </button>
                <button onClick={next} className="p-1 rounded-full bg-background border shadow-md pointer-events-auto hover:bg-primary hover:text-white transition-all transform hover:scale-110">
                  <ChevronRight size={14} />
                </button>
              </div>
            )}
          </div>
        </DialogTrigger>



        <DialogContent className="w-[95%] sm:max-w-[450px] overflow-hidden border-none shadow-2xl">
          <DialogHeader className="space-y-3">
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="bg-primary/5 text-primary border-primary/20 rounded-md px-2 py-1 uppercase tracking-wider text-[10px]">
                {day_name}
              </Badge>
              {currentEntry?.slot_label === "combined" && (
                <Badge className="bg-orange-500/10 text-orange-600 border-none rounded-md px-2 py-1 text-[10px]">
                  Combined Class
                </Badge>
              )}
              {currentEntry?.reschedule_id && (
                <Badge className=" text-xs bg-red-500 text-white">
                  Rescheduled
                </Badge>
              )}
            </div>

            <DialogTitle className="text-2xl font-extrabold tracking-tight leading-tight">
              {currentEntry?.course_names?.length > 0
                ? currentEntry.course_names.split(',').join(" & ")
                : "Untitled Course"}
            </DialogTitle>

            <div className="flex flex-wrap gap-2 text-muted-foreground">
              {/* Remove duplicate teacher names */}
              {[...new Set((currentEntry?.teacher_names ?? '').split(','))].map((teacher, i) => (
                <div key={i} className="flex items-center gap-1.5 text-sm font-medium">
                  <User size={14} className="text-primary" />
                  {teacher}
                </div>
              ))}
            </div>

          </DialogHeader>

          <Separator className="my-2 opacity-50" />

          <div className="space-y-6 py-2">
            {/* Key Metadata Grid */}
            <div className="grid grid-cols-2 gap-6">
              <div className="space-y-1">
                <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60">Time Slot</p>
                <div className="flex items-center gap-2 text-sm font-semibold">
                  <Clock size={16} className="text-muted-foreground" />
                  {formatTimeTo12Hour(start)} - {formatTimeTo12Hour(end)}
                </div>
              </div>

              <div className="space-y-1">
                <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60">Location</p>
                <div className="flex items-center gap-2 text-sm font-semibold">
                  <MapPin size={16} className="text-muted-foreground" />
                  {currentEntry?.classroom_name || "TBD"}
                </div>
              </div>

              <div className="space-y-1 text-xs">
                <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60">Course Code{(currentEntry?.course_codes ?? []).length > 1 ? "s" : ""}</p>
                <div className="flex flex-wrap gap-1 mt-1">
                  {(currentEntry?.course_codes ?? "").split(',').map((code, idx) => (
                    <code key={idx} className="bg-muted px-1.5 py-0.5 rounded text-primary font-mono font-bold">
                      {code}
                    </code>
                  ))}
                </div>
              </div>

              <div className="space-y-1">
                <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60">Student{(currentEntry?.student_count ?? 0) > 1 ? "s" : ""}</p>
                <div className="flex items-center gap-2 text-sm font-semibold">
                  <Users size={16} className="text-muted-foreground" />
                  {currentEntry?.student_count ?? 0} Enrolled
                </div>
              </div>
            </div>

            {/* Section for Merged/Group info */}
            {currentEntry?.merge_name && (
              <div className="rounded-xl bg-primary/[0.03] border border-primary/10 p-3">
                <div className="flex items-center gap-2 mb-1">
                  <Layers size={14} className="text-primary" />
                  <span className="text-[11px] font-bold uppercase tracking-tight text-primary/80">Merged Group label</span>
                </div>
                <p className="text-sm font-medium italic text-muted-foreground pl-5">
                  "{currentEntry.merge_name}"
                </p>
              </div>
            )}

            <Separator />
            {currentEntry.reschedule_date && (
              <div className="rounded-xl bg-primary/[0.03] border border-error/40 p-3">
                <div className="flex items-center gap-2 mb-1">
                  <CalendarDays size={14} className="text-error" />
                  <span className="text-[11px] font-bold uppercase tracking-tight text-error/80">Rescheduled On</span>
                </div>
                <p className="text-sm font-medium  text-muted-foreground pl-5">
                  {formatDateOnly(currentEntry.reschedule_date)}
                </p>
              </div>

            )}
          </div>

          {/* Footer Decoration */}
          <div className="mt-2 flex justify-end">
            {/* <p className="text-[10px] text-muted-foreground/40 font-mono italic">
              {(currentEntry.violations ?? []).length > 0 ? `${(currentEntry.violations ?? []).length} violations` : "No violations"}
            </p> */}
          </div>
        </DialogContent>
      </Dialog>
    );
}