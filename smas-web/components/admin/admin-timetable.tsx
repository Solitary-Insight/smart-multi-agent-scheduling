"use client"

import { Fragment, useEffect, useMemo, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { CalendarDays, CalendarX, Users, Clock, MapPin, Layers, Info, ChevronLeft, ChevronRight, UserStar, User, FilterX, Calendar, ClockAlert, Calendar1, Loader2, CheckCircle2, AlertCircle, UserX, MapPinOff, Armchair, CalendarOff } from "lucide-react"
import { formatDateOnly, formatDateTime, formatTimeTo12Hour, generateHslColors, getNumberPosPostfixes } from "@/lib/utils"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { AnimatePresence, motion } from "framer-motion"
import { toast } from "sonner"
import ScheduleController from "@/lib/api-controllers/schedule.controller"
import { Separator } from "../ui/separator"
import InputAutoFill from "../ui/input-auto-fill"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select"
import { CourseController } from "@/lib/api-controllers/course.controller"
import DepartmentController from "@/lib/api-controllers/department-controller"
import { Button } from "../ui/button"
import { TeacherController } from "@/lib/api-controllers/teacher.controller"
import GenericController from "@/lib/api-controllers/generic-controller"
import { LoadingTimetableShimmer } from "../ui/loading-shimmers/loading-timetable-shimmer"

import { DndContext, DragEndEvent, useSensor, useSensors, PointerSensor, closestCorners } from "@dnd-kit/core"
import { ClassroomController } from "@/lib/api-controllers/classroom.controller"
import { ScrollArea } from "../ui/scroll-area"

export function AdminTimeTable() {
  const [timetables, setTimeTables] = useState([])

  const [semFilter, setSemFilter] = useState("all")
  const [courseFilter, setCourseFilter] = useState("all")
  const [deptFilter, setDeptFilter] = useState("all")
  const [teacherFilter, setTeacherFilter] = useState("all")






  const [isBusy, setisBusy] = useState(true) // Global loading
  const [isRequesting, setisRequesting] = useState(false) // Global loading


  const [courses, setCourses] = useState([])
  const [classrooms, setClassrooms] = useState([])
  const [teachers, setTeachers] = useState([])
  const [week_days, setWeekDays] = useState({})

  const [departments, setDepartments] = useState([])
  const [codeMap, setCodeMap] = useState({ semester_codes: {}, departments_codes: {}, teachers_codes: {} })
  const filteredTimetable = useMemo(() => {
    console.log('timetables', timetables)
    return timetables.filter(t => {
      // Split course codes into array
      const courseCodes = (t.course_codes ?? "").split(",").map(c => c.trim());

      // Check department match
      const deptMatch =
        deptFilter === 'all' ||
        !codeMap.departments_codes[deptFilter] ||
        codeMap.departments_codes[deptFilter].some(c => courseCodes.includes(c));


      const semMatch =
        semFilter === 'all' ||
        !codeMap.semester_codes[Number(semFilter)] ||
        codeMap.semester_codes[Number(semFilter)].some(c => courseCodes.includes(c));


      const teachMatch =
        teacherFilter === 'all' ||
        !codeMap.teachers_codes[Number(teacherFilter)] ||
        codeMap.teachers_codes[Number(teacherFilter)].some(c => courseCodes.includes(c));

      // Check course match
      const courseMatch =
        courseFilter === 'all' ||
        courseCodes.includes(courseFilter);



      // Only include if both match
      return deptMatch && courseMatch && semMatch && teachMatch
    });
  }, [deptFilter, timetables, courseFilter, semFilter, codeMap, teacherFilter])



  function handleCourses(courses) {
    // Objects to store results
    const semester_codes = {};
    const departments_codes = {};
    const teachers_codes = {};
    courses.forEach(c => {
      if (!c) return; // skip null/undefined

      const deptId = c.department_id ?? 'unknown';
      const semester = c.semester ?? 'unknown';
      const teacher_id = c.teacher_id ?? 'unknown';
      const courseCode = c.course_code ?? null;
      
      if (!semester_codes[semester]) semester_codes[semester] = []
      if (!departments_codes[deptId]) departments_codes[deptId] = []
      if (!teachers_codes[teacher_id]) teachers_codes[teacher_id] = []
      
      semester_codes[semester].push(courseCode)
      teachers_codes[teacher_id].push(courseCode)
      departments_codes[deptId].push(courseCode)


    });
    setCodeMap({ semester_codes, departments_codes, teachers_codes })
  }




  const timeSlots = useMemo(() => {
    return Array.from(

      new Set(filteredTimetable.map(t => `${t.start_time}-${t.end_time}`))
    ).sort()
  }, [filteredTimetable])



  useEffect(() => {
    toast.dismiss()
    // toast.loading("Loading Timetable for Admin...")
    setisBusy(true)
    Promise.all([
      new ScheduleController().getAdminTimeTable({
        onSuccess: (data) => {
          toast.dismiss()
          setTimeTables(data.timetables)
        }, onFailed: (err) => {
          toast.dismiss()

          console.log('err', err)
          toast.error("Failed to load timetable")
        }
      }),
      new GenericController().getAllWeekDays({
        onSuccess: (data) => { setWeekDays(Object.fromEntries(data.map(day => [day.id, day]))) },
        onFailed: (err) => { toast.dismiss(); toast.error("Unable to load week data..") },
      }),
      new ClassroomController().getAllClassrooms({
        onSuccess: (data) => { setClassrooms(data) },
        onFailed: (err) => { toast.dismiss(); toast.error("Unable to load classrooms..") },
      }),
      new TeacherController().getAllTeachersNamesAndIds({
        onSuccess: (data) => {
          toast.dismiss()
          setTeachers(data)
        }, onFailed: (err) => {
          toast.dismiss()

          console.log('err', err)
          toast.error("Failed to load timetable")
        }
      }),


      new CourseController().getAllCourses({
        onSuccess: (data) => {
          toast.dismiss()
          setCourses(data)
          handleCourses(data)
        }, onFailed: (err) => {
          toast.dismiss()

          console.log('err', err)
          toast.error("Failed to load timetable")
        }
      }),
      new DepartmentController().getAllDepartments({
        onSuccess: (data) => {
          toast.dismiss()
          setDepartments(data)
        }, onFailed: (err) => {
          toast.dismiss()

          console.log('err', err)
          toast.error("Failed to load timetable")
        }
      }),
    ]).finally(() => {
      setisBusy(false)
    })
  }, [])

  const resetFilters = () => {
    // setSearch("")
    setDeptFilter("all")
    setCourseFilter("all")
    setSemFilter("all")
    setTeacherFilter("all")
  }



  return (
    <div className="space-y-4">
      <div className="space-y-1">
        <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
          Academic Timetable
        </h1>
        <p className="text-sm text-muted-foreground">
          Manage and view course schedules across departments.
        </p>
      </div>
      {isBusy ? <LoadingTimetableShimmer /> :
        <Card >
          <div className="flex flex-col">
            <CardHeader className="  m-0 pb-3 pt-4">
              {/* Header Title Section */}

              {/* Controls Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-x-4 gap-y-3">

                {/* Course Search */}
                <div className="space-y-2">
                  <label className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground ml-1">
                    Course Selection
                  </label>
                  <InputAutoFill
                    value={courseFilter}
                    onChange={setCourseFilter}
                    placeholder="Filter by course"
                    options={courses.map((c) => ({
                      label: `[${c.course_code}] ${c.course_name}`,
                      value: c.course_code,
                    }))}
                  />
                </div>

                {/* Teacher Search */}
                <div className="space-y-2">
                  <label className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground ml-1">
                    Faculty Member
                  </label>
                  <InputAutoFill
                    value={teacherFilter}
                    onChange={setTeacherFilter}
                    placeholder="Filter by Teacher"
                    options={teachers.map((t) => ({
                      label: t.name,
                      value: t.id,
                    }))}
                  />
                </div>

                {/* Department Select */}
                <div className="space-y-2">
                  <label className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground ml-1">
                    Department
                  </label>
                  <Select value={deptFilter} onValueChange={setDeptFilter}>
                    <SelectTrigger className="bg-background/50 focus:ring-primary/20 transition-all">
                      <SelectValue placeholder="All Departments" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all" className="font-medium">All Departments</SelectItem>
                      <Separator className="my-1" />
                      {departments.map((d) => (
                        <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Semester Select */}
                <div className="space-y-2">
                  <label className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground ml-1">
                    Academic Term
                  </label>
                  <Select value={semFilter} onValueChange={setSemFilter}>
                    <SelectTrigger className="bg-background/50 focus:ring-primary/20 transition-all">
                      <SelectValue placeholder="Semester" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all" className="font-medium">All Semesters</SelectItem>
                      <Separator className="my-1" />
                      {Object.keys(codeMap.semester_codes).map(num => (
                        <SelectItem key={num} value={num.toString()}>
                          {num}{getNumberPosPostfixes(Number(num))} Semester
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="flex items-end flex-col md:flex-row md:items-center justify-between gap-1  ">


                {/* Quick Action / Reset Info */}
                <div className="flex w-full justify-end">
                  {(deptFilter !== "all" || semFilter !== "all" || courseFilter !== "all" || teacherFilter !== "all") && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={resetFilters}
                      className="w-fit h-9 text-xs font-medium border-destructive/20 text-destructive hover:bg-destructive/10 hover:text-destructive transition-colors"
                    >
                      <FilterX className="w-3.5 h-3.5 mr-2" />
                      Reset All Viewport Filters
                    </Button>
                  )}

                </div>
              </div>
            </CardHeader>

            <CardContent className="md:p-x-2 p-x-1  ">
              {/* The outer container handles the scrollbar */}
              <div className="relative overflow-x-auto rounded-lg border bg-muted/65 w-full">
                <div
                  className="inline-grid gap-1 p-1 bg-border w-full"
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
                  {Object.entries(week_days).map(([key, value]) => (
                    <div
                      key={key}
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
                    !filteredTimetable ||
                    filteredTimetable.length === 0) && (
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
                      <Fragment key={time}>
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
                        {Object.entries(week_days).map(([dayId, value], index) => (
                          <DayCell
                            allSlots={timeSlots}
                            i={index}
                            updateSlot={({ slot_id, payload }) => {
                              setTimeTables(prev => prev.map(p => Number(p.slot_id) == Number(slot_id) ? payload : p))
                            }}
                            classrooms={classrooms}
                            departments={departments}
                            key={`${dayId}-${time}`}
                            day_name={value.name}
                            days={Object.values(week_days)}
                            dayId={dayId}
                            start={start}
                            end={end}
                            filteredTimetable={filteredTimetable}
                            deptFilter={deptFilter}
                          />
                        ))}
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
        </Card>
      }
    </div>
  )
}
function DayCell({ updateSlot, departments, dayId, i, allSlots, classrooms, days, day_name, start, end, filteredTimetable, deptFilter }) {
  const [index, setIndex] = useState(0);
  const [isRescheduleOpen, setIsRescheduleOpen] = useState(false);

  // Validation States: 'idle' | 'checking' | 'available' | 'conflict'
  const [validationStatus, setValidationStatus] = useState('idle');
  const [conflictsRaw, setConflictsRaw] = useState(null);
  const [isBusy, setIsBusy] = useState(false)

  // State for the manual reschedule form
  const [rescheduleData, setRescheduleData] = useState({
    day_id: "",
    timeslot: "",
    classroom_id: ""
  });

  const isOnlyTeacherPriorityConflict = useMemo(() => {
    if (validationStatus !== "conflict" || !conflictsRaw) return false;

    const normalized = Object.fromEntries(
      Object.entries(conflictsRaw).map(([k, v]) => [k, Array.isArray(v) ? v : []])
    );

    // console.log("CHECK:", {
    //   teacher_priority: normalized.teacher_priority.length,
    //   classroom: normalized.classroom.length,
    //   students: normalized.students.length,
    //   teacher_availability: normalized.teacher_availability.length,
    // });

    // must have teacher_priority
    if (normalized.teacher_priority.length === 0 && normalized.teacher_availability.length === 0) return false;

    // ANY other conflict → false
    for (const [key, value] of Object.entries(normalized)) {
      if ((key !== "teacher_priority" && key !== "teacher_availability") && value.length > 0) {
        return false;
      }

    }

    return true;

  }, [validationStatus, conflictsRaw]);


  const entries = filteredTimetable.filter(
    (t) =>
      t.start_time?.trim() === start &&
      t.end_time?.trim() === end &&
      String(t.day_id) === String(dayId)
    // (t.department_ids ?? []).some((d) => (deptFilter == "all" || Number(d) === Number(deptFilter)))
  );



  const next = (e) => {
    e.stopPropagation();
    setIndex((prev) => (prev + 1) % entries.length);
  };

  const prev = (e) => {
    e.stopPropagation();
    setIndex((prev) => (prev - 1 + entries.length) % entries.length);
  };

  useEffect(() => {
    if (!isRescheduleOpen) {
      setRescheduleData({
        day_id: "",
        timeslot: "",
        classroom_id: ""
      });
      setValidationStatus("idle")
    }

  }, [isRescheduleOpen])

  useEffect(() => {

    if (validationStatus != "idle") {
      setValidationStatus("idle")
      setConflictsRaw(null)

    }
  }, [rescheduleData])


  async function shiftSchedule() {
    const [start_time, end_time] = rescheduleData.timeslot?.split('-')
    toast.loading("Updating slot timings. Please wait...")
    setIsBusy(true)
    const payload = {
      ...currentEntry,
      day_id: Number(rescheduleData.day_id),
      classroom_id: Number(rescheduleData.classroom_id),
      start_time,
      end_time,
      slot_id: currentEntry?.slot_id,
      slot_datetime: days.filter(d => Number(d.id) == Number(rescheduleData.day_id))[0]?.date
    }
    await new ScheduleController().updateSlot({
      ...payload,
      onSuccess: (data) => {
        updateSlot({ slot_id: payload.slot_id, payload })
        console.log('payload', payload)
        toast.dismiss()
        toast.success("Slot timing have been updated successfully.")
      }, onFailed: (err) => {
        toast.dismiss()
        toast.error("Unable to slot. Please try again...")
      }
    }).finally(() => {
      setIsBusy(true)

      setIsRescheduleOpen(false)
    })
  }





  const checkSlotAvailability = async () => {
    setValidationStatus('idle');

    if (Number(rescheduleData.day_id) == (currentEntry?.day_id ?? "") &&
      Number(rescheduleData.classroom_id) == (currentEntry?.classroom_id ?? "") &&
      rescheduleData.timeslot == `${currentEntry?.start_time}-${currentEntry?.end_time}`) {
      toast.dismiss()
      return toast.warning("Nothing to check. Change day, slot or classroom before checking...")
    }
    // --- TEST CONFIGURATION ---
    setIsBusy(true)
    const IS_TEST_MODE = true;
    const SIMULATE_CONFLICT = false; // Toggle this to see 'Available' vs 'Conflict'
    // ---------------------------

    setValidationStatus('checking');

    console.log('currentEntry', currentEntry)
    setConflictsRaw([]);
    await new ScheduleController().checkAvailablity({
      course_codes: currentEntry.course_codes,
      timings: rescheduleData.timeslot,
      day_id: rescheduleData.day_id,
      classroom_id: rescheduleData.classroom_id,
      onSuccess: (data) => {
        setValidationStatus('available');

      }, onFailed: (err) => {
        setValidationStatus('conflict');
        setConflictsRaw(err.conflicts); // ✅ required
      }
    });

    setIsBusy(false)


  };
  // --- EMPTY STATE ---
  if (entries.length === 0) {
    return (
      <div className="min-h-[90px] sm:min-h-[110px] flex flex-col items-center justify-center border border-dashed border-muted-foreground/20 rounded-xl bg-muted/5 m-1 opacity-40 group hover:opacity-100 transition-opacity">
        <CalendarX size={18} className="text-error mb-1 group-hover:scale-110 transition-transform" />
        <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">No Class</span>
      </div>
    );
  }
  const currentEntry = entries[index] ?? null;
  if (currentEntry) {
    currentEntry.department_info = departments.filter(d => d.id == currentEntry.department_id)[0] ?? null
  }

  if (currentEntry) {
    const colors = generateHslColors(currentEntry.department_info?.id)

    return (
      <motion.div
        initial={{ opacity: 0, x: 0, y: -30 }}
        animate={{ opacity: 1, x: 0, y: 0 }}
        transition={{ delay: i * 0.1 }}>
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
                {currentEntry.department_info && (
                  <p
                    style={{ borderColor: colors?.border, color: colors?.text, backgroundColor: `${colors?.text}10` }}
                    className="font-bold border-[1px] rounded-full text-[9px] tracking-wider uppercase px-2 "
                  >
                    {currentEntry.department_info.code}
                  </p>
                )}
                <Info size={12} className="text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>

              {/* Animated Card Content */}
              {currentEntry && (
                <div className="relative h-[60px] flex items-center ">
                  <AnimatePresence mode="wait">
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, y: 5 }}
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

              <div className="flex flex-wrap justify-between gap-2 text-muted-foreground">
                {/* Remove duplicate teacher names */}
                <div className="">
                  {[...new Set((currentEntry?.teacher_names ?? '').split(','))].map((teacher, i) => (
                    <div key={i} className="flex items-center gap-1.5 text-sm font-medium">
                      <User size={14} className="text-primary" />
                      {teacher}
                    </div>
                  ))}
                </div>


              </div>

            </DialogHeader>

            <Separator className="my-2 opacity-50" />

            <div className="space-y-6 py-2">
              {/* Key Metadata Grid - Responsive: 1 col on mobile, 2 cols on small screens+ */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 gap-y-5">

                {/* Date Section */}
                <div className="space-y-1">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60">Date</p>
                  <div className="flex items-center gap-2 text-sm font-semibold">
                    <Calendar1 size={16} className="text-muted-foreground shrink-0" />
                    <span className="truncate">{formatDateOnly(currentEntry.slot_datetime)}</span>
                  </div>
                </div>

                {/* Time Slot Section */}
                <div className="space-y-1">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60">Time Slot</p>
                  <div className="flex items-center gap-2 text-sm font-semibold">
                    <Clock size={16} className="text-muted-foreground shrink-0" />
                    <span className="tabular-nums">
                      {formatTimeTo12Hour(start)} - {formatTimeTo12Hour(end)}
                    </span>
                  </div>
                </div>

                {/* Location Section */}
                <div className="space-y-1">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60">Location</p>
                  <div className="flex items-center gap-2 text-sm font-semibold">
                    <MapPin size={16} className="text-muted-foreground shrink-0" />
                    <span className="truncate">{currentEntry?.classroom_name || "TBD"}</span>
                  </div>
                </div>

                {/* Students Section */}
                <div className="space-y-1">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60">
                    Student{(currentEntry?.student_count ?? 0) > 1 ? "s" : ""}
                  </p>
                  <div className="flex items-center gap-2 text-sm font-semibold">
                    <Users size={16} className="text-muted-foreground shrink-0" />
                    <span>{currentEntry?.student_count ?? 0} Enrolled</span>
                  </div>
                </div>

                {/* Course Codes - Full width on small mobile if codes are many */}
                <div className="space-y-1 col-span-1 sm:col-span-2">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60">
                    Course Code{(currentEntry?.course_codes ?? "").split(',').length > 1 ? "s" : ""}
                  </p>
                  <div className="flex flex-wrap gap-1.5 mt-1">
                    {(currentEntry?.course_codes ?? "").split(',').map((code, idx) => (
                      <code key={idx} className="bg-muted px-2 py-0.5 rounded text-primary font-mono font-bold text-[11px] border border-border/40">
                        {code.trim()}
                      </code>
                    ))}
                  </div>
                </div>
              </div>

              {/* Section for Merged/Group info */}
              {currentEntry?.merge_name && (
                <motion.div
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="rounded-xl bg-primary/[0.03] border border-primary/10 p-3"
                >
                  <div className="flex items-center gap-2 mb-1">
                    <Layers size={14} className="text-primary" />
                    <span className="text-[11px] font-bold uppercase tracking-tight text-primary/80">Merged Group Label</span>
                  </div>
                  <p className="text-sm font-medium italic text-muted-foreground pl-6">
                    "{currentEntry.merge_name}"
                  </p>
                </motion.div>
              )}

              {currentEntry.reschedule_date && <Separator className="opacity-50" />}

              {/* Rescheduled Notice */}
              {currentEntry.reschedule_date && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="rounded-xl bg-destructive/[0.03] border border-destructive/20 p-3"
                >
                  <div className="flex items-center gap-2 mb-1 text-destructive">
                    <CalendarDays size={14} />
                    <span className="text-[11px] font-bold uppercase tracking-tight ">Rescheduled On</span>
                  </div>
                  <p className="text-sm font-bold text-muted-foreground pl-6">
                    {formatDateOnly(currentEntry.reschedule_date)}
                  </p>
                </motion.div>
              )}


            </div>


            {/* Action Footer */}
            {!currentEntry?.reschedule_id && <div className="flex flex-col gap-2">
              <Dialog open={isRescheduleOpen} onOpenChange={(open) => {
                if (isBusy) return
                setRescheduleData({
                  day_id: currentEntry?.day_id ?? "",
                  classroom_id: currentEntry?.classroom_id ?? "",
                  timeslot: `${currentEntry?.start_time}-${currentEntry?.end_time}`
                })
                setIsRescheduleOpen(open)
              }}>
                <DialogTrigger asChild>
                  <Button variant="outline" className="w-full gap-2 border-primary/20 hover:bg-accent/50 hover:text-white">
                    <ClockAlert size={16} className="text-primary " />
                    Adjust Manually
                  </Button>
                </DialogTrigger>
                <DialogContent className={`sm:max-w-[400px]  ${isBusy ? "[&>button]:hidden" : "[&>button]:block"}`}
                  onEscapeKeyDown={(e) => isBusy && e.preventDefault()}
                  onPointerDownOutside={(e) => isBusy && e.preventDefault()}>
                  <DialogHeader>
                    <DialogTitle className="mt-2">Reschedule: {currentEntry.course_names}</DialogTitle>
                  </DialogHeader>

                  <div className="space-y-4 py-4">
                    {/* Select Day */}
                    <div className="space-y-2">
                      <label className="text-xs font-bold uppercase text-muted-foreground">New Day</label>
                      <Select
                        value={String(rescheduleData.day_id)}
                        onValueChange={(val) => setRescheduleData({ ...rescheduleData, day_id: val })}
                      >
                        <SelectTrigger><SelectValue placeholder="Select Day" /></SelectTrigger>
                        <SelectContent>
                          {days.map(day => (
                            <SelectItem key={day.id} disabled={day.is_holiday} value={String(day.id)} >{day.name} {day.is_holiday == true && "(Holiday)"}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Select Timeslot */}
                    <div className="space-y-2">
                      <label className="text-xs font-bold uppercase text-muted-foreground">New Time Slot</label>
                      <Select
                        value={rescheduleData.timeslot}

                        onValueChange={(val) => setRescheduleData({ ...rescheduleData, timeslot: val })}
                      >
                        <SelectTrigger><SelectValue placeholder="Select Time" /></SelectTrigger>
                        <SelectContent>
                          {allSlots.map(slot => {
                            const [start, end] = slot.split("-")
                            return <SelectItem key={slot} value={slot}>{formatTimeTo12Hour(start)} - {formatTimeTo12Hour(end)}</SelectItem>
                          }
                          )}
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Select Classroom */}
                    <div className="space-y-2">
                      <label className="text-xs font-bold uppercase text-muted-foreground">New Classroom</label>
                      <Select
                        value={String(rescheduleData.classroom_id)}

                        onValueChange={(val) => setRescheduleData({ ...rescheduleData, classroom_id: val })}
                      >
                        <SelectTrigger><SelectValue placeholder="Select Room" /></SelectTrigger>
                        <SelectContent>
                          {classrooms.map(room => (
                            <SelectItem key={room.id} value={String(room.id)}>{room.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    {!isBusy && <AnimatePresence mode="wait">
                      {validationStatus !== 'idle' && (
                        <motion.div
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, scale: 0.95 }}
                          className={`rounded-xl border p-4 transition-all ${validationStatus === 'available' ? "bg-emerald-50/80 border-emerald-200" :
                            validationStatus === 'conflict' ? "bg-red-200/10 border-red-700" : "bg-muted/30 border-border"
                            }`}
                        >
                          <div className="flex items-start gap-3">
                            {validationStatus === 'checking' && <Loader2 className="h-5 w-5 animate-spin text-primary" />}
                            {validationStatus === 'available' && <CheckCircle2 className="h-5 w-5 text-emerald-600" />}
                            {validationStatus === 'conflict' && <AlertCircle className="h-5 w-5 text-red-600" />}

                            <div className="flex-1">
                              <h4 className={`text-sm font-bold ${validationStatus === 'available' ? "text-emerald-900" :
                                validationStatus === 'conflict' ? "text-red-900" : "text-foreground"
                                }`}>
                                {validationStatus === 'checking' && "Verifying schedule integrity..."}
                                {validationStatus === 'available' && "Slot Available"}
                                {validationStatus === 'conflict' && "Schedule Conflict Detected"}
                              </h4>

                              {validationStatus === 'conflict' && conflictsRaw && (
                                <div className="mt-2 max-h-16 overflow-y-auto space-y-1.5 text-[10px] pr-1 custom-scrollbar">

                                  {/* Teacher Conflict */}
                                  {[...new Map((conflictsRaw.teacher ?? []).map(t => [t.course_code, t])).values()].map((t, i) => (
                                    <div key={`t-${i}`} className="flex items-center gap-1.5 text-red-600 truncate">
                                      <UserX size={12} className="shrink-0" />
                                      <span className="font-medium">{t.teacher_name} have slot of  </span>
                                      <span className="opacity-80">{t.course_code}</span>
                                    </div>
                                  ))}

                                  {/* Classroom Conflict */}
                                  {Object.values(
                                    Object.fromEntries((conflictsRaw.classroom ?? []).map((c) => [c.course_code, c]))
                                  ).map((c, i) => (
                                    <div key={`c-${i}`} className="flex items-center gap-1.5 text-red-600 truncate">
                                      <MapPinOff size={12} className="shrink-0" />
                                      <span className="font-medium">{c.classroom_name} reserved for </span>
                                      <span className="opacity-80">{c.course_code}</span>
                                    </div>
                                  ))}

                                  {/* Students */}
                                  {conflictsRaw.students?.length > 0 && (
                                    <div className="flex items-center gap-1.5 text-orange-600">
                                      <Users size={12} className="shrink-0" />
                                      <span>{conflictsRaw.students.length} students have other schedules.</span>
                                    </div>
                                  )}

                                  {/* Capacity */}
                                  {conflictsRaw.capacity?.length > 0 && (
                                    <div className="flex items-center gap-1.5 text-amber-600">
                                      <AlertCircle size={12} className="shrink-0" />
                                      <span>Classroom Capacity exceeded</span>
                                    </div>
                                  )}

                                  {/* Teacher Availability */}
                                  {conflictsRaw.teacher_availability?.length > 0 && (
                                    <div className="flex items-center gap-1.5 text-slate-500">
                                      <CalendarX size={12} className="shrink-0" />
                                      <span>Teacher usually unavailable on this day.</span>
                                    </div>
                                  )}

                                  {/* Priority */}
                                  {conflictsRaw.teacher_priority?.length > 0 && (
                                    <div className="flex items-center gap-1.5 text-blue-500">
                                      <Clock size={12} className="shrink-0" />
                                      <span>Outside teacher preferred time.</span>
                                    </div>
                                  )}

                                </div>
                              )}
                              {validationStatus === 'available' && (
                                <p className="text-xs text-emerald-700 mt-1">
                                  The teacher, students, and classroom are all free for this slot.
                                </p>
                              )}
                            </div>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>}
                    <div className="flex flex-col gap-2 0">
                      {validationStatus === 'idle' && (
                        <Button
                          className="w-full text-black bg-accent/50 hover:bg-accent/70"
                          onClick={checkSlotAvailability}
                          disabled={!rescheduleData.day_id || !rescheduleData.timeslot || !rescheduleData.classroom_id}
                        >
                          Check Availability
                        </Button>
                      )}

                      {validationStatus === 'checking' && (
                        <Button disabled className="w-full">
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Please wait...
                        </Button>
                      )}

                      {validationStatus === 'available' && (
                        <Button
                          className="w-full bg-emerald-600 hover:bg-emerald-700"
                          onClick={shiftSchedule}
                          disabled={validationStatus === 'checking' || isBusy}
                        >
                          {isBusy ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : "Confirm & Reschedule"}
                        </Button>
                      )}

                      {validationStatus === 'conflict' && (
                        !isOnlyTeacherPriorityConflict ?
                          <Button
                            variant="outline"
                            className="w-full border-destructive/20 text-destructive hover:bg-destructive/50"
                            onClick={checkSlotAvailability}
                          >
                            Re-verify Slot
                          </Button> : <Button
                            variant="outline"
                            disabled={isBusy}
                            className="w-full bg-yellow-300/40 border-info/20 text-black hover:bg-yellow-300/50"
                            onClick={shiftSchedule}
                          >
                            {isBusy ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : 'Ignore & Shift'}


                          </Button>
                      )}


                      {validationStatus === 'conflict' && (
                        <Button
                          variant="outline"
                          disabled={isBusy}
                          className="w-full border-info/20 text-primary hover:bg-red-600/80"
                          onClick={
                            () => {
                              setValidationStatus('idle')
                            }
                          }
                        >
                          Cancel
                        </Button>
                      )}
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            </div>}
          </DialogContent>
        </Dialog>
      </motion.div>

    );
  }
}