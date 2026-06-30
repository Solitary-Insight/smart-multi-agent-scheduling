"use client"

import { useEffect, useMemo, useState } from "react"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog"
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table"
import { Search, Plus, Pencil, Trash2, Eye, EyeOff, Copy, User, UserCog, ShieldCheck } from "lucide-react"
import { toast } from "sonner"
import { TeacherController } from "@/lib/api-controllers/teacher.controller"
import { EmailValidator, NameValidator, PasswordValidator } from "@/lib/utils/fields-validators"
import DeleteConfirmDialog from "../common/helper/confirm-delete-dialog"
import TeacherRowShimmer from "../ui/loading-shimmers/teacher-row-shimmer"
import Paginator from "../common/helper/paginator"
import { UserController } from "@/lib/api-controllers/user.controller"
import AdminRowShimmer from "../ui/loading-shimmers/admin-row-shimmer"
import { useAuth } from "@/lib/auth-context"

export function AdminAdmins() {
  const [admins, setAdmins] = useState<any[]>([])
  const [search, setSearch] = useState("")
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editing, setEditing] = useState<any | null>(null)

  const [formName, setFormName] = useState("")
  const [formEmail, setFormEmail] = useState("")
  const [formPassword, setFormPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)

  const [isBusy, setIsBusy] = useState(true)
  const [isRequesting, setIsRequesting] = useState(false)

  const [adminToDelete, setAdminToDelete] = useState<any>(null)
  const [openDeleteDialog, setDeleteDialog] = useState(false)
  const { user } = useAuth()

  // Fetch Admins
  useEffect(() => {
    async function getAdmins() {
      setIsBusy(true)
      await new UserController().getAdmins({
        onSuccess: (data: any) => {
          setAdmins(Array.isArray(data) ? data : [])
        },
        onFailed: () => { }
      })
      setIsBusy(false)
    }
    getAdmins()
  }, [])

  // Filtering
  const filtered = useMemo(() => {
    return admins.filter(
      (u) =>
        u.name.toLowerCase().includes(search.toLowerCase()) ||
        u.email.toLowerCase().includes(search.toLowerCase())
    )
  }, [admins, search])

  // Pagination
  const [currentPage, setCurrentPage] = useState(1)
  const ITEMS_PER_PAGE = 7

  const paginated = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE
    return filtered.slice(start, start + ITEMS_PER_PAGE)
  }, [filtered, currentPage])

  // Reset Form
  const resetForm = () => {
    setFormName("")
    setFormEmail("")
    setFormPassword("")
    setEditing(null)
    setShowPassword(false)
  }

  const openAdd = () => {
    resetForm()
    setDialogOpen(true)
  }

  const openEdit = (user: any) => {
    setEditing(user)
    setFormName(user.name)
    setFormEmail(user.email)
    setFormPassword(user.password_hash)
    setDialogOpen(true)
  }

  // Save
  const handleSave = async () => {
    if (!NameValidator(formName, () => toast.error("Invalid Name. Please enter valid Admin Name."))) return
    if (!EmailValidator(formEmail, () => toast.error("Invalid Email. Please enter valid Email."))) return
    if (!PasswordValidator(formPassword)) return toast.error("Password must be 8 chars")

    const payload = {
      name: formName,
      email: formEmail,
      password: formPassword
    }

    setDialogOpen(false)
    setIsRequesting(true)

    if (editing) {
      toast.loading("Updating Admin. Please wait...")

      await new UserController().updateUser({
        id: editing.id,
        payload,
        onSuccess: () => {
          toast.dismiss()

          toast.success("Admin Record Updated...")
          setAdmins((prev) =>
            prev.map((u) => (u.id === editing.id ? { ...u, ...payload } : u))
          )
          resetForm()
        },
        onFailed: (err) => {
          toast.dismiss()
          setDialogOpen(true)

          toast.error(err)
        }
      })
    } else {
      toast.loading("Creating Admin account. Please wait...")

      await new UserController().createAdmins({
        payload,
        onSuccess: (data) => {
          toast.dismiss()
          toast.success("Admin Account Created Successfully...")
          setAdmins((prev) => [...prev, { ...payload, id: data.user_id }])
          resetForm()
        },
        onFailed: (err) => {
          toast.dismiss()
          setDialogOpen(true)

          toast.error(err)
        }

      })
    }

    setIsRequesting(false)
  }

  // Delete
  const handleDelete = async () => {
    if (!adminToDelete) return

    setIsRequesting(true)
    toast.loading("Deleting Admin Account. Please wait ...")

    await new UserController().deleteUser({
      id: adminToDelete.id,
      onSuccess: () => {
        toast.dismiss()
        toast.success("Admin Account has been deleted successfully.")
        setAdmins((prev) => prev.filter((u) => u.id !== adminToDelete.id))
      },
      onFailed: () => {
        toast.dismiss()
        toast.error("Failed to delete admin account. Please wait...")
      }
    })

    setAdminToDelete(null)
    setIsRequesting(false)
  }

  const handleCopy = async (text: string) => {
    await navigator.clipboard.writeText(text)
    toast.success("Admin Credentials Copied to clipboard.")
  }

  return (
    <div className="space-y-6">
      <DeleteConfirmDialog
        title="Delete Admin"
        description={`Delete ${adminToDelete?.name}?`}
        open={openDeleteDialog}
        onOpenChange={setDeleteDialog}
        confirmationKeyword="CONFIRM"
        onConfirm={handleDelete}
      />

      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">Admins Management</h1>
          <p className="text-sm text-muted-foreground">{admins.length} admins</p>
        </div>
        <Button onClick={openAdd}>
          <Plus className="mr-2 h-4 w-4" /> Add Admin
        </Button>
      </div>

      <Card>
        <CardHeader>
          <div className="relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
        </CardHeader>

        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>

            <TableBody>
              {isBusy ? (
                Array(ITEMS_PER_PAGE).fill(0).map((_, i) => <AdminRowShimmer key={i} />)
              ) : paginated.length === 0 ? (
                <TableRow >
                  <TableCell colSpan={3} className="text-center py-10">
                    <UserCog className="mx-auto h-8 w-8 opacity-40" />
                    <p>No admin found</p>
                  </TableCell>
                </TableRow>
              ) : (
                paginated.map((u, ind) => {
                  // 1. Loading States
                  if (isRequesting && Number(u.id) == Number(editing?.id ?? null)) return <AdminRowShimmer key={ind} />
                  if (isRequesting && Number(u.id) == Number(adminToDelete?.id ?? null)) return <AdminRowShimmer key={ind} />

                  // Check if this row belongs to the current user
                  const isCurrentUser = u.email === user?.email;

                  return (
                    <TableRow className="hover:bg-accent/20" key={ind}>
                      <TableCell className="font-medium">
                        {u.name}
                        {isCurrentUser && (
                          <span className="ml-2 text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full border border-primary/20">
                            You
                          </span>
                        )}
                      </TableCell>
                      <TableCell>{u.email}</TableCell>
                      <TableCell className="text-right flex justify-end gap-1">

                        <Button
                          disabled={isBusy || isRequesting}
                          size="icon"
                          variant="ghost"
                          onClick={() => handleCopy(`Email: ${u.email} | Password: ${u.password_hash}`)}
                        >
                          <Copy className="h-4 w-4" />
                        </Button>

                        <Button
                          disabled={isBusy || isRequesting}
                          size="icon"
                          variant="ghost"
                          onClick={() => openEdit(u)} // Fixed: changed 'user' to 'u' to target the row admin
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>

                        <Button
                          disabled={isBusy || isRequesting || isCurrentUser}
                          size="icon"
                          variant="ghost"
                          onClick={() => {
                            if (isCurrentUser) {
                              toast.dismiss()
                              return toast.error("You cannot delete your own account from here.")
                            }
                            setAdminToDelete(u)
                            setDeleteDialog(true)
                          }}
                        >
                          <Trash2 className={`h-4 w-4 ${isCurrentUser ? 'text-gray-400' : 'text-red-500'}`} />
                        </Button>
                      </TableCell>
                    </TableRow>
                  )
                }))}
            </TableBody>
          </Table>

          <Paginator
            totalItems={filtered.length}
            currentPage={currentPage}
            itemsPerPage={ITEMS_PER_PAGE}
            onPageChange={setCurrentPage}
            label="Admins"
          />
        </CardContent>
      </Card>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-lg border-white/10  text-white shadow-2xl">
          <DialogHeader className="space-y-3">
            {/* Icon Indicator */}
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-600/10 border border-blue-500/20 text-blue-400 mb-2">
              <ShieldCheck className="h-7 w-7" />
            </div>

            <DialogTitle className="text-2xl font-black tracking-tight text-center">
              {editing ? "Modify Administrator" : "Register Administrator"}
            </DialogTitle>

            <DialogDescription className="text-center text-slate-500 text-[10px] uppercase tracking-[0.2em] font-bold">
              {editing ? "Update secure system credentials" : "Create new elevated access profile"}
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-6 py-4">
            {/* Grid for Name and Email */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-1">
                  Full Name *
                </Label>
                <Input
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  placeholder="e.g. Dr. Arshad Ali"
                // className="h-12 border-white/5 bg-black/40 text-white transition-all focus:border-blue-500/40 focus:ring-blue-500/5 placeholder:text-slate-800"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-1">
                  University Email *
                </Label>
                <Input
                  type="email"
                  value={formEmail}
                  onChange={(e) => setFormEmail(e.target.value)}
                  placeholder="admin@stmu.edu.pk"
                // className="h-12 border-white/5 bg-black/40 text-white transition-all focus:border-blue-500/40 focus:ring-blue-500/5 placeholder:text-slate-800"
                />
              </div>
            </div>

            {/* Full width Password Field */}
            <div className="space-y-2">
              <Label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-1">
                System Password *
              </Label>
              <div className="relative">
                <Input
                  type={showPassword ? "text" : "password"}
                  value={formPassword}
                  onChange={(e) => setFormPassword(e.target.value)}
                  placeholder="••••••••"
                // className="h-12 border-white/5 bg-black/40 text-white pr-12 transition-all focus:border-blue-500/40 focus:ring-blue-500/5 placeholder:text-slate-800"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-2 text-slate-600 hover:text-blue-400 transition-colors"
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>
          </div>

          <DialogFooter className="flex flex-col sm:flex-row gap-3 pt-2">
            <Button
              variant="ghost"
              onClick={() => setDialogOpen(false)}
              className="flex-1 h-12 border-white/5 text-slate-400 hover:bg-white/5 hover:text-white transition-all"
            >
              Cancel
            </Button>
            <Button
              onClick={handleSave}
              className="flex-1 h-12 bg-blue-600 hover:bg-blue-500 text-white font-bold transition-all shadow-lg shadow-blue-900/40 active:scale-[0.98]"
            >
              {editing ? "Save Changes" : "Confirm Entry"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
