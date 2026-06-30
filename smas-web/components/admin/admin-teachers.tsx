"use client"

import { useEffect, useMemo, useState } from "react"
import {
  getDepartmentById,
  getScheduleForTeacher,
  type Teacher,
  DAYS,
} from "@/lib/data"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog"
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table"
import { Search, Plus, Pencil, Trash2, EyeOff, Eye, Copy, Users } from "lucide-react"
import { toast } from "sonner"
import DepartmentController from "@/lib/api-controllers/department-controller"
import { TeacherController } from "@/lib/api-controllers/teacher.controller"
import { EmailValidator, NameValidator, PasswordValidator } from "@/lib/utils/fields-validators"
import { generateHslColors } from "@/lib/utils"
import DeleteConfirmDialog from "../common/helper/confirm-delete-dialog"
import TeacherRowShimmer from "../ui/loading-shimmers/teacher-row-shimmer"
import Paginator from "../common/helper/paginator"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select"
import GenericController from "@/lib/api-controllers/generic-controller"

export function AdminTeachers() {
  const [teacherList, setTeacherList] = useState([])
  const [search, setSearch] = useState("")
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editing, setEditing] = useState<Teacher | null>(null)
  const [deptFilter, setDeptFilter] = useState("all")
  const [week_days, setWeekDays] = useState([])
  const [formName, setFormName] = useState("")
  const [formEmail, setFormEmail] = useState("")
  const [formDepts, setFormDepts] = useState<string[]>([])
  const [formPriorityDays, setFormPriorityDays] = useState<string[]>([])
  const [formTimeStart, setFormTimeStart] = useState("09:00")
  const [formTimeEnd, setFormTimeEnd] = useState("15:00")
  const [formPassword, setFormPassword] = useState("")
  const [showPassword, tooglePasswordVisiblity] = useState(false)

  const [departments, setDepartments] = useState([])

  const [isBusy, setisBusy] = useState(true) // Global loading
  const [isRequesting, setisRequesting] = useState(false) // Global loading


  const [teacherToDelete, setTeacherToDelete] = useState(null)
  const [openDeleteDialog, setDeleteDialog] = useState(false)


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
    console.log('--CALLING ALL Teachers--')
    async function getAllTeachers() {
      setisBusy(true)

      await new TeacherController().getAllTeachers({
        onSuccess: (data: any) => {
          if (!Array.isArray(data)) return [];
          const safeParse = (str) => {
            try {
              const parsed = typeof str === 'string' ? JSON.parse(str) : str;
              return Array.isArray(parsed) ? parsed.filter(item => item !== null) : [];
            } catch (e) {
              return []; // Return empty array on failure
            }
          };
          const processedData = data.map(d => ({ ...d, departmentIds: safeParse(d.departmentIds), priorityDays: safeParse(d.priorityDays) }));
          setTeacherList(processedData); // Or whatever your state setter is
        },
        onFailed: (err: any) => { console.log('err', err) }
      })
      setisBusy(false)

    }
    getAllTeachers()
  }, [])
  const filtered = useMemo(() => {
    return teacherList.filter(
      (t) => {
        const search_match = t.name.toLowerCase().includes(search.toLowerCase()) || t.email.toLowerCase().includes(search.toLowerCase())
        const department_match = (t.departmentIds ?? []).includes(deptFilter) || deptFilter == 'all'

        return search_match && department_match



      }
    )
  }, [teacherList, search, deptFilter])
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
    console.log('--CALLING ALL Teachers--')
    async function getWeekDays() {
      setisBusy(true)

      await new GenericController().getAllWeekDays({
        onSuccess: (data: any) => {
         setWeekDays(data)
        },
        onFailed: (err: any) => { console.log('err', err) }
      })
      setisBusy(false)

    }
    getWeekDays()
  }, [])
  useEffect(() => {
    if (dialogOpen && !editing && week_days.length != 0) {
      const active_days = week_days.filter(d => !d.is_holiday).map(d => d.id)
      console.log(`setting all week active for new teacher ${active_days}`)
      setFormPriorityDays(active_days)
    }

  }, [week_days, dialogOpen, editing])

  const resetForm = () => {
    setFormName("")
    setFormEmail("")
    setFormDepts([])
    setFormPriorityDays([])
    setFormTimeStart("09:00")
    setFormPassword("")
    tooglePasswordVisiblity(false)
    setFormTimeEnd("15:00")
    setEditing(null)
  }

  const openAdd = () => { resetForm(); setDialogOpen(true) }

  const openEdit = (teacher) => {
    setEditing(teacher)
    setFormName(teacher.name)
    setFormEmail(teacher.email)
    setFormDepts(teacher.departmentIds)
    setFormPassword(teacher.password)
    setFormPriorityDays(teacher.priorityDays)
    setFormTimeStart(teacher.priority_time_start)
    setFormTimeEnd(teacher.priority_time_end)
    setDialogOpen(true)
  }

  const handleSave = async () => {

    if (!NameValidator(formName, () => { toast.error("Name is not valid. Please enter a valid name.") })) return
    if (!EmailValidator(formEmail, () => { toast.error("Email is not valid. Please enter a valid email.") })) return
    if (!PasswordValidator(formPassword)) return toast.error(" Password length must be equal to 8 charecters.")
    if (formDepts.length == 0) return toast.error(" Teacher must be belonging to a department.")
    const payload = { name: formName, password: formPassword, email: formEmail, departmentIds: formDepts, priorityDays: formPriorityDays, priorityTimeStart: formTimeStart, priorityTimeEnd: formTimeEnd }
    toast.dismiss()

    if (editing) {

      toast.loading("Updating teacher record. Please wait...")
      setDialogOpen(false)
      setisRequesting(true)
      await new TeacherController().updateTeacher({
        id: editing.id,
        payload,
        onSuccess: (data) => {
          toast.dismiss()
          toast.success("Teacher record Updated.")
          setTeacherList((prev) => prev.map(s => s.id == editing.id ?
            {
              ...s,...payload, id: editing.id,
              priority_time_start: payload.priorityTimeStart,
              priority_time_end: payload.priorityTimeEnd,
            }
            : s))
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
      toast.loading("Saving teacher record. Please wait...")
      setDialogOpen(false)
      setisRequesting(true)



      await new TeacherController().createTeacher({
        payload,
        onSuccess: (data) => {
          toast.dismiss()
          toast.success("Teacher added successfully.")
          const newTeacher: any = {
            id: data.user_id,
            name: formName,
            email: formEmail,
            departmentIds: formDepts,
            password: formPassword,
            priorityDays: formPriorityDays,
            priority_time_start: formTimeStart,
            priority_time_end: formTimeEnd,
          }
          setTeacherList((prev) => [...prev, newTeacher])
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



  const toggleDept = (deptId: string) => {
    setFormDepts((prev) => prev.includes(deptId) ? prev.filter((d) => d !== deptId) : [...prev, deptId])
  }

  const toggleDay = (day: string) => {
    setFormPriorityDays((prev) => prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day])
  }



  const handleDelete = async () => {
    if (!teacherToDelete) return toast.error("Something went wrong. Please try again!")
    toast.loading("Deleting teacher record. Please wait!")
    setisRequesting(true)

    await new TeacherController().deleteTeacher({
      id: teacherToDelete.id,
      onSuccess: (data) => {
        toast.dismiss()

        toast.success("Teacher record has been deleted.")
        setTeacherList((prev) => prev.filter((s) => s.id !== teacherToDelete.id))
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

    setTeacherToDelete(null)
  }
  const handleCopy = async (text_string) => {
    try {
      await navigator.clipboard.writeText(text_string);

      toast.success("Teacher credentials copied to clipboard")
    } catch (err) {
      toast.error("Failed to copy!");
    }
  };

  return (
    <div className="space-y-6">
      <DeleteConfirmDialog
        title="Delete Teacher Record"
        description={`This will permanently erase ${teacherToDelete?.name}'s all records.`}
        open={openDeleteDialog}
        onOpenChange={setDeleteDialog}
        confirmationKeyword="CONFIRM Delete"
        onConfirm={() => { handleDelete() }}
      />
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Teachers Management</h1>
          <p className="text-sm text-muted-foreground">{teacherList.length} total teachers</p>
        </div>
        <Button disabled={(isRequesting || isBusy)} onClick={openAdd}>
          <Plus className="mr-2 h-4 w-4" /> Add Teacher
        </Button>
      </div>

      <Card>
        <CardHeader>

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input placeholder="Search teachers..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
            </div>
            <Select value={deptFilter} onValueChange={setDeptFilter}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="All Departments" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Departments</SelectItem>
                {departments.map((d) => <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead className="hidden sm:table-cell">Email</TableHead>
                  <TableHead>Departments</TableHead>
                  <TableHead className="hidden md:table-cell">Priority Days</TableHead>
                  <TableHead className="hidden lg:table-cell">Classes/Week</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isBusy ? (
                  // Shimmer State
                  Array(5).fill(0).map((_, i) => (
                    <TeacherRowShimmer key={i} />
                  ))
                ) :
                  paginated.map((teacher, i) => {
                    const classCount = getScheduleForTeacher(teacher.id).length
                    if (teacherToDelete?.id == teacher.id && isRequesting) return <TeacherRowShimmer key={i} />
                    if (editing?.id == teacher.id && isRequesting) return <TeacherRowShimmer key={i} />

                    return (
                      <TableRow key={teacher.id} className="hover:bg-accent/30">
                        <TableCell className="font-medium text-foreground">{teacher.name}</TableCell>
                        <TableCell className="hidden sm:table-cell text-sm text-muted-foreground">{teacher.email}</TableCell>
                        <TableCell>
                          <div className="flex flex-wrap gap-1">
                            {departments.filter(d => teacher.departmentIds.includes(d.id)).map((d) => {
                              const dept = d
                              const colors = generateHslColors(d?.id ?? i)

                              return (
                                <Badge key={d.id} variant="outline" style={{ borderColor: colors?.border, color: colors?.text }} className="text-xs">
                                  {dept?.code}
                                </Badge>
                              )
                            })}
                          </div>
                        </TableCell>
                        <TableCell className="hidden md:table-cell text-xs text-muted-foreground">
                          {week_days.map((wd, i) => {
                            const colors = generateHslColors(wd.id)
                            if (teacher.priorityDays.includes(wd.id)) {
                              return (
                                <Badge key={i} variant="outline" style={{ borderColor: colors?.border, color: colors?.text }} className="text-xs m-[2px]">
                                  {wd.name.slice(0, 3)}
                                </Badge>
                              )
                            }
                          })}

                        </TableCell>
                        <TableCell className="hidden lg:table-cell text-sm text-muted-foreground">{teacher.classes_per_week??0}</TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-1">
                            <Button variant="ghost" size="icon" className="h-8 w-8 text-green-400 hover:text-green-500" onClick={() => handleCopy(`Email : ${teacher.email ?? ""} | Password : ${teacher.password ?? ""}`)}>
                              <Copy className="h-3.5 w-3.5" />
                              <span className="sr-only">Copy</span>
                            </Button>
                            <Button disabled={(isBusy || isRequesting)} variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEdit(teacher)}>
                              <Pencil className="h-3.5 w-3.5" />
                              <span className="sr-only">Edit</span>
                            </Button>
                            <Button disabled={(isBusy || isRequesting)} variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive" onClick={() => { setDeleteDialog(true); setTeacherToDelete(teacher) }}>
                              <Trash2 className="h-3.5 w-3.5" />
                              <span className="sr-only">Delete</span>
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    )
                  })}

                {
                  (!isBusy && paginated.length == 0) && <TableRow>
                    <TableCell colSpan={6} className="h-32 text-center">
                      <div className="flex flex-col items-center justify-center gap-2 text-muted-foreground">

                        <Users className="h-8 w-8 opacity-40" />

                        <div className="text-sm font-medium">No teachers found</div>
                        <div className="text-xs">Add teachers to start assigning courses</div>

                        <Button
                          variant="outline"
                          size="sm"
                          className="mt-2"
                          onClick={() => openAdd()}
                        >
                          Add Teacher
                        </Button>

                      </div>
                    </TableCell>
                  </TableRow>
                }
              </TableBody>
            </Table>
          </div>
          <Paginator
            totalItems={filtered.length}
            currentPage={currentPage}
            itemsPerPage={ITEMS_PER_PAGE}
            onPageChange={setCurrentPage}
            label="Teachers"
          />
        </CardContent>
      </Card>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{editing ? "Edit Teacher" : "Add New Teacher"}</DialogTitle>
            <DialogDescription>{editing ? "Update teacher details." : "Add a new teacher to the system."}</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Name *</Label>
                <Input value={formName} onChange={(e) => setFormName(e.target.value)} placeholder="Full name" />
              </div>
              <div className="space-y-2">
                <Label>Email *</Label>
                <Input value={formEmail} onChange={(e) => setFormEmail(e.target.value)} placeholder="Email" type="email" />
              </div>
              <div className="space-y-2 col-span-full">
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
            </div>
            <div className="space-y-2">
              <Label>Departments *</Label>
              <div className="flex flex-wrap gap-3">
                {departments.map((d) => (
                  <label key={d.id} className="flex items-center gap-2">
                    <Checkbox checked={formDepts.includes(d.id)} onCheckedChange={() => toggleDept(d.id)} />
                    <span className="text-sm">{d.name}</span>
                  </label>
                ))}
              </div>
            </div>
            <div className="space-y-2">
              <Label>Priority Days</Label>
              <div className="flex flex-wrap gap-3">
                {week_days.map((day) => (
                  <label key={day.id} className="flex items-center gap-2">
                    <Checkbox className={`text-sm ${day.is_holiday ? "border border-red-500" : ""}`} disabled={day.is_holiday} checked={formPriorityDays.includes(day.id)} onCheckedChange={() => toggleDay(day.id)} />
                    <span className={`text-sm ${day.is_holiday ? "text-red-500" : ""}`}>{day.name}</span>
                  </label>
                ))}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Priority Start Time</Label>
                <Input type="time" value={formTimeStart} onChange={(e) => setFormTimeStart(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Priority End Time</Label>
                <Input type="time" value={formTimeEnd} onChange={(e) => setFormTimeEnd(e.target.value)} />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleSave}>{editing ? "Save Changes" : "Add Teacher"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
