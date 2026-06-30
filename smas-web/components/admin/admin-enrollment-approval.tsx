"use client"

import { useEffect, useMemo, useState, Fragment, act } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectTrigger,
  SelectContent,
  SelectItem,
  SelectValue
} from "@/components/ui/select"
import {
  CheckCircle2,
  XCircle,
  Search,
  FilterX,
  UserCheck,
  UserX,
  RotateCcw,
  Clock,
  BookOpen,
  AlertCircle,
  Info
} from "lucide-react"
import { toast } from "sonner"
import StudentController from "@/lib/api-controllers/student-controller"
import { generateHslColors, getNumberPosPostfixes } from "@/lib/utils"
import { CourseController } from "@/lib/api-controllers/course.controller"
import ResultRowShimmer from "../ui/loading-shimmers/result-row-shimmer"
import Paginator from "../common/helper/paginator"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "../ui/tooltip"
import DepartmentController from "@/lib/api-controllers/department-controller"
import { Separator } from "../ui/separator"

export default function AdminRequestedEnrollmentsApproval() {
  // --- Data State ---
  const [rawRequests, setRawRequests] = useState([])
  const [loading, setLoading] = useState(true)
  const [isRequesting, setIsRequesting] = useState(false)
  const [selectedIds, setSelectedIds] = useState<string[]>([]) // Format: "studentId-courseId"


  const [departments, setDepartments] = useState([])


  // --- Filter State ---
  const [search, setSearch] = useState("")
  const [deptFilter, setDeptFilter] = useState("all")
  const [semFilter, setSemFilter] = useState("all")
  const [currentPage, setCurrentPage] = useState(1)
  const ITEMS_PER_PAGE = 8

  // --- Grouping Logic: Student -> [Courses] ---
  const groupedData = useMemo(() => {
    const groups = rawRequests.reduce((acc, curr) => {
      const id = curr.student_id;
      if (!acc[id]) {
        acc[id] = {
          student_id: id,
          student_name: curr.student_name,
          email: curr.email,
          department_id: curr.department_id,
          department_code: curr.department_code,
          semester: curr.semester,
          requests: []
        };
      }
      acc[id].requests.push(curr);
      return acc;
    }, {});
    return Object.values(groups);
  }, [rawRequests]);

  // --- Filtering ---
  const filteredStudents = useMemo(() => {
    console.log('groupedData', groupedData)
    return groupedData.filter((s: any) => {
      const matchesSearch = s.student_name.toLowerCase().includes(search.toLowerCase()) ||
        s.email.toLowerCase().includes(search.toLowerCase());
      const matchesDept = deptFilter === "all" || Number(s.department_id) === Number(deptFilter);
      const matchesSem = semFilter === "all" || String(s.semester) === semFilter;
      return matchesSearch && matchesDept && matchesSem;
    });
  }, [groupedData, search, deptFilter, semFilter]);

  const paginated = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredStudents.slice(start, start + ITEMS_PER_PAGE);
  }, [filteredStudents, currentPage]);

  const fetchData = async () => {
    setLoading(true);
    await Promise.all([
      new CourseController().getEnrollmentRequested({
        onSuccess: (res) => setRawRequests(res),
        onFailed: () => toast.error("Failed to load requests")
      }),
      new DepartmentController().getAllDepartments({
        onSuccess: (res) => setDepartments(res),
        onFailed: () => toast.error("Failed to load requests")
      })
    ])
    setLoading(false);
  };

  useEffect(() => { fetchData() }, []);

  // --- Batch Actions ---
  const handleBatchOperation = async (type: 'approve' | 'reject', specificRequests?: any[]) => {
    const targetRequests = specificRequests || rawRequests.filter(r =>
      selectedIds.includes(`${r.student_id}-${r.course_id}`)
    );

    if (targetRequests.length === 0) return;

    const processable_requests = targetRequests.map(t => ({ student_id: t.student_id, course_id: t.course_id }))
    console.log('processable_requests', processable_requests)
    setIsRequesting(true);
    toast.loading(`${type === 'approve' ? 'Approving' : 'Rejecting'} ${targetRequests.length} requests...`);
    const payload = {
      data: processable_requests,
      action_type: type
    }

    await new CourseController().responseEnrollmentRequests({
      payload,
      onSuccess: (data) => {
        toast.dismiss();
        toast.success(`Successfully processed ${targetRequests.length} items`);

        // Update UI: Remove processed items
        const processedKeys = targetRequests.map(r => `${r.student_id}-${r.course_id}`);
        setRawRequests(prev => prev.filter(r => !processedKeys.includes(`${r.student_id}-${r.course_id}`)));
        setSelectedIds(prev => prev.filter(id => !processedKeys.includes(id)));
      },
      onFailed: (err) => {
        toast.dismiss();
        toast.error("Some operations failed. Please refresh and try again.");
      }

    })
    setIsRequesting(false);



  };

  const toggleStudentAll = (student: any) => {
    const rowKeys = student.requests.map(r => `${r.student_id}-${r.course_id}`);
    const allSelected = rowKeys.every(key => selectedIds.includes(key));

    if (allSelected) {
      setSelectedIds(prev => prev.filter(id => !rowKeys.includes(id)));
    } else {
      setSelectedIds(prev => [...new Set([...prev, ...rowKeys])]);
    }
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6 animate-in fade-in duration-500">

      {/* Header & Global Batch Actions */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Enrollment Requests</h1>
          <p className="text-sm text-muted-foreground">Review and manage pending student course enrollments.</p>
        </div>

        {selectedIds.length > 0 && (
          <div className="flex items-center gap-2 bg-primary/5 p-2 rounded-lg border border-primary/20 animate-in slide-in-from-right-2">
            <span className="text-sm font-bold px-2">{selectedIds.length} Selected</span>
            <Button size="sm" variant="outline" className="text-green-600 border-green-200 hover:bg-green-50" onClick={() => handleBatchOperation('approve')}>
              <UserCheck className="w-4 h-4 mr-1" /> Approve All
            </Button>
            <Button size="sm" variant="outline" className="text-destructive border-destructive/20 hover:bg-destructive/5" onClick={() => handleBatchOperation('reject')}>
              <UserX className="w-4 h-4 mr-1" /> Reject All
            </Button>
            <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => setSelectedIds([])}>
              <RotateCcw className="h-4 h-4" />
            </Button>
          </div>
        )}
      </div>

      <Card className="shadow-md border-primary/5">
        <CardHeader className="pb-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="md:col-span-2 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search student name or email..."
                className="pl-9"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <Select value={deptFilter} onValueChange={setDeptFilter}>
              <SelectTrigger><SelectValue placeholder="Department" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Departments</SelectItem>
                {departments.map((d) => (
                  <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={semFilter} onValueChange={setSemFilter}>
              <SelectTrigger><SelectValue placeholder="Semester" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Semesters</SelectItem>
                {[1, 2, 3, 4, 5, 6, 7, 8].map(s => (
                  <SelectItem key={s} value={String(s)}>{s}{getNumberPosPostfixes(s)} Semester </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>


          <div className="flex w-full justify-end">
            {(search || deptFilter !== "all" || semFilter !== "all") && (
              <div className="flex justify-end">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => { setSearch(""); setDeptFilter("all"); setSemFilter("all") }}
                  className="w-fit h-9 text-xs font-medium border-destructive/20 text-destructive hover:bg-destructive/10 hover:text-destructive transition-colors"
                >
                  <FilterX className="w-3.5 h-3.5 mr-2" />
                  Reset All Viewport Filters
                </Button>

              </div>
            )}



          </div>
        </CardHeader>

        <CardContent className="flex flex-col gap-2">
          <div className="rounded-xl border overflow-hidden">
            <Table >
              <TableHeader className="bg-muted/30">
                <TableRow>
                  <TableHead className="w-[50px]"></TableHead>
                  <TableHead>Student Detail</TableHead>
                  <TableHead>Academic Info</TableHead>
                  <TableHead>Requested Courses</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody >
                {loading || isRequesting ? (
                  Array(5).fill(0).map((_, i) => <ResultRowShimmer key={i} />)
                ) : paginated.length === 0 ? (
                  <TableRow>

                    <TableCell colSpan={5} className="h-32 text-center">
                      <div className="flex flex-col items-center justify-center gap-2 text-muted-foreground">

                        <div className="text-sm font-medium">No pending enrollment requests</div>
                        <div className="text-xs">Once a student request to enroll course, it will apear here.</div>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  paginated.map((student: any) => {
                    const deptColor = generateHslColors(student.department_id);
                    const semColor = generateHslColors(student.semester);

                    return (
                      <TableRow key={student.student_id} className="hover:bg-muted/5 transition-colors hover:bg-accent/30">
                        <TableCell>
                          <Checkbox
                            checked={student.requests.every(r => selectedIds.includes(`${r.student_id}-${r.course_id}`))}
                            onCheckedChange={() => toggleStudentAll(student)}
                          />
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-col">
                            <span className="font-bold text-sm">{student.student_name}</span>
                            <span className="text-[11px] text-muted-foreground">{student.email}</span>
                          </div>
                        </TableCell>


                        <TableCell className="flex ">
                          <div className="flex   flex-col gap-2">
                            <Badge className="text-center m-auto text-[10px]  h-5 px-2 font-mono" style={{ borderColor: deptColor?.border, color: deptColor?.text }} variant="outline" >
                              {student.department_code}
                            </Badge>


                            <Badge variant="outline" className="text-[10px] h-5 px-1.5 font-mono" style={{ borderColor: semColor?.border, color: semColor?.text }}>
                              {student.semester}{getNumberPosPostfixes(student.semester)}
                            </Badge>
                          </div>
                        </TableCell>

                        <TableCell>
                          <div className="flex flex-wrap gap-1">
                            {student.requests.map((req, indx) => {
                              const colors = generateHslColors(req.course_id ?? indx);
                              const isSelected = selectedIds.includes(`${req.student_id}-${req.course_id}`);

                              const isEnrolled = req.course_status === 'enrolled';
                              const isRejected = req.course_status === 'rejected';

                              return (
                                <TooltipProvider key={req.course_id}>
                                  <Tooltip>
                                    <TooltipTrigger asChild>
                                      <Badge
                                        variant={isSelected ? "default" : "outline"}
                                        style={!isSelected ? { borderColor: colors?.border, color: colors?.text } : {}}
                                        className={`
                  text-[10px] h-6 px-2 flex items-center gap-1.5 font-mono cursor-pointer transition-all select-none
                  ${isSelected ? "ring-2 ring-primary ring-offset-1" : "hover:bg-muted/50"}
                `}
                                        onClick={(e) => {
                                          e.preventDefault();
                                          const key = `${req.student_id}-${req.course_id}`;
                                          setSelectedIds(prev => prev.includes(key) ? prev.filter(id => id !== key) : [...prev, key]);
                                        }}
                                      >
                                        {/* Selection Dot / Icon */}
                                        {isSelected ? (
                                          <CheckCircle2 className="w-3 h-3 text-primary-foreground animate-in zoom-in" />
                                        ) : (
                                          <div className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: colors?.text }} />
                                        )}

                                        {req.course_code}

                                        {/* Status Indicator (Only show if not selected to save space) */}
                                        {!isSelected && (
                                          <>
                                            {isEnrolled && <CheckCircle2 className="w-3 h-3 text-blue-500" />}
                                            {isRejected && <AlertCircle className="w-3 h-3 text-destructive" />}
                                            {!isEnrolled && !isRejected && <Info className="w-3 h-3 text-yellow-500" />}
                                          </>
                                        )}
                                      </Badge>
                                    </TooltipTrigger>
                                    <TooltipContent side="top" className="flex flex-col gap-1">
                                      <p className="font-bold text-xs">{req.course_name}</p>
                                      <p className="text-[10px] opacity-80">{isSelected ? "Selected for action" : "Click to select"}</p>
                                    </TooltipContent>
                                  </Tooltip>
                                </TooltipProvider>
                              );
                            })}
                          </div>
                        </TableCell>
                        <TableCell className="text-right pr-6">
                          <div className="flex justify-end gap-2  group-hover:opacity-100 transition-all duration-300 ease-in-out">
                            <TooltipProvider delayDuration={100}>

                              {/* Approve All Action */}
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button
                                    size="icon"
                                    variant="ghost"
                                    className="h-8 w-8 rounded-lg text-emerald-600 hover:text-emerald-700 hover:bg-emerald-500/10 border border-transparent hover:border-emerald-500/20 transition-all active:scale-95"
                                    onClick={() => handleBatchOperation('approve', student.requests)}
                                  >
                                    <CheckCircle2 size={18} strokeWidth={2.5} />
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent side="top" className="bg-emerald-600 text-white border-none font-black text-[10px] uppercase tracking-widest">
                                  Approve All for Student
                                </TooltipContent>
                              </Tooltip>

                              {/* Reject All Action */}
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button
                                    size="icon"
                                    variant="ghost"
                                    className="h-8 w-8 rounded-lg text-red-600 hover:text-red-700 hover:bg-red-500/10 border border-transparent hover:border-red-500/20 transition-all active:scale-95"
                                    onClick={() => handleBatchOperation('reject', student.requests)}
                                  >
                                    <XCircle size={18} strokeWidth={2.5} />
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent side="top" className="bg-red-600 text-white border-none font-black text-[10px] uppercase tracking-widest">
                                  Reject All for Student
                                </TooltipContent>
                              </Tooltip>

                            </TooltipProvider>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </div>

          <Paginator
            totalItems={filteredStudents.length}
            currentPage={currentPage}
            itemsPerPage={ITEMS_PER_PAGE}
            onPageChange={setCurrentPage}
            label="Students"
          />
        </CardContent>
      </Card>
    </div>
  );
}