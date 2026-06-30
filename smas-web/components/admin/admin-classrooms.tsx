"use client"

import { useEffect, useMemo, useState } from "react"
import { type Classroom } from "@/lib/data"
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
import { Search, Plus, Pencil, Trash2 } from "lucide-react"
import { toast } from "sonner"
import { AdminValidator } from "@/lib/validation-controllers/admin-validator"
import { ClassroomController } from "@/lib/api-controllers/classroom.controller"
import DeleteConfirmDialog from "../common/helper/confirm-delete-dialog"
import Paginator from "../common/helper/paginator"
import ClassroomRowShimmer from "../ui/loading-shimmers/classroom-row-shimmer"
import { generateHslColors } from "@/lib/utils"

const TYPE_COLORS: Record<string, string> = {
  lecture: "bg-primary/10 text-primary",
  lab: "bg-success/10 text-success",
  seminar: "bg-warning/10 text-warning",
}

export function AdminClassrooms() {
  const [rooms, setRooms] = useState([])
  const [search, setSearch] = useState("")
  const [dialogOpen, setDialogOpen] = useState(false)

  const [editing, setEditing] = useState<Classroom | null>(null)


  // status monitoring 

  const [isBusy, setisBusy] = useState(true) // Global loading
  const [isRequesting, setisRequesting] = useState(false) // Global loading

  const [roomToDelete, setRoomToDelete] = useState(null)


  const [openDeleteDialog, setDeleteDialog] = useState(false)


  const [formName, setFormName] = useState("")
  const [formBuilding, setFormBuilding] = useState("")
  const [formCapacity, setFormCapacity] = useState("50")
  const [formType, setFormType] = useState<Classroom["type"]>("lecture")
  const [formEquipment, setFormEquipment] = useState("")

  const filtered = useMemo(() => {
    return rooms.filter(
      (r) => JSON.stringify(r).includes(search)
    )
  }, [rooms, search])
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
    setFormName(""); setFormBuilding(""); setFormCapacity("50"); setFormType("lecture"); setFormEquipment(""); setEditing(null)
  }

  const openAdd = () => { resetForm(); setDialogOpen(true) }

  const openEdit = (room: Classroom) => {
    setEditing(room)
    setFormName(room.name)
    setFormBuilding(room.building)
    setFormCapacity(String(room.capacity))
    setFormType(room.type)
    setFormEquipment(room.equipments)
    setDialogOpen(true)
  }


  // on start calls  
  useEffect(() => {
    console.log('--CALLING ALL Classrooms--')
    async function getAllClassrooms() {
      setisBusy(true)
      await new ClassroomController().getAllClassrooms({
        onSuccess: (data: any) => { setRooms(data); },
        onFailed: (err: any) => { console.log('err', err) }
      })
      setisBusy(false)

    }
    getAllClassrooms()
  }, [])


  // callbacks 
  function onClassroomUpdated(data) {
    toast.dismiss()
    const cleanedEquipment = Array.from(
      new Set(
        formEquipment
          .split(",")
          .map(item => item.trim())
          .filter(Boolean)
      )
    ).join(",");
    const updated = { id: data.classroom_id, name: formName, building: formBuilding, capacity: Number(formCapacity), type: formType, equipments: cleanedEquipment, }
    setRooms(prev =>
      prev.map(r =>
        Number(r.id) === Number(data.classroom_id) ? updated : r
      )
    )
    toast.success("Classroom Updated Successfully!")
    resetForm()
  }
  function onClassroomUpdateFailed(err) {
    toast.dismiss()
    toast.success("Classroom Updating Failed!")
    setTimeout(() => {
      setDialogOpen(true)
    }, 2000);
  }


  // callbacks 
  function onClassroomCreated(data) {
    const cleanedEquipment = Array.from(
      new Set(
        formEquipment
          .split(",")
          .map(item => item.trim())
          .filter(Boolean)
      )
    ).join(",");
    toast.dismiss()
    const newRoom = { id: data.classroom_id, name: formName, building: formBuilding, capacity: Number(formCapacity), type: formType, equipments: cleanedEquipment, }
    setRooms((prev) => [newRoom, ...prev])
    toast.success("Classroom Added Successfully!")
    resetForm()
  }
  function onClassroomCreationFailed(err) {
    toast.dismiss()
    toast.success("Classroom Adding Failed!")
    setTimeout(() => {
      setDialogOpen(true)
    }, 2000);
  }

  const handleSave = async () => {
    const cleanedEquipment = Array.from(
      new Set(
        formEquipment
          .split(",")
          .map(item => item.trim())
          .filter(Boolean)
      )
    ).join(",");
    
    setFormEquipment(cleanedEquipment);

    const validation_result = AdminValidator.validateClassroomForm(
      { name: formName, building: formBuilding, type: formType, capacity: formCapacity }
    )
    if (validation_result) return toast.error(validation_result)
    const payload = { name: formName, building: formBuilding, type: formType, capacity: formCapacity, equipments: cleanedEquipment }

    toast.loading(`Classroom is being ${editing ? 'Updated' : 'Saved'}. Please wait...`)
    if (editing) {
      setDialogOpen(false)
      setisRequesting(true)
      await new ClassroomController().updateClassroom({
        id: editing?.id,
        payload, onSuccess: onClassroomUpdated, onFailed: onClassroomUpdateFailed
      })
      setisRequesting(false)
    } else {
      setDialogOpen(false)
      await new ClassroomController().createClassroom({
        payload, onSuccess: onClassroomCreated, onFailed: onClassroomCreationFailed
      })

    }

  }


  const handleDelete = async () => {
    if (!roomToDelete) return toast.error("Something went wrong. Please try again!")
    toast.loading("Removing room. Please wait!")
    setisRequesting(true)

    await new ClassroomController().deleteClassroom({
      id: roomToDelete.id,
      onSuccess: (data) => {
        toast.dismiss()
        toast.success("Classroom has been removed.")
        setRooms((prev) => prev.filter((c) => Number(c.id) !== Number(roomToDelete?.id)))
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

    setRoomToDelete(null)
  }


  return (
    <div className="space-y-6">
      <DeleteConfirmDialog
        title="Delete Classroom Permenently?"
        description={`This will permanently erase room ${roomToDelete?.name}. `}
        open={openDeleteDialog}
        onOpenChange={setDeleteDialog}
        confirmationKeyword="CONFIRM Delete"
        onConfirm={() => { handleDelete() }}
      />
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Classrooms Management</h1>
          <p className="text-sm text-muted-foreground">{rooms.length} total classrooms</p>
        </div>
        <Button disabled={(isBusy || isRequesting)} className="disabled:bg-primary/50" onClick={openAdd}>
          <Plus className="mr-2 h-4 w-4" /> Add Classroom
        </Button>
      </div>

      <Card>
        <CardHeader>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input placeholder="Search classrooms..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Building</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead className="hidden sm:table-cell">Capacity</TableHead>
                  <TableHead className="hidden md:table-cell">Equipment</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isBusy ? (
                  // Shimmer State
                  Array(5).fill(0).map((_, i) => (
                    <ClassroomRowShimmer key={i} />
                  ))
                ) : paginated.map((room, indx) => {
                  if (Number(roomToDelete?.id) == Number(room.id) && isRequesting) return <ClassroomRowShimmer key={indx} />
                  else if (Number(editing?.id) == Number(room.id) && isRequesting) return <ClassroomRowShimmer key={indx} />

                  return <TableRow key={room.id} className="hover:bg-accent/30">
                    <TableCell className="font-medium text-foreground">{room.name}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">{room.building}</TableCell>
                    <TableCell>
                      <Badge className={`capitalize text-xs ${TYPE_COLORS[`${room.type.toLowerCase()}`]}`}>{room.type}</Badge>
                    </TableCell>
                    <TableCell className="hidden sm:table-cell text-sm text-muted-foreground">{room.capacity}</TableCell>
                    <TableCell className="hidden md:table-cell">
                      <div className="flex flex-wrap gap-1">
                        {(room.equipments??'').split(',').map((e, i) => {
                          const colors = generateHslColors(e.trim() ?? i)

                          return <Badge key={i} variant="outline" style={{ borderColor: colors?.border, color: colors?.text }} className="text-xs font-mono">
                            {e}
                          </Badge>
                        }
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        <Button disabled={(isBusy || isRequesting)} variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEdit(room)}>
                          <Pencil className="h-3.5 w-3.5" />
                          <span className="sr-only">Edit</span>
                        </Button>
                        <Button disabled={(isBusy || isRequesting)} variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive" onClick={() => {
                          setRoomToDelete(room); setDeleteDialog(true);
                        }}>
                          <Trash2 className="h-3.5 w-3.5" />
                          <span className="sr-only">Delete</span>
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                }
                )}
                {(!isBusy && paginated.length == 0) && <TableRow>
                  <TableCell colSpan={8} className="h-32 text-center">
                    <div className="flex flex-col items-center justify-center gap-2 text-muted-foreground">

                      <div className="text-sm font-medium">No classroom available</div>
                      <div className="text-xs">Add your classroom to get started</div>

                      <Button
                        variant="outline"
                        size="sm"
                        className="mt-2"
                        onClick={openAdd}
                      >
                        Add Classroom
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
            label="Classrooms"
          />
        </CardContent>
      </Card>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{editing ? "Edit Classroom" : "Add New Classroom"}</DialogTitle>
            <DialogDescription>{editing ? "Update classroom details." : "Add a new classroom."}</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Room Name *</Label>
                <Input value={formName} onChange={(e) => setFormName(e.target.value)} placeholder="e.g. Hall A101" />
              </div>
              <div className="space-y-2">
                <Label>Building *</Label>
                <Input value={formBuilding} onChange={(e) => setFormBuilding(e.target.value)} placeholder="e.g. Main Building" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Type</Label>
                <Select value={formType} onValueChange={(v) => setFormType(v as Classroom["type"])}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="lecture">Lecture</SelectItem>
                    <SelectItem value="lab">Lab</SelectItem>
                    <SelectItem value="seminar">Seminar</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Capacity</Label>
                <Input type="number" value={formCapacity} onChange={(e) => setFormCapacity(e.target.value)} />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Equipment (comma-separated)</Label>
              <Input value={formEquipment} onChange={(e) => setFormEquipment(e.target.value)} placeholder="Projector, Whiteboard" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleSave}>{editing ? "Save Changes" : "Add Classroom"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
