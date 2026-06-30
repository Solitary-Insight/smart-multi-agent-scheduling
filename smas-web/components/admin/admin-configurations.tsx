"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Separator } from "@/components/ui/separator"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Settings, Clock, Calendar, Bell, Shield, Save, Loader } from "lucide-react"
import { toast } from "sonner"
import ConfigurationController from "@/lib/api-controllers/configuration.controller"
import { SEMESETER_CONFIG_KEY } from '@/lib/constants/keys.js'
import GenericController from "@/lib/api-controllers/generic-controller"
import AdminConfigurationsShimmer from "../ui/loading-shimmers/configuration-page-shimmmer"
export function AdminConfigurations() {
  const [days, setDays] = useState({})
  const [isBusy, setisBusy] = useState(true) // Global loading
  const [isRequesting, setisRequesting] = useState(false) // Global loading

  const [config, setConfig] = useState({
    semesterName: "Fall 2026",
    startDate: "2026-09-01",
    endDate: "2026-12-15",
    maxCredits: 21,
    minCredits: 20,
    slotDuration: 60,
    break_between_classes: 15,
    dayStart: "08:00",
    dayEnd: "18:00",
    allowConflicts: false,
    autoNotify: true,
    requireApproval: true,
    maxClassSize: 40,
    enrollmentOpen: true,
    weekStart: "",
  })




  useEffect(() => {
    async function loadData() {
      setisBusy(true)
      await Promise.all([
        new GenericController().getAllWeekDays({
          onSuccess: (data) => { setDays(Object.fromEntries(data.map(day => [day.id, day]))) },
          onFailed: (err) => { toast.dismiss(); toast.error("Unable to load week data..") },
        }),
        new ConfigurationController().getConfigurationByKey({
          key: SEMESETER_CONFIG_KEY,
          onSuccess: (data) => { if (data.value) { setConfig(data.value) } },
          onFailed: (err) => { toast.dismiss(); toast.error("Unable to load configuration data..") }
        })
      ])
      setisBusy(false)
    }
    loadData()
  }, [])

  async function handleSave() {
    const {
      semesterName,
      startDate,
      endDate,
      maxCredits,
      minCredits,
      slotDuration,
      break_between_classes,
      dayStart,
      weekStart,
      dayEnd,
      maxClassSize
    } = config;
    toast.dismiss()
    if (!semesterName.trim()) return toast.error("Semester name is required");
    if (!startDate || !endDate) return toast.error("Start and End dates are required");
    if (new Date(startDate) > new Date(endDate)) return toast.error("Start date cannot be after end date");
    if (weekStart == '') return toast.error("Please choose a starting day of the week.");
    if (Number(minCredits) < 0 || Number(maxCredits) < 0) return toast.error("Credits cannot be negative");
    if (Number(minCredits) > Number(maxCredits)) return toast.error("Minimum credits cannot exceed maximum credits");
    if (Number(slotDuration) <= 0) return toast.error("Slot duration must be greater than 0");
    if (Number(break_between_classes) < 0) return toast.error("Break duration cannot be negative");
    if (dayStart >= dayEnd) return toast.error("Day start time must be before end time");
    if (Number(maxClassSize) <= 0) return toast.error("Max class size must be greater than 0");
    if (Object.values(days).filter(d => !d.is_holiday).length < 1) return toast.error("There must be atleast 1 working day!");

    // toast.loading("Saving configurations. Please wait...")
    setisRequesting(true)
    await new ConfigurationController().setConfiguration(
      {
        key: SEMESETER_CONFIG_KEY,
        payload: {
          value: config,
          days_config: Object.entries(days).map(([k, v]) => [k, v.is_holiday]),
          description: "Configurations for semester",
        },
        onSuccess: (data) => {
          toast.dismiss();
          toast.success("Configuration saved successfully.");

          // Fail-safe: ensure data is an array with at least one element
          const id = Array.isArray(data) && data[0]?.id ? data[0].id : '';

          // Update local state safely
          setConfig(prev => ({
            ...prev,
            weekStart: id || prev.weekStart || '' // fallback to previous value or empty string
          }));
        },
        onFailed: (error) => {
          console.error("[CONFIG-SAVE-ERROR]", error);
          toast.dismiss();
          toast.error("Failed to save configuration. Using defaults.");

          // Optional: fallback to default config or empty string
          setConfig(prev => ({
            ...prev,
            weekStart: prev.weekStart || ''
          }));
        }
      }
    )
    setisRequesting(false)

    // 👉 call API here
    // await configService.setConfiguration("academic.settings", { value: config })
  }
  if (isBusy) return <AdminConfigurationsShimmer />

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Configurations</h1>
          <p className="text-sm text-muted-foreground">
            System settings and timetable parameters
          </p>
        </div>
        <Button disabled={isRequesting || isBusy} onClick={handleSave}>
          {
            isRequesting ? <Loader className=" animate-spin mr-2 h-4 w-4" /> : <Save className="mr-2 h-4 w-4" />
          }
          {isRequesting ? "Saving Configurations" : "Save Configurations"}
        </Button>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Calendar className="h-4 w-4 text-primary" />
              Semester Settings
            </CardTitle>
            <CardDescription>Configure the current academic semester</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="semester-name">Semester Name</Label>
              <Input
                disabled={isRequesting}
                id="semester-name"
                value={config.semesterName}
                onChange={(e) => setConfig({ ...config, semesterName: e.target.value })}
              />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="start-date">Start Date</Label>
                <Input
                  disabled={isRequesting}
                  id="start-date"
                  type="date"
                  value={config.startDate}
                  onChange={(e) => setConfig({ ...config, startDate: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="end-date">End Date</Label>
                <Input
                  disabled={isRequesting}
                  id="end-date"
                  type="date"
                  value={config.endDate}
                  onChange={(e) => setConfig({ ...config, endDate: e.target.value })}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="week-start">Week Starts On</Label>
              <Select
                value={config.weekStart || ""}
                disabled={isRequesting}
                onValueChange={(v) => setConfig({ ...config, weekStart: v })}
              >
                <SelectTrigger id="week-start">
                  <SelectValue placeholder="Select a day" />
                </SelectTrigger>
                <SelectContent>
                  {Object.values(days).map((d) => (
                    <SelectItem
                      key={d.id}
                      value={d.id}
                      disabled={d.is_holiday} // disable holidays
                    >
                      {d.name} {d.is_holiday ? "(Holiday)" : ""}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                Choose which day your week starts on (holidays are disabled).
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Clock className="h-4 w-4 text-primary" />
              Time Slot Settings
            </CardTitle>
            <CardDescription>Define class scheduling parameters</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="slot-duration">Slot Duration (min)</Label>
                <Input
                  id="slot-duration"
                  type="number"
                  min={1}
                  value={config.slotDuration}
                  disabled={isRequesting}
                  onChange={(e) =>
                    setConfig({
                      ...config,
                      slotDuration: Number(e.target.value) || 0
                    })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="break-duration">Break Duration (min)</Label>
                <Input
                  id="break-duration"
                  type="number"
                  min={0}
                  value={config.break_between_classes}
                  disabled={isRequesting}
                  onChange={(e) =>
                    setConfig({
                      ...config,
                      break_between_classes: Number(e.target.value) || 0
                    })
                  }
                />
              </div>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="day-start">Day Starts</Label>
                <Input
                  id="day-start"
                  disabled={isRequesting}
                  type="time"
                  value={config.dayStart}
                  onChange={(e) => setConfig({ ...config, dayStart: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="day-end">Day Ends</Label>
                <Input
                  disabled={isRequesting}
                  id="day-end"
                  type="time"
                  value={config.dayEnd}
                  onChange={(e) => setConfig({ ...config, dayEnd: e.target.value })}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Settings className="h-4 w-4 text-primary" />
              Enrollment Settings
            </CardTitle>
            <CardDescription>Student enrollment parameters</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="max-credits">Max Credits per Semester</Label>
                <Input
                  id="max-credits"
                  type="number"
                  min={0} // optional, prevent negative values
                  value={config.maxCredits}
                  disabled={isRequesting}
                  onChange={(e) =>
                    setConfig({
                      ...config,
                      maxCredits: Number(e.target.value) || 0
                    })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="min-credits">Min Credits per Semester</Label>

                <Input
                  id="min-credits"
                  type="number"
                  min={0}
                  value={config.minCredits}
                  disabled={isRequesting}
                  onChange={(e) =>
                    setConfig({
                      ...config,
                      minCredits: Number(e.target.value) || 0
                    })
                  }
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="max-class-size">Max Class Size</Label>
              <Input
                id="max-class-size"
                type="number"
                min={1}
                disabled={isRequesting}
                value={config.maxClassSize}
                onChange={(e) =>
                  setConfig({
                    ...config,
                    maxClassSize: Number(e.target.value) || 0
                  })
                }
              />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Calendar className="h-4 w-4 text-primary" />
              Week Day Settings
            </CardTitle>
            <CardDescription>
              Configure which days are working days and which are holidays

            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
              {Object.entries(days).map(([k, v]) => (
                <div
                  key={k}
                  className="flex flex-col items-center p-3  rounded shadow-sm"
                >
                  <p className="text-sm font-medium text-center">{v.name}</p>
                  <Switch
                    disabled={isRequesting}
                    checked={!v.is_holiday} // true = working day
                    onCheckedChange={(val) =>
                      setDays(prev =>
                        ({ ...prev, [k]: { ...v, is_holiday: !v.is_holiday } })
                      )
                    }
                  />
                  <p className="text-xs text-muted-foreground mt-1 text-center">
                    {v.is_holiday ? "Holiday" : "Working Day"}
                  </p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Shield className="h-4 w-4 text-primary" />
            System Preferences
          </CardTitle>
          <CardDescription>Toggle system behaviors</CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-foreground">Allow Schedule Conflicts</p>
              <p className="text-xs text-muted-foreground">
                Allow overlapping classes in the same room
              </p>
            </div>
            <Switch
              disabled={isRequesting}
              checked={config.allowConflicts}
              onCheckedChange={(v) => setConfig({ ...config, allowConflicts: v })}
            />
          </div>
          <Separator />
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-foreground">Auto Notifications</p>
              <p className="text-xs text-muted-foreground">
                Send email notifications for schedule changes
              </p>
            </div>
            <Switch
              disabled={isRequesting}
              checked={config.autoNotify}
              onCheckedChange={(v) => setConfig({ ...config, autoNotify: v })}
            />
          </div>
          <Separator />
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-foreground">Require Enrollment Approval</p>
              <p className="text-xs text-muted-foreground">
                Admins must approve student enrollments
              </p>
            </div>
            <Switch
              disabled={isRequesting}
              checked={config.requireApproval}
              onCheckedChange={(v) => setConfig({ ...config, requireApproval: v })}
            />
          </div>
          <Separator />
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-foreground">Enrollment Open</p>
              <p className="text-xs text-muted-foreground">
                Students can currently enroll in courses
              </p>
            </div>
            <Switch
              disabled={isRequesting}
              checked={config.enrollmentOpen}
              onCheckedChange={(v) => setConfig({ ...config, enrollmentOpen: v })}
            />
          </div>
        </CardContent>
      </Card>


      {/* <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Bell className="h-4 w-4 text-primary" />
              Notification Templates
            </CardTitle>
            <CardDescription>Customize notification messages sent to users</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Schedule Change Notification</Label>
              <Input
                defaultValue="Your class {course} has been rescheduled to {newTime} in {room}."
                className="text-sm"
              />
            </div>
            <div className="space-y-2">
              <Label>Enrollment Confirmation</Label>
              <Input
                defaultValue="You have been enrolled in {course} for the {semester} semester."
                className="text-sm"
              />
            </div>
            <div className="space-y-2">
              <Label>Class Cancellation</Label>
              <Input
                defaultValue="Your class {course} on {date} has been cancelled."
                className="text-sm"
              />
            </div>
          </CardContent>
        </Card> */}


    </div>
  )
}
