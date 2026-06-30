"use client"

import { useEffect, useMemo, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Select,
  SelectTrigger,
  SelectContent,
  SelectItem,
  SelectValue
} from "@/components/ui/select"
import {
  Search,
  CheckCircle2,
  XCircle,
  UserPlus,
  GraduationCap,
  RotateCcw,
  FilterX,
  Info,
  X,
  ChartArea,
  LucideArrowUp10,
  LucideArrowUpNarrowWide,
  LucideArrowUpWideNarrow,
  AlertCircle
} from "lucide-react"
import { toast } from "sonner"
import StudentController from "@/lib/api-controllers/student-controller"
import { generateHslColors, getNumberPosPostfixes, safeParseJsonArray } from "@/lib/utils"
import DepartmentController from "@/lib/api-controllers/department-controller"
import InputAutoFill from "../ui/input-auto-fill"
import { Label } from "recharts"
import Paginator from "../common/helper/paginator"
import ResultRowShimmer from "../ui/loading-shimmers/result-row-shimmer"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "../ui/tooltip"

export function AdminResults() {
  // --- Data State ---
  const [students, setStudents] = useState([])
  const [departments, setDepartments] = useState([])
  // status monitoring 

  const [isBusy, setisBusy] = useState(true) // Global loading
  const [isRequesting, setisRequesting] = useState(false) // Global loading

  // --- Filter State ---
  const [search, setSearch] = useState("")
  const [deptFilter, setDeptFilter] = useState("all")
  const [semFilter, setSemFilter] = useState("all")
  const [courseFilter, setCourseFilter] = useState("all")
  const [selectedIds, setSelectedIds] = useState<number[]>([])

  const [selected_student, setSelectedStudent] = useState(null)

  const MAX_SEMESTER = 8;


  function applyFilters() {
    return students
      .filter(s => {
        // 1. Search Match
        const searchLower = search.toLowerCase();
        const matchesSearch = s.student_name.toLowerCase().includes(searchLower) ||
          s.student_email.toLowerCase().includes(searchLower);

        // 2. Department & Semester Match
        const matchesDept = deptFilter === "all" || s.department_id === deptFilter;
        const matchesSem = semFilter === "all" || s.semester.toString() === semFilter;

        // 3. Course Match (Parsing JSON once here for efficiency)
        const courses = safeParseJsonArray(s.enrolled_courses);
        const matchesCrs = courseFilter === "all" ||
          courses.some(c => c.course_code === courseFilter.trim());

        return matchesSearch && matchesDept && matchesSem && matchesCrs;
      })
      .sort((a, b) => a.student_name - b.student_name) // Sort by Semester
      .map(s => {
        const courses = safeParseJsonArray(s.enrolled_courses);

        return {
          ...s,
          // If a specific course is filtered, only show that course in the list
          // Otherwise, show all parsed courses
          enrolled_courses: courseFilter === "all"
            ? courses
            : courses.filter(crs => crs.course_code === courseFilter.trim())
        };
      });
  }

  // --- Logic: Filtering ---
  const filteredStudents = useMemo(applyFilters, [search, deptFilter, semFilter, students, courseFilter]);

  // Logic For Pagination 
  const [currentPage, setCurrentPage] = useState(1)
  const ITEMS_PER_PAGE = 7
  // Pagination Logic
  const totalPages = Math.ceil(filteredStudents.length / ITEMS_PER_PAGE)
  const paginated = useMemo(() => {

    const start = (currentPage - 1) * ITEMS_PER_PAGE
    return filteredStudents.slice(start, start + ITEMS_PER_PAGE)
  }, [filteredStudents, currentPage])


  const [semesters, allEnrolledCoursesMap] = useMemo(() => {
    // 1. Handle Semesters (Unique & Sorted)
    const uniqueSemesters = [...new Set(students.flatMap(s => s.semester))].sort((a, b) => a - b);

    // 2. Handle Courses (Unique & Sorted)
    const uniqueCoursesMap = {}
    // Proper Flattening: Extract all course objects from all students
    const all_courses = students.flatMap(s => safeParseJsonArray(s.enrolled_courses) || []).map(c => {
      uniqueCoursesMap[`${c.course_code}`] = c
    })

    console.log('uniqueCoursesMap', uniqueCoursesMap)
    // Return as a flat pair: [Array, Array]
    return [uniqueSemesters, uniqueCoursesMap];
  }, [students, search]);

  useEffect(() => {
    console.log('--CALLING ALL DEPT--')
    async function getAllDepartments() {
      setisBusy(true)
      await new DepartmentController().getAllDepartmentsOverview({
        onSuccess: (data: any) => { setDepartments(data); },
        onFailed: (err: any) => { console.log('err', err) }
      })
      setisBusy(false)

    }
    getAllDepartments()
  }, [])
  useEffect(() => {
    async function getStudentWithCourses() {
      setisBusy(true)

      await new StudentController().getStudentWithEnrolledCourses(
        {
          onSuccess: (data) => { setStudents(data); console.log('data', data) },
          onFailed: (err) => { toast.dismiss(); toast.error(err.toString()) }
        }
      )
      setisBusy(false)

    }
    getStudentWithCourses()
  }, [])
  // --- Logic: Selection ---
  const toggleAll = () => {
    if (selectedIds.length === filteredStudents.length) setSelectedIds([])
    else setSelectedIds(filteredStudents.map(s => s.student_id))
  }

  const toggleOne = (id: number) => {
    setSelectedIds(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id])
  }


  async function PromoteSelectedStudents() {
    const selected_stds = filteredStudents.filter(s => selectedIds.includes(s.student_id) && Number(s.semester) < MAX_SEMESTER)
    if (selected_stds.length == 0) return toast.error(`Looks like students are already in their final semester. i.e ${MAX_SEMESTER}th Semester.`)
    const payload = selected_stds.map(s => ({
      student_id: s.student_id,
      semester: s.semester,
      // enrolled_courses: safeParseJsonArray(s.enrolled_courses).map(c => c.course_id)
    }))
    toast.dismiss()

    toast.loading(`Promoting ${selected_stds.length} student${selected_stds.length == 1 ? "" : "s"}.${selectedIds.length == selected_stds.length ? " Please wait..." : "Some students were already in their last semester."}`)
    setisRequesting(true)
    await new StudentController().promoteStudents({
      payload,
      onSuccess: (data) => {
        toast.dismiss();
        toast.success(`${data.promotion_count ?? selectedIds.length} student${data.promotion_count ?? selectedIds.length == 1 ? "" : "s"} have been promoted to next semester.`)
        setStudents(prev => {
          return prev.map(s =>
            ((data.student_ids ?? []).includes(Number(s.student_id))) ? { ...s, semester: (Number(s.semester) + 1), isPromoted: true } : s
          )
        })
      },
      onFailed: (err) => { toast.dismiss(); toast.error(`Something went wrong while promoting student${selectedIds.length == 1 ? "" : "s"}. Please try again...`) }
    })
    setisRequesting(false)


  }

  function onPassAndPromoteSuccess(data, student) {
    toast.dismiss();
    toast.success(`${student?.student_name ?? "student"}'s result saved for ${!data.promoted ? "Final" : `${student?.semester} ${getNumberPosPostfixes(student?.semester)}`} semester.`);



    setStudents(prev => {
      return prev.map(s =>
        (s.student_id == data.student_id) ? {
          ...s,
          semester: data.promoted ? (Number(s.semester) + 1) : s.semester,
          enrolled_courses: safeParseJsonArray(s.enrolled_courses).map(c => ({ ...c, course_status: "completed" })),
          passed_and_promoted: true,
        } : s
      )
    })
    setSelectedStudent(null)
  }


  function onResetSuccess(data, student) {
    toast.dismiss();
    toast.success(`${student?.student_name ?? "Student"}'s result has been reset.`);



    setStudents(prev => {
      return prev.map(s =>
        (s.student_id == data.student_id) ? {
          ...s,
          semester: data.isDeproved
            ? (Number(s.semester) - 1) : s.semester,
          enrolled_courses: safeParseJsonArray(s.enrolled_courses).map(c => ({ ...c, course_status: "enrolled" })),
          passed_and_promoted: false,
          isPromoted: false,
          batch_operation: false
        } : s
      )
    })
    setSelectedStudent(null)

  }


  async function passAndPromoteStudent(student) {
    setSelectedStudent(student);

    const is_final_semester = student.semester == MAX_SEMESTER
    const payload = {
      student_id: student.student_id,
      enrolled_courses: safeParseJsonArray(student.enrolled_courses).map(c => c.course_id),
      should_promote: !is_final_semester,
    }
    toast.dismiss()

    toast.loading(`Saving ${student?.student_name ?? "student"} result. Please wait... `)

    setisRequesting(true)
    await new StudentController().passAndPromoteStudent({
      payload,
      onSuccess: (data) => { onPassAndPromoteSuccess(data, student) },
      onFailed: (err) => { toast.dismiss(); toast.error(`Something went wrong while promoting ${student?.student_name ?? "student"}. Please try again...`) }
    })
    setisRequesting(false)


  }



  async function resetStudentResult(student) {
    setSelectedStudent(student);

    const isPromoted = student.isPromoted == true || student.passed_and_promoted == true
    const payload = {
      student_id: student.student_id,
      enrolled_courses: safeParseJsonArray(student.enrolled_courses).map(c => c.course_id),
      shouldSetBack: isPromoted,
    }
    toast.dismiss()

    toast.loading(`Resetting ${student?.student_name ?? "student"} result. Please wait... `)

    setisRequesting(true)
    await new StudentController().resetStudentResult({
      payload,
      onSuccess: (data) => { onResetSuccess(data, student) },
      onFailed: (err) => { toast.dismiss(); toast.error(`Something went wrong while Reseting ${student?.student_name ?? "student"}. Please try again...`) }
    })
    setisRequesting(false)


  }






  async function batchCourseRemarking(remark: "completed" | 'failed') {

    const selected_stds = filteredStudents.filter(s => selectedIds.includes(s.student_id))
    const payload = selected_stds.map(s => ({
      student_id: s.student_id,
      enrolled_courses: safeParseJsonArray(s.enrolled_courses).map(c => c.course_id),
      remark
    }))
    toast.dismiss()
    toast.loading(`Marking ${selectedIds.length} student${selectedIds.length > 1 ? "s" : ''}. Please wait...`)

    await new StudentController().saveBatchRemarks({
      payload,
      onSuccess: (data) => {
        toast.dismiss()
        setStudents(prev => {
          return prev.map(s =>
            (payload.map(p => p.student_id).includes(s.student_id)) ? {
              ...s,
              batch_operation: true,
              enrolled_courses: JSON.stringify(safeParseJsonArray(s.enrolled_courses).map(c => (courseFilter === "all" ||
                c.course_code === courseFilter.trim()) ? ({ ...c, course_status: remark }) : c)),
            } : s
          )
        })
        toast.success(`Marked ${selectedIds.length} student${selectedIds.length > 1 ? "s" : ''} successfully.`)
      },
      onFailed: (err) => {
        toast.dismiss()
        toast.error(`Something went wrong while marking ${selectedIds.length} student${selectedIds.length > 1 ? "s" : ''}. Please try again`)
      }
    })
  }

  const resetFilters = () => {
    setSearch("")
    setDeptFilter("all")
    setCourseFilter("all")
    setSemFilter("all")
  }



  return (
    <div className="  max-w-7xl mx-auto space-y-6">

      {/* Top Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-foreground">Result Compilation</h1>
            <p className="text-sm text-muted-foreground">Manage student academic progress and course clearances.</p>
          </div>
        </div>


        {selectedIds.length > 0 && (
          <div className="flex flex-col items-center gap-2 bg-primary/5 p-2 rounded-lg border border-primary/20 animate-in fade-in slide-in-from-top-2">
            <div className="flex items-center justify-between w-full gap-2">
              <span className="text-sm font-medium ">{selectedIds.length} Selected</span>

              <Button size="sm" variant="outline" className="hover:bg-black hover:text-red-500 text-white" onClick={() => setSelectedIds([])}>
                <X className="w-4 h-4 text-red-500" /> Cancel
              </Button>
            </div>

            <div className="flex gap-1">

              <Button size="sm" variant="outline" onClick={() => batchCourseRemarking('completed')}>
                <CheckCircle2 className="w-4 h-4 mr-1 text-green-500 hidden md:block" /> Pass {selectedIds.length > 1 && "All"}
              </Button>
              <Button size="sm" variant="outline" onClick={() => batchCourseRemarking('failed')}>
                <XCircle className="hidden md:block w-4 h-4 mr-1 text-destructive" /> Fail {selectedIds.length > 1 && "All"}
              </Button>
              <Button size="sm" onClick={PromoteSelectedStudents}>
                <LucideArrowUpWideNarrow className="w-4 h-4 mr-1 hidden md:block" /> Promote
              </Button>
            </div>
          </div>
        )}
      </div>

      <Card className="shadow-md">

        <CardHeader className="  m-0 pb-3 pt-4">
          {/* Header Title Section */}


          {/* Controls Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-x-4 gap-y-3">

            {/* Course Search */}
            <div className="space-y-2">
              <label className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground ml-1">
                Search Fields
              </label>
              <div className="relative lg:col-span-2">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search name, email or ID..."
                  className="pl-9 w-full"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
            </div>

            {/* Teacher Search */}
            <div className="space-y-2">
              <label className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground ml-1">
                Course Filter
              </label>
              <div className="space-y-1.5 lg:col-span-2">
                <InputAutoFill
                  value={courseFilter}
                  onChange={setCourseFilter}
                  placeholder="Filter by Course..."
                  options={Object.values(allEnrolledCoursesMap).map((c) => ({
                    label: `[${c.course_code}] ${c.course_name}`,
                    value: c.course_code,
                  }))}
                />
              </div>
            </div>

            {/* Department Select */}
            <div className="space-y-2">
              <label className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground ml-1">
                Department
              </label>
              <div className="col-span-1 lg:col-span-2">
                <Select value={deptFilter} onValueChange={setDeptFilter}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="All Departments" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Departments</SelectItem>
                    {departments.map((d) => (
                      <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Semester Select */}
            <div className="space-y-2">
              <label className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground ml-1">
                Academic Term
              </label>
              <div className="col-span-1 lg:col-span-2">
                <Select value={semFilter} onValueChange={setSemFilter}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Semester" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Semesters</SelectItem>
                    {semesters.map(num => (
                      <SelectItem key={num} value={num.toString()}> {num}{getNumberPosPostfixes(Number(num))} Semester </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
          <div className="flex items-end flex-col md:flex-row md:items-center justify-between gap-1  ">
            {/* Quick Action / Reset Info */}
            <div className="flex w-full justify-end">
              {(search || deptFilter !== "all" || semFilter !== "all" || courseFilter !== "all") && (
                <div className="flex justify-end">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={resetFilters}
                    className="w-fit h-9 text-xs font-medium border-destructive/20 text-destructive hover:bg-destructive/10 hover:text-destructive transition-colors"
                  >
                    <FilterX className="w-3.5 h-3.5 mr-2" />
                    Reset All Viewport Filters
                  </Button>

                </div>
              )}
            </div>
          </div>
        </CardHeader>

        <CardContent>
          <div className="rounded-md border overflow-x-auto">
            <Table>
              <TableHeader className="bg-muted/50">
                <TableRow>
                  <TableHead className="w-[50px]">
                    <Checkbox
                      disabled={isBusy || isRequesting}

                      checked={selectedIds.length === filteredStudents.length && filteredStudents.length > 0}
                      onCheckedChange={toggleAll}
                    />
                  </TableHead>
                  <TableHead>Student Details</TableHead>
                  <TableHead>Academic Info</TableHead>
                  <TableHead>Enrolled Courses</TableHead>
                  <TableHead className="text-right">Quick Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isBusy ? (
                  // Shimmer State
                  Array(5).fill(0).map((_, i) => (
                    <ResultRowShimmer key={i} />
                  ))
                ) :
                  paginated.map((student, i) => {
                    const sem_colors = generateHslColors(student?.semester ?? i)
                    const dept = departments.filter(d => Number(student.department_id) == Number(d.id))[0]
                    const dep_colors = generateHslColors(dept?.id ?? i)
                    if (isRequesting && selectedIds.includes(student.student_id)) return <ResultRowShimmer key={i} />
                    else if (isRequesting && selected_student?.student_id == student.student_id) return <ResultRowShimmer key={i} />
                    return <TableRow key={student.student_id} className={`${selectedIds.includes(student.student_id) ? "bg-primary/5" : ""} hover:bg-accent/30`}>
                      <TableCell>
                        <Checkbox
                          disabled={isBusy || isRequesting}
                          checked={selectedIds.includes(student.student_id)}
                          onCheckedChange={() => toggleOne(student.student_id)}
                        />
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col">
                          <span className="font-bold">{student.student_name}</span>
                          <span className="text-xs text-muted-foreground">{student.student_email}</span>
                        </div>
                      </TableCell>
                      <TableCell className="flex ">
                        <div className="flex   flex-col gap-2">
                          <Badge className="text-center m-auto text-[10px]  h-5 px-2 font-mono" style={{ borderColor: dep_colors?.border, color: dep_colors?.text }} variant="outline" >
                            {dept?.code ?? ""}
                          </Badge>
                          <Badge className="text-[10px] h-5 px-1.5 font-mono" variant="outline"
                            style={{ borderColor: sem_colors?.border, color: sem_colors?.text }}
                          >

                            {student.semester}{getNumberPosPostfixes(student.semester)}
                          </Badge>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1.5">
                          {safeParseJsonArray(student.enrolled_courses).map((course, indx) => {
                            const colors = generateHslColors(course.course_id ?? indx)

                            return <Badge
                              key={course.course_id}
                              variant={course.course_status == 'completed' ? "success" : course.course_status == 'failed' ? "destructive" : 'outline'}
                              style={(course.course_status == 'completed' || course.course_status == 'failed') ? {} : { borderColor: colors?.border, color: colors?.text }}
                              className="text-[10px] h-5 px-1.5  flex items-center gap-1 py-1 font-mono cursor-pointer hover:opacity-80 "
                            // onClick={() => {
                            //   // Toggle individual course logic
                            //   setStudents(prev => prev.map(s =>
                            //     s.id === student.id
                            //       ? { ...s, courses: s.courses.map(c => c.id === course.id ? { ...c, passed: !c.passed } : c) }
                            //       : s
                            //   ))
                            // }}
                            >
                              {course.course_code}
                              {course.course_status == 'completed' ? <CheckCircle2 className="w-3 h-3  text-blue-500" /> : course.course_status == 'failed' ? <AlertCircle className="w-3 h-3 text-black" /> : <Info className="w-3 h-3 text-yellow-500" />}
                            </Badge>
                          }

                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-right pr-6">
                        <div className="flex justify-end gap-2  group-hover:opacity-100 transition-all duration-300 ease-in-out">
                          <TooltipProvider delayDuration={100}>

                            {/* Reset Result Action */}
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  disabled={(selectedIds.length > 0 || !(student.isPromoted == true || student.batch_operation == true || student.passed_and_promoted == true))}
                                  className="h-8 w-8 rounded-lg text-slate-500 hover:text-slate-700 hover:bg-slate-500/10 border border-transparent hover:border-slate-500/20 transition-all active:scale-95 disabled:opacity-30"
                                  onClick={() => resetStudentResult(student)}
                                >
                                  <RotateCcw size={18} strokeWidth={2.5} />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent side="top" className="bg-slate-700 text-white border-none font-black text-[10px] uppercase tracking-widest">
                                Reset Result
                              </TooltipContent>
                            </Tooltip>

                            {/* Pass and Promote Action */}
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  disabled={(student.passed_and_promoted ?? false) || selectedIds.length > 0 || isRequesting}
                                  className="h-8 w-8 rounded-lg text-indigo-600 hover:text-indigo-700 hover:bg-indigo-500/10 border border-transparent hover:border-indigo-500/20 transition-all active:scale-95 disabled:opacity-30"
                                  onClick={() => passAndPromoteStudent(student)}
                                >
                                  <GraduationCap size={18} strokeWidth={2.5} />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent side="top" className="bg-indigo-600 text-white border-none font-black text-[10px] uppercase tracking-widest">
                                Pass and Promote
                              </TooltipContent>
                            </Tooltip>

                          </TooltipProvider>
                        </div>
                      </TableCell>
                    </TableRow>
                  })
                }
                {(!isBusy && paginated.length == 0) && <TableRow>
                  <TableCell colSpan={8} className="h-32 text-center">
                    <div className="flex flex-col items-center justify-center gap-2 text-muted-foreground">

                      <div className="text-sm font-medium">No Student enrollment available</div>
                      <div className="text-xs">Ask students to enroll course to get started</div>


                    </div>
                  </TableCell>
                </TableRow>}
              </TableBody>
            </Table>
          </div>
          {/* ----------Pagination  */}
          <Paginator
            totalItems={filteredStudents.length}
            currentPage={currentPage}
            itemsPerPage={ITEMS_PER_PAGE}
            onPageChange={setCurrentPage}
            label="Records"
          />
        </CardContent>
      </Card>
    </div>
  )
}