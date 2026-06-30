"use client"

import { useEffect, useMemo, useState } from "react"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import {
    Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter
} from "@/components/ui/dialog"
import {
    Table, TableBody, TableCell, TableHead, TableHeader, TableRow
} from "@/components/ui/table"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Plus, Pencil, Trash2, Coffee, Search } from "lucide-react"
import { toast } from "sonner"
import { Label } from "../ui/label"
import DepartmentController from "@/lib/api-controllers/department-controller"
import { generateHslColors, safeParseJsonArray } from "@/lib/utils"
import { BreakController } from "@/lib/api-controllers/break.controller"


import dayjs from "dayjs";
import duration from "dayjs/plugin/duration";
import ConfigurationController from "@/lib/api-controllers/configuration.controller"
import { SEMESETER_CONFIG_KEY } from "@/lib/constants/keys"
import GenericController from "@/lib/api-controllers/generic-controller"
import BreakRowShimmer from "../ui/loading-shimmers/break-row-shimmer"
import Paginator from "../common/helper/paginator"
import DeleteConfirmDialog from "../common/helper/confirm-delete-dialog"
dayjs.extend(duration);


// Mock departments (replace with API)

export default function AdminBreaks() {
    const [breaks, setBreaks] = useState<any[]>([])
    const [dialogOpen, setDialogOpen] = useState(false)
    const [editing, setEditing] = useState<any | null>(null)
    const [breakToDelete, setBreakToDelete] = useState<any | null>(null)

    const [departments, setDepartments] = useState([])
    const [days, setDays] = useState([])


    const [config, setConfig] = useState(null)
    // status monitoring 

    const [isBusy, setisBusy] = useState(true) // Global loading
    const [isRequesting, setisRequesting] = useState(false) // Global loading

    // form state
    const [startTime, setStartTime] = useState("")
    const [endTime, setEndTime] = useState("")
    const [selectedDays, setSelectedDays] = useState<string[]>([])
    const [selectedDepartments, setSelectedDepartments] = useState<string[]>([])
    const [breakLabel, setBreakLabel] = useState("");


    //filters 
    const [deptFilter, setDeptFilter] = useState("all")
    const [dayFilter, setDayFilter] = useState("all")
    const [search, setSearch] = useState("")


    const [openDeleteDialog, setDeleteDialog] = useState(false)



    const processed_breaks = useMemo(() => {
        return breaks.map(b => {
            const { formatted, duration } = getTimeDetails(b.start, b.end);
            const hours = duration.hours();
            const minutes = duration.minutes();
            return {
                ...b,
                formatted_time: formatted,
                hours,
                minutes,
                days: safeParseJsonArray(b.days),
                departments: safeParseJsonArray(b.departments),
            }
        })
    }, [breaks])

    const filtered_breaks = useMemo(() => {
        return processed_breaks.filter((b) => {
            // Search filter
            const matchesSearch = b.label.toLowerCase().includes(search.toLowerCase());
            // Department filter
            const matchesDept =
                deptFilter === "all" ||
                b.departments.some((depId: number) => depId === Number(deptFilter));
            // Day filter
            const matchesDay =
                dayFilter === "all" ||
                b.days.some((dayId: number) => dayId === Number(dayFilter));
            return matchesSearch && matchesDept && matchesDay;
        });
    }, [processed_breaks, search, deptFilter, dayFilter]);


    // Logic For Pagination 
    const [currentPage, setCurrentPage] = useState(1)
    const ITEMS_PER_PAGE = 7
    // Pagination Logic
    const totalPages = Math.ceil(filtered_breaks.length / ITEMS_PER_PAGE)
    const paginated = useMemo(() => {
        const start = (currentPage - 1) * ITEMS_PER_PAGE
        return filtered_breaks.slice(start, start + ITEMS_PER_PAGE)
    }, [filtered_breaks, currentPage])



    // default load
    useEffect(() => {

        async function fetchRequiredData() {
            setisBusy(true)
            await Promise.all([
                new BreakController().getAllBreaks({
                    onSuccess: (data: any) => { setBreaks(data); },
                    onFailed: (err: any) => { }
                }),
                new DepartmentController().getAllDepartments({
                    onSuccess: (data: any) => { setDepartments(data); setSelectedDepartments(data.map(d => d.id)) },
                    onFailed: (err: any) => { }
                }),
                new GenericController().getAllWeekDays({
                    onSuccess: (data: any) => { setDays(data); setSelectedDays(data.map(d => d.id)) },
                    onFailed: (err: any) => { }
                }), new ConfigurationController().getConfigurationByKey({
                    key: SEMESETER_CONFIG_KEY,
                    onSuccess: (data) => { if (data.value) { setConfig(data.value) } },
                    onFailed: (err) => { toast.dismiss(); toast.error("Unable to load configuration data..") }
                })

            ]).catch(e => {
                toast.error("Loading data failed. Please refresh the page.")
            }).finally(() => {
                setisBusy(false)

            })


        }
        // // replace with API
        // setBreaks([])
        // setisBusy(false)
        fetchRequiredData()
    }, [])

    function getTimeDetails(startStr: string, endStr: string) {
        const [sh, sm] = startStr.split(":").map(Number);
        const [eh, em] = endStr.split(":").map(Number);

        let start = dayjs().hour(sh).minute(sm).second(0);
        let end = dayjs().hour(eh).minute(em).second(0);

        // handle overnight case
        if (end.isBefore(start)) end = end.add(1, "day");

        const diffMinutes = end.diff(start, "minute");

        return {
            formatted: `${start.format("hh:mm A")} - ${end.format("hh:mm A")}`,
            duration: dayjs.duration(diffMinutes, "minutes"),
        };
    }

    const resetForm = () => {
        setBreakLabel("");
        setStartTime("");
        setEndTime("");
        setSelectedDays(days.filter(d => !d.is_holiday).map(d => d.id))
        setSelectedDepartments(departments.map(d => d.id));
        setEditing(null);
    }

    const openAdd = () => {
        resetForm()
        setDialogOpen(true)
    }

    const openEdit = (b: any) => {
        setEditing(b)
        setBreakLabel(b.label)
        setStartTime(b.start)
        setEndTime(b.end)
        setSelectedDays(b.days)
        setSelectedDepartments(b.departments)
        setDialogOpen(true)
    }

    const handleSave = async () => {
        toast.dismiss()
        if (!breakLabel.trim()) return toast.error("Break label is required.")
        if (!startTime || !endTime) return toast.error("Start & End time is required.")
        if (selectedDays.length == 0) return toast.error("Atleast one day must be selected.")
        if (selectedDepartments.length == 0) return toast.error("Atleast one department must be selected.")

        const { formatted, duration } = getTimeDetails(startTime, endTime);

        const hours = duration.hours();
        const minutes = duration.minutes();

        const total_break_time = (hours ?? 0) * 60 + (minutes ?? 0);

        if (config) {
            if (total_break_time > config?.slotDuration ?? 0) {
                return toast.error(`Break time can not be more than a slot duration. i.e ${config?.slotDuration ?? "Unknown"} Minutes.`)

            }
        }
        const payload = {
            id: editing?.id ?? Date.now(),
            label: breakLabel,
            start: startTime,
            end: endTime,
            days: selectedDays,
            departments: selectedDepartments
        }

        setDialogOpen(false)
        setisRequesting(true)

        toast.loading(`Break is being ${editing ? "Edited" : "Created"}. Please wait...`)
        if (editing) {
            await new BreakController().updateBreak({
                id: editing.id,
                payload,
                onSuccess: ({ message, id }) => {
                    toast.dismiss()
                    toast.success("Break Updated successfully...")
                    setBreaks(prev => prev.map(b => b.id === editing.id ? { ...payload } : b))
                    resetForm()

                },
                onFailed: (err) => {
                    toast.dismiss(); toast.error(err);
                    setTimeout(() => {
                        setDialogOpen(true)
                    }, 2000);
                }
            })
        } else {
            await new BreakController().createBreak({
                payload,
                onSuccess: ({ message, id }) => {
                    toast.dismiss()
                    toast.success("Break created successfully...")
                    setBreaks(prev => [{ ...payload, id }, ...prev])
                    resetForm()

                },
                onFailed: (err) => {
                    toast.dismiss(); toast.error(err);
                    setTimeout(() => {
                        setDialogOpen(true)
                    }, 2000);
                }
            })


        }
        setisRequesting(false)


    }

    const handleDelete = async () => {
        toast.loading("Deleting break. Please wait...")
        setisRequesting(true)
        await new BreakController().deleteBreak({
            id: Number(breakToDelete.id),
            onSuccess: (data) => {
                toast.dismiss();
                toast.success("Break deleted successfully")
                setBreaks(prev => prev.filter(b => Number(b.id) != Number(breakToDelete.id)))
            },
            onFailed: (err) => {
                toast.dismiss();
                toast.error(err)
            }
        })
        setisRequesting(false)


    }

    // toggle helpers
    const toggleItem = (list: string[], setList: any, value: string) => {
        setList(
            list.includes(value)
                ? list.filter(i => i !== value)
                : [...list, value]
        )
    }

    return (
        <div className="space-y-6">
            <DeleteConfirmDialog
                title="Delete Breake"
                description={`This will permanently erase break ${breakToDelete?.label}.`}
                open={openDeleteDialog}
                onOpenChange={setDeleteDialog}
                confirmationKeyword="CONFIRM Delete"
                onConfirm={() => { handleDelete() }}
            />
            {/* Header */}
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold flex items-center gap-2">
                        Breaks
                    </h1>
                    <p className="text-sm text-muted-foreground">
                        Manage break times across departments
                    </p>
                </div>

                <Button disabled={(isRequesting || isBusy)} onClick={openAdd}>
                    <Plus className="mr-2 h-4 w-4" />
                    Add Break
                </Button>
            </div>

            {/* Table */}
            <Card>
                <CardHeader>
                    <div className="flex flex-col sm:flex-row sm:items-center flex-wrap gap-3">
                        {/* Search Input */}
                        <div className="relative flex-1 min-w-[200px]">
                            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                            <Input
                                placeholder="Search by label..."
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                className="pl-9 w-full"
                            />
                        </div>

                        {/* Department Filter */}
                        <div className="flex-1 sm:flex-none min-w-[160px]">
                            <Select value={deptFilter} onValueChange={(val) => setDeptFilter(val)}>
                                <SelectTrigger className="w-full sm:w-48">
                                    <SelectValue placeholder="All Departments" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All Departments</SelectItem>
                                    {departments.map((d) => (
                                        <SelectItem key={d.id} value={String(d.id)}>
                                            {d.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        {/* Day Filter */}
                        <div className="flex-1 sm:flex-none min-w-[160px]">
                            <Select value={dayFilter} onValueChange={(val) => setDayFilter(val)}>
                                <SelectTrigger className="w-full sm:w-48">
                                    <SelectValue placeholder="All Days" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All Days</SelectItem>
                                    {days.filter(d => !d.is_holiday).map((d) => (
                                        <SelectItem key={d.id} value={String(d.id)}>
                                            {d.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead className="text-start">Time</TableHead>
                                <TableHead className="hidden sm:table-cell text-center">Days</TableHead>
                                <TableHead className="hidden md:table-cell text-center">Departments</TableHead>
                                <TableHead className="text-right">Actions</TableHead>
                            </TableRow>
                        </TableHeader>

                        <TableBody>
                            {isBusy ? (
                                Array(5).fill(0).map((_, i) => <BreakRowShimmer key={i} />)
                            ) : (
                                filtered_breaks.map((b, i) => {
                                    if ((Number(breakToDelete?.id) === Number(b.id) && isRequesting) ||
                                        (Number(editing?.id) === Number(b.id) && isRequesting))
                                        return <BreakRowShimmer key={i} />

                                    return (
                                        <TableRow key={b.id} className="hover:bg-accent/30">
                                            {/* Time Column */}
                                            <TableCell>
                                                <div className="flex flex-col gap-1 text-sm">
                                                    <span className="font-medium truncate">{b.label}</span>
                                                    <span className="truncate">{b.formatted_time}</span>
                                                    <span className="text-xs text-muted-foreground">
                                                        {[
                                                            b.hours > 0 && `${b.hours} hour${b.hours > 1 ? "s" : ""}`,
                                                            b.minutes > 0 && `${b.minutes} minute${b.minutes > 1 ? "s" : ""}`,
                                                        ].filter(Boolean).join(" ")}
                                                    </span>
                                                </div>
                                            </TableCell>

                                            {/* Days Column */}
                                            <TableCell className="hidden sm:table-cell">
                                                <div className="flex flex-wrap gap-1 justify-center">
                                                    {days
                                                        .filter(d => b.days.includes(d.id))
                                                        .map(d => {
                                                            const colors = generateHslColors(d.id);
                                                            return (
                                                                <Badge
                                                                    key={d.id}
                                                                    style={(d.is_holiday || Number(dayFilter) === Number(d.id)) ? {} : { borderColor: colors?.border, color: colors?.text }}
                                                                    variant={d.is_holiday ? "destructive" : Number(dayFilter) === Number(d.id) ? "accent" : "outline"}
                                                                    className="cursor-pointer text-xs"
                                                                    onClick={() => setDayFilter(String(d.id))}
                                                                    title={d.is_holiday ? `${d.name} (Holiday)` : d.name}
                                                                >
                                                                    {d.name.slice(0, 3)}
                                                                </Badge>
                                                            );
                                                        })}
                                                </div>
                                            </TableCell>

                                            {/* Departments Column */}
                                            <TableCell className="hidden md:table-cell">
                                                <div className="flex flex-wrap gap-1 justify-center">
                                                    {departments
                                                        .filter(dep => b.departments.includes(dep.id))
                                                        .map(dep => {
                                                            const colors = generateHslColors(dep.code);
                                                            return (
                                                                <Badge
                                                                    key={dep.id}
                                                                    style={Number(deptFilter) === dep.id ? {} : { borderColor: colors?.border, color: colors?.text }}
                                                                    variant={Number(deptFilter) === dep.id ? "accent" : "outline"}
                                                                    className="cursor-pointer text-xs"
                                                                    onClick={() => setDeptFilter(String(dep.id))}
                                                                    title={dep.name}
                                                                >
                                                                    {dep.code}
                                                                </Badge>
                                                            );
                                                        })}
                                                </div>
                                            </TableCell>

                                            {/* Actions */}
                                            <TableCell className="text-right">
                                                <div className="flex justify-end gap-1">
                                                    <Button disabled={isRequesting || isBusy} variant="ghost" size="icon" onClick={() => openEdit(b)}>
                                                        <Pencil className="h-4 w-4" />
                                                    </Button>
                                                    <Button disabled={isRequesting || isBusy} variant="ghost" size="icon" onClick={() => { setDeleteDialog(true); setBreakToDelete(b) }}>
                                                        <Trash2 className="h-4 w-4 text-destructive" />
                                                    </Button>
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    )
                                })
                            )}

                            {/* Empty State */}
                            {(paginated.length === 0 && !isBusy) && (
                                <TableRow>
                                    <TableCell colSpan={4} className="h-32 text-center">
                                        <div className="flex flex-col items-center justify-center gap-2 text-muted-foreground">
                                            <div className="text-sm font-medium">No Break available</div>
                                            <div className="text-xs">Add breaks to get started</div>
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                className="mt-2"
                                                disabled={isRequesting || isBusy}
                                                onClick={openAdd}
                                            >
                                                Add Break
                                            </Button>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>

                    <Paginator
                        totalItems={filtered_breaks.length}
                        currentPage={currentPage}
                        itemsPerPage={ITEMS_PER_PAGE}
                        onPageChange={setCurrentPage}
                        label="Breaks"
                    />
                </CardContent>
            </Card>

            {/* Dialog */}
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                <DialogContent className="sm:max-w-lg">
                    <DialogHeader>
                        <DialogTitle>
                            {editing ? "Edit Break" : "Add Break"}
                        </DialogTitle>
                        <p className="text-sm text-muted-foreground">
                            Define break timing and apply it across selected days and departments.
                        </p>
                    </DialogHeader>

                    <div className="">
                        {/* Break Label */}
                        <div className="space-y-2">
                            <Label className="text-sm font-medium">Break Label</Label>
                            <Input
                                placeholder="e.g. Lunch Break, Short Break"
                                value={breakLabel}
                                onChange={e => setBreakLabel(e.target.value)}
                            />
                            <p className="text-xs text-muted-foreground">Provide a short title for the break.</p>
                        </div>
                        {/* Time Section */}
                        <div className="space-y-1">
                            <Label className="text-sm font-medium">Break Time</Label>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1">
                                    <Label className="text-xs text-muted-foreground">Start Time</Label>
                                    <Input
                                        type="time"
                                        value={startTime}
                                        onChange={e => setStartTime(e.target.value)}
                                    />
                                </div>

                                <div className="space-y-1">
                                    <Label className="text-xs text-muted-foreground">End Time</Label>
                                    <Input
                                        type="time"
                                        value={endTime}
                                        onChange={e => setEndTime(e.target.value)}
                                    />
                                </div>
                            </div>
                            <p className="text-xs text-muted-foreground">Max Break duration is {config?.slotDuration ?? "unknown"} Minutes. i.e. slot duration</p>

                        </div>

                        {/* Days Section */}
                        <div className="space-y-3">
                            <div className="flex items-center justify-between">
                                <Label className="text-sm font-medium">Days</Label>

                                <div className="flex gap-2">
                                    {days.length > selectedDays.length && <Button
                                        type="button"
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => setSelectedDays(days.filter(d => !d.is_holiday).map(d => d.id))}
                                    >
                                        All
                                    </Button>}
                                    {selectedDays.length > 0 && <Button
                                        type="button"
                                        variant="destructive"
                                        size="sm"
                                        onClick={() => setSelectedDays([])}
                                    >
                                        Clear
                                    </Button>}
                                </div>
                            </div>

                            <div className="flex flex-wrap gap-2">
                                {days.map(d => {
                                    const colors = generateHslColors(d.name);
                                    const isSelected = selectedDays.includes(d.id);

                                    // Determine badge variant and style
                                    let variant: "default" | "accent" | "destructive" | "outline" = "outline";
                                    let style = {};

                                    if (isSelected) {
                                        variant = "accent";
                                    } else if (d.is_holiday) {
                                        variant = "destructive";
                                    } else {
                                        style = { borderColor: colors?.border, color: colors?.text };
                                    }

                                    return (
                                        <Badge
                                            key={d.id}
                                            variant={variant}
                                            style={style}
                                            className="cursor-pointer  font-sm text-sm transition-colors duration-200"
                                            onClick={() => {
                                                if (d.is_holiday) return; // Cannot select holidays
                                                toggleItem(selectedDays, setSelectedDays, d.id);
                                            }}
                                            title={d.is_holiday ? `${d.name} (Holiday)` : d.name} // accessibility
                                        >
                                            {(d.name ?? "").slice(0, 3)}
                                        </Badge>
                                    );
                                })}
                            </div>

                            <p className="text-xs text-muted-foreground">
                                Select the days this break applies to.
                            </p>
                        </div>

                        {/* Departments Section */}
                        <div className="space-y-3">
                            <div className="flex items-center justify-between">
                                <Label className="text-sm font-medium">Departments</Label>

                                <div className="flex gap-2">
                                    {selectedDepartments.length < departments.length && <Button
                                        type="button"
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => setSelectedDepartments(departments.map(d => d.id))}
                                    >
                                        All
                                    </Button>}
                                    {selectedDepartments.length > 0 && <Button
                                        type="button"
                                        variant="destructive"
                                        size="sm"
                                        onClick={() => setSelectedDepartments([])}
                                    >
                                        Clear
                                    </Button>}
                                </div>
                            </div>

                            <div className="flex flex-wrap gap-2">
                                {departments.map(dep => {
                                    const colors = generateHslColors(dep.code)
                                    const isSelected = selectedDepartments.includes(dep.id)
                                    return <Badge
                                        key={dep.id}
                                        variant={isSelected ? "accent" : 'outline'}
                                        style={isSelected ? {} : { borderColor: colors?.border, color: colors?.text }}
                                        className={`cursor-pointer  text-${isSelected ? "black" : "white"}`}
                                        onClick={() =>
                                            toggleItem(selectedDepartments, setSelectedDepartments, dep.id)
                                        }
                                    >
                                        {dep.code}
                                    </Badge>
                                })}
                            </div>

                            <p className="text-xs text-muted-foreground">
                                Apply this break to selected departments.
                            </p>
                        </div>
                    </div>

                    <DialogFooter>
                        <Button
                            variant="outline"
                            onClick={() => setDialogOpen(false)}
                        >
                            Cancel
                        </Button>

                        <Button onClick={handleSave}>
                            {editing ? "Save Changes" : "Create Break"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    )
}