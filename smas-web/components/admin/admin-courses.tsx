"use client"

import { useEffect, useMemo, useState } from "react"
import {
  courses as initialCourses,
  teachers,

  getCourseById,
  getTeacherById,
  getDepartmentById,
  type Course,
} from "@/lib/data"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Search, Plus, Pencil, Trash2, X, ChevronRight, ChevronLeft, FilterX } from "lucide-react"
import { toast } from "sonner"
import DepartmentController from "@/lib/api-controllers/department-controller"
import CourseRowShimmer from "../ui/loading-shimmers/course-row-shimmer"
import InputAutoFill from "../ui/input-auto-fill"
import { TeacherController } from "@/lib/api-controllers/teacher.controller"
import { CourseController } from "@/lib/api-controllers/course.controller"
import { AdminValidator } from "@/lib/validation-controllers/admin-validator"
import { generateHslColors, getNumberPosPostfixes, safeParseJsonArray } from "@/lib/utils"
import DeleteConfirmDialog from "../common/helper/confirm-delete-dialog"
import Paginator from "../common/helper/paginator"

export function AdminCourses() {
  const [courses, setCourses] = useState<Course[]>([])
  const [enrollmentStats, setEnrollmentStats] = useState({})
  const [search, setSearch] = useState("")
  const [deptFilter, setDeptFilter] = useState("all")
  const [semFilter, setSemFilter] = useState("all")
  const [teacherFilter, setTeacherFilter] = useState("all")


  const [dialogOpen, setDialogOpen] = useState(false)
  const [editing, setEditing] = useState<Course | null>(null)

  // Form state
  const [formName, setFormName] = useState("")
  const [formCode, setFormCode] = useState("")
  const [formDept, setFormDept] = useState("")
  const [formSemester, setFormSemester] = useState("1")
  const [formCredits, setFormCredits] = useState("3")
  const [formTeacher, setFormTeacher] = useState("")
  const [formDescription, setFormDescription] = useState("")
  const [formPrereqs, setFormPrereqs] = useState<string[]>([])
  const [departments, setDepartments] = useState([])

  const [courseToDelete, setCourseToDelete] = useState(null)


  const [openDeleteDialog, setDeleteDialog] = useState(false)


  const [teachers_info, setTeachersInfo] = useState([])



  // status monitoring 

  const [isBusy, setisBusy] = useState(true) // Global loading
  const [isRequesting, setisRequesting] = useState(false) // Global loading


  const filtered = courses.filter((c) => {
    const matchesSearch = JSON.stringify(c).toLowerCase().includes(search.toLowerCase())
    const matchesDept = deptFilter === "all" || c.department_code === deptFilter
    const matchesSem = semFilter === "all" || Number(c.semester) == Number(semFilter)
    const matchesTec = teacherFilter === "all" || Number(c.teacher_id) == Number(teacherFilter)

    return matchesSearch && matchesDept && matchesSem && matchesTec
  }, [courses, deptFilter, semFilter, teacherFilter])

  // Logic For Pagination 
  const [currentPage, setCurrentPage] = useState(1)
  const ITEMS_PER_PAGE = 7
  // Pagination Logic
  const totalPages = Math.ceil(filtered.length / ITEMS_PER_PAGE)
  const paginated = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE
    return filtered.slice(start, start + ITEMS_PER_PAGE)
  }, [filtered, currentPage])


  const resetForm = () => {
    setFormName("")
    setFormCode("")
    setFormDept("")
    setFormSemester("1")
    setFormCredits("3")
    setFormTeacher("")
    setFormDescription("")
    setFormPrereqs([])
    setEditing(null)
  }

  const openAdd = () => {
    resetForm()
    setDialogOpen(true)
  }

  const openEdit = (course: Course) => {
    setEditing(course)
    setFormName(course.course_name)
    setFormCode(course.course_code)
    setFormDept(course.department_id)
    setFormSemester(String(course.semester))
    setFormCredits(String(course.credit_hours))
    setFormTeacher(course.teacher_id)
    setFormDescription(course.description)
    setFormPrereqs(course.prerequisites)
    setDialogOpen(true)
  }



  // callback functions 

  function onCourseEditited(data) {
    const selected_dept = departments.find(d => d.id == formDept)
    const selected_teacher = teachers_info.find(t => t.id == formTeacher)
    const updatedCourse = {
      id: data?.course_id,
      course_name: formName,

      course_code: formCode,
      department_id: formDept,
      department_code: selected_dept?.code ?? "",
      department_name: selected_dept?.name,
      semester: Number(formSemester),
      credit_hours: Number(formCredits),
      teacher_id: formTeacher,
      teacher_name: selected_teacher?.name,
      description: formDescription,
      prerequisites: courses.filter(c => formPrereqs.includes(c.id)).map(c => c.id),
    }
    setCourses(prev => prev.map(c => (Number(c.id) == Number(data.course_id)) ? updatedCourse : c))
    toast.dismiss()
    toast.success("Course Updated Successfully!")
    setDialogOpen(false)
    setEditing(null)
    resetForm()
  }
  function onCourseEditingFailed(err) {
    toast.dismiss()

    toast.error(err)
    setTimeout(() => {
      setDialogOpen(true)

    }, 2000);
  }
  function onCourseAdded(data) {
    const selected_dept = departments.find(d => d.id == formDept)
    const selected_teacher = teachers_info.find(t => t.id == formTeacher)
    const newCourse = {
      id: data.course_id,
      course_name: formName,
      course_code: formCode,
      department_id: formDept,
      department_code: selected_dept?.code ?? "",
      department_name: selected_dept?.name,
      semester: Number(formSemester),
      credit_hours: Number(formCredits),
      teacher_id: formTeacher,
      teacher_name: selected_teacher?.name,
      description: formDescription,
      prerequisites: courses.filter(c => formPrereqs.includes(c.id)).map(c => c.id),
    }
    setCourses((prev) => [newCourse, ...prev])
    toast.dismiss()

    toast.success("Course Added Successfully!")
    setDialogOpen(false)
    resetForm()
  }
  function onCourseAddingFailed(error) {
    toast.dismiss()

    toast.error(error)
    setTimeout(() => {
      setDialogOpen(true)

    }, 2000);
  }
  // ----API CALLINGS 

  useEffect(() => {
    console.log('--CALLING ALL DEPT--')
    async function getAllDepartments() {
      setisBusy(true)
      await new DepartmentController().getAllDepartmentsOverview({
        onSuccess: (data: any) => { setDepartments(data); console.log('data-dept', data) },
        onFailed: (err: any) => { console.log('err', err) }
      })
      setisBusy(false)

    }
    getAllDepartments()
  }, [])



  // load all courses 
  useEffect(() => {
    console.log('--CALLING ALL DEPT--')
    async function getAllCourses() {
      setisBusy(true)
      await Promise.all([
        await new CourseController().getAllCourses({
          onSuccess: (data: any) => {

            (data ?? []).map(d => { d.prerequisites = safeParseJsonArray(d.prerequisites) })
            setCourses(data);
          },
          onFailed: (err: any) => { console.log('err-course', err) }
        }), await new CourseController().getEnrollmentStats({
          onSuccess: (data: any) => {
                 setEnrollmentStats(data)
          },
          onFailed: (err: any) => { console.log('err-course-stats', err) }
        }),
      ])


      setisBusy(false)

    }
    getAllCourses()
  }, [])


  useEffect(() => {
    console.log('--CALLING ALL Teachers Names and Ids--')
    async function getAllTeachersNamesAndIds() {
      setisBusy(true)

      await new TeacherController().getAllTeachersNamesAndIds({
        onSuccess: (data: any) => {
          setTeachersInfo(data)
        },
        onFailed: (err: any) => { console.log('err', err) }
      })
      setisBusy(false)

    }
    getAllTeachersNamesAndIds()
  }, [])

  const handleSave = async () => {
    const validation_result = AdminValidator.validateCourseForm(
      { course_name: formName, course_code: formCode, teacher_id: formTeacher, department_id: formDept }
    )
    if (validation_result) return toast.error(validation_result)
    const payload = { prerequisites: formPrereqs, course_name: formName, course_code: formCode, department_id: formDept, teacher_id: formTeacher, semester: Number(formSemester), credit_hours: Number(formCredits), description: formDescription ?? "" }

    toast.loading(`Course info is being ${editing ? 'Updated' : 'Saved'}. Please wait...`)
    setDialogOpen(false)
    if (editing) {
      toast.dismiss()
      setisRequesting(true)
      await new CourseController().updateCourse(
        { id: editing.id, payload, onSuccess: onCourseEditited, onFailed: onCourseEditingFailed }
      )
      setisRequesting(false)


    } else {
      toast.dismiss()

      await new CourseController().createCourse(
        { payload, onSuccess: onCourseAdded, onFailed: onCourseAddingFailed }
      )
    }

  }


  const handleDelete = async () => {
    if (!courseToDelete) return toast.error("Something went wrong. Please try again!")
    toast.loading("Deleting Course. Please wait!")
    setisRequesting(true)

    await new CourseController().deleteCourse({
      id: courseToDelete.id,
      onSuccess: (data) => {
        toast.dismiss()

        toast.success("Course has been deleted.")
        setCourses((prev) => prev.filter((c) => c.id !== courseToDelete?.id))
      },
      onFailed: (err) => {
        toast.dismiss()

        toast.error("Something went wrong. Please try again!")
      }
    })
    setisRequesting(false)

    setTimeout(() => {
      toast.dismiss()
    }, 3000);

    setCourseToDelete(null)
  }


  const resetFilters = () => {
    // setSearch("")
    setDeptFilter("all")
    setSemFilter("all")
    setTeacherFilter("all")
    setSearch("")
  }


  function getPrerequisitsOfCourse(course) {
    const pre_req = course.prerequisites
    if (pre_req && pre_req.length == 0) return null
    return pre_req

  }
  return (
    <div className="space-y-6">
      <DeleteConfirmDialog
        title="Delete Course Permenently?"
        description={`This will permanently erase ${courseToDelete?.course_name}'s course. `}
        open={openDeleteDialog}
        onOpenChange={setDeleteDialog}
        confirmationKeyword="CONFIRM Delete"
        onConfirm={() => { handleDelete() }}
      />
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Courses Management</h1>
          <p className="text-sm text-muted-foreground">{courses.length} total courses</p>
        </div>
        <Button disabled={(isBusy || isRequesting)} className="disabled:bg-primary/50" onClick={openAdd}>
          <Plus className="mr-2 h-4 w-4" /> Add Course
        </Button>
      </div>

      <Card>
        <CardHeader className="space-y-2">
          {/* Controls Container */}
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:flex lg:items-center lg:gap-4">

            {/* Search Input - Full width on mobile/tablet, expands flexibly on desktop */}
            <div className="relative flex-1 sm:col-span-2 lg:flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search courses..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9 w-full"
              />
            </div>

            {/* Department Filter */}
            <Select value={deptFilter} onValueChange={setDeptFilter}>
              <SelectTrigger className="w-full lg:w-48">
                <SelectValue placeholder="All Departments" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Departments</SelectItem>
                {departments.map((d) => (
                  <SelectItem key={d.id} value={d.code}>{d.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Semester Filter */}
            <Select value={semFilter} onValueChange={setSemFilter}>
              <SelectTrigger className="w-full lg:w-48">
                <SelectValue placeholder="All Semesters" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Semesters</SelectItem>
                {/* Note: Ensure 'departments' mapping here is intentional or swap with your semester data */}
                {[1, 2, 3, 4, 5, 6, 7, 8].map((d) => (
                  <SelectItem key={d} value={String(d)}>
                    {d}{getNumberPosPostfixes(d)} Semester
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Teacher Filter */}
            <div className="flex">
              <InputAutoFill
                value={teacherFilter}
                onChange={setTeacherFilter}
                placeholder="Filter by Teacher"
                options={teachers_info.map((t) => ({
                  label: t.name,
                  value: t.id,
                }))}
              />
            </div>
          </div>

          {/* Reset Button Container - Displays conditionally if any filter is active */}
          {(deptFilter !== "all" || semFilter !== "all" || teacherFilter !== "all" || search !== '') && (
            <div className="flex w-full justify-end animate-in fade-in duration-200">
              <Button
                variant="outline"
                size="sm"
                onClick={resetFilters}
                className="w-full sm:w-auto h-9 text-xs font-medium border-destructive/20 text-destructive hover:bg-destructive/10 hover:text-destructive transition-colors"
              >
                <FilterX className="w-3.5 h-3.5 mr-2" />
                Reset Filters
              </Button>
            </div>
          )}
        </CardHeader>
        <CardContent>
          <div className="flex flex-col justify-between">
            <div className="overflow-x-auto grow ">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Code</TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead className="hidden md:table-cell">Department</TableHead>
                    <TableHead className="hidden sm:table-cell">Teacher</TableHead>
                    <TableHead className="hidden lg:table-cell">Semester</TableHead>
                    <TableHead className="hidden lg:table-cell">Credits</TableHead>
                    <TableHead className="hidden lg:table-cell">Enrolled Students</TableHead>
                    <TableHead className="hidden xl:table-cell">Prerequisites</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isBusy ? (
                    // Shimmer State
                    Array(5).fill(0).map((_, i) => (
                      <CourseRowShimmer key={i} />
                    ))
                  ) : paginated.map((course, indx) => {
                    const colors = generateHslColors(course?.id ?? indx)
                    const colors_Dpt = generateHslColors(course?.department_id ?? indx)
                    if (Number(courseToDelete?.id) == Number(course.id) && isRequesting) return <CourseRowShimmer key={indx} />
                    else if (Number(editing?.id) == Number(course.id) && isRequesting) return <CourseRowShimmer key={indx} />
                    const pre_reqs = getPrerequisitsOfCourse(course)
                    return (
                      <TableRow key={course.id} className="hover:bg-accent/30">


                        <TableCell>
                          <Badge key={course.id} variant="outline" style={{ borderColor: colors?.border, color: colors?.text }} className="text-xs font-mono">
                            {course?.course_code}
                          </Badge>
                        </TableCell>
                        <TableCell className="font-medium text-foreground">{course.course_name}</TableCell>
                        <TableCell className="hidden md:table-cell">
                          <Badge key={course.id} variant="outline" style={{ borderColor: colors_Dpt?.border, color: colors_Dpt?.text }} className="text-xs">
                            {course?.department_code}
                          </Badge>
                        </TableCell>
                        <TableCell className="hidden sm:table-cell text-sm text-muted-foreground">{course?.teacher_name}</TableCell>
                        <TableCell className="hidden lg:table-cell text-sm text-muted-foreground">{course.semester}{getNumberPosPostfixes(course.semester)}</TableCell>
                        <TableCell className="hidden lg:table-cell text-sm text-muted-foreground">{course.credit_hours}</TableCell>{}
                        <TableCell className="hidden lg:table-cell text-sm text-muted-foreground">{enrollmentStats[`${course.id}`]?.enrolled_students	??0}</TableCell>
                        <TableCell className="hidden xl:table-cell">
                          <div className="flex flex-wrap gap-1">


                            {courses.filter(c => (course.prerequisites ?? []).includes(c.id)).map((c) => {

                              const colors = generateHslColors(c?.id ?? indx)

                              return (

                                <Badge key={c.id} variant="outline" style={{ borderColor: colors?.border, color: colors?.text }} className="text-xs">
                                  {c?.course_code}
                                </Badge>)
                            })

                            }
                            {(course.prerequisites ?? []).length === 0 && <span className="text-xs text-muted-foreground">None</span>}
                            {/* {pre_reqs? pre_reqs.join('-'):<span className="text-xs bg-blue-300/10 cursor-default text-muted-foreground rounded-lg px-1  border">None</span>} */}

                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-1">
                            <Button disabled={(isBusy || isRequesting)} variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEdit(course)}>
                              <Pencil className="h-3.5 w-3.5" />
                              <span className="sr-only">Edit</span>
                            </Button>
                            <Button disabled={(isBusy || isRequesting)} variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive" onClick={() => {
                              setCourseToDelete(course); setDeleteDialog(true);
                            }}>
                              <Trash2 className="h-3.5 w-3.5" />
                              <span className="sr-only">Delete</span>
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    )
                  })}
                  {(!isBusy && paginated.length == 0) && <TableRow>
                    <TableCell colSpan={8} className="h-32 text-center">
                      <div className="flex flex-col items-center justify-center gap-2 text-muted-foreground">

                        <div className="text-sm font-medium">No courses available</div>
                        <div className="text-xs">Add your course to get started</div>

                        <Button
                          variant="outline"
                          size="sm"
                          className="mt-2"
                          onClick={openAdd}
                        >
                          Add Course
                        </Button>

                      </div>
                    </TableCell>
                  </TableRow>}
                </TableBody>
              </Table>
            </div>



            {/* ----------Pagination  */}
            <Paginator
              totalItems={filtered.length}
              currentPage={currentPage}
              itemsPerPage={ITEMS_PER_PAGE}
              onPageChange={setCurrentPage}
              label="Courses"
            />
          </div>

        </CardContent>
      </Card>

      {/* Add/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{editing ? "Edit Course" : "Add New Course"}</DialogTitle>
            <DialogDescription>
              {editing ? "Update the course details below." : "Fill in the details to create a new course."}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Course Name *</Label>
                <Input value={formName} onChange={(e) => setFormName(e.target.value)} placeholder="e.g. Data Structures" />
              </div>
              <div className="space-y-2">
                <Label>Course Code *</Label>
                <Input value={formCode} onChange={(e) => setFormCode(e.target.value)} placeholder="e.g. CS201" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Department *</Label>
                <Select value={formDept} onValueChange={setFormDept}>
                  <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                  <SelectContent>
                    {departments.map((d) => <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              {/* <div className="space-y-2">
                <Label>Teacher *</Label>
                <Select value={formTeacher} onValueChange={setFormTeacher}>
                  <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                  <SelectContent>
                    {teachers.map((t) => <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div> */}
              <div className="space-y-2">
                <Label>Teacher *</Label>

                <InputAutoFill
                  value={formTeacher}
                  onChange={setFormTeacher}
                  placeholder="Select teacher"
                  options={teachers_info.map((t) => ({
                    label: t.name,
                    value: t.id,
                  }))}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Semester</Label>
                <Select value={formSemester} onValueChange={setFormSemester}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {[1, 2, 3, 4, 5, 6, 7, 8].map((s) => <SelectItem key={s} value={String(s)}>Semester {s}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Credits</Label>
                <Select value={formCredits} onValueChange={setFormCredits}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {[1, 2, 3, 4, 5].map((c) => <SelectItem key={c} value={String(c)}>{c} credits</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Course Prerequisites ({formPrereqs.length}) *</Label>
              <div className="flex flex-wrap gap-2">
                {courses.filter(c => (formPrereqs.includes(c.id))).map((c, indx) => {
                  const colors = generateHslColors(c?.id ?? indx)


                  return <div
                    key={c.id}
                    className="flex items-center border hover:bg-accent/20 text-accent px-2 py-1 rounded-full text-sm font-medium space-x-1"
                  >
                    <Badge variant="outline" style={{ borderColor: colors?.border, color: colors?.text }} className="text-xs cursor-pointer">
                      {c.course_code}
                    </Badge>
                    <button
                      type="button"
                      className="hover:bg-gray-800  rounded-full p-0.5 text-xs"
                      onClick={() =>
                        setFormPrereqs((prev) => prev.filter((p) => p !== c.id))
                      }
                    >
                      <X className="text-red-500"></X>
                    </button>
                  </div>
                })}
              </div>
              <InputAutoFill
                value={formPrereqs}
                onChange={val => setFormPrereqs(prev => ([val, ...prev]))}
                placeholder="Select Prerequisites"
                options={courses.filter(c => (!formPrereqs.includes(c.id) && (!formDept || c.department_id == formDept) && Number(c.id) != Number(editing?.id))).map((t) => ({
                  label: `[${t.course_code}]  ${t.course_name}`,
                  value: t.id,
                }))}
              />
            </div>

            <div className="space-y-2">
              <Label>Description</Label>
              <Textarea value={formDescription} onChange={(e) => setFormDescription(e.target.value)} placeholder="Course description..." rows={2} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleSave}>{editing ? "Save Changes" : "Add Course"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
