"use client"

import { Fragment, useEffect, useMemo, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Separator } from "@/components/ui/separator"
import {
  Zap,
  CheckCircle2,
  AlertTriangle,
  Loader2,
  CalendarDays,
  RefreshCw,
  Download,
  X,
  Settings,
  ArrowLeft,
  ArrowLeftIcon,
  ArrowRightIcon,
  Users,
  MapPin,
  Clock,
  User,
  UserStar,
  ShieldAlert,
  Activity,
  AlertCircle,
  UserX,
  HelpCircle,
  MapPinOff,
  Maximize2,
  Ban,
  Wand2,
  CircleCheckBig,
  StarIcon,
  Star,

} from "lucide-react"
import { ChevronLeft, ChevronRight, Layers, Info, CalendarX } from 'lucide-react';
import { toast } from "sonner"
import GenericController from "@/lib/api-controllers/generic-controller"
import ScheduleController from "@/lib/api-controllers/schedule.controller"
import { ResourceStateBoxShimmer } from "../ui/loading-shimmers/generation-stats-card-shimmer"
import { formatTimeTo12Hour, generateHslColors } from "@/lib/utils"
import DepartmentController from "@/lib/api-controllers/department-controller"
import { CourseController } from "@/lib/api-controllers/course.controller"
import { Input } from "../ui/input"
import { motion, AnimatePresence } from "framer-motion";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { ScrollArea } from "../ui/scroll-area"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "../ui/accordion"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "../ui/tooltip"
import { useAuth } from "@/lib/auth-context"
import { TimeTableProcessShimmer } from "../ui/loading-shimmers/timetable-process-shimmer"
type GenerationStatus = "idle" | "generating" | "done" | "error"

interface GeneratedEntry {
  id: string
  courseId: string
  courseName: string
  courseCode: string
  teacherId: string
  teacherName: string
  classroomId: string
  classroomName: string
  day: string
  startTime: string
  endTime: string
  type: "Lecture" | "Lab" | "Tutorial"
}


const def_resources_stats = {
  courses: 0,
  teachers: 0,
  students: 0,
  departments: 0,
  mergedClasses: 0,
  workingDays: 0,
}
export function AdminTimetableGenerator() {
  const [status, setStatus] = useState<GenerationStatus>("idle")
  const [selectedDept, setSelectedDept] = useState("all")
  const { user, logout } = useAuth()

  const [constrains, setConstrains] = useState({
    findBestPossible: false,
    avoidConflicts: true,
    optimizeRooms: true,
    respectPreferences: true,
    nSolutions: 5,
  });

  // data  

  const [solutions, setSolutions] = useState([])
  const [conflicts, setConflicts] = useState<string[]>([])

  const [semesters, setSemesters] = useState([1, 2, 3, 4, 5, 6, 7, 8])
  const [departments, setDepartments] = useState([])
  const [days, setDays] = useState({})
  const [courses, setCourses] = useState({})
  const [breaks, setBreaks] = useState({})

  const [resources_stats, setResourcesStats] = useState(def_resources_stats)
  const [isBusy, setisBusy] = useState(true) // Global loading
  const [isRequesting, setisRequesting] = useState(false) // Global loading

  const [minimize_control, setIsControlMininmized] = useState(false)

  const [deptFilter, setDeptFilter] = useState('all')
  const [semFilter, setSemFilter] = useState('all')
  const [currentSolutionIndex, setCurrentSolutionIndex] = useState(0)



  const courseMap=useMemo(()=>{
console.log('courses', courses)
  },[courses])

  function transformArrayToMap(array, key, setter) {
    const map = {};
    array.forEach(item => {
      const id = item[key];
      map[id] = item;
    });
    setter(map);
  }

  const should_minimize_panel = useMemo(() => {
    return minimize_control && (status === "done" || status === "error");
  }, [minimize_control, status]);

  const deptId = selectedDept === "all" ? null : Number(deptFilter);
  const filteredTimetable = useMemo(() => {
    if (!solutions?.length) return [];

    const timetable = solutions[currentSolutionIndex]?.timetable ?? [];

    return timetable.filter(t => {
      // Department filter
      const deptMatch = deptFilter ? (deptFilter == 'all' || (t.department_ids ?? []).includes(deptFilter)) : true;

      // Semester filter
      const semMatch = semFilter
        ? (semFilter == 'all' || (courses[`${semFilter}`] ?? []).some(course => t.course_ids.includes(course.id)))
        : true;
      return deptMatch && semMatch; // all filters must match
    });
  }, [solutions, deptFilter, semFilter, currentSolutionIndex]);
  const timeSlots = useMemo(() => {
    return Array.from(
      new Set(
        filteredTimetable.map(t => `${t.start_time}-${t.end_time}`)
      )
    ).sort();
  }, [filteredTimetable]);

  useEffect(() => {
    async function loadAllData() {
      setisBusy(true)
      await Promise.all([
        new DepartmentController().getAllDepartments({
          onSuccess: (data: any) => { setDepartments(data); },
          onFailed: (err: any) => { }
        }),
        await new CourseController().getAllCourses({
          onSuccess: (data: any[]) => {
            const coursesBySemester: Record<string, any[]> = {};

            (data ?? []).forEach(course => {
              const sem = String(course.semester);
              if (!coursesBySemester[sem]) coursesBySemester[sem] = [];
              coursesBySemester[sem].push(course);
            });

            setCourses(coursesBySemester); // full list
          },
          onFailed: (err: any) => {
            console.error('Failed to fetch courses:', err);
          }
        }),
        await new GenericController().getAllWeekDays({
          onSuccess: (data) => transformArrayToMap(data, "id", setDays),
          onFailed: (error) => console.error("[LOAD-WEEKDAYS-ERROR]", error),
        }),

        new GenericController().getResourcesStats({
          onSuccess: ({ data }) => { setResourcesStats(data) }, onFailed: (err) => {
            toast.dismiss();
            toast.error("Failed to load resources stats")
          }
        })
      ])
      setisBusy(false)

    }

    loadAllData()
  }, [])



  async function ApplyTimeTable(solution) {
    console.log("----------Applying TimeTable---------- ")
    toast.dismiss()
    if (!solution) return toast.error("Solution is not applicable")
    else if ((solution?.timetable ?? []).length == 0) return toast.error("No timetable found in this solution")

    toast.loading("Saving timetable for application. Please wait...")
    await new ScheduleController().applySchedule({
      payload: {
        user_id: user?.id ?? null,
        slots: solution.timetable
      },
      onSuccess: (data) => {
        toast.dismiss()
        toast.success("Timetable saved successfully...")
      },
      onFailed: (err) => {
        toast.dismiss()
        console.log('err', err)
        toast.error("Unable to save timetable. Please try again.")

      }
    })


  }





  async function handleGenerate() {
    setStatus("generating");
    setSolutions([])
    const options = {
      stopOnFirstValid: !constrains.findBestPossible,
      noOverlaps: constrains.avoidConflicts,
      optimizeRooms: constrains.optimizeRooms,
      allowTeacherPreference: constrains.respectPreferences,
      nSolutions: constrains.nSolutions
    };

    await new ScheduleController().createSchedule({
      options,
      onSuccess: ({ data, success }) => {
        console.log('{data,success}', JSON.stringify({ data, success }, null, 2))
        if (!success) { toast.dismiss(); toast.error("Unable to create time table with perfectness..") }
        setSolutions(data.solutions ?? []);
        console.log('data', data)
        if (data.solutions) {
          setStatus("success");
          setIsControlMininmized(true)
        }
      },
      onFailed: (error) => {
        console.error("error", JSON.stringify(error, null, 2));
        setStatus("failed");
      },
    });

    setStatus("done");

  }

  function handleReset() {
    setStatus("idle")
    setSolutions([])
    setConflicts([])
  }



  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Timetable Generator</h1>
          <p className="text-sm text-muted-foreground">
            Automatically generate optimized schedules
          </p>
        </div>
        <div className="flex gap-2">
          {status === "done" && (
            <Button variant="outline" onClick={handleReset}>
              <RefreshCw className="mr-2 h-4 w-4" />
              Reset
            </Button>
          )}
          {/* <Button variant="outline">
            <Download className="mr-2 h-4 w-4" />
            Export
          </Button> */}
        </div>
      </div>



      <div
        className={`
    grid gap-4 sm:gap-6
    ${should_minimize_panel
            ? "grid-cols-1"
            : "grid-cols-1 md:grid-cols-2 xl:grid-cols-3"}
  `}
      >        {should_minimize_panel ?
        <></> :
        <Card className="xl:col-span-1 flex relative  flex-col ">
          {(status === "done" || status === "error") && (
            <button
              onClick={() => setIsControlMininmized(true)}
              className="absolute right-2 top-2 rounded-full p-1 border hover:bg-muted"
            >
              <X className="h-4 w-4" />
            </button>
          )}
          <CardHeader className="flex" >
            <CardTitle className="text-base">Generation Settings</CardTitle>
            <CardDescription>Configure parameters for timetable generation</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6 ">
            <Separator />


            <div className="space-y-4">

              {/* Switches */}
              <div className="space-y-2">

                {/* Best Timetables */}
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium">Best possible Timetables</p>
                    <p className="text-xs text-muted-foreground">
                      Try all combinations to find best {constrains.nSolutions} solutions if exist.
                    </p>
                  </div>
                  <Switch
                    checked={constrains.findBestPossible}
                    onCheckedChange={(v) =>
                      setConstrains(prev => ({ ...prev, findBestPossible: v }))
                    }
                  />
                </div>

                {/* Avoid Conflicts */}
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium">Avoid Conflicts</p>
                    <p className="text-xs text-muted-foreground">
                      No room / teacher overlaps
                    </p>
                  </div>
                  <Switch
                    checked={constrains.avoidConflicts}
                    onCheckedChange={(v) =>
                      setConstrains(prev => ({ ...prev, avoidConflicts: v }))
                    }
                  />
                </div>

                {/* Optimize Rooms */}
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium">Optimize Rooms</p>
                    <p className="text-xs text-muted-foreground">
                      Match room capacity to class size
                    </p>
                  </div>
                  <Switch
                    checked={constrains.optimizeRooms}
                    onCheckedChange={(v) =>
                      setConstrains(prev => ({ ...prev, optimizeRooms: v }))
                    }
                  />
                </div>

                {/* Teacher Preferences */}
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium">Teacher Preferences</p>
                    <p className="text-xs text-muted-foreground">
                      Respect preferred time slots
                    </p>
                  </div>
                  <Switch
                    checked={constrains.respectPreferences}
                    onCheckedChange={(v) =>
                      setConstrains(prev => ({ ...prev, respectPreferences: v }))
                    }
                  />
                </div>
              </div>

              {/* Number of Solutions */}
              <div className="flex items-center justify-between pt-2 border-t">
                <div>
                  <p className="text-sm font-medium">Number of Solutions</p>
                  <p className="text-xs text-muted-foreground">
                    Maximum number of timetables to generate (5–100).
                  </p>
                </div>

                {/* Stepper */}
                <div className="flex items-center gap-2">


                  <Input
                    type="number"
                    min={5}
                    max={100}
                    value={constrains.nSolutions}
                    disabled={isRequesting}
                    onChange={(e) => {
                      let val = Number(e.target.value);
                      if (val < 5) val = 5;
                      if (val > 100) val = 100;
                      setConstrains(prev => ({ ...prev, nSolutions: val }));
                    }}
                    className="w-16 text-center"
                  />


                </div>
              </div>

            </div>

            <Separator />
            {
              isBusy ? <ResourceStateBoxShimmer /> :
                <div className="rounded-lg bg-muted p-3">
                  <p className="text-xs font-medium text-muted-foreground">Resources Available</p>
                  <div className="mt-2 space-y-1 text-sm text-foreground">
                    <div className="flex justify-between">
                      <span>Courses</span>
                      <span className="font-medium">{resources_stats.courses}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Teachers</span>
                      <span className="font-medium">{resources_stats.teachers}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Students</span>
                      <span className="font-medium">{resources_stats.students}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Departments</span>
                      <span className="font-medium">{resources_stats.departments}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Merged Classes</span>
                      <span className="font-medium">{resources_stats.mergedClasses}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Working Days</span>
                      <span className="font-medium">{resources_stats.workingDays}</span>
                    </div>

                  </div>
                </div>
            }

            <div className="flex-1">
              <Button
                className="w-full"
                onClick={handleGenerate}

                disabled={status === "generating" || isBusy || isRequesting}
              >
                {status === "generating" ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    {!isBusy ? <Zap className="mr-2 h-4 w-4" /> : <Loader2 className="mr-2  animate-spin h-4 w-4" />}
                    {isBusy ? "Loading Configurations..." : "Generate Timetable"}
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>}

        <Card className={should_minimize_panel ? "lg:col-span-1" : "xl:col-span-2"}>
          <CardHeader className="relative p-3 sm:p-4">
            {/* Always visible: Heading + Settings */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CalendarDays className="h-5 w-5 text-primary" />
                <CardTitle className="text-base md:text-lg font-semibold">
                  {status == "generating" ? "Generating Schedule..." : "Generated Schedule"}
                </CardTitle>
              </div>

              {should_minimize_panel && (
                <button
                  onClick={() => setIsControlMininmized(false)}
                  className="rounded-full p-1 border hover:bg-muted"
                >
                  <Settings className="h-4 w-4" />
                </button>
              )}
            </div>

            {/* Only show full header if solutions exist */}
            {solutions.length > 0 && (
              <div className="mt-4">
                <ScheduleHeaderContent
                  ApplyTimeTable={ApplyTimeTable}
                  deptFilter={deptFilter}
                  setDeptFilter={setDeptFilter}
                  semFilter={semFilter}
                  setSemFilter={setSemFilter}
                  departments={departments}
                  semesters={semesters}
                  solutions={solutions}
                  currentSolutionIndex={currentSolutionIndex}
                  setCurrentSolutionIndex={setCurrentSolutionIndex}
                  status={status}
                />
              </div>
            )}
          </CardHeader>
          <CardContent className="p-3 sm:p-4">
            {conflicts.length > 0 && (
              <div className="mb-4 rounded-lg border border-warning/30 bg-warning/10 p-3">
                <div className="flex items-center gap-2 text-sm font-medium text-warning">
                  <AlertTriangle className="h-4 w-4" />
                  {conflicts.length} Conflict{conflicts.length > 1 ? "s" : ""} Detected
                </div>
                <ul className="mt-1 space-y-1 text-xs text-muted-foreground">
                  {conflicts.map((c, i) => (
                    <li key={i}>{c}</li>
                  ))}
                </ul>
              </div>
            )}

            {status === "generating" && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="w-full flex items-center justify-center py-10"
              >
                <div className="w-full max-w-xl">
                  <TimeTableProcessShimmer
                    STAGES={[
                      "Loading semester configuration...",
                      "Preparing courses, teachers, and classrooms...",
                      "Analyzing prerequisites and grouping courses...",
                      "Generating available time slots...",
                      "Evaluating teacher availability and constraints...",
                      "Detecting conflicts (teachers, rooms, students)...",
                      "Optimizing classroom allocation...",
                      "Balancing student credit loads...",
                      "Scoring and ranking possible schedules...",
                      "Running intelligent search (beam search)...",
                      "Refining and selecting best solutions...",
                      "Finalizing timetable..."
                    ]}
                    HeadingElement={
                      () => <div className="flex flex-col items-center justify-center ">
                        {/* <Loader2 className="mb-4 h-8 w-8 animate-spin text-primary" /> */}

                        <div className="flex gap-2 items-center">
                          <div className="relative flex h-3 w-3">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-3 w-3 bg-primary"></span>
                          </div>
                          <p className="text-sm font-bold tracking-tight text-foreground">
                            Entity Agents Active
                          </p>
                        </div>
                        <p className="text-sm font-medium text-foreground">Generating optimized timetable...</p>

                      </div>} />
                </div>

              </motion.div>
            )}

            {status === "idle" && (
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <CalendarDays className="mb-4 h-10 w-10 text-muted-foreground/50" />
                <p className="text-sm font-medium text-foreground">No timetable generated yet</p>
                <p className="text-xs text-muted-foreground">
                  Configure settings and click &quot;Generate Timetable&quot;
                </p>
              </div>
            )}
            {/* {(status === "done" || status === "error") && (
              <div className="overflow-x-auto">
                <div
                  className="inline-grid gap-px rounded-lg bg-border"
                  style={{ gridTemplateColumns: `repeat(${Object.keys(days).length + 1}, minmax(0, 1fr))` }}
                >
                  <div className="bg-black p-2 text-center text-xs font-medium text-white">
                    Time
                  </div>
                  {Object.entries(days).map(([key, value]) => (
                    <div
                      key={key}
                      className="bg-muted p-2 text-center text-xs font-medium text-muted-foreground"
                    >
                      {value.name}
                    </div>
                  ))}
                  {solutions[0] &&  filteredTimetable.map((item,i) => (
                    <>
                      <div
                        key={`time-${item.start_time}-${i}`}
                        className="flex items-center justify-center bg-card p-2 text-xs text-muted-foreground"
                      >
                        {item.start_time}
                      </div>
                      {/* {DAYS.map((day) => {
                        const entry = filteredEntries.find(
                          (e) => e.day === day && e.startTime === time
                        )
                        return (
                          <div
                            key={`${day}-${time}`}
                            className="flex min-h-[56px] items-center bg-card p-1"
                          >
                            {entry && (
                              <div
                                className={`w-full rounded p-1.5 text-xs ${entry.type === "Lab"
                                  ? "bg-success/10 text-success"
                                  : entry.type === "Tutorial"
                                    ? "bg-warning/10 text-warning"
                                    : "bg-primary/10 text-primary"
                                  }`}
                              >
                                <p className="font-medium">{entry.courseCode}</p>
                                <p className="truncate opacity-80">{entry.classroomName}</p>
                              </div>
                            )}
                          </div>
                        )
                      })} 
                    </>
                  ))}
                </div>
              </div>
            )} */}

            {(status === "done" || status === "error") && solutions[currentSolutionIndex] && (
              <div className="overflow-x-auto w-full pb-2 ">
                <div
                  className="inline-grid gap-1 w-full  rounded-lg bg-border p-1"
                  style={{
                    gridTemplateColumns: `repeat(${Object.keys(days).length + 1}, minmax(90px, 1fr))`
                  }}
                >
                  {/* Header */}
                  <div className="bg-black p-2 rounded-lg text-center text-xs font-medium text-white">
                    Time Slots
                  </div>

                  {Object.entries(days).map(([key, value]) => (
                    <div
                      key={key}
                      className={`bg-${value.is_holiday ? "error" : "muted"} p-2 text-center rounded text-xs font-medium text-muted-foreground`}
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
                    )}
                  {/* Rows */}
                  {timeSlots.map((time) => {
                    const [start, end] = time.split("-");

                    return (


                      <Fragment key={time}>
                        {/* STICKY TIME COLUMN */}
                        {/* Note: sticky left-1 matches the p-1 of the container */}
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

                        {/* NORMAL DAY COLUMNS */}
                        {Object.entries(days).map(([dayId, value]) => (
                          <DayCell
                            key={`${dayId}-${time}`}
                            dayId={dayId}
                            dayName={value.name}
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
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

function DayCell({ dayId, dayName, start, end, filteredTimetable, deptFilter }) {
  const [index, setIndex] = useState(0);

  const entries = filteredTimetable.filter(
    (t) =>
      t.start_time?.trim() === start &&
      t.end_time?.trim() === end &&
      String(t.day_id) === String(dayId) &&
      (t.department_ids ?? []).some((d) => (deptFilter == "all" || Number(d) === Number(deptFilter)))
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
          <div className="group relative min-h-[90px] sm:min-h-[110px] w-full bg-card border border-border rounded-xl p-2 shadow-sm transition-all hover:shadow-lg hover:border-primary/30 cursor-pointer overflow-hidden active:scale-[0.98]">

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
                {currentEntry?.label === "combined" && <div className="absolute end-1 top-1 p-1 bg-red-700 rounded-full shadow-lg animate-pulse"></div>}
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
                      {currentEntry.course_names?.join(", ")}
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
              {[...new Set(currentEntry?.teacher_names || [])].map((teacher, i) => (
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
                {dayName}
              </Badge>
              {currentEntry?.label === "combined" && (
                <Badge className="bg-orange-500/10 text-orange-600 border-none rounded-md px-2 py-1 text-[10px]">
                  Combined Class
                </Badge>
              )}
            </div>

            <DialogTitle className="text-2xl font-extrabold tracking-tight leading-tight">
              {currentEntry?.course_names?.length > 0
                ? currentEntry.course_names.join(" & ")
                : "Untitled Course"}
            </DialogTitle>

            <div className="flex flex-wrap gap-2 text-muted-foreground">
              {/* Remove duplicate teacher names */}
              {[...new Set(currentEntry?.teacher_names || [])].map((teacher, i) => (
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
                  {currentEntry?.course_codes?.map((code, idx) => (
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
          </div>

          {/* Footer Decoration */}
          <div className="mt-2 flex justify-end">
            <p className="text-[10px] text-muted-foreground/40 font-mono italic">
              {(currentEntry.violations ?? []).length > 0 ? `${(currentEntry.violations ?? []).length} violations` : "No violations"}
            </p>
          </div>
        </DialogContent>
      </Dialog>
    );
}
const ScheduleHeaderContent = ({
  deptFilter,
  ApplyTimeTable,
  setDeptFilter,
  semFilter,
  setSemFilter,
  departments,
  semesters,
  solutions,
  currentSolutionIndex,
  setCurrentSolutionIndex,
  status,
}) => {
  return (
    <>
      {/* Top Row */}
      <div className="grid grid-cols-1 md:grid-cols-[1fr_auto] gap-4 items-start">
        {/* Left */}
        <div className="flex flex-col gap-2">

          {/* Active Filters */}
          <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
            {(deptFilter && deptFilter != "all") && (
              <span className="px-2 py-1 bg-muted rounded-md">
                {departments.find(d => d.id == deptFilter)?.name}
              </span>
            )}
            {semFilter && semFilter !== "all" && (
              <span className="px-2 py-1 bg-muted rounded-md">
                Semester {semFilter}
              </span>
            )}
            <span className="px-2 py-1 bg-muted rounded-md">
              Solution {currentSolutionIndex + 1}/{solutions.length}
            </span>
          </div>
        </div>

        {/* Right */}
        {status === "done" && (
          <Badge className="bg-success text-success-foreground flex items-center gap-1">
            <CheckCircle2 className="h-3 w-3" />
            Generated
          </Badge>
        )}
      </div>

      {/* Filters + Pagination */}
      <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-4 mt-4">
        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-3">
          {/* Department */}
          <div className="flex flex-col">
            <label className="text-xs text-muted-foreground mb-1">
              Department
            </label>
            <Select value={deptFilter} onValueChange={setDeptFilter}>
              <SelectTrigger className="w-full sm:w-44">
                <SelectValue placeholder="All Departments" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>

                {departments.map(d => (
                  <SelectItem key={d.id} value={d.id}>
                    {d.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Semester */}
          <div className="flex flex-col">
            <label className="text-xs text-muted-foreground mb-1">
              Semester
            </label>
            <Select value={semFilter} onValueChange={setSemFilter}>
              <SelectTrigger className="w-full sm:w-44">
                <SelectValue placeholder="All Semesters" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                {semesters.map(s => (
                  <SelectItem key={s} value={s}>
                    Semester {s}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <SolutionControls ApplyTimeTable={ApplyTimeTable} solutions={solutions} currentIndex={currentSolutionIndex} onIndexChange={setCurrentSolutionIndex} />


      </div>
    </>
  );
};
const SolutionControls = ({ solutions, ApplyTimeTable, currentIndex, onIndexChange }) => {
  if (!solutions || solutions.length === 0) return null;

  const currentSolution = solutions[currentIndex];
  const hardConstraints = currentSolution?.hardViolations || [];
  const softConstraints = currentSolution?.issues || [];
  const hardCount = hardConstraints.length;
  const softCount = softConstraints.length;

  const handleNext = () => onIndexChange((currentIndex + 1) % solutions.length);
  const handlePrev = () => onIndexChange((currentIndex - 1 + solutions.length) % solutions.length);

  return (
    <div className="flex justify-end items-center gap-2 flex-wrap sm:flex-nowrap bg-background/80 backdrop-blur-md p-1 rounded-2xl border shadow-sm w-fit">

      {/* 1. Compact Pagination Pill */}

      <div className="flex flex-1 justify-center items-center bg-muted/50 rounded-full p-1 border border-border/50">

        <button
          onClick={handlePrev}
          className="p-1 rounded-full hover:bg-background hover:shadow-sm transition-all active:scale-90 text-muted-foreground"
        >
          <ChevronLeft className="h-4 w-4" />
        </button>

        <div className="px-2 min-w-[45px] text-center">
          <span className="text-[11px] font-bold font-mono">
            {currentIndex + 1}<span className="opacity-30 mx-0.5">/</span>{solutions.length}
          </span>
        </div>

        <button
          onClick={handleNext}
          className="p-1 rounded-full hover:bg-background hover:shadow-sm transition-all active:scale-90 text-muted-foreground"
        >
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>

      {/* 2. Compact Audit Trigger */}
      <Dialog>
        <DialogTrigger asChild>
          <button className="group flex px-1 items-center gap-2 bg-card border shadow-sm rounded-full pl-3 pr-2 py-1.5 hover:border-primary/50 transition-all active:scale-95">
            <div className="flex items-center gap-2">
              <div className=" flex items-center gap-1" title="Hard Violations">
                <div className="p-1 rounded-full bg-muted group-hover:bg-primary/10 group-hover:text-primary-foreground transition-colors">
                  <ShieldAlert className={`h-3.5 w-3.5 ${hardCount > 0 ? "text-error" : "text-emerald-500"}`} />
                </div>
                <span className="text-[11px] font-bold tabular-nums">{hardCount}</span>
              </div>

              <div className="w-[1px] h-3 bg-border/60" />

              <div className="flex items-center gap-1" title="Soft Issues">
                <Zap className={`h-3.5 w-3.5 ${softCount > 0 ? "text-amber-500" : "text-emerald-500"}`} />
                <span className="text-[11px] font-bold tabular-nums">{softCount}</span>
              </div>
            </div>

            <div className="p-1 rounded-full bg-muted group-hover:bg-primary/30 group-hover:text-primary-foreground transition-colors">
              <Info className=" text-warning h-3 w-3" />
            </div>
          </button>
        </DialogTrigger>

        <DialogContent className="sm:max-w-[500px] gap-0 p-0 overflow-hidden border-none shadow-2xl">
          <DialogHeader className="p-6 bg-muted/30 border-b">
            <DialogTitle className="flex items-center gap-2 text-lg font-bold">
              <Activity className="text-primary h-5 w-5" />
              Timetable Audit Report
            </DialogTitle>
          </DialogHeader>

          <div className="p-6 space-y-6 max-h-[60vh] overflow-y-auto custom-scrollbar">
            {/* Hard Constraints Section */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold uppercase tracking-widest text-destructive flex items-center gap-2">
                  <ShieldAlert size={14} /> Critical Violations
                </h3>
                <Badge variant={hardCount > 0 ? "destructive" : "outline"} className="text-[10px]">
                  {hardCount} Issues
                </Badge>
              </div>
              <div className="space-y-2">
                {hardCount > 0 ? (
                  <HardViolationList violations={hardConstraints} />
                ) : (
                  <div className="flex items-center gap-3 p-3 rounded-xl bg-emerald-500/5 border border-emerald-500/10 text-emerald-600 text-sm">
                    <CheckCircle2 size={16} /> All hard constraints are satisfied.
                  </div>
                )}
              </div>
            </div>

            {/* Soft Constraints Section */}
            <div className="space-y-3 pt-2">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold uppercase tracking-widest text-amber-600 flex items-center gap-2">
                  <Zap size={14} /> Optimization Suggestions
                </h3>
                <Badge variant="outline" className="text-[10px] text-amber-600 border-amber-200 bg-amber-50">
                  {softCount} Warnings
                </Badge>
              </div>
              <div className="space-y-2">
                {softCount > 0 ? (
                  <AuditIssueList issues={softConstraints} />
                ) : (
                  <div className="flex items-center gap-3 p-3 rounded-xl bg-emerald-500/5 border border-emerald-500/10 text-emerald-600 text-sm">
                    <CheckCircle2 size={16} /> Schedule is optimally balanced.
                  </div>
                )}
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* 3. Implement Button */}
      <TooltipProvider delayDuration={200}>
        <Tooltip >
          <TooltipTrigger className="flex " asChild>
            <Button
              onClick={() => ApplyTimeTable(solutions[currentIndex])}
              className="flex items-center gap-2  text-primary-foreground pl-3 pr-4 py-1.5 rounded-full text-xs font-bold shadow-sm hover:ring-2 hover:ring-primary/20 transition-all active:scale-95"
            >
              <CircleCheckBig className="h-3.5 w-3.5" />
              <span className="">Apply</span>
            </Button>
          </TooltipTrigger>
          <TooltipContent side="top">
            <p className="text-xs">Apply this schedule</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    </div>
  );
};


const HardViolationList = ({ violations }) => {
  if (!violations || violations.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-8 border-2 border-dashed rounded-xl bg-emerald-500/5 border-emerald-500/10">
        <div className="p-3 bg-emerald-500/20 rounded-full mb-3">
          <ShieldAlert className="h-6 w-6 text-emerald-600" />
        </div>
        <p className="text-sm font-bold text-emerald-700">Perfect Validation</p>
        <p className="text-[11px] text-emerald-600/70 uppercase tracking-tighter">No hard constraints violated</p>
      </div>
    );
  }

  // Helper to get the right icon for the violation code
  const getViolationIcon = (code) => {
    switch (code) {
      case 'teacher_overlap':
      case 'teacher_unavailable': return <UserX className="h-4 w-4" />;
      case 'room_overlap': return <MapPinOff className="h-4 w-4" />;
      case 'student_overlap': return <Users className="h-4 w-4" />;
      case 'capacity_insufficient':
      case 'class_too_large': return <Maximize2 className="h-4 w-4" />;
      case 'break_conflict': return <Ban className="h-4 w-4" />;
      default: return <ShieldAlert className="h-4 w-4" />;
    }
  };

  return (
    <ScrollArea className="h-[400px] w-full pr-4">
      <div className="space-y-3">
        {violations.map((v, idx) => (
          <div
            key={`${v.code}-${idx}`}
            className="group relative flex flex-col gap-2 p-4 rounded-xl border border-destructive/20 bg-destructive/[0.02] hover:bg-destructive/[0.04] transition-all"
          >
            {/* Header: Icon + Code */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-lg bg-destructive/10 text-destructive">
                  {getViolationIcon(v.code)}
                </div>
                <span className="text-[10px] font-black uppercase tracking-widest text-destructive/80">
                  {v.code.replace("_", " ")}
                </span>
              </div>
              <Badge variant="outline" className="text-[9px] font-mono border-destructive/30 text-destructive/60">
                CRITICAL
              </Badge>
            </div>

            {/* Main Message */}
            <p className="text-sm font-semibold text-foreground leading-snug">
              {v.message}
            </p>

            {/* Contextual Data Grid (Safety First) */}
            <div className="grid grid-cols-2 gap-2 mt-1">
              {v.teacher_id && (
                <div className="flex items-center gap-1.5 text-[11px] font-medium text-muted-foreground bg-background/50 p-1 rounded border border-border/50">
                  <Fingerprint size={12} className="text-primary/60" />
                  ID: <span className="text-foreground">T-{v.teacher_id}</span>
                </div>
              )}
              {v.room_id && (
                <div className="flex items-center gap-1.5 text-[11px] font-medium text-muted-foreground bg-background/50 p-1 rounded border border-border/50">
                  <MapPinOff size={12} className="text-primary/60" />
                  Room: <span className="text-foreground">#{v.room_id}</span>
                </div>
              )}
              {v.capacity && (
                <div className="col-span-2 flex items-center gap-2 mt-1 px-2 py-1 bg-destructive/5 rounded-md border border-destructive/10">
                  <CornerDownRight size={12} className="text-destructive/40" />
                  <span className="text-[10px] font-bold text-destructive/80 uppercase">Metrics:</span>
                  <span className="text-[11px] font-mono">
                    Capacity: <span className="font-bold">{v.capacity}</span> / Demand: <span className="font-bold text-destructive">{v.demand}</span>
                  </span>
                </div>
              )}
            </div>

            {/* Visual Indicator on left */}
            <div className="absolute left-0 top-4 bottom-4 w-1 bg-destructive rounded-r-full" />
          </div>
        ))}
      </div>
    </ScrollArea>
  );
};


const AuditIssueList = ({ issues }) => {
  if (!issues || issues.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-10 text-muted-foreground">
        <AlertCircle className="h-10 w-10 mb-2 opacity-20" />
        <p className="text-sm font-medium">No optimization issues found.</p>
      </div>
    );
  }

  return (
    <ScrollArea className="h-[450px] pr-4">
      <Accordion type="single" collapsible className="space-y-3">
        {issues.map((issue, idx) => (
          <AccordionItem
            key={`${issue.group_id}-${idx}`}
            value={`item-${idx}`}
            className="border rounded-xl bg-card px-4 py-0 overflow-hidden shadow-sm"
          >
            <AccordionTrigger className="hover:no-underline py-4">
              <div className="flex items-center gap-3 text-left">
                {issue.type === 'unscheduled' ? (
                  <div className="p-2 bg-amber-500/10 rounded-lg">
                    <UserX className="h-4 w-4 text-amber-600" />
                  </div>
                ) : (
                  <div className="p-2 bg-destructive/10 rounded-lg">
                    <AlertTriangle className="h-4 w-4 text-destructive" />
                  </div>
                )}
                <div>
                  <p className="text-sm font-bold leading-none mb-1">
                    {issue.course_names?.join(" & ") || issue.message || "Unscheduled Session"}
                  </p>
                  <p className="text-[11px] text-muted-foreground font-medium uppercase tracking-tight">
                    {issue.type === 'unscheduled' ? `Feasible Slots: ${issue.feasiblePlacements}` : `Penalty: ${issue.penalty}`}
                  </p>
                </div>
              </div>
            </AccordionTrigger>

            <AccordionContent className="pb-4 pt-0 border-t border-dashed mt-2">
              <div className="grid gap-4 mt-4">

                {/* 1. Reasons Summary */}
                {issue.reasons && (
                  <div className="space-y-2">
                    <span className="text-[10px] font-bold uppercase text-muted-foreground/70">Blocking Reasons</span>
                    <div className="flex flex-wrap gap-1.5">
                      {issue.reasons.map((r, i) => (
                        <Badge key={i} variant="secondary" className="text-[10px] text-error bg-muted/10 font-mono">
                          {r.key.replace("_", " ")}: {r.count}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                {/* 2. Best Near Miss Logic */}
                {issue.bestNearMiss && (
                  <div className="p-3 rounded-lg bg-primary/[0.03] border border-primary/10">
                    <div className="flex items-center gap-2 mb-2">
                      <Clock size={14} className="text-primary" />
                      <span className="text-xs font-bold text-primary">Best Placement Attempt</span>
                    </div>
                    <p className="text-[13px] font-medium">
                      {issue.bestNearMiss.day_name} @ {issue.bestNearMiss.start_time} in {issue.bestNearMiss.room_name}
                    </p>
                    <div className="flex items-center gap-1 mt-2">
                      <span className="text-[10px] text-muted-foreground uppercase font-bold">Failed Due To:</span>
                      {issue.bestNearMiss.violations.map((v, i) => (
                        <Badge key={i} variant="destructive" className="text-[9px] py-0 px-1.5 h-4">
                          {v}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                {/* 3. Blocker Details */}
                <div className="grid grid-cols-2 gap-3">
                  {issue.topTeacherBlockers?.length > 0 && (
                    <div className="bg-muted/30 p-2 rounded-lg">
                      <span className="text-[9px] font-bold uppercase text-muted-foreground">Teacher Blocker</span>
                      <p className="text-xs font-bold mt-0.5">ID: {issue.topTeacherBlockers[0].key}</p>
                      <p className="text-[10px] text-muted-foreground">{issue.topTeacherBlockers[0].count} conflicts</p>
                    </div>
                  )}
                  {issue.topRoomBlockers?.length > 0 && (
                    <div className="bg-muted/30 p-2 rounded-lg">
                      <span className="text-[9px] font-bold uppercase text-muted-foreground">Room Blocker</span>
                      <p className="text-xs font-bold mt-0.5">Room ID: {issue.topRoomBlockers[0].key}</p>
                      <p className="text-[10px] text-muted-foreground">{issue.topRoomBlockers[0].count} hits</p>
                    </div>
                  )}
                </div>

                {/* 4. Suggestion Footer */}
                {issue.suggestions && (
                  <div className="flex items-start gap-2 pt-2 text-primary/80">
                    <HelpCircle size={14} className="mt-0.5 shrink-0" />
                    <p className="text-[11px] italic font-medium">
                      {issue.suggestions[0]}
                    </p>
                  </div>
                )}
              </div>
            </AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
    </ScrollArea>
  );
};