"use client"

import { useEffect, useMemo, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from "@/components/ui/dialog"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
// Ensure you are using your local UI Select component for consistent styling
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { Search, Plus, Trash2, GitMerge, Users, Info, X, Pencil } from "lucide-react"
import { toast } from "sonner"
import { CourseController } from "@/lib/api-controllers/course.controller"
import { generateHslColors, safeParseJsonArray } from "@/lib/utils"
import InputAutoFill from "../ui/input-auto-fill"
import DeleteConfirmDialog from "../common/helper/confirm-delete-dialog"
import DepartmentController from "@/lib/api-controllers/department-controller"
import { TeacherController } from "@/lib/api-controllers/teacher.controller"
import { ClassMergeController } from "@/lib/api-controllers/class-merge.controller"
import Paginator from "../common/helper/paginator"
import MergeRowShimmer from "../ui/loading-shimmers/merge-row-shimmer"

export function AdminClassMerger() {
    const [courses, setCourses] = useState([])
    const [teachers, setTeachers] = useState([])
    const [mergedClasses, setMergedClasses] = useState([])
    const [isBusy, setIsBusy] = useState(true)
    const [isRequesting, setisRequesting] = useState(false) // Global loading

    const [dialogOpen, setDialogOpen] = useState(false)
    const [deptFilter, setDeptFilter] = useState("all")
    const [departments, setDepartments] = useState([])
    const [selected_teacher, setSelectedTeacher] = useState(null)

    const [search, setSearch] = useState("")

    // Form State
    const [mergeTitle, setMergeTitle] = useState("")
    const [selectedCourseIds, setSelectedCourseIds] = useState<string[]>([])
    const [mergeToDelete, setMergeToDelete] = useState(null)
    const [openDeleteDialog, setDeleteDialog] = useState(false)

    // --- Logic: Filter courses based on department selection ---
    const filteredOptions = useMemo(() => {
        return courses
            .filter(c => {
                const notSelected = !selectedCourseIds.includes(c.id);
                const teacher_filter = (selected_teacher == null || c.teacher_id == selected_teacher.teacher_id);
                const matchesDept = deptFilter === "all" || c.department_id === deptFilter;
                return notSelected && matchesDept && teacher_filter;
            })
            .map(c => ({
                label: `[${c.course_code}] ${c.course_name}`,
                value: c.id
            }));
    }, [courses, selectedCourseIds, deptFilter, selected_teacher]);
    // Logic For Pagination 
    const [currentPage, setCurrentPage] = useState(1)
    const ITEMS_PER_PAGE = 7
    // Pagination Logic
    const totalPages = Math.ceil(filteredOptions.length / ITEMS_PER_PAGE)

    const filtered = useMemo(() => {
        // If search is empty, return everything immediately
        const query = search.trim().toLowerCase();
        if (!query) return mergedClasses;

        return mergedClasses.filter(m => {
            const title = m.merge_name?.toLowerCase() || ""; // Using the DB field name 'merge_name'
            const courses = m.courses || [];

            // Check if the title matches
            const titleMatch = title.includes(query);

            // Check if any teacher in the sub-array matches
            const teacherMatch = courses.some(c =>
                c.teacher_name?.toLowerCase().includes(query)
            );

            // Check if any course code or name in the sub-array matches
            const courseMatch = courses.some(c =>
                c.course_code?.toLowerCase().includes(query) ||
                c.course_name?.toLowerCase().includes(query)
            );

            return titleMatch || teacherMatch || courseMatch;
        });
    }, [mergedClasses, search]);


    const paginated = useMemo(() => {
        const start = (currentPage - 1) * ITEMS_PER_PAGE
        return filtered.slice(start, start + ITEMS_PER_PAGE)
    }, [filtered, currentPage])


    useEffect(() => {
        if (selectedCourseIds.length == 0) return
        const selected_course = courses.find(c => Number(c.id) == Number(selectedCourseIds[0]))
        setSelectedTeacher({ teacher_id: selected_course.teacher_id, teacher_name: selected_course.teacher_name })
    }, [selectedCourseIds])


    const already_merged = useMemo(() => {
        console.log('Merged', mergedClasses)
        return mergedClasses.flatMap(obj => obj?.courses ?? []).map(c => c.course_code)
    }, [mergedClasses])

    // Load Data
    useEffect(() => {
        const fetchData = async () => {
            setIsBusy(true)
            try {
                await Promise.all([
                    new CourseController().getAllCourses({
                        onSuccess: (data) => setCourses(data),
                        onFailed: (err) => console.error(err)
                    }),
                    new TeacherController().getAllTeachersNamesAndIds({
                        onSuccess: (data) => setTeachers(data),
                        onFailed: (err) => console.error(err)
                    }),
                    new DepartmentController().getAllDepartmentsOverview({
                        onSuccess: (data) => setDepartments(data),
                        onFailed: (err) => console.error(err)
                    })
                    ,
                    new ClassMergeController().getMergeClasses({
                        onSuccess: (data) => setMergedClasses(data),
                        onFailed: (err) => console.error(err)
                    })
                ]);
            } finally {
                setIsBusy(false)
            }
        }
        fetchData()
    }, [])

    function showClearedSelectedCourse({ teacher, old_val, old_ids }) {
        if (!teacher || !old_val) return
        setSelectedCourseIds([])
        toast.dismiss()
        toast.warning(`${teacher?.teacher_name ?? "Another Teacher"} selected...`, {
            description: "Selected courses have been reset. You can still revert...",
            action: {
                label: "Undo",
                onClick: () => {
                    setSelectedTeacher(old_val)
                    setSelectedCourseIds(old_ids)
                    setDialogOpen(true)
                },
            },
        })
    }

    const handleMerge = async () => {
        toast.dismiss()
        if (!mergeTitle || selectedCourseIds.length < 2) {
            return toast.error("Please provide a title and select at least 2 courses.")
        }

        const sel_courses = courses.filter(c => selectedCourseIds.includes(c.id));

        const credits = new Set(sel_courses.map(c => c.credit_hours));

        if (credits.size > 1) {
            return toast.error("Course Credit Hours Mismatched.");
        }
        // Logic for your API would go here
        const payload = {
            title: mergeTitle,
            courses: sel_courses.map(c => c.id)
        }
        toast.loading("Creating merged class. Please wait")
        setDialogOpen(false)
        setisRequesting(true)
        await new ClassMergeController().mergeClasses({
            payload,
            onSuccess: (data) => {
                toast.dismiss()
                const newMerge = {
                    id: data.mergeId,
                    title: mergeTitle,
                    courses: sel_courses
                }
                setMergedClasses(prev => [newMerge, ...prev])
                resetForm()
                toast.success("Course merged successfully.")
            },
            onFailed: (err) => {
                toast.dismiss()
                toast.error(err)
                setTimeout(() => {
                    setDialogOpen(true)
                }, 2000);
            }
        })
        setisRequesting(false)
    }

    const resetForm = () => {
        setMergeTitle("")
        setSelectedCourseIds([])
        setSelectedTeacher(null)
        setDeptFilter("all")
    }


    async function deleteMerge() {
        if (!mergeToDelete) return
        setisRequesting(true)

        toast.loading("Deleting course merge. Please wait...")
        await new ClassMergeController().deleteMergeClasses({
            id: mergeToDelete.id,
            onSuccess: (data) => {
                setMergedClasses(prev => prev.filter(m => Number(m.id) !== Number(mergeToDelete.id)))
                toast.dismiss()
                toast.success("Classes separated successfully.")
            },
            onFailed: (error) => {
                toast.dismiss()
                toast.error(error)
            }
        })
        setisRequesting(false)
    }


    return (
        <div className="space-y-6">
            <DeleteConfirmDialog
                title="Unmerge Classes?"
                description={`This will separate the courses in "${mergeToDelete?.title}".`}
                open={openDeleteDialog}
                onOpenChange={setDeleteDialog}
                onConfirm={deleteMerge}
            />

            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight text-foreground text-left">Class Merger</h1>
                    <p className="text-sm text-muted-foreground text-left">Combine multiple sections into one shared class.</p>
                </div>
                <Button disabled={(isBusy || isRequesting)} onClick={() => setDialogOpen(true)} className="bg-indigo-600 hover:bg-indigo-700">
                    <GitMerge className="mr-2 h-4 w-4" /> Merge Classes
                </Button>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                        <Users className="h-5 w-5 text-primary" />
                        Active Merged Classes
                    </CardTitle>
                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                        <Input placeholder="Search by course code, teacher name or merge name..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
                    </div>

                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Merged Group Title</TableHead>
                                <TableHead>Teacher Name</TableHead>
                                <TableHead>Combined Courses</TableHead>
                                <TableHead className="text-right">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {isBusy ? (
                                // Shimmer State
                                Array(5).fill(0).map((_, i) => (
                                    <MergeRowShimmer key={i} />
                                ))
                            )
                                : filtered
                                    .map((group, i) => {
                                        if (mergeToDelete?.id == group.id && isRequesting) return <MergeRowShimmer key={i} />

                                        return <TableRow className="hover:bg-accent/30" key={group.id}>
                                            <TableCell className="font-bold text-primary">{group.title}</TableCell>
                                            <TableCell className="font-bold text-white">{safeParseJsonArray(group.courses)[0]?.teacher_name ?? '--'}</TableCell>
                                            <TableCell>
                                                <div className="flex flex-wrap gap-2">
                                                    {group.courses.map((c) => {
                                                        const colors = generateHslColors(c.id)

                                                        return <Badge key={c.id} style={{ borderColor: colors?.border, color: colors?.text }} variant="outline">
                                                            {c.course_code}
                                                        </Badge>
                                                    })}
                                                </div>
                                            </TableCell>
                                            <TableCell className="text-right">
                                                {/* <Button
                                                variant="ghost"
                                                size="icon"
                                                className="text-default"
                                                onClick={() => { openEdit(group) }}
                                            >
                                                <Pencil className="h-4 w-4" />
                                            </Button> */}

                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    disabled={(isBusy || isRequesting)}

                                                    className="text-destructive"
                                                    onClick={() => { setMergeToDelete(group); setDeleteDialog(true); }}
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                </Button>
                                            </TableCell>
                                        </TableRow>
                                    }
                                    )}
                            {(paginated.length === 0 && !isBusy) &&
                                <TableRow>
                                    <TableCell colSpan={7} className="h-32 text-center">
                                        <div className="flex flex-col items-center justify-center gap-2 text-muted-foreground">

                                            <GitMerge className="h-8 w-8 opacity-40" />

                                            <div className="text-sm font-medium">No merged classes found</div>
                                            <div className="text-xs">class merges will appear here once added</div>

                                            <Button
                                                variant="outline"
                                                size="sm"
                                                className="mt-2"
                                                onClick={() => setDialogOpen(true)}                                            >
                                                Create Merge
                                            </Button>

                                        </div>
                                    </TableCell>
                                </TableRow>}

                        </TableBody>
                    </Table>
                    {/* ----------Pagination  */}
                    <Paginator
                        totalItems={filtered.length}
                        currentPage={currentPage}
                        itemsPerPage={ITEMS_PER_PAGE}
                        onPageChange={setCurrentPage}
                        label="Class Merges"
                    />
                </CardContent>
            </Card>

            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                <DialogContent className="sm:max-w-[500px]">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2 text-left">
                            <GitMerge className="h-5 w-5 text-indigo-500" />
                            Merge Multiple Classes
                        </DialogTitle>
                        <DialogDescription className="text-left">
                            Select courses to treat as a single unit.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-3 py-1">
                        <div className="space-y-2">
                            <Label className="flex">Merged Class Name *</Label>
                            <Input
                                placeholder="e.g. Combined ICT (CS & Cyber)"
                                value={mergeTitle}
                                onChange={(e) => setMergeTitle(e.target.value)}
                            />
                        </div>

                        <div className="space-y-2">
                            <Label className="flex">Select Teacher * </Label>
                            <InputAutoFill
                                value={selected_teacher?.teacher_id ?? ""}
                                onChange={(val) => {
                                    const t = teachers.find(t => Number(t.id) == Number(val))

                                    if (Number(val) != Number(selected_teacher?.teacher_id) && selectedCourseIds.length > 0) showClearedSelectedCourse({ teacher: t, old_val: selected_teacher, old_ids: selectedCourseIds })
                                    setSelectedTeacher({ teacher_id: t?.id, teacher_name: t?.name })
                                }}
                                placeholder="Search teachers..."
                                options={teachers.map(c => {
                                    return { label: c.name, value: c.id }
                                })}
                            />
                        </div>

                        <div className="space-y-2">
                            <Label className="flex ">Department Filter</Label>
                            <Select value={deptFilter} onValueChange={setDeptFilter}>
                                <SelectTrigger className="w-full">
                                    <SelectValue placeholder="All Departments" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All Departments</SelectItem>
                                    {departments.map((d) => (
                                        <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-2">
                            <Label className="flex">Selected Courses ({selectedCourseIds.length})</Label>

                            {selectedCourseIds.length > 0 && (
                                <div className="space-y-3">
                                    {/* Error Alert - Only shows if there are red badges */}
                                    {selectedCourseIds.some(id => already_merged.includes(courses.find(c => c.id === id)?.course_code)) && (
                                        <div className="flex items-start gap-2 p-3 rounded-md bg-destructive/10 border border-destructive/20 text-destructive">
                                            <Info className="h-4 w-4 mt-0.5 shrink-0" />
                                            <div className="text-xs space-y-1">
                                                <p className="font-bold">Collision Detected</p>
                                                <p>Some selected courses are already part of another merged group. Remove them to proceed.</p>
                                            </div>
                                        </div>
                                    )}

                                    {/* Selected Badges Area */}
                                    <div className="flex flex-wrap gap-2 p-3 border rounded-md bg-muted/30 transition-all">
                                        {selectedCourseIds.map(id => {
                                            const course = courses.find(c => c.id === id)
                                            const already_grouped = already_merged.includes(course?.course_code)

                                            return (
                                                <Badge
                                                    key={id}
                                                    variant={already_grouped ? "destructive" : 'secondary'}
                                                    className={`flex items-center gap-1 pr-1 transition-colors ${already_grouped ? "animate-pulse ring-1 ring-destructive" : ""
                                                        }`}
                                                >
                                                    <span className="flex items-center gap-1">
                                                        {/* {already_grouped && <X className="h-3 w-3" />} */}
                                                        {course?.course_code}
                                                    </span>
                                                    <button
                                                        className="ml-1 rounded-full hover:bg-background/20 p-0.5"
                                                        onClick={() => setSelectedCourseIds(prev => prev.filter(i => i !== id))}
                                                    >
                                                        <X className="h-3 w-3" />
                                                    </button>
                                                </Badge>
                                            )
                                        })}
                                    </div>
                                </div>
                            )}

                            <InputAutoFill
                                value=""
                                onChange={(val) => {
                                    if (val && !selectedCourseIds.includes(val)) {
                                        setSelectedCourseIds(prev => [...prev, val])
                                    }
                                }}
                                placeholder={`Search courses${selected_teacher ? " by " + selected_teacher.teacher_name : ""}...`}
                                options={filteredOptions}
                            />
                        </div>
                    </div>

                    <DialogFooter>
                        <Button variant="outline" onClick={() => { setDialogOpen(false); resetForm(); }}>
                            Cancel
                        </Button>
                        <Button
                            onClick={handleMerge}
                            disabled={!mergeTitle || selectedCourseIds.length < 2 || selectedCourseIds.some(id => {
                                const course = courses.find(c => c.id === id);
                                return already_merged.includes(course?.course_code);
                            })}
                            className="bg-indigo-600"
                        >
                            Confirm Merge
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div >
    )
}