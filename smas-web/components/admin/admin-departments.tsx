"use client"

import { useEffect, useMemo, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Plus, Search, MoreHorizontal, Pencil, Trash2, Building2, Users, BookOpen, GraduationCap } from "lucide-react"
import { toast } from "sonner"
import { teachers, courses } from "@/lib/data"
import DepartmentController from "@/lib/api-controllers/department-controller.js"
import { TeacherController } from "@/lib/api-controllers/teacher.controller"
import InputAutoFill from "../ui/input-auto-fill"
import { generateHslColors, safeSum } from "@/lib/utils"
import DepartmentRowShimmer from "../ui/loading-shimmers/department-row-shimmer"
import { AdminValidator } from "@/lib/validation-controllers/admin-validator"
import DeleteConfirmDialog from "../common/helper/confirm-delete-dialog"
import Paginator from "../common/helper/paginator"


const def_form_vals = { name: "", code: "", headOfDepartment: "" }
export function AdminDepartments() {
  const [departments, setDepartments] = useState([])
  const [search, setSearch] = useState("")
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingDept, setEditingDept] = useState(null)
  const [formData, setFormData] = useState(def_form_vals)

  const [teachers_info, setTeachersInfo] = useState([])
  const [stats, setStats] = useState({ total_dept: 0, total_faculty: 0, total_course: 0, total_students: 0 })

  const [departmentToDelete, setDepartmentToDelete] = useState(null)


  const [openDeleteDialog, setDeleteDialog] = useState(false)


  const [isBusy, setisBusy] = useState(true) // Global loading
  const [isRequesting, setisRequesting] = useState(false) // Global loading


  // one time api caling  
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

  // INFO ----------------------------- 


  useEffect(() => {
    console.log('--CALLING ALL DEPT--')
    async function getAllDepartments() {
      await new DepartmentController().getAllDepartmentsOverview({
        onSuccess: (data: any) => { calculateStats(data); setDepartments(data) },
        onFailed: (err: any) => { console.log('err', err) }
      })
    }
    getAllDepartments()
  }, [])
  const filtered = useMemo(() => {
    return departments.filter(
      (d) =>
        d.name.toLowerCase().includes(search.toLowerCase()) ||
        d.code.toLowerCase().includes(search.toLowerCase())||
        (d.head_name??"").toLowerCase().includes(search.toLowerCase())
    )
  }, [search, departments])

  // Logic For Pagination 
  const [currentPage, setCurrentPage] = useState(1)
  const ITEMS_PER_PAGE = 6
  // Pagination Logic
  const totalPages = Math.ceil(filtered.length / ITEMS_PER_PAGE)
  const paginated = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE
    return filtered.slice(start, start + ITEMS_PER_PAGE)
  }, [filtered, currentPage])

  function calculateStats(data) {
    const students = data.map(d => d.students_count)
    const faculty = data.map(d => d.teachers_count)
    const courses = data.map(d => d.courses_count)
    setStats({
      total_course: safeSum(courses),
      total_dept: data.length,
      total_faculty: safeSum(faculty),
      total_students: safeSum(students)
    })
  }

  function openAdd() {
    setEditingDept(null)
    setFormData({ name: "", code: "", headOfDepartment: "" })
    setDialogOpen(true)
  }

  function openEdit(dept) {
    setEditingDept(dept)
    setFormData({ name: dept.name, code: dept.code, headOfDepartment: dept.head_of_department })
    setDialogOpen(true)
  }


  // call backs 
  function OnDepartmentUpdated(data) {
    const hod = teachers_info.find(t => Number(t.id) == formData.headOfDepartment)

    toast.dismiss()
    setDepartments((prev) =>
      prev.map((d) => (Number(d.id) === Number(editingDept.id) ?
        {
          ...d, head_of_department: formData.headOfDepartment, name: formData.name, code: formData.code, head_name: hod?.name,

        } : d))
    )
    toast.success("Department updated successfully")
    setEditingDept(null)
  }

  function onDepartmentEditFailed(err) {
    toast.dismiss()

    toast.error(err.toString())
    setTimeout(() => {
      setDialogOpen(true)

    }, 2000);
  }

  function OnDepartmentAdded(data) {
    const hod = teachers_info.find(t => Number(t.id) == formData.headOfDepartment)
    const newDept = {
      id: data.department_id,
      ...formData,
      teachers_count: 0,
      head_of_department: hod?.id,
      head_name: hod?.name ?? "",
      courses_count: 0,
      students_count: 0,
    }
    setDepartments((prev) => [newDept, ...prev])
    toast.dismiss()
    toast.success("Department added successfully")

    setFormData(def_form_vals)

  }

  function OnDepartmentAddingFailed(err) {
    toast.dismiss()

    toast.error(err.toString())
    setTimeout(() => {
      setDialogOpen(true)

    }, 2000);
  }

  async function handleSave() {
    const validation_result = AdminValidator.validateDepartmentForm(
      { name: formData.name, code: formData.code, hod: formData.headOfDepartment }
    )
    if (validation_result) return toast.error(validation_result)
    const payload = { name: formData.name, code: formData.code, head_of_department: formData.headOfDepartment }
    toast.loading(`Department is being ${editingDept ? 'Updated' : 'Saved'}. Please wait...`)
    setDialogOpen(false)
    setisRequesting(true)

    if (editingDept) {

      await new DepartmentController().updateDepartment(
        { id: editingDept?.id, payload, onSuccess: OnDepartmentUpdated, onFailed: onDepartmentEditFailed }
      )
    } else {

      await new DepartmentController().createDepartment(
        { payload, onSuccess: OnDepartmentAdded, onFailed: OnDepartmentAddingFailed }
      )

    }
    setDialogOpen(false)
    setisRequesting(false)
  }




  const handleDelete = async () => {
    if (!departmentToDelete) return toast.error("Something went wrong. Please try again!")
    toast.loading("Deleting Department. Please wait!")
    setisRequesting(true)

    await new DepartmentController().deleteDepartment({
      id: departmentToDelete.id,
      onSuccess: (data) => {
        toast.dismiss()

        toast.success("Department deleted")
        setDepartments((prev) => prev.filter((d) => Number(d.id) !== Number(departmentToDelete.id)))
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

    setDepartmentToDelete(null)
  }


  return (
    <div className="space-y-6">

      <DeleteConfirmDialog
        title="Delete Department Permenently?"
        description={`This will permanently erase ${departmentToDelete?.name}. `}
        open={openDeleteDialog}
        onOpenChange={setDeleteDialog}
        confirmationKeyword="CONFIRM Delete"
        onConfirm={() => { handleDelete() }}
      />
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Departments</h1>
          <p className="text-sm text-muted-foreground">Manage university departments and faculties</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button disabled={(isBusy || isRequesting)} className="disabled:bg-primary/50" onClick={openAdd}>
              <Plus className="mr-2 h-4 w-4" />
              Add Department
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editingDept ? "Edit Department" : "Add New Department"}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="dept-name">Department Name</Label>
                <Input
                  id="dept-name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g., Computer Science"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="dept-code">Department Code</Label>
                <Input
                  id="dept-code"
                  value={formData.code}
                  onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                  placeholder="e.g., CS"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="dept-head">Head of Department</Label>
                <InputAutoFill
                  value={formData.headOfDepartment}
                  onChange={(v) => setFormData({ ...formData, headOfDepartment: v })}
                  placeholder="Select Head of Department"
                  options={teachers_info.map((t) => ({
                    label: t.name,
                    value: t.id,
                  }))}
                />

              </div>
            </div>
            <DialogFooter>
              <DialogClose asChild>
                <Button variant="outline">Cancel</Button>
              </DialogClose>
              <Button onClick={handleSave}>{editingDept ? "Update" : "Add"} Department</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-4 sm:grid-cols-4">
        <Card>
          <CardContent className="flex items-center gap-4 p-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
              <Building2 className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">{stats.total_dept}</p>
              <p className="text-xs text-muted-foreground">Total Departments</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-4 p-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-success/10">
              <Users className="h-5 w-5 text-success" />
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">{stats.total_faculty}</p>
              <p className="text-xs text-muted-foreground">Total Faculty</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-4 p-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-300/10">
              <GraduationCap className="h-5 w-5 text-blue-300" />
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">{stats.total_students}</p>
              <p className="text-xs text-muted-foreground">Total Students</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-4 p-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-warning/10">
              <BookOpen className="h-5 w-5 text-warning" />
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">{stats.total_course}</p>
              <p className="text-xs text-muted-foreground">Total Courses</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <CardTitle className="text-base">All Departments</CardTitle>
            <div className="relative w-full sm:w-64">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search departments..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Department</TableHead>
                <TableHead>Code</TableHead>
                <TableHead>Head of Department</TableHead>
                <TableHead className="text-center">Teachers</TableHead>
                <TableHead className="text-center">Courses</TableHead>
                <TableHead className="text-center">Students</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isBusy ? (
                // Shimmer State
                Array(5).fill(0).map((_, i) => (
                  <DepartmentRowShimmer key={i} />
                ))
              ) : paginated.map((dept, indx) => {
                const colors_dpt = generateHslColors(dept?.id ?? indx)
                const colors_std = generateHslColors(stats.total_students)
                const colors_crs = generateHslColors(stats.total_course)
                const colors_fac = generateHslColors(stats.total_faculty)
                if (Number(departmentToDelete?.id) == Number(dept.id) && isRequesting) return <DepartmentRowShimmer key={indx} />
                else if (Number(editingDept?.id) == Number(dept.id) && isRequesting) return <DepartmentRowShimmer key={indx} />

                return <TableRow className="hover:bg-accent/30" key={dept.id}>
                  <TableCell className="font-medium text-foreground">{dept.name}</TableCell>
                  <TableCell>
                    <Badge style={{ borderColor: colors_dpt?.border, color: colors_dpt?.text }} variant="outline">{dept.code}</Badge>
                  </TableCell>
                  <TableCell className="text-muted-foreground">{dept.head_name}</TableCell>

                  {/* ------------------ */}
                  {/* <TableCell className="text-center">
                    <Badge style={{ borderColor: colors_fac?.border, color: colors_fac?.text }} variant="outline">{dept.teachers_count}</Badge>
                  </TableCell>
                  <TableCell className="text-center">
                    <Badge style={{ borderColor: colors_crs?.border, color: colors_crs?.text }} variant="outline">{dept.courses_count}</Badge>
                  </TableCell>
                  <TableCell className="text-center">
                    <Badge style={{ borderColor: colors_std?.border, color: colors_std?.text }} variant="outline">{dept.students_count}</Badge>
                  </TableCell> */}
                    <TableCell className="hidden sm:table-cell text-sm text-center text-muted-foreground">{dept.teachers_count}</TableCell>
                    <TableCell className="hidden sm:table-cell text-sm text-center text-muted-foreground">{dept.courses_count}</TableCell>
                    <TableCell className="hidden sm:table-cell text-sm text-center text-muted-foreground">{dept.students_count}</TableCell>


                  {/* ------------------- */}
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-1">
                      <Button disabled={(isBusy || isRequesting)} variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEdit(dept)}>
                        <Pencil className="h-3.5 w-3.5" />
                        <span className="sr-only">Edit</span>
                      </Button>
                      <Button disabled={(isBusy || isRequesting)} variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive" onClick={() => {
                        setDepartmentToDelete(dept); setDeleteDialog(true);
                      }}>
                        <Trash2 className="h-3.5 w-3.5" />
                        <span className="sr-only">Delete</span>
                      </Button>
                    </div>
                  </TableCell>

                </TableRow>
              })}
              {(!isBusy && filtered.length === 0) && (
                <TableCell colSpan={8} className="h-32 text-center">
                  <div className="flex flex-col items-center justify-center gap-2 text-muted-foreground">

                    <div className="text-sm font-medium">No department available</div>
                    <div className="text-xs">Add your department to get started</div>

                    <Button
                      variant="outline"
                      size="sm"
                      className="mt-2"
                      onClick={openAdd}
                    >
                      Add Department
                    </Button>

                  </div>
                </TableCell>
              )}
            </TableBody>
          </Table>

          {/* ----------Pagination  */}
          <Paginator
            totalItems={filtered.length}
            currentPage={currentPage}
            itemsPerPage={ITEMS_PER_PAGE}
            onPageChange={setCurrentPage}
            label="Departments"
          />
        </CardContent>
      </Card>
    </div>
  )
}
