"use client"

import { useEffect, useState } from "react"
import { useAuth } from "@/lib/auth-context"
import type { Role } from "@/lib/data"
import { cn, formatDateTime } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { Badge } from "@/components/ui/badge"
import {
  BookOpen,
  Calendar,
  ChevronLeft,
  ClipboardList,
  GraduationCap,
  LayoutDashboard,
  LogOut,
  Menu,
  Bell,
  Users,
  Building2,
  Settings,
  Clock,
  BookPlus,
  CalendarClock,
  DoorOpen,
  Layers,
  Award,
  GitFork,
  Coffee,
  CalendarDays,
  CheckCircle,
  UserCog,
  ShieldCheck,
  Loader2,
  CheckCircle2,
  KeyRound,
  ArrowRight,
} from "lucide-react"
import { departments, getNotificationsForUser } from "@/lib/data"

import GenericController from '@/lib/api-controllers/generic-controller'

// Portal components
import { StudentDashboard } from "@/components/student/student-dashboard"
import { StudentEnrollment } from "@/components/student/student-enrollment"
import { StudentTimetable } from "@/components/student/student-timetable"
import { Notifications } from "@/components/student/student-notifications"
import { TeacherDashboard } from "@/components/teacher/teacher-dashboard"
import { TeacherReschedule } from "@/components/teacher/teacher-reschedule"
import { TeacherTimetable } from "@/components/teacher/teacher-timetable"
import { AdminDashboard } from "@/components/admin/admin-dashboard"
import { AdminCourses } from "@/components/admin/admin-courses"
import { AdminStudents } from "@/components/admin/admin-students"
import { AdminTeachers } from "@/components/admin/admin-teachers"
import { AdminClassrooms } from "@/components/admin/admin-classrooms"
import { AdminDepartments } from "@/components/admin/admin-departments"
import { AdminConfigurations } from "@/components/admin/admin-configurations"
import { AdminTimetableGenerator } from "@/components/admin/admin-timetable-generator"
import { toast } from "sonner"
import { AdminResults } from "./admin/admin-results"
import { AdminClassMerger } from "./admin/admin-class-merger"
import AdminBreaks from "./admin/admin-breaks"
import { AdminTimeTable } from "./admin/admin-timetable"
import AdminRequestedEnrollmentsApproval from "./admin/admin-enrollment-approval"

import { io } from "socket.io-client"
import { NOTIFICATION_SOCKET_ENDPOINT } from "@/lib/constants/backend-constants"
import AdminRescheduleRequest from "./admin/admin-reschedule-requests"
import { AdminAdmins } from "./admin/admin-admins-management"
import { Card } from "./ui/card"
import { UserController } from "@/lib/api-controllers/user.controller"

interface NavItem {
  id: string
  label: string
  icon: typeof LayoutDashboard
}

const NAV_ITEMS: Record<Role, NavItem[]> = {
  student: [
    { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
    { id: "enrollment", label: "Enrollment", icon: BookPlus },
    { id: "timetable", label: "Timetable", icon: Calendar },
    { id: "notifications", label: "Notifications", icon: Bell },
  ],
  teacher: [
    { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
    { id: "timetable", label: "Timetable", icon: Calendar },
    { id: "reschedule", label: "Reschedule", icon: CalendarClock },
    { id: "notifications", label: "Notifications", icon: Bell },

  ],
  admin: [
    { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
    { id: "admins", label: "Admins", icon: UserCog },
    { id: "teachers", label: "Teachers", icon: Users },
    { id: "students", label: "Students", icon: GraduationCap },
    { id: "courses", label: "Courses", icon: BookOpen },
    { id: "classrooms", label: "Classrooms", icon: DoorOpen },
    { id: "departments", label: "Departments", icon: Building2 },
    { id: "breaks", label: "Breaks", icon: Coffee },
    { id: "class-merger", label: "Class Merges", icon: GitFork },
    { id: "results", label: "Results", icon: Award },
    { id: "enrollments", label: "Enrollments", icon: CheckCircle },
    { id: "timetable", label: "Timetable", icon: CalendarDays },
    { id: "reschedule-req", label: "Reschedule Requests", icon: CalendarClock },
    { id: "timetable-gen", label: "Generate Timetable", icon: Layers },
    { id: "notifications", label: "Notifications", icon: Bell },

    { id: "configurations", label: "Configurations", icon: Settings },

  ],
}

const ROLE_LABELS: Record<Role, string> = {
  student: "Student Portal",
  teacher: "Teacher Portal",
  admin: "Admin Portal",
}

export function DashboardShell() {
  const { user, logout } = useAuth()
  const [activePage, setActivePage] = useState("dashboard")
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const [weekDays, setWeekDays] = useState([])






  useEffect(() => {
    async function getAllWeekDays() {
      await new GenericController().getAllWeekDays({
        onSuccess: ((days) => { setWeekDays(days) }), onFailed: (err) => { toast.dismiss(); toast.error("Unable to load week days") }
      })
    }
    getAllWeekDays()
  }, [])

  if (!user) return null
  console.log('user', user)

  const navItems = NAV_ITEMS[user.role]
  const { unreadCount } = useAuth()

  const handleNavClick = (id: string) => {
    setActivePage(id)
    setMobileOpen(false)
  }

  const renderContent = () => {
    switch (user.role) {
      case "student":
        switch (activePage) {
          case "dashboard": return <StudentDashboard />
          case "enrollment": return <StudentEnrollment />
          case "timetable": return <StudentTimetable />
          case "notifications": return <Notifications />
          default: return <StudentDashboard />
        }
      case "teacher":
        switch (activePage) {
          case "dashboard": return <TeacherDashboard />
          case "timetable": return <TeacherTimetable />
          case "reschedule": return <TeacherReschedule />
          case "notifications": return <Notifications />

          default: return <TeacherDashboard />
        }
      case "admin":
        switch (activePage) {
          case "dashboard": return <AdminDashboard />
          case "courses": return <AdminCourses />
          case "admins": return <AdminAdmins />
          case "students": return <AdminStudents />
          case "teachers": return <AdminTeachers week_days={weekDays} />
          case "classrooms": return <AdminClassrooms />
          case "departments": return <AdminDepartments />
          case "breaks": return <AdminBreaks />
          case "results": return <AdminResults />
          case "timetable": return <AdminTimeTable />
          case "class-merger": return <AdminClassMerger />
          case "enrollments": return <AdminRequestedEnrollmentsApproval />
          case "timetable-gen": return <AdminTimetableGenerator />
          case "reschedule-req": return <AdminRescheduleRequest />
          case "notifications": return <Notifications />

          case "configurations": return <AdminConfigurations />

          default: return <AdminDashboard />
        }
      default:
        return null
    }
  }

  const SidebarContent = () => (
    <div className="flex h-full flex-col">
      <div className="flex h-14 items-center gap-2 border-b border-sidebar-border px-4">
        <div className="flex h-8 w-8 items-center justify-center rounded-md bg-sidebar-primary">
          <BookOpen className="h-4 w-4 text-sidebar-primary-foreground" />
        </div>
        {!sidebarCollapsed && (
          <div className="flex flex-col">
            <span className="text-sm font-semibold text-sidebar-foreground">SMAS</span>
            <span className="text-xs text-sidebar-foreground/60">{ROLE_LABELS[user.role]}</span>
          </div>
        )}
      </div>

      <ScrollArea className="flex-1 px-3 py-4">
        <nav className="flex flex-col gap-1">
          {navItems.map((item) => {
            const Icon = item.icon
            const isActive = activePage === item.id
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => handleNavClick(item.id)}
                className={cn(
                  "flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium transition-colors",
                  isActive
                    ? "bg-sidebar-accent text-sidebar-primary"
                    : "text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground"
                )}
              >
                <Icon className="h-4 w-4 shrink-0" />
                {!sidebarCollapsed && (
                  <span className="flex-1 text-left">{item.label}</span>
                )}
                {!sidebarCollapsed && item.id === "notifications" && unreadCount > 0 && (
                  <Badge variant="destructive" className="h-5 min-w-5 justify-center px-1 text-xs">
                    {unreadCount}
                  </Badge>
                )}
              </button>
            )
          })}
        </nav>
      </ScrollArea>

      <div className="border-t border-sidebar-border p-3">
        <div className={cn("flex items-center gap-3", sidebarCollapsed && "justify-center")}>
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-sidebar-accent text-xs font-bold text-sidebar-accent-foreground">
            {user.name.split(" ").map((n) => n[0]).join("")}
          </div>
          {!sidebarCollapsed && (
            <div className="flex flex-1 flex-col overflow-hidden">
              <span className="truncate text-sm font-medium text-sidebar-foreground">{user.name}</span>
              <span className="truncate text-xs text-sidebar-foreground/60">{user.email}</span>
            </div>
          )}
          {!sidebarCollapsed && (
            <Button variant="ghost" size="icon" onClick={logout} className="h-8 w-8 shrink-0 text-sidebar-foreground/60 hover:bg-sidebar-accent hover:text-sidebar-foreground">
              <LogOut className="h-4 w-4" />
              <span className="sr-only">Logout</span>
            </Button>
          )}
        </div>
      </div>
    </div>
  )

  if (!user?.otp_verified) return <ValidatingLayout Status="otp" expires_at={user?.expires_at} role={user?.role} />

  return (
    <div className="flex h-screen bg-background">
      {/* Desktop Sidebar */}
      <aside
        className={cn(
          "hidden flex-col border-r border-border bg-sidebar transition-all duration-300 md:flex",
          sidebarCollapsed ? "w-16" : "w-60"
        )}
      >
        <SidebarContent />
      </aside>

      {/* Main Area */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Top bar */}
        <header className="flex h-14 items-center gap-3 border-b border-border bg-card px-4">
          {/* Mobile menu */}
          <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="md:hidden">
                <Menu className="h-5 w-5" />
                <span className="sr-only">Open menu</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-60 bg-sidebar p-0">
              <SidebarContent />
            </SheetContent>
          </Sheet>

          {/* Collapse toggle (desktop) */}
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            className="hidden h-8 w-8 md:flex"
          >
            <ChevronLeft className={cn("h-4 w-4 transition-transform", sidebarCollapsed && "rotate-180")} />
            <span className="sr-only">Toggle sidebar</span>
          </Button>

          <div className="flex-1">
            <h2 className="text-sm font-semibold text-foreground capitalize">
              {navItems.find((n) => n.id === activePage)?.label ?? "Dashboard"}
            </h2>
          </div>

          <div className="flex items-center gap-2">
            {user.role !== "student" ? null : (
              <Button variant="ghost" size="icon" className="relative" onClick={() => handleNavClick("notifications")}>
                <Bell className="h-4 w-4" />
                {unreadCount > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-destructive text-[10px] text-destructive-foreground">
                    {unreadCount}
                  </span>
                )}
                <span className="sr-only">Notifications</span>
              </Button>
            )}
            <div className="hidden items-center gap-2 sm:flex">
              <span className="text-xs text-muted-foreground">{user.name}</span>
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">
                {user.name.split(" ").map((n) => n[0]).join("")}
              </div>
            </div>
          </div>
        </header>

        {/* Content Area */}
        <main className="flex-1 overflow-auto">
          <div className="p-4 md:p-6">{renderContent()}</div>
        </main>
      </div>
    </div>
  )
}



type AuthStatus = "validating" | "success" | "otp";

interface ValidatingLayoutProps {
  role: string;
  status: AuthStatus;
  onOtpSubmit?: (otp: string) => void;
}

export function ValidatingLayout({ role, Status, expires_at, onOtpSubmit }: ValidatingLayoutProps) {
  const [otpValue, setOtpValue] = useState("");
  const { user, login, logout } = useAuth()
  const [isBusy, setIsBusy] = useState(false)
  const [isResending, setIsResending] = useState(false)
  const [status, setStatus] = useState(Status)

  async function verifyOtp() {
    toast.dismiss()
    setIsBusy(true)
    toast.loading("Verifying OTP. Please wait... ")
    await new UserController().handleVerifyOtp({
      session_token: user?.session_token,
      otp_code: otpValue,
      onSuccess: (({ user }) => {
        toast.dismiss()
        setTimeout(() => {
          login(user)

        }, 2000)
        setStatus('success')
      }), onFailed: (err) => {
        toast.dismiss()
        toast.error(err)
      }
    })
      .finally(() => {
        setIsBusy(false)
      })
  }

  async function resendOtp() {
    toast.dismiss()
    setIsResending(true)
    toast.loading("Requesting for new OTP. Please wait... ")
    await new UserController().handleResendOtp({
      session_token: user?.session_token,
      onSuccess: (({ newExpiry }) => {
        toast.dismiss()
       
        setIsResending(false)
        toast.success("A new OTP has been sent to your email.")
        login({...user,expires_at:newExpiry})
      }), onFailed: (err) => {
        toast.dismiss()
        toast.error(err)
      }
    })
      .finally(() => {
        setIsResending(false)
      })
  }

  return (
    <div className="relative h-screen w-full overflow-hidden bg-[#020617] selection:bg-blue-500/30">
      {/* Background Layer: Grids and Glows */}
      <div className="fixed inset-0 z-0">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#1e293b_1px,transparent_1px),linear-gradient(to_bottom,#1e293b_1px,transparent_1px)] bg-[size:40px_40px] [mask-image:radial-gradient(ellipse_80%_50%_at_50%_0%,#000_70%,transparent_100%)] opacity-20" />
        <div className="absolute -top-[10%] -left-[10%] h-[50%] w-[50%] rounded-full bg-blue-600/10 blur-[120px]" />
        <div className="absolute -bottom-[10%] -right-[10%] h-[50%] w-[50%] rounded-full bg-indigo-600/10 blur-[120px]" />
      </div>

      {/* Content Layer */}
      <main className="relative z-10 flex h-full items-center justify-center p-6">
        <div className="flex w-full max-w-[400px] flex-col items-center space-y-8 text-center">

          {/* Status Icon Container */}
          <div className="relative flex h-20 w-20 items-center justify-center">
            {/* Glass Backdrop */}
            <div className="absolute inset-0 rounded-2xl border border-white/10 bg-white/5  shadow-2xl" />

            {status === "validating" && (
              <div className="relative flex items-center justify-center animate-in fade-in zoom-in duration-500">
                <ShieldCheck className="h-8 w-8 text-white/10" />
                <Loader2 className="absolute h-12 w-12 text-primary animate-spin" />
              </div>
            )}

            {status === "success" && (
              <div className="flex items-center justify-center animate-in zoom-in duration-500">
                <CheckCircle2 className="h-10 w-10 text-emerald-500" />
                <div className="absolute inset-0 rounded-2xl animate-ping border border-emerald-500/20" />
              </div>
            )}

            {status === "otp" && (
              <div className="flex items-center justify-center animate-in slide-in-from-top-4 duration-500">
                <KeyRound className="h-10 w-10 text-amber-500" />
              </div>
            )}
          </div>

          {/* Typography Section */}
          <div className="space-y-2 animate-in fade-in slide-in-from-bottom-4 duration-700">
            <h2 className="text-2xl font-semibold tracking-tight text-white capitalize">
              {status === "validating" && `Authenticating ${role}`}
              {status === "success" && "Access Granted"}
              {status === "otp" && "Verification Required"}
            </h2>
            <p className="text-sm text-slate-400">
              {status === "validating" && "We are preparing your secure environment..."}
              {status === "success" && `Welcome back to the ${role} portal.`}
              {status === "otp" && `Please enter the 6-digit OTP code sent to your email before ${expires_at && formatDateTime(new Date(expires_at))}.`}
            </p>
          </div>

          {/* Interactive Area */}
          <div className="w-full max-w-[280px] animate-in fade-in slide-in-from-bottom-6 duration-1000">
            {/* Loading/Success Bar */}
            {(status === "validating" || status === "success") && (
              <div className="w-full overflow-hidden rounded-full bg-white/5 h-[1px]">
                <div
                  className={cn(
                    "h-full transition-all duration-1000 origin-left",
                    status === "validating" ? "bg-primary/60 animate-progress-loading w-full" : "bg-emerald-500 w-full"
                  )}
                />
              </div>
            )}

            {/* OTP Input Field */}
            {status === "otp" && (
              <div className="space-y-6 animate-in fade-in slide-in-from-bottom-6 duration-1000">
                <div className="space-y-4">
                  {/* OTP Input */}
                  <div className="group relative">
                    <input
                      type="text"
                      maxLength={6}
                      value={otpValue}
                      onChange={(e) => setOtpValue(e.target.value.replace(/\D/g, ""))}
                      placeholder="••••••"
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-center text-xl tracking-[0.5em] text-white placeholder:text-white/10 focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
                    />
                  </div>

                  {/* Primary Action: Verify */}
                  <button
                    onClick={() => verifyOtp(otpValue)}
                    disabled={otpValue.length < 6 || isBusy}
                    className="flex w-full items-center justify-center gap-2 rounded-xl bg-white px-4 py-3 text-sm font-semibold text-black transition-all hover:bg-slate-200 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isBusy ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <>
                        Verify Identity
                        <ArrowRight className="h-4 w-4" />
                      </>
                    )}
                  </button>
                </div>

                {/* Secondary Actions: Resend & Logout */}
                <div className="flex flex-col items-center gap-4">
                  <div className="flex w-full items-center justify-between px-1">
                    {/* Resend Logic */}
                    <button
                      onClick={resendOtp}
                      disabled={isBusy || isResending}
                      className="text-[11px] font-medium uppercase tracking-wider text-primary hover:text-primary/80 disabled:text-slate-500 disabled:no-underline transition-all"
                    >
                      {isResending?"Resending OTP code ":"Resend Code"}
                    </button>

                    {/* Separator Dot */}
                    <div className="h-1 w-1 rounded-full bg-white/10" />

                    {/* Logout / Switch Account */}
                    <button
                      onClick={logout}
                      className="text-[11px] font-medium uppercase tracking-wider text-slate-400 hover:text-white transition-all"
                    >
                      Sign Out
                    </button>
                  </div>

                  {/* Minimalistic Help Text */}
                  <p className="text-[11px] text-slate-600 text-center leading-relaxed">
                    Having trouble? Ensure you are checking the <br />
                    email associated with your <span className="text-slate-400">{role}</span> account.
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Footer Status */}
          <p className="text-[10px] uppercase tracking-[0.3em] text-slate-500">
            {status === "validating" && "Initializing Workspace"}
            {status === "success" && "Redirecting to Dashboard"}
            {status === "otp" && "Identity Confirmation"}
          </p>
        </div>
      </main>
    </div>
  );
}