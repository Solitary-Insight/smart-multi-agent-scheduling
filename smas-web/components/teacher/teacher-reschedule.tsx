"use client"

import { useEffect, useState, useMemo } from "react"
import { motion, AnimatePresence } from "framer-motion"
import {
  CalendarClock, Clock, CheckCircle2, XCircle, Loader2, Users, MapPin,
  User, ChevronLeft, ChevronRight, Info, Layers, CalendarX, CalendarDays,
  Calendar1,
  ClockAlertIcon,
  History,
  ArrowRightLeft,
  InfoIcon
} from "lucide-react"
import { toast } from "sonner"

import { useAuth } from "@/lib/auth-context"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

import ScheduleController from "@/lib/api-controllers/schedule.controller"
import GenericController from "@/lib/api-controllers/generic-controller"
import RescheduleController from "@/lib/api-controllers/reschedule-controller"
import { formatDateOnly, formatDateTime, formatTimeAgo, formatTimeTo12Hour, generateHslColors } from "@/lib/utils"
import { Skeleton } from "../ui/skeleton"

export function TeacherReschedule() {
  const { user } = useAuth()

  // Data States
  const [timetableMap, setTimetableMap] = useState({})
  const [requests, setRequests] = useState([])
  const [weekDays, setWeekDays] = useState([])
  const [isBusy, setIsBusy] = useState(true)


  const requests_of_this_week = useMemo(() => {
    return requests.filter(r => {
      return r.same_week
    }).map(r => r.slot_id)

  }, [requests])


  // Pagination State
  const [currentPageSchedule, setCurrentPageSchedule] = useState(1)
  const [currentPageHistory, setCurrentPageHistory] = useState(1)
  const itemsPerPageSchedule = 3
  const itemsPerPageHistory = 4

  // Form State
  const [selectedEntry, setSelectedEntry] = useState(null)
  const [requestedDay, setRequestedDay] = useState("")
  const [requestedSlot, setRequestedSlot] = useState("")
  const [reason, setReason] = useState("")
  const [submitting, setSubmitting] = useState(false)

  const processTimetable = (timetables) => {
    const map = {}
    timetables.forEach(t => {
      const slot_key = `${t.day_name}-${t.start_time}-${t.end_time}-${t.classroom_id}-${t.reschedule_status}`;
      if (!map[slot_key]) map[slot_key] = []
      map[slot_key].push(t)
    });
    setTimetableMap(map)
  }

  useEffect(() => {
    if (!user) return
    loadInitialData()
  }, [user])

  const loadInitialData = async () => {
    setIsBusy(true)
    const scheduleApi = new ScheduleController()
    const genericApi = new GenericController()
    const rescheduleApi = new RescheduleController()

    try {
      await Promise.all([
        scheduleApi.getTeacherTimeTable({
          teacher_id: user.id,
          onSuccess: (data) => processTimetable(data.timetables),
          onFailed: () => toast.error("Failed to load classes")
        }),
        rescheduleApi.getTeacherRequests({
          teacher_id: user.id,
          onSuccess: (data) => { setRequests(data ?? []) },
          onFailed: () => toast.error("Failed to load Requests")
        }),
        genericApi.getAllWeekDays({
          onSuccess: (data) => setWeekDays(data),
          onFailed: () => toast.error("Failed to load weekdays")
        })
      ])
    } finally {
      setIsBusy(false)
    }
  }

  // Derived Data for Pagination
  const entriesArray = Object.values(timetableMap)
  const totalPagesSchedule = Math.ceil(entriesArray.length / itemsPerPageSchedule)
  const currentEntries = entriesArray.slice((currentPageSchedule - 1) * itemsPerPageSchedule, currentPageSchedule * itemsPerPageSchedule)
  const totalPagesHistory = Math.ceil(requests.length / itemsPerPageSchedule)
  const currentEntriesHistory = requests.slice((currentPageHistory - 1) * itemsPerPageHistory, currentPageHistory * itemsPerPageHistory)



  const handleSubmitRequest = () => {
    if (!requestedDay || !reason.trim()) {
      return toast.error("Please fill both day and reason for reschedule fields.")
    }


    setSubmitting(true)
    const [start, end] = requestedSlot.split("|")
    const payload = {
      slot_id: selectedEntry?.slot_id,
      teacher_id: selectedEntry?.teacher_id,
      preferred_day_id: requestedDay, reason,
      teacher_name: user?.name ?? `Teacher-${user?.id ?? "Unknown"}`,
      course_name: selectedEntry?.course_names ?? "Unknown",
      day_name: weekDays.filter(d => d.id == Number(requestedDay))[0]?.name ?? "Unknown",
    }
    new RescheduleController().createRequest({
      payload,
      onSuccess: ({ message, request_id, created_at }) => {
        toast.success("Reschedule request submitted to admin!")
        setSelectedEntry(null)
        setRequests(prev => ([{ ...payload, id: request_id, created_at }, ...prev]))
        setReason("")
        loadInitialData()
      }

      ,
      onFailed: (err) => {
        toast.error("Unable to request. Please try again later..")
        console.log('err', err)
      }
    }).finally(() => setSubmitting(false))
  }

  if (!user) return null

  return (
    <div className="space-y-6 cursor-default">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-foreground">Reschedule Hub</h1>
          <p className="text-sm text-muted-foreground">Manage your teaching slots and view request status.</p>
        </div>


      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="border-none bg-muted/20 shadow-none  flex flex-col">
          <CardHeader className="pb-3 px-4">
            <CardTitle className="text-[11px] font-black uppercase tracking-widest text-primary/70 flex items-center gap-2">
              <Layers className="w-4 h-4" /> Your Classes This Week <span className="text-orange-300 ">({Object.keys(timetableMap).length})</span>

            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 flex flex-col flex-1 px-4 pb-4 gap-2">
            <div className="space-y-3 flex-1">

              {isBusy ? (
                <RescheduleShimmer />
              ) : currentEntries.length > 0 ? (
                <AnimatePresence mode="popLayout">
                  {currentEntries.map((entries: any, idx) => (
                    <RescheduleListCard
                      key={entries[0].slot_id || idx}
                      entry={entries[0]}
                      index={idx}
                      requests_of_this_week={requests_of_this_week}
                      onReschedule={setSelectedEntry}
                    />
                  ))}
                </AnimatePresence>
              ) : (
                <div className="py-12 text-center border-2 border-dashed rounded-2xl opacity-50">
                  <CalendarX className="mx-auto mb-2" />
                  <p className="text-xs font-bold uppercase">No active classes found</p>
                </div>
              )}

            </div>
            <div className="flex flex-col flex  justify-end items-end">
              {!isBusy && totalPagesSchedule > 1 && (
                <div className="flex items-center gap-2 bg-muted/50 p-1 rounded-lg border">
                  <Button variant="ghost" size="icon" className="h-8 w-8" disabled={currentPageSchedule === 1} onClick={() => setCurrentPageSchedule(p => p - 1)}>
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <span className="text-[10px] font-black px-2">{currentPageSchedule} / {totalPagesSchedule}</span>
                  <Button variant="ghost" size="icon" className="h-8 w-8" disabled={currentPageSchedule === totalPagesSchedule} onClick={() => setCurrentPageSchedule(p => p + 1)}>
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Request History Section */}
        <Card className=" flex flex-col">
          <CardHeader className="pb-2 px-4">
            <CardTitle className="text-base flex gap-2  font-bold">
              Request History
              {requests.length > 0 && <span className="text-orange-500 text-[12px]">({requests.length}) Requests</span>}
            </CardTitle>
            {/* <CardDescription>Track the status of your previous requests.</CardDescription> */}
          </CardHeader>
          <CardContent className="flex flex-col flex-1 px-4 pb-4 gap-2">
            {/* <div className="flex items-center justify-between">
                <h3 className="text-[11px] font-black uppercase tracking-widest text-muted-foreground/70 flex items-center gap-2">
                  <History size={14} className="text-primary" />
                  My Reschedule Requests
                </h3>
                {requests.length > 0 && (
                  <Badge variant="outline" className="text-[9px] font-bold opacity-60">
                    {requests.length} Total
                  </Badge>
                )}
              </div> */}

            <div className="space-y-3 flex-1">
              {isBusy ? (
                <RequestHistoryShimmer />
              ) : currentEntriesHistory.length > 0 ? (
                currentEntriesHistory.map((req, idx) => (
                  <RequestStatusCard key={req.id || idx} request={req} index={idx} />
                ))
              ) : (
                /* NO REQUEST CASE */
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="flex flex-col items-center justify-center py-12 px-4 border-2 border-dashed border-border/40 rounded-2xl bg-muted/5"
                >
                  <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center mb-3">
                    <CalendarX size={20} className="text-muted-foreground/50" />
                  </div>
                  <p className="text-[11px] font-black uppercase tracking-tight text-muted-foreground/60">
                    No Requests Found
                  </p>
                  <p className="text-[10px] text-muted-foreground/40 mt-1 text-center max-w-[180px]">
                    Your reschedule history will appear here once you submit a request.
                  </p>
                </motion.div>
              )}

            </div>
            <div className="flex flex-col flex-1  justify-end items-end">
              {!isBusy && totalPagesHistory > 1 && (
                <div className="flex items-center gap-2 bg-muted/50 p-1 rounded-lg border">
                  <Button variant="ghost" size="icon" className="h-8 w-8" disabled={currentPageHistory === 1} onClick={() => setCurrentPageHistory(p => p - 1)}>
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <span className="text-[10px] font-black px-2">{currentPageHistory} / {totalPagesHistory}</span>
                  <Button variant="ghost" size="icon" className="h-8 w-8" disabled={currentPageHistory === totalPagesHistory} onClick={() => setCurrentPageHistory(p => p + 1)}>
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Actual Form Dialog */}
      <Dialog open={!!selectedEntry} onOpenChange={() => setSelectedEntry(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Request Reschedule</DialogTitle>
            <DialogDescription className="text-xs">
              Rescheduling: <span className="font-bold text-foreground">{selectedEntry?.course_names}</span>
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="grid grid-cols-1 gap-4">
              <div className="space-y-2">
                <Label className="text-[10px] uppercase font-bold text-muted-foreground">Prefered Day</Label>
                <Select value={requestedDay} onValueChange={setRequestedDay}>
                  <SelectTrigger className="text-xs font-bold"><SelectValue placeholder="Select a Prefered Day" /></SelectTrigger>
                  <SelectContent>
                    {weekDays.map((day: any) => <SelectItem disabled={day.is_holiday} key={day.id} value={day.id.toString()}>{day.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>

            </div>
            <div className="space-y-2">
              <Label className="text-[10px] uppercase font-bold text-muted-foreground">Reason</Label>
              <Textarea
                placeholder="Briefly explain the reason for this change..."
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                className="text-sm bg-muted/20"
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setSelectedEntry(null)} className="text-xs font-bold">Discard</Button>
            <Button onClick={handleSubmitRequest} disabled={submitting} className="text-xs font-black uppercase tracking-widest">
              {submitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <CheckCircle2 className="mr-2 h-4 w-4" />}
              Send Request
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

function RescheduleListCard({ entry, requests_of_this_week = [], index, onReschedule }) {
  const colors = generateHslColors(entry.course_id || 101)
  const courseCodes = (entry.course_codes ?? "").split(',').map(c => c.trim())

  return (
    <motion.div
      layout
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.05 }}
    >
      <Dialog>
        <DialogTrigger asChild>
          <div className="group relative flex flex-col gap-3 rounded-xl border border-border/50 bg-card p-4 shadow-sm transition-all hover:shadow-md cursor-pointer overflow-hidden">
            {/* Color Accent Bar */}
            <div className="absolute left-0 top-0 bottom-0 w-[3px]" style={{ backgroundColor: colors?.text }} />

            {/* Top Right Slot ID - Clean & Integrated */}
            <div className="absolute top-2 right-2 opacity-40 group-hover:opacity-100 transition-opacity">
              <code className="text-[9px] font-black font-mono bg-muted px-1.5 py-0.5 rounded border border-border/50">
                #{entry?.slot_id}
              </code>
            </div>

            <div className="flex justify-between items-start gap-2 pl-2">
              <div className="space-y-1 overflow-hidden">
                <h4 className="text-sm font-black text-foreground truncate max-w-[250px]">{entry.course_names}</h4>
                <div className="flex flex-wrap gap-1">
                  {courseCodes.map((code, idx) => (
                    <Badge key={idx} variant="outline" className="text-[9px] font-bold px-1.5 py-0 opacity-70 border-primary/20 text-primary">
                      {code}
                    </Badge>
                  ))}
                  {entry?.slot_label === "combined" && (
                    <Badge className="bg-green-500/10 text-green-600 border-none rounded-md px-1.5 py-0 text-[8px] font-bold uppercase">
                      Combined
                    </Badge>
                  )}
                  {entry?.reschedule_date && (
                    <Badge className="bg-orange-500/10 text-orange-600 border-none rounded-md px-1.5 py-0 text-[8px] font-bold uppercase">
                      Re-Scheduled
                    </Badge>
                  )}
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between border-t border-border/40 pt-3 pl-2">
              <div className="flex flex-col gap-1">
                <div className="flex items-center gap-1.5 text-[10px] font-bold text-muted-foreground uppercase tracking-tight">
                  <Clock className="w-3 h-3 text-orange-400" />
                  {formatTimeTo12Hour(entry.start_time)} - {formatTimeTo12Hour(entry.end_time)}
                </div>
                <div className="flex items-center gap-1.5 text-[10px] font-bold text-muted-foreground uppercase tracking-tight">
                  <MapPin className="w-3 h-3 text-primary" />
                  {entry.day_name} | <span className="text-foreground">{entry.classroom_name}</span>
                </div>
              </div>

              <div className="flex items-center">
                {/* {!entry.reschedule_date && !requests_of_this_week.includes(entry.slot_id) && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 text-rose-500 hover:bg-rose-500/10 hover:text-rose-600 border border-transparent hover:border-rose-200"
                    onClick={(e) => {
                      e.stopPropagation();
                      // onMarkMissed(entry);
                    }}
                  >
                    <XCircle className="h-3.5 w-3.5" />
                  </Button>
                )} */}
                {requests_of_this_week.includes(entry.slot_id) ? (
                  <Badge variant="secondary" className="h-7 px-2.5 bg-orange-500/10 hover:bg-orange-500/10 text-orange-600 border-none text-[9px] font-black uppercase">
                    <ClockAlertIcon className="mr-1 h-3 w-3" /> Requested
                  </Badge>
                ) : entry.reschedule_date ? <Badge variant="success" className="h-7 px-2.5 bg-green-500/10 hover:bg-green-500/10 text-green-600 border-none text-[9px] font-black uppercase">
                  <CheckCircle2 className="mr-1 h-3 w-3" /> Rescheduled
                </Badge> : (
                  <Button size="sm" onClick={(e) => { e.stopPropagation(); onReschedule(entry); }}
                    className="h-7 text-[9px] font-bold uppercase tracking-wider bg-primary/10 text-primary hover:bg-primary hover:text-white"
                  >
                    Reschedule
                  </Button>
                )}
              </div>
            </div>
          </div>
        </DialogTrigger>

        {/* THE DETAILED VIEW DIALOG */}
        <DialogContent className="w-[95%] sm:max-w-[450px] overflow-hidden border-none shadow-2xl">

          <DialogHeader className="space-y-3">

            <div className="flex items-center gap-2">

              <Badge variant="outline" className="bg-primary/5 text-primary border-primary/20 rounded-md px-2 py-1 uppercase tracking-wider text-[10px]">

                {entry.day_name}

              </Badge>

              {entry?.slot_label === "combined" && (

                <Badge className="bg-orange-500/10 text-orange-600 border-none rounded-md px-2 py-1 text-[10px]">

                  Combined Class

                </Badge>

              )}

              {entry?.reschedule_id && (

                <Badge className=" text-xs bg-red-500 text-white">

                  Rescheduled

                </Badge>

              )}

            </div>


            <DialogTitle className="text-2xl font-extrabold tracking-tight leading-tight">

              {entry?.course_names?.length > 0

                ? entry.course_names.split(',').join(" & ")

                : "Untitled Course"}

            </DialogTitle>


            <div className="flex flex-wrap gap-2 text-muted-foreground">

              {/* Remove duplicate teacher names */}

              {[...new Set((entry?.teacher_names ?? '').split(','))].map((teacher, i) => (

                <div key={i} className="flex items-center gap-1.5 text-sm font-medium">

                  <User size={14} className="text-primary" />

                  {teacher}

                </div>

              ))}

            </div>


          </DialogHeader>


          <Separator className="my-2 opacity-50" />


          <div className="space-y-6 py-2">
            {/* Key Metadata Grid - Responsive: 1 col on mobile, 2 cols on small screens+ */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 gap-y-5">

              {/* Date Section */}
              <div className="space-y-1">
                <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60">Date</p>
                <div className="flex items-center gap-2 text-sm font-semibold">
                  <Calendar1 size={16} className="text-muted-foreground shrink-0" />
                  <span className="truncate">{formatDateOnly(entry.slot_datetime)}</span>
                </div>
              </div>

              {/* Time Slot Section */}
              <div className="space-y-1">
                <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60">Time Slot</p>
                <div className="flex items-center gap-2 text-sm font-semibold">
                  <Clock size={16} className="text-muted-foreground shrink-0" />
                  <span className="tabular-nums">
                    {formatTimeTo12Hour(entry.start_time)} - {formatTimeTo12Hour(entry.end_time)}
                  </span>
                </div>
              </div>

              {/* Location Section */}
              <div className="space-y-1">
                <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60">Location</p>
                <div className="flex items-center gap-2 text-sm font-semibold">
                  <MapPin size={16} className="text-muted-foreground shrink-0" />
                  <span className="truncate">{entry?.classroom_name || "TBD"}</span>
                </div>
              </div>

              {/* Students Section */}
              <div className="space-y-1">
                <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60">
                  Student{(entry?.student_count ?? 0) > 1 ? "s" : ""}
                </p>
                <div className="flex items-center gap-2 text-sm font-semibold">
                  <Users size={16} className="text-muted-foreground shrink-0" />
                  <span>{entry?.student_count ?? 0} Enrolled</span>
                </div>
              </div>

              {/* Course Codes - Full width on small mobile if codes are many */}
              <div className="space-y-1 col-span-1 sm:col-span-2">
                <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60">
                  Course Code{(entry?.course_codes ?? "").split(',').length > 1 ? "s" : ""}
                </p>
                <div className="flex flex-wrap gap-1.5 mt-1">
                  {(entry?.course_codes ?? "").split(',').map((code, idx) => (
                    <code key={idx} className="bg-muted px-2 py-0.5 rounded text-primary font-mono font-bold text-[11px] border border-border/40">
                      {code.trim()}
                    </code>
                  ))}
                </div>
              </div>
            </div>

            {/* Section for Merged/Group info */}
            {entry?.merge_name && (
              <motion.div
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                className="rounded-xl bg-primary/[0.03] border border-primary/10 p-3"
              >
                <div className="flex items-center gap-2 mb-1">
                  <Layers size={14} className="text-primary" />
                  <span className="text-[11px] font-bold uppercase tracking-tight text-primary/80">Merged Group Label</span>
                </div>
                <p className="text-sm font-medium italic text-muted-foreground pl-6">
                  "{entry.merge_name}"
                </p>
              </motion.div>
            )}

            {entry.reschedule_date && <Separator className="opacity-50" />
            }
            {/* Rescheduled Notice */}
            {entry.reschedule_date && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="rounded-xl bg-destructive/[0.03] border border-destructive/20 p-3"
              >
                <div className="flex items-center gap-2 mb-1 text-destructive">
                  <CalendarDays size={14} />
                  <span className="text-[11px] font-bold uppercase tracking-tight">Rescheduled On</span>
                </div>
                <p className="text-sm font-bold text-muted-foreground pl-6">
                  {formatDateOnly(entry.reschedule_date)}
                </p>
              </motion.div>
            )}
          </div>




        </DialogContent>
      </Dialog>
    </motion.div>
  )
}

function RequestStatusCard({ request, index }) {
  const statusConfig = {
    pending: { bg: "bg-amber-500/10", text: "text-amber-600", icon: <Clock size={12} /> },
    approved: { bg: "bg-emerald-500/10", text: "text-emerald-600", icon: <CheckCircle2 size={12} /> },
    rejected: { bg: "bg-red-500/10", text: "text-red-600", icon: <XCircle size={12} /> },
  }

  const config = statusConfig[request.status?.toLowerCase()] || statusConfig.pending

  return (
    <motion.div
      initial={{ opacity: 0, x: 10 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.04 }}
      className="group relative flex flex-col gap-2 rounded-xl border border-border/40 bg-card p-3 shadow-sm hover:border-primary/20 transition-all"
    >
      {/* Header: ID, Status and TimeAgo */}
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-2">
          <code className="text-[10px] font-mono font-black text-primary/60 bg-primary/5 px-1.5 py-0.5 rounded">
            #{request.slot_id}
          </code>
          <div className={`flex items-center gap-1 text-[10px] font-black uppercase tracking-tight ${config.text}`}>
            {config.icon}
            {request.status || 'Pending'}
          </div>
        </div>
        <span className="text-[10px] font-bold text-muted-foreground/70 tabular-nums">
          {formatTimeAgo(request.created_at)}
        </span>
      </div>

      {/* Simplified Preferred Day Section */}
      <div className="flex items-center gap-2 pl-1">
        <InfoIcon size={12} className="text-muted-foreground/40" />
        <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-tight">
          Requesting FOR A SLOT ON <span className="text-foreground font-black ml-1">{request.preferred_day}</span>
        </p>
      </div>

      {/* Footer: Reason (Compact) */}
      {request.reason && (
        <p className="text-[12px] text-muted-foreground/80 italic truncate pl-2 border-l-2 border-muted/30">
          “{request.reason}”
        </p>
      )}
    </motion.div>
  )
}
function RequestHistoryShimmer() {
  return (
    <div className="space-y-3">
      {[1, 2].map((i) => (
        <div key={i} className="p-4 rounded-xl border border-border/30 bg-card/50 space-y-4">
          <div className="flex justify-between items-center">
            <Skeleton className="h-5 w-20 rounded-md" />
            <Skeleton className="h-3 w-12 rounded-md" />
          </div>
          <div className="space-y-2">
            <Skeleton className="h-4 w-1/3" />
            <div className="h-10 w-full rounded-lg bg-muted/20 border border-border/10" />
          </div>
          <Skeleton className="h-3 w-full opacity-40" />
        </div>
      ))}
    </div>
  )
}
function RescheduleShimmer() {
  return (
    <div className="space-y-3">
      {[1, 2, 3, 4].map((i) => (
        <div
          key={i}
          className="relative flex flex-col gap-3 rounded-xl border border-border/50 bg-card p-4 shadow-sm"
        >
          {/* Left accent bar shimmer */}
          <Skeleton className="absolute left-1 top-1/2 -translate-y-1/2 h-10 w-1 rounded-full opacity-50" />

          <div className="flex justify-between items-start gap-2 pl-2">
            <div className="space-y-2 w-full">
              {/* Course Name line */}
              <Skeleton className="h-4 w-3/4 rounded-md" />

              {/* Badges line */}
              <div className="flex gap-1">
                <Skeleton className="h-4 w-12 rounded-md" />
                <Skeleton className="h-4 w-16 rounded-md" />
                <Skeleton className="h-4 w-20 rounded-md opacity-40" />
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between border-border/40 pl-2 mt-1">
            <div className="flex flex-col gap-2 w-1/2">
              {/* Time Slot line */}
              <div className="flex items-center gap-2">
                <Skeleton className="h-3 w-3 rounded-full" />
                <Skeleton className="h-3 w-24 rounded-md" />
              </div>
              {/* Location line */}
              <div className="flex items-center gap-2">
                <Skeleton className="h-3 w-3 rounded-full" />
                <Skeleton className="h-3 w-32 rounded-md" />
              </div>
            </div>

            {/* Button shimmer */}
            <Skeleton className="h-8 w-28 rounded-md" />
          </div>
        </div>
      ))}
    </div>
  )
}