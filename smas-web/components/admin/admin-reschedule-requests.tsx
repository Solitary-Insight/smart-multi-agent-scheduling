import React, { useEffect, useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import {
  Search, Filter, Calendar, Clock, User,
  CheckCircle2, XCircle, MoreVertical,
  ArrowRightLeft, History, FilterX,
  ChevronRight,
  Brain
} from 'lucide-react'

import RescheduleController from "@/lib/api-controllers/reschedule-controller"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import Paginator from '../common/helper/paginator'
import GenericController from '@/lib/api-controllers/generic-controller'
import { formatTimeAgo, formatTimeTo12Hour, generateHslColors, getNumberPosPostfixes } from '@/lib/utils'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '../ui/tooltip'
import Shimmer from '../ui/loading-shimmers/shimmer'
import { toast } from 'sonner'
import InputAutoFill from '../ui/input-auto-fill'
import { TeacherController } from '@/lib/api-controllers/teacher.controller'
import { CourseController } from '@/lib/api-controllers/course.controller'
import { RescheduleAgentDialog } from './sub-components/rescheduler-agent-dialog'

// Custom hook-like status config
const statusConfig = {
  pending: { bg: "bg-amber-500/10", text: "text-amber-600", icon: <Clock size={12} /> },
  approved: { bg: "bg-emerald-500/10", text: "text-emerald-600", icon: <CheckCircle2 size={12} /> },
  rejected: { bg: "bg-red-500/10", text: "text-red-600", icon: <XCircle size={12} /> },
}

export default function AdminRescheduleRequest() {
  const [isBusy, setIsBusy] = useState(true)
  const [isRequesting, setIsRequesting] = useState(false)
  const [requests, setRequests] = useState([])
  const [weekDays, setWeekDays] = useState([])
  const [teachers, setTeachers] = useState([])
  const [courses, setCourses] = useState([])

  const [agentDialog, setAgentDialog] = useState({ isOpen: false, request: null });

  const [selectedReqId, setSelectedReqId] = useState(null)

  // Filter States (Blank for now)

  const [teacherFilter, setTeacherFilter] = useState("all")
  const [statusFilter, setStatusFilter] = useState("all")
  const [courseFilter, setCourseFilter] = useState("all")
  const [search, setSearch] = useState("")



  const [currentPage, setCurrentPage] = useState(1)
  const ITEMS_PER_PAGE = 6


  function handleApprove(request) {
    setAgentDialog({ isOpen: true, request });
  }

  const handleApprovalSuccess = (id) => {
    setRequests(prev => prev.map(r => r.id === id ? { ...r, status: 'approved' } : r));
  };
  // --- Filtering ---
  const filtered_requests = useMemo(() => {
    return requests.filter((req: any) => {
      const search_match = search.trim() == '' || req.slot_id.toString().includes(search) || req.course_names.includes(search)
      const teacher_match = teacherFilter == 'all' || Number(req.teacher_id) == Number(teacherFilter)
      const course_match = courseFilter == 'all' || req.course_codes.split(',').includes(courseFilter)
      const status_match = statusFilter == 'all' || req.status == statusFilter.toLowerCase()
      return search_match && teacher_match && course_match && status_match;
    });
  }, [search, requests, teacherFilter, courseFilter, statusFilter]);

  const paginated = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return filtered_requests.slice(start, start + ITEMS_PER_PAGE);
  }, [filtered_requests, currentPage]);




  useEffect(() => {
    async function loadData() {
      await Promise.all([
        new RescheduleController().getAllRequests({
          onSuccess: (data) => setRequests(data),
          onFailed: (err) => console.error(err)
        }),
        new CourseController().getAllCourses({
          onSuccess: (data) => {
            toast.dismiss()
            setCourses(data)
          }, onFailed: (err) => {
            toast.dismiss()
            console.log('err', err)
            toast.error("Failed to load courses")
          }
        }),
        new TeacherController().getAllTeachersNamesAndIds({
          onSuccess: (data) => setTeachers(data),
          onFailed: (err) => console.error(err)
        }),
        new GenericController().getAllWeekDays({
          onSuccess: (data) => setWeekDays(data),
          onFailed: (err) => console.error(err)
        }),

      ]).finally(() => {
        setIsBusy(false)

      })
    }
    loadData()
  }, [])


  async function rejectRequest(request_id) {
    const status = "rejected"
    setSelectedReqId(request_id)
    setIsRequesting(true)
    const toastId = toast.loading("Rejecting request, please wait...")
    await new RescheduleController().updateRequestStatus({
      request_id,
      status,
      onSuccess: () => {
        setRequests(prev =>
          prev.map(p => Number(p.id) === Number(request_id) ? { ...p, status } : p)
        )
        toast.success("Request rejected successfully", { id: toastId })
      },
      onFailed: (err) => {
        // 4. Error Feedback
        toast.error("Failed to reject request. Please try again!", { id: toastId })
        console.error('Rejection Error:', err)
      }
    }).finally(() => {
      // 5. Release Global Loading
      setIsRequesting(false)
      setSelectedReqId(null)
    })
  }

  return (
    <div className="max-w-7xl mx-auto space-y-6 animate-in fade-in duration-500">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Reschedule Requests</h1>
        <p className="text-sm text-muted-foreground">Manage teacher requests for timetable adjustments.</p>
      </div>


      <Card className="shadow-md border-primary/5">
        <CardHeader className="  m-0 pb-2 pt-4">
          {/* Header Title Section */}
          {isBusy ? <div className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-${4} gap-4`}>
            {[...new Array(4)].map((i) => (
              <div key={i} className="space-y-2">
                <Shimmer className="h-3 w-20 ml-1" /> {/* Label */}
                <Shimmer className="h-10 w-full" />   {/* Input/Select */}
              </div>
            ))}
          </div>
            : <>
              {/* Controls Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-x-4 gap-y-3">

                {/* Course Search */}
                <div className="space-y-2">
                  <label className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground ml-1">
                    Search
                  </label>
                  <Input
                    placeholder="Search by slot_id, course name..."
                    className=" focus:outline-none focus:ring-2 focus:ring-accent "
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                  />
                </div>

                {/* Teacher Search */}
                <div className="space-y-2">
                  <label className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground ml-1">
                    Faculty Member
                  </label>
                  <InputAutoFill
                    value={teacherFilter}
                    onChange={setTeacherFilter}
                    placeholder="Filter by Teacher"
                    options={teachers.map((t) => ({
                      label: t.name,
                      value: t.id,
                    }))}
                  />
                </div>

                {/* Department Select */}
                <div className="space-y-2">
                  <label className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground ml-1">
                    Courses
                  </label>
                  <InputAutoFill
                    value={courseFilter}
                    onChange={setCourseFilter}
                    placeholder="Filter by course"
                    options={courses.map((c) => ({
                      label: `[${c.course_code}] ${c.course_name}`,
                      value: c.course_code,
                    }))}
                  />
                </div>

                {/* Semester Select */}
                <div className="space-y-2">
                  <label className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground ml-1">
                    Status
                  </label>
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger className="bg-background/50 focus:ring-primary/20 transition-all">
                      <SelectValue placeholder="Status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all" className="font-medium">All </SelectItem>
                      <Separator className="my-1" />
                      {['Pending', 'Approved', 'Rejected'].map(val => (
                        <SelectItem key={val} value={val.toLowerCase()}>
                          {val}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="flex items-end flex-col md:flex-row md:items-center justify-between gap-1  ">


                {/* Quick Action / Reset Info */}
                <div className="flex w-full justify-end">
                  {(search || teacherFilter != "all" || courseFilter != "all" || statusFilter != "all") && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => { setSearch(''); setTeacherFilter("all"); setCourseFilter("all"); setStatusFilter("all") }}
                      className="w-fit h-9 text-xs font-medium border-destructive/20 text-destructive hover:bg-destructive/10 hover:text-destructive transition-colors"
                    >
                      <FilterX className="w-3.5 h-3.5 mr-2" />
                      Reset All Viewport Filters
                    </Button>
                  )}

                </div>
              </div>
            </>}
        </CardHeader>

        <CardContent className="flex flex-col gap-2">
          <div className="rounded-xl border overflow-hidden">
            <Table>
              <TableHeader className="bg-muted/30">
                <TableRow className="border-border/40 hover:bg-transparent">
                  <TableHead className="text-[10px] font-black uppercase tracking-widest pl-6">Teacher / Date</TableHead>
                  <TableHead className="text-[10px] font-black uppercase tracking-widest">Course Details</TableHead>
                  <TableHead className="text-[10px]  font-black uppercase tracking-widest">Adjustment</TableHead>
                  <TableHead className="text-[10px] font-black uppercase tracking-widest">Status</TableHead>
                  <TableHead className="text-right pr-6 text-[10px] font-black uppercase tracking-widest">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isBusy ? (
                  Array(6).fill(0).map((_, i) => <RequestRowShimmer key={i} />)
                ) : paginated.length === 0 ? (
                  <EmptyState colSpan={5} />
                ) : (
                  paginated.map((req, idx) => {

                    if (isRequesting && Number(req.id) == Number(selectedReqId)) return <RequestRowShimmer key={idx} />
                    return <TableRow key={req.id} className="group border-border/40 hover:bg-muted/5 transition-all">
                      {/* 1. Teacher & Metadata */}
                      <TableCell className="pl-6 py-4 min-w-[200px] lg:min-w-[280px]">
                        <div className="flex flex-col gap-1">
                          <TooltipProvider delayDuration={100}>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <span className="text-sm font-black text-foreground uppercase tracking-tight cursor-help hover:text-primary transition-colors w-fit">
                                  {req.teacher_name}
                                </span>
                              </TooltipTrigger>
                              <TooltipContent side="right" className="max-w-[240px] p-3 shadow-xl border-border/50">
                                <div className="space-y-1">
                                  <p className="text-[8px] font-black uppercase tracking-widest text-primary/60">Reason for Request</p>
                                  <p className="text-[11px] font-medium italic text-foreground/90 leading-snug">
                                    {req.reason ? `"${req.reason}"` : "No specific reason provided."}
                                  </p>
                                </div>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>

                          <div className="flex items-center gap-2 text-[10px] font-bold text-muted-foreground/50 tabular-nums">
                            <span className="font-mono">#{req.slot_id}</span>
                            <span className="h-1 w-1 rounded-full bg-border" />
                            <span className="uppercase tracking-tighter">{formatTimeAgo(req.created_at)}</span>
                          </div>
                        </div>
                      </TableCell>

                      {/* 2. Course Identifiers */}
                      <TableCell className="max-w-[200px]">
                        <div className="flex flex-wrap gap-1.5 items-center">
                          {req.course_codes?.split(',').map((code, idx) => {
                            const name = req.course_names?.split(',')[idx]?.trim();
                            const colors = generateHslColors(code.trim());

                            return (
                              <TooltipProvider key={idx} delayDuration={100}>
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <Badge
                                      variant="outline"
                                      style={{ borderColor: colors?.border, color: colors?.text }}
                                      className="text-[10px] font-mono px-1.5 py-0 border-primary/20 cursor-help hover:bg-muted/40 transition-colors"
                                    >
                                      {code.trim()}
                                    </Badge>
                                  </TooltipTrigger>
                                  <TooltipContent className="text-[10px] font-black uppercase">{name}</TooltipContent>
                                </Tooltip>
                              </TooltipProvider>
                            );
                          })}

                          {req.course_codes?.split(',').length > 1 && (
                            <span className="text-[8px] font-black text-orange-500/80 uppercase tracking-widest bg-orange-500/5 px-1.5 cursor-default rounded-lg border border-orange-500/10">
                              Combined
                            </span>
                          )}
                        </div>
                      </TableCell>

                      {/* 3. Adjustment (Flow View) */}
                      <TableCell>
                        <div className="flex items-center gap-3 py-1.5 px-3 rounded-xl bg-muted/20 border border-border/5 w-fit">
                          <div className="flex flex-col">
                            <span className="text-[9px] font-black text-muted-foreground/40 uppercase leading-none mb-1">
                              {weekDays.find(wd => wd.id === req.day_id)?.name || 'Slot'}
                            </span>
                            <span className="text-[10px] font-mono font-bold tabular-nums text-muted-foreground/70">
                              {formatTimeTo12Hour(req.start_time)}
                            </span>
                          </div>

                          <div className="flex flex-col items-center opacity-20">
                            <ChevronRight size={12} className="text-primary" />
                          </div>

                          <div className="flex flex-col">
                            <span className="text-[9px] font-black text-primary/60 uppercase leading-none mb-1">Prefered Day</span>
                            <span className="text-[11px] font-black text-foreground uppercase tracking-tight leading-none">
                              {req.preferred_day}
                            </span>
                          </div>
                        </div>
                      </TableCell>

                      {/* 4. Status */}
                      <TableCell>
                        {(() => {
                          const conf = statusConfig[req.status?.toLowerCase()] || statusConfig.pending;
                          return (
                            <div className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-md ${conf.bg} ${conf.text} border border-transparent`}>
                              {conf.icon}
                              <span className="text-[10px] font-black uppercase tracking-widest leading-none">{req.status}</span>
                            </div>
                          );
                        })()}
                      </TableCell>

                      {/* 5. Actions */}
                      <TableCell className="text-right pr-6">
                        <div className="flex justify-end gap-2 opacity-100 group-hover:opacity-100 transition-all duration-300 ease-in-out">
                          <TooltipProvider delayDuration={100}>

                            {/* Approve Action */}
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button
                                  disabled={isRequesting == true || isBusy == true || (req.status ?? "") == "approved"}
                                  size="icon"
                                  variant="ghost"
                                  className="h-8 w-8 rounded-lg text-emerald-600 hover:text-emerald-700 hover:bg-emerald-500/10 border border-transparent hover:border-emerald-500/20 transition-all active:scale-95"
                                  onClick={() => handleApprove(req)}
                                >
                                  <Brain size={18} strokeWidth={2.5} />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent side="top" className="bg-emerald-600 text-white border-none font-black text-[10px] uppercase tracking-widest">
                                Run Reschedular Agent
                              </TooltipContent>
                            </Tooltip>

                            {/* Reject Action */}
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button
                                  disabled={isRequesting || isBusy || (req.status ?? "") == "rejected"}

                                  size="icon"
                                  variant="ghost"
                                  className="h-8 w-8 rounded-lg text-red-600 hover:text-red-700 hover:bg-red-500/10 border border-transparent hover:border-red-500/20 transition-all active:scale-95"
                                  onClick={() => rejectRequest(req.id)}
                                >
                                  <XCircle size={18} strokeWidth={2.5} />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent side="top" className="bg-red-600 text-white border-none font-black text-[10px] uppercase tracking-widest">
                                Reject Request
                              </TooltipContent>
                            </Tooltip>

                          </TooltipProvider>
                        </div>
                      </TableCell>
                    </TableRow>
                  })
                )}
              </TableBody>
            </Table>
          </div>
          <Paginator
            totalItems={filtered_requests.length}
            currentPage={currentPage}
            itemsPerPage={ITEMS_PER_PAGE}
            onPageChange={setCurrentPage}
            label="Requests"
          />
        </CardContent>
      </Card>
      <RescheduleAgentDialog
        isOpen={agentDialog.isOpen}
        request={agentDialog.request}
        onOpenChange={(open) => setAgentDialog(prev => ({ ...prev, isOpen: open }))}
        onApprovalComplete={handleApprovalSuccess}
      />
    </div>
  )
}

// Helper Components
function RequestRowShimmer() {
  return (
    <TableRow className="border-border/40 hover:bg-transparent">
      {/* 1. Teacher & Metadata Shimmer */}
      <TableCell className="pl-6 py-4 min-w-[200px] lg:min-w-[280px]">
        <div className="flex flex-col gap-2">
          <Shimmer className="h-4 w-32" /> {/* Teacher Name */}
          <div className="flex items-center gap-2">
            <Shimmer className="h-3 w-8" /> {/* ID */}
            <div className="h-1 w-1 rounded-full bg-muted" />
            <Shimmer className="h-3 w-16" /> {/* Time Ago */}
          </div>
        </div>
      </TableCell>

      {/* 2. Course Identifiers Shimmer */}
      <TableCell className="max-w-[200px]">
        <div className="flex gap-1.5 items-center">
          <Shimmer className="h-5 w-12 rounded-md" /> {/* Course 1 */}
          <Shimmer className="h-5 w-12 rounded-md" /> {/* Course 2 */}
        </div>
      </TableCell>

      {/* 3. Adjustment Shimmer */}
      <TableCell>
        <div className="flex items-center gap-3 py-1.5 px-3 rounded-xl border border-border/5 w-fit bg-muted/10">
          <div className="flex flex-col gap-1">
            <Shimmer className="h-2 w-8" />
            <Shimmer className="h-3 w-14" />
          </div>
          <div className="opacity-20"><ChevronRight size={12} /></div>
          <div className="flex flex-col gap-1">
            <Shimmer className="h-2 w-8" />
            <Shimmer className="h-3 w-14" />
          </div>
        </div>
      </TableCell>

      {/* 4. Status Shimmer */}
      <TableCell>
        <Shimmer className="h-6 w-20 rounded-md" />
      </TableCell>

      {/* 5. Actions Shimmer */}
      <TableCell className="text-right pr-6">
        <div className="flex justify-end gap-1">
          <Shimmer className="h-8 w-8 rounded-lg" />
          <Shimmer className="h-8 w-8 rounded-lg" />
        </div>
      </TableCell>
    </TableRow>
  );
}

function EmptyState({ colSpan }) {
  return (
    <TableRow>
      <TableCell colSpan={colSpan} className="h-48 text-center">
        <div className="flex flex-col items-center justify-center gap-2 opacity-40">
          <History size={32} />
          <p className="text-xs font-black uppercase tracking-widest">No Reschedule Requests Found</p>
        </div>
      </TableCell>
    </TableRow>
  )
}







