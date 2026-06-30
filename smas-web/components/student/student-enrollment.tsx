"use client"

import { useEffect, useMemo, useState } from "react"
import { useAuth } from "@/lib/auth-context"
import {
  getStudentById,
  getCourseById,
  students,
} from "@/lib/data"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Search, CheckCircle2, XCircle, BookOpen, AlertTriangle } from "lucide-react"
import { toast } from "sonner"
import { CourseController } from "@/lib/api-controllers/course.controller"
import { generateHslColors, safeParseJsonArray } from "@/lib/utils"
import CourseCardShimmer from "../ui/loading-shimmers/course-card-shimmer"
import { CourseCard } from "./components/course-card"
import { CourseDetailDialog } from "./components/course-detail-dialog"
import Paginator from "../common/helper/paginator"
import { TableCell, TableRow } from "../ui/table"
import { SEMESETER_CONFIG_KEY } from "@/lib/constants/keys"
import ConfigurationController from "@/lib/api-controllers/configuration.controller"

export function StudentEnrollment() {
  const { user } = useAuth()
  const [search, setSearch] = useState("")
  const [courses, setCourses] = useState([])
  const [semFilter, setSemFilter] = useState<string>("all")

  const [config, setConfig] = useState(null)

  const [selectedCourse, setSelectedCourse] = useState<string | null>(null)
  const [enrolledIds, setEnrolledIds] = useState<string[]>(() => {
    const student = user ? getStudentById(user.id) : null
    return student?.enrolledCourses ?? []
  })

  if (!user) return null


  const [isBusy, setisBusy] = useState(true) // Global loading
  const [isRequesting, setisRequesting] = useState(false) // Global loading
  const [courseInProcess, setCourseInProcess] = useState(null) // Global loading


  const filteredCourses = useMemo(() => {
    return courses.filter((c) => {
      const matchesSearch =
        c.course_name.toLowerCase().includes(search.toLowerCase()) ||
        c.course_code.toLowerCase().includes(search.toLowerCase())
      const matchesDept = semFilter === "all" || c.semester === semFilter
      return matchesSearch && matchesDept
    })

  }, [courses, search, semFilter])

  // Logic For Pagination 
  const [currentPage, setCurrentPage] = useState(1)
  const ITEMS_PER_PAGE = 5
  // Pagination Logic
  const totalPages = Math.ceil(filteredCourses.length / ITEMS_PER_PAGE)
  const paginated = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE
    return filteredCourses.slice(start, start + ITEMS_PER_PAGE)
  }, [filteredCourses, currentPage])

  function processCourses(data) {
    console.log('data', data);
    (data ?? []).map(course => {
      course.completed = data.filter(c => c.isCompleted).map(c => c.course_code).includes(course.id)

      course.prerequisites = safeParseJsonArray(course.prerequisites)

    })

    setCourses(data)
  }

  // INFO -----One Time Api Calls------------------------ 
  useEffect(() => {
    console.log('--CALLING Available Courses--')
    async function getData() {
      setisBusy(true)

      await Promise.all([
        new ConfigurationController().getConfigurationByKey({
          key: SEMESETER_CONFIG_KEY,
          onSuccess: (data) => { if (data.value) { setConfig(data.value) } },
          onFailed: (err) => { toast.dismiss(); toast.error("Unable to load configuration data..") }
        }), new CourseController().getAvailableCourses({
          student_id: user.id,
          onSuccess: (data: any) => {
            processCourses(data)
          },
          onFailed: (err: any) => { console.log('err', err) }
        })]


      ).finally(() => {
        setisBusy(false)

      })
    }


    getData()
  }, [])


  const withdrawCourse = async (course) => {

    if (!course.enrollment_status == 'enrolled') return toast.error("Course can not be withdrawn without enrollement.")
    toast.dismiss()
    toast.loading("Course is been withdrawn. Please wait...")
    setCourseInProcess(course.course_id)
    const payload = { course_id: Number(course.course_id), student_id: Number(user.id) }
    await new CourseController().withdrawCourse({
      payload,
      onSuccess: (data) => {
        setCourses(prev => {
          return prev.map(c => {
            return (Number(c.course_id) == payload.course_id) ? { ...c, enrollment_status: "new", can_enroll: true } : c
          })
        })
        toast.dismiss(), toast.success("Course withdrawn successfully. Best of luck with remaining courses")
      },
      onFailed: (err) => { toast.dismiss(), toast.success(err) }
    })
    setCourseInProcess(null)
  }

  const handleEnroll = async (course) => {
    if (course.enrollment_status == "completed") return toast.error("Course is already been cleared. Please contact administration for improvement.")
    else if (course.enrollment_status == "enrolled") return toast.error("Course is already been enrolled")
    else if (!course.can_enroll) return toast.error("Course can not be enrolled due to either missing prerequisites or already enrollement.")
    toast.dismiss()
    const requireApproval = (config?.requireApproval ?? false)

    toast.loading(`Course ${requireApproval ? "is being requested for enrollment" : "is being enrolled"}. Please wait...`)
    setCourseInProcess(course.course_id)
    const payload = { course_id: Number(course.course_id), student_id: Number(user.id), requireApproval }
    await new CourseController().enrollCourse({
      payload,
      onSuccess: (data) => {
        setCourses(prev => {
          return prev.map(c => {
            return (Number(c.course_id) == payload.course_id) ? { ...c, enrollment_status: requireApproval ? "requested" : "enrolled", can_enroll: false } : c
          })
        })
        toast.dismiss(), toast.success(`Course ${requireApproval ? "enrollment requested" : "enrolled"} successfully. Best of luck with the course.`)
      },
      onFailed: (err) => { toast.dismiss(), toast.success(err) }
    })
    setCourseInProcess(null)
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">Course Enrollment</h1>
        <p className="text-sm text-muted-foreground">Browse and enroll in available courses</p>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <CardTitle className="text-base">Available Courses in {filteredCourses[0]?.department_name ?? " Your Department"} </CardTitle>
              <CardDescription>{filteredCourses.length} courses found</CardDescription>
            </div>
            <div className="flex gap-2">
              <div className="relative flex-1 sm:w-64">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Search courses..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-9"
                />
              </div>
              <Select value={semFilter} onValueChange={setSemFilter}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="All Departments" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Semesters</SelectItem>
                  {[...new Set(courses.map(c => c.semester))].map((s, id) => (
                    <SelectItem key={id} value={s}>Semester {s}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {isBusy ? (
              // Shimmer State
              Array(5).fill(0).map((_, i) => (
                <CourseCardShimmer key={i} />
              ))
            ) : paginated.map((course, i) => {
              if (courseInProcess != null && Number(courseInProcess) == Number(course.course_id)) return <CourseCardShimmer key={course.course_id} />

              return <CourseCard
                index={i}
                key={course.course_id}
                course={course}
                enrollment_open={config?.enrollmentOpen ?? false}
                requireApproval={config?.requireApproval ?? true}
                disabled_click={courseInProcess != null}
                allCourses={paginated}
                onSelect={setSelectedCourse}
                onEnroll={handleEnroll}
                onWithdraw={withdrawCourse}
              />
            })}
            {(!isBusy && paginated.length === 0) && (
              <div className="flex items-center justify-center w-full py-5">
                <p className="text-gray-500 text-center text-md">
                  No courses available for enrollment. Please contact admin.
                </p>
              </div>
            )}
          </div>
          {/* ----------Pagination  */}
          <Paginator
            totalItems={filteredCourses.length}
            currentPage={currentPage}
            itemsPerPage={ITEMS_PER_PAGE}
            onPageChange={setCurrentPage}
            label="Courses"
          />
        </CardContent>
      </Card>

      {/* Course Detail Dialog */}
      <CourseDetailDialog selectedCourse={selectedCourse} setSelectedCourse={setSelectedCourse} handleWithdraw={withdrawCourse} handleEnroll={handleEnroll} courses={courses} />
    </div >
  )
}
