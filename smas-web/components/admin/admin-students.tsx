"use client"

import { useEffect, useMemo, useState } from "react"
import {
  students as initialStudents,
  departments,
  courses,
  getDepartmentById,
  getCourseById,
  type Student,
} from "@/lib/data"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog"
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select"
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table"
import { Search, Plus, Pencil, Trash2, EyeOff, Eye, Copy, GraduationCap, FilterX } from "lucide-react"
import { toast } from "sonner"
import DepartmentController from "@/lib/api-controllers/department-controller"
import StudentController from "@/lib/api-controllers/student-controller"
import { EmailValidator, NameValidator, PasswordStrengthValidator, PasswordValidator } from '@/lib/utils/fields-validators.js'
import DeleteConfirmDialog from "../common/helper/confirm-delete-dialog"
import StudentRowShimmer from "../ui/loading-shimmers/student-row-shimmer"
import { generateHslColors, getNumberPosPostfixes, safeParseJsonArray } from "@/lib/utils"
import Paginator from "../common/helper/paginator"

export function AdminStudents() {
  const [students, setStudents] = useState([])
  const [search, setSearch] = useState("")
  const [deptFilter, setDeptFilter] = useState("all")
  const [semFilter, setSemFilter] = useState("all")
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editing, setEditing] = useState<Student | null>(null)
  const [departments, setDepartments] = useState([])

  const [studentToDelete, setStudentToDelete] = useState(null)
  const [openDeleteDialog, setDeleteDialog] = useState(false)

  const [formName, setFormName] = useState("")
  const [formEmail, setFormEmail] = useState("")
  const [formPassword, setFormPassword] = useState("")
  const [formDept, setFormDept] = useState("")
  const [formSemester, setFormSemester] = useState("1")
  const [showPassword, tooglePasswordVisiblity] = useState(false)

  const [isBusy, setisBusy] = useState(true) // Global loading
  const [isRequesting, setisRequesting] = useState(false) // Global loading



  const filtered = useMemo(() => {
    return students.filter((s) => {
      console.log('search', search)
      const matchesSearch = s.name.toLowerCase().includes(search.toLowerCase()) || s.email.toLowerCase().includes(search.toLowerCase())
      const matchesDept = deptFilter === "all" || s.department_id === deptFilter
      const matchesSem = semFilter === "all" || Number(s.semester) == Number(semFilter)
      return matchesSearch && matchesDept && matchesSem
    })
  }, [students, deptFilter, semFilter,search])
  // Logic For Pagination 
  const [currentPage, setCurrentPage] = useState(1)
  const ITEMS_PER_PAGE = 7
  // Pagination Logic
  const totalPages = Math.ceil(filtered.length / ITEMS_PER_PAGE)
  const paginated = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE
    return filtered.slice(start, start + ITEMS_PER_PAGE)
  }, [filtered, currentPage])





  useEffect(() => {
    console.log('--CALLING ALL DEPT--')
    setisBusy(true)
    async function getAllDepartments() {
      await new DepartmentController().getAllDepartmentsOverview({
        onSuccess: (data: any) => { setDepartments(data) },
        onFailed: (err: any) => { console.log('err', err) }
      })
      setisBusy(false)
    }
    getAllDepartments()

  }, [])

  useEffect(() => {
    console.log('--CALLING ALL STD--')
    setisBusy(true)
    async function getAllStudents() {
      await new StudentController().getAllStudents({
        onSuccess: (data: any) => { setStudents(data) },
        onFailed: (err: any) => { console.log('err', err) }
      })
      setisBusy(false)
    }
    getAllStudents()
  }, [])



  const resetForm = () => {
    setFormName("")
    setFormEmail("")
    setFormDept("")
    setFormPassword("")
    tooglePasswordVisiblity(false)
    setFormSemester("1")
    setEditing(null)
    setStudentToDelete(null)
  }

  const openAdd = () => { resetForm(); setDialogOpen(true) }

  const openEdit = (student: Student) => {
    setEditing(student)
    setFormName(student.name)
    setFormEmail(student.email)
    setFormDept(student.department_id)
    setFormPassword(student.password ?? "")
    setFormSemester(String(student.semester))
    setDialogOpen(true)
  }

  const handleSave = async () => {
    if (!formName || !formEmail || !formDept || !formPassword) {
      toast.error("Please fill all required fields.")
      return
    }
    if (!NameValidator(formName, () => { toast.error("Name is not valid. Please enter a valid name.") })) return
    if (!EmailValidator(formEmail, () => { toast.error("Email is not valid. Please enter a valid email.") })) return
    if (!PasswordValidator(formPassword)) return toast.error(" Password length must be equal to 8 charecters.")
    if (editing) {

      const payload = { name: formName, email: formEmail, department_id: formDept, semester: formSemester, password: formPassword }
      toast.loading("Updating student record. Please wait...")
      setDialogOpen(false)
      setisRequesting(true)
      await new StudentController().updateStudent({
        id: editing.id,
        payload,
        onSuccess: (data) => {
          toast.dismiss()
          toast.success("Student Updated.")
          setStudents((prev) => prev.map(s => s.id == editing.id ? data.student : s))
          resetForm()
          setEditing(null)
        },
        onFailed: (err) => {
          toast.dismiss()

          toast.error(err);
          setTimeout(() => {
            setDialogOpen(true)

          }, 2000);
        },
      })
      setisRequesting(false)

      setTimeout(() => {
        toast.dismiss()
      }, 3000);

    } else {

      const payload = { name: formName, email: formEmail, department_id: formDept, semester: formSemester, password: formPassword }
      toast.loading("Saving student record. Please wait...")
      setDialogOpen(false)
      setisRequesting(true)

      await new StudentController().createStudent({
        payload,
        onSuccess: (data) => {
          toast.dismiss()
          toast.success("Student record added.")
          const department = departments.find(d => d.id === formDept);
          const department_name = department?.name ?? "--";
          const newStudent = {
            id: data.user_id,
            name: formName,
            email: formEmail,
            departmentId: formDept,
            department_name,
            password: formPassword,
            semester: Number(formSemester),
            enrolledCourses: [],
            completedCourses: [],
          }
          setStudents((prev) => [...prev, newStudent])
          resetForm()

        },
        onFailed: (err) => {
          toast.dismiss()
          toast.error(err);
          setTimeout(() => {
            setDialogOpen(true)

          }, 2000);

        },
      })
      setisRequesting(false)

      setTimeout(() => {
        toast.dismiss()
      }, 3000);

    }
  }

  const handleCopy = async (text_string) => {
    try {
      await navigator.clipboard.writeText(text_string);

      toast.success("Student credentials copied to clipboard")
    } catch (err) {
      toast.error("Failed to copy!");
    }
  };

  const handleDelete = async () => {
    if (!studentToDelete) return toast.error("Something went wrong. Please try again!")
    toast.loading("Deleting student record. Please wait!")
    setisRequesting(true)

    await new StudentController().deleteStudent({
      id: studentToDelete.id,
      onSuccess: (data) => {
        toast.dismiss()

        toast.success("Student record has been deleted.")
        setStudents((prev) => prev.filter((s) => s.id !== studentToDelete.id))
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

    setStudentToDelete(null)
  }

  const resetFilters = () => {
    // setSearch("")
    setDeptFilter("all")
    setSemFilter("all")
    setSearch("")
  }

  return (
    <div className="space-y-6">
      <DeleteConfirmDialog
        title="Delete Student Record"
        description={`This will permanently erase ${studentToDelete?.name}'s all records.`}
        open={openDeleteDialog}
        onOpenChange={setDeleteDialog}
        confirmationKeyword="CONFIRM Delete"
        onConfirm={() => { handleDelete() }}
      />
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Students Management</h1>
          <p className="text-sm text-muted-foreground">{students.length} total students</p>
        </div>
        <Button disabled={(isRequesting || isBusy)} onClick={openAdd}>
          <Plus className="mr-2 h-4 w-4" /> Add Student
        </Button>
      </div>

      <Card>
        <CardHeader className="space-y-2">
          {/* Controls Container */}
          <div className="grid grid-cols-1 gap-x-3 gap-y-1 sm:grid-cols-2 md:flex md:items-center md:gap-4">

            {/* Search Input - Expands to fill available space on desktop */}
            <div className="relative flex-1 sm:col-span-2 md:flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search students..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9 w-full"
              />
            </div>

            {/* Department Filter */}
            <Select value={deptFilter} onValueChange={setDeptFilter}>
              <SelectTrigger className="w-full md:w-48">
                <SelectValue placeholder="All Departments" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Departments</SelectItem>
                {departments.map((d) => (
                  <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Semester Filter */}
            <Select value={semFilter} onValueChange={setSemFilter}>
              <SelectTrigger className="w-full md:w-48">
                <SelectValue placeholder="All Semesters" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Semesters</SelectItem>
                {[1, 2, 3, 4, 5, 6, 7, 8].map((d) => (
                  <SelectItem key={d} value={String(d)}>
                    {d}{getNumberPosPostfixes(d)} Semester
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Reset Button Container - Aligns perfectly based on screen size */}
          {(deptFilter !== "all" || semFilter !== "all" || search !== '') && (
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
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead className="hidden sm:table-cell">Email</TableHead>
                  <TableHead>Department</TableHead>
                  <TableHead className="hidden md:table-cell">Semester</TableHead>
                  <TableHead className="hidden lg:table-cell">Enrolled</TableHead>
                  <TableHead className="hidden lg:table-cell">Completed</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isBusy ? (
                  // Shimmer State
                  Array(5).fill(0).map((_, i) => (
                    <StudentRowShimmer key={i} />
                  ))
                ) :
                  paginated.map((student, i) => {
                    const dept = student.department_code ?? student.department_name ?? ""
                    if (studentToDelete?.id == student.id && isRequesting) return <StudentRowShimmer key={i} />
                    if (editing?.id == student.id && isRequesting) return <StudentRowShimmer key={i} />

                    const colors = generateHslColors(student?.department_id ?? i)

                    return (
                      <TableRow key={student.id} className="hover:bg-accent/30">
                        <TableCell className="font-medium text-foreground">{student.name}</TableCell>
                        <TableCell className="hidden sm:table-cell text-sm text-muted-foreground">{student.email}</TableCell>
                        <TableCell>
                          <Badge variant="outline" style={{ borderColor: colors.border, color: colors.text }}>{dept}</Badge>
                        </TableCell>
                        <TableCell className="hidden md:table-cell text-sm text-muted-foreground">{student.semester}{getNumberPosPostfixes(student.semester)}</TableCell>
                        <TableCell className="hidden lg:table-cell">
                          <div className="flex flex-wrap gap-1">
                            {safeParseJsonArray(student.enrolledCourses).map((cId) => {
                              const colors = generateHslColors(cId)


                              return <Badge key={cId} style={{ borderColor: colors?.border, color: colors?.text }} variant="outline" className="text-[10px] h-5 px-1.5 font-mono">{cId}</Badge>
                            })}
                            {safeParseJsonArray(student.enrolledCourses).length == 0 && <div>No enrollment</div>}
                            {/* {student. == 0 && <span className="hidden lg:table-cell text-xs text-muted-foreground"> No Enrollment</span>} */}
                          </div>
                        </TableCell>
                        <TableCell className="hidden lg:table-cell text-sm text-muted-foreground">
                          {safeParseJsonArray(student.completedCourses).length} courses
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-1">
                            <Button variant="ghost" size="icon" className="h-8 w-8 text-green-400 hover:text-green-500" onClick={() => handleCopy(`Email : ${student.email ?? ""} | Password : ${student.password ?? ""}`)}>
                              <Copy className="h-3.5 w-3.5" />
                              <span className="sr-only">Copy</span>
                            </Button>
                            <Button disabled={(isBusy || isRequesting)} variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEdit(student)}>
                              <Pencil className="h-3.5 w-3.5" />
                              <span className="sr-only">Edit</span>
                            </Button>
                            <Button disabled={(isBusy || isRequesting)} variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive" onClick={() => { setDeleteDialog(true); setStudentToDelete(student) }}>
                              <Trash2 className="h-3.5 w-3.5" />
                              <span className="sr-only">Delete</span>
                            </Button>


                          </div>
                        </TableCell>
                      </TableRow>
                    )
                  })}
                {(paginated.length === 0 && !isBusy) &&
                  <TableRow>
                    <TableCell colSpan={7} className="h-32 text-center">
                      <div className="flex flex-col items-center justify-center gap-2 text-muted-foreground">

                        <GraduationCap className="h-8 w-8 opacity-40" />

                        <div className="text-sm font-medium">No students found</div>
                        <div className="text-xs">Students will appear here once added</div>

                        <Button
                          variant="outline"
                          size="sm"
                          className="mt-2"
                          onClick={() => openAdd()}
                        >
                          Add Student
                        </Button>

                      </div>
                    </TableCell>
                  </TableRow>
                }

              </TableBody>
            </Table>
          </div>
          {/* ----------Pagination  */}
          <Paginator
            totalItems={filtered.length}
            currentPage={currentPage}
            itemsPerPage={ITEMS_PER_PAGE}
            onPageChange={setCurrentPage}
            label="Students"
          />
        </CardContent>
      </Card>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{editing ? "Edit Student" : "Add New Student"}</DialogTitle>
            <DialogDescription>{editing ? "Update student details." : "Add a new student to the system."}</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4">
            <div className="space-y-2">
              <Label>Name *</Label>
              <Input value={formName} onChange={(e) => setFormName(e.target.value)} placeholder="Full name" />
            </div>
            <div className="space-y-2">
              <Label>Email *</Label>
              <Input value={formEmail} onChange={(e) => setFormEmail(e.target.value)} placeholder="Email address" type="email" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password *</Label>
              <div className="relative">
                <Input
                  id="password"
                  value={formPassword}
                  onChange={(e) => setFormPassword(e.target.value)}
                  placeholder="Set a password"
                  type={showPassword ? "text" : "password"}
                  className="pr-10" // Add padding to the right so text doesn't overlap the icon
                />
                <button
                  type="button"
                  onClick={() => tooglePasswordVisiblity(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 focus:outline-none"
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
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
              <div className="space-y-2">
                <Label>Semester</Label>
                <Select value={formSemester} onValueChange={setFormSemester}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {[1, 2, 3, 4, 5, 6, 7, 8].map((s) => <SelectItem key={s} value={String(s)}>Semester {s}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleSave}>{editing ? "Save Changes" : "Add Student"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
