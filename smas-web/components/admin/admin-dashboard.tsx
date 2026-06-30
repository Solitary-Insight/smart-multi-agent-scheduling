"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  Users,
  GraduationCap,
  BookOpen,
  Building2,
  DoorOpen,
  CalendarDays,
  TrendingUp,
  Clock,
  Building,
  ArrowUpRight,
  User,
  ChevronLeft,
  ChevronRight,
  Activity,
} from "lucide-react"
import { students, teachers, courses, classrooms, scheduleEntries } from "@/lib/data"
import DepartmentController from "@/lib/api-controllers/department-controller"
import { useEffect, useMemo, useState } from "react"
import { formatTimeAgo, generateHslColors } from "@/lib/utils"
import DepartmentTileShimmer from "../ui/loading-shimmers/department-tile-shimmer"
import GenericController from "@/lib/api-controllers/generic-controller"
import Shimmer from "../ui/loading-shimmers/shimmer"
import { AdvanceStatRow } from "../ui/loading-shimmers/dashboard-advance-state-shimmer"
import { Button } from "../ui/button"
import TrafficLogTimeline from "./sub-components/traffic-log-timeline"

const stats = [
  {
    label: "Students",
    value: students.length,
    icon: GraduationCap,
    key: "students",
    color: "text-primary",
    bg: "bg-primary/10",
  },
  {
    label: "Teachers",
    value: teachers.length,
    icon: Users,
    key: "teachers",
    color: "text-success",
    bg: "bg-success/10",
  },
  {
    label: "Courses",
    value: courses.length,
    icon: BookOpen,
    key: "courses",
    color: "text-warning",
    bg: "bg-warning/10",
  },
  {
    label: "Classrooms",
    value: classrooms.length,
    icon: DoorOpen,
    color: "text-destructive",
    key: 'classrooms',
    bg: "bg-destructive/10",
  },
  {
    label: "Departments",
    value: 4,
    icon: Building2,
    key: "departments",
    color: "text-primary",
    bg: "bg-primary/10",
  },
  {
    label: "Scheduled Classes",
    value: scheduleEntries.length,
    icon: CalendarDays,
    key: "scheduledClasses",
    color: "text-success",
    bg: "bg-success/10",
  },
]



export function AdminDashboard() {

  const [activities, setActivites] = useState([])
  const [traffic_logs, setTrafficLogs] = useState([])
  const [departments, setDepartments] = useState([])
  const [resoursesStats, setResoursesStats] = useState({
    courses: 0,
    teachers: 0,
    students: 0,
    classrooms: 0,
    departments: 0,
    mergedClasses: 0,
    workingDays: 0,
    scheduledClasses: 0
  })

  const [advancedStats, setAdvancedStats] = useState({
    enrollmentRate: 0,
    roomUtilization: 0,
    avgClassSize: 0,
    studentTeacherRatio: '0:0',
    coursesPerDepartment: 0
  })




  // status monitoring 

  const [isBusy, setisBusy] = useState(true) // Global loading
  const [isRequesting, setisRequesting] = useState(false) // Global loading




  useEffect(() => {
    console.log('--CALLING ALL DEPT--')
    async function getAllDepartments() {
      setisBusy(true)
      await Promise.all([
        new DepartmentController().getAllDepartmentsOverview({
          onSuccess: (data: any) => { setDepartments(data); },
          onFailed: (err: any) => { console.log('err', err) }
        }),
        new GenericController().getResourcesStats({
          onSuccess: (stats: any) => { setResoursesStats(stats.data); },
          onFailed: (err: any) => { console.log('err', err) }
        })
        ,
        new GenericController().getAdvancedStats({
          onSuccess: (stats: any) => { setAdvancedStats(stats.data); },
          onFailed: (err: any) => { console.log('err', err) }
        }),
        new GenericController().getLogs({
          onSuccess: (data: any) => { setActivites(data.logs); },
          onFailed: (err: any) => { console.log('err', err) }
        }),
        new GenericController().getTrafficLogs({
          onSuccess: (data: any) => { setTrafficLogs(data.logs); },
          onFailed: (err: any) => { console.log('err', err) }
        })
      ])
      setisBusy(false)

    }
    getAllDepartments()
  }, [])


  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Admin Dashboard</h1>
        <p className="text-sm text-muted-foreground">
          Overview of your university management system
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {stats.map((stat, i) => {
          return <Card key={stat.label}>
            <CardContent className="flex items-center gap-4 p-4">
              <div className={`flex h-12 w-12 items-center justify-center rounded-xl ${stat.bg}`}>
                <stat.icon className={`h-6 w-6 ${stat.color}`} />
              </div>
              <div>
                {isBusy ? <Shimmer className="h-7 w-12 rounded-md" />
                  : <p className="text-2xl font-bold text-foreground">{resoursesStats[`${stat.key}`]}</p>}
                <p className="text-xs text-muted-foreground">{stat.label}</p>
              </div>
            </CardContent>
          </Card>
        }
        )}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <TrendingUp className="h-4 w-4 text-primary" />
              Quick Stats
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">

            {/* Enrollment Rate */}
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Enrollment Rate</span>

              {isBusy ? (
                <div className="flex items-center gap-2">
                  <Shimmer className="h-2 w-24 rounded-full" />
                  <Shimmer className="h-4 w-10" />
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <div className="h-2 w-24 overflow-hidden rounded-full bg-muted">
                    <div
                      className="h-full rounded-full bg-primary"
                      style={{ width: `${advancedStats.enrollmentRate}%` }}
                    />
                  </div>
                  <span className="text-sm font-medium text-foreground">
                    {Math.floor(advancedStats.enrollmentRate)}%
                  </span>
                </div>
              )}
            </div>

            {/* Room Utilization */}
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Room Utilization</span>

              {isBusy ? (
                <div className="flex items-center gap-2">
                  <Shimmer className="h-2 w-24 rounded-full" />
                  <Shimmer className="h-4 w-10" />
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <div className="h-2 w-24 overflow-hidden rounded-full bg-muted">
                    <div
                      className="h-full rounded-full bg-success"
                      style={{ width: `${advancedStats.roomUtilization}%` }}
                    />
                  </div>
                  <span className="text-sm font-medium text-foreground">
                    {Math.floor(
                      advancedStats.roomUtilization > 100
                        ? 100
                        : advancedStats.roomUtilization
                    )}%
                  </span>
                </div>
              )}
            </div>

            {/* Avg Class Size */}
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Avg. Class Size</span>

              {isBusy ? (
                <Shimmer className="h-4 w-20" />
              ) : (
                <span className="text-sm font-medium text-foreground">
                  {Math.ceil(advancedStats.avgClassSize)} students
                </span>
              )}
            </div>

            {/* Student-Teacher Ratio */}
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Student-Teacher Ratio</span>

              {isBusy ? (
                <Shimmer className="h-4 w-16" />
              ) : (
                <span className="text-sm font-medium text-foreground">
                  {resoursesStats.students}:{resoursesStats.teachers}
                </span>
              )}
            </div>

            {/* Courses per Department */}
            <AdvanceStatRow
              label="Courses per Department"
              isLoading={isBusy}
              value={Math.ceil(advancedStats.coursesPerDepartment)}
            />

          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Clock className="h-4 w-4 text-primary" />
              Recent Activity
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ActivityTimeline activities={activities.sort((a, b) => (new Date(b.time) - new Date(a.time)))} isBusy={isBusy} />
          </CardContent>
        </Card>


        {/* Add this next to or below your Activity Card */}

      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <CalendarDays className="h-4 w-4 text-primary" />
            Department Overview
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {isBusy ? (
              // Shimmer State
              Array(4).fill(0).map((_, i) => (
                <DepartmentTileShimmer key={i} />
              ))
            ) : departments.map((dept, indx) => {
              const colors = generateHslColors(dept?.id ?? indx)

              return (
                <div
                  key={dept.id}
                  className="group relative flex flex-col justify-between rounded-xl border border-border bg-card p-5 transition-all hover:border-primary/30 hover:shadow-md"
                >
                  {/* Header: Code & Action */}
                  <div className="absolute top-1 end-[5px] flex items-start justify-end">
                    <Badge
                      variant="outline"
                      style={{ borderColor: colors?.border, color: colors?.text, backgroundColor: `${colors?.text}10` }}
                      className="font-mono text-[10px] tracking-wider uppercase px-2 "
                    >
                      {dept.code}
                    </Badge>
                    {/* Optional: Add a subtle 'view' icon that appears on hover
                    // <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                    //   <ArrowUpRight className="h-4 w-4 text-muted-foreground" />
                    // </div> */}
                  </div>

                  {/* Body: Identity */}
                  <div className="mb-1">
                    <h3 className="text-base font-bold leading-tight text-foreground line-clamp-1">
                      {dept.name}
                    </h3>
                    <div className="mt-1.5 flex items-center gap-1.5 text-xs text-muted-foreground">
                      <User className="h-3 w-3" />
                      <span className="truncate">Head: {dept.head_name}</span>
                    </div>
                  </div>

                  {/* Footer: Stats Grid */}
                  <div className="grid grid-cols-3 gap-2 rounded-lg bg-muted/30 p-2.5 border border-border/50">
                    <div className="flex flex-col items-center border-r border-border/50 last:border-0">
                      <span className="text-sm font-bold text-foreground">{dept.courses_count}</span>
                      <span className="text-[10px] uppercase tracking-tighter text-muted-foreground font-medium">Courses</span>
                    </div>
                    <div className="flex flex-col items-center border-r border-border/50 last:border-0">
                      <span className="text-sm font-bold text-foreground">{dept.teachers_count}</span>
                      <span className="text-[10px] uppercase tracking-tighter text-muted-foreground font-medium">Faculty</span>
                    </div>
                    <div className="flex flex-col items-center last:border-0">
                      <span className="text-sm font-bold text-foreground">{dept.students_count}</span>
                      <span className="text-[10px] uppercase tracking-tighter text-muted-foreground font-medium">Students</span>
                    </div>
                  </div>
                </div>
              )
            })}

          </div>
          {(departments.length === 0 && !isBusy) &&
            <div className=" flex w-ful flex-col items-center text-muted-foreground">

              <Building className="h-8 w-8 opacity-40" />

              <div className="text-sm font-medium">No Departmet found</div>
              <div className="text-xs">Department insights will appear here once added</div>


            </div>
          }
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Activity className="h-4 w-4 text-primary" />
            System Traffic
          </CardTitle>
        </CardHeader>
        <CardContent>
          <TrafficLogTimeline logs={traffic_logs} isBusy={isBusy} />
        </CardContent>
      </Card>
    </div>
  )
}

function ActivityTimeline({ activities, isBusy }) {
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 3;

  // Pagination Logic
  const totalPages = Math.ceil(activities.length / ITEMS_PER_PAGE);
  const paginatedActivities = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return activities.slice(start, start + ITEMS_PER_PAGE);
  }, [activities, currentPage]);

  return (
    <div className="flex flex-col h-full">
      <div className="space-y-6 flex-1">
        {isBusy ? (
          // 1. Loading State (Shimmer)
          Array(ITEMS_PER_PAGE).fill(0).map((_, i) => (
            <div key={i} className="flex items-start gap-3">
              <Shimmer className="mt-2 h-2 w-2 flex-shrink-0 rounded-full" />
              <div className="min-w-0 flex-1 space-y-2">
                <Shimmer className="h-4 w-1/3" />
                <Shimmer className="h-3 w-3/4" />
              </div>
              <Shimmer className="h-5 w-12" />
            </div>
          ))
        ) : activities.length === 0 ? (
          // 2. No Log Scenario
          <div className="flex flex-col items-center justify-center py-10 text-center">
            <div className="rounded-full bg-muted/50 p-3 mb-3">
              <Clock className="h-5 w-5 text-muted-foreground/40" />
            </div>
            <p className="text-sm font-medium text-foreground">No recent activity</p>
            <p className="text-xs text-muted-foreground max-w-[180px]">
              Logs will appear here once system changes are made.
            </p>
          </div>
        ) : (
          // 3. Active Data State
          paginatedActivities.map((activity, i) => (
            <div key={i} className="group flex items-start gap-3 relative animate-in fade-in slide-in-from-bottom-1">
              {/* Timeline Line Connector */}
              {i !== paginatedActivities.length - 1 && (
                <div className="absolute left-[3.5px] top-4 w-[1px] h-full bg-border/60" />
              )}

              <div className={`mt-1.5 h-2 w-2 flex-shrink-0 rounded-full ring-4 ring-background z-10 
                 ${activity.heading.toLowerCase().includes('delete') ? 'bg-destructive' : 'bg-primary'}`}
              />

              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-foreground leading-none mb-1 tracking-tight">
                  {activity.heading}
                </p>
                <p className="text-[11px] text-muted-foreground leading-relaxed line-clamp-2">
                  {activity.body}
                </p>
              </div>

              <Badge
                variant="outline"
                className="flex-shrink-0 text-[9px] font-mono h-5 bg-muted/20 border-none text-muted-foreground/80"
              >
                {formatTimeAgo(activity.time)}
              </Badge>
            </div>
          ))
        )}
      </div>

      {/* Mini Pagination Footer */}
      {!isBusy && totalPages > 1 && (
        <div className="mt-6 pt-4 border-t flex items-center justify-between">
          <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-widest">
            Page {currentPage} of {totalPages}
          </p>
          <div className="flex gap-1">
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7"
              disabled={currentPage === 1}
              onClick={() => setCurrentPage(p => p - 1)}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7"
              disabled={currentPage === totalPages}
              onClick={() => setCurrentPage(p => p + 1)}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}