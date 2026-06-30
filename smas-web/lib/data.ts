// ==================== TYPES ====================

export type Role = "student" | "teacher" | "admin"

export interface Department {
  id: string
  name: string
  code: string
  color: string
  headOfDepartment: string
}

export interface Course {
  id: string
  name: string
  code: string
  departmentId: string
  semester: number
  credits: number
  prerequisites: string[] // course IDs
  teacherId: string
  description: string
}

export interface Student {
  id: any
  name: string
  email: string
  departmentId: string
  semester: number
  enrolledCourses: string[] // course IDs
  completedCourses: string[] // course IDs
}

export interface Teacher {
  id: string
  name: string
  email: string
  departmentIds: string[]
  priorityDays: string[] // "Monday", "Tuesday", etc.
  priorityTimeStart: string // "09:00"
  priorityTimeEnd: string // "15:00"
}

export interface Classroom {
  id: string
  name: string
  building: string
  capacity: number
  type: "lecture" | "lab" | "seminar"
  equipment: string[]
}

export interface TimeSlot {
  id: string
  startTime: string
  endTime: string
  label: string
}

export interface ScheduleEntry {
  id: string
  courseId: string
  teacherId: string
  classroomId: string
  departmentId: string
  day: string
  timeSlotId: string
  isRescheduled?: boolean
  originalDay?: string
  originalTimeSlotId?: string
}

export interface BreakEntry {
  id: string
  name: string
  day: string | "all"
  startTime: string
  endTime: string
  departmentId?: string | "all"
}

export interface Holiday {
  id: string
  name: string
  date: string
  departmentIds: string[] | ["all"]
}

export interface Notification {
  id: string
  title: string
  message: string
  type: "info" | "warning" | "success" | "error"
  targetRole: Role
  targetId?: string
  read: boolean
  timestamp: string
}

export interface RescheduleRequest {
  id: string
  teacherId: string
  scheduleEntryId: string
  requestedDay: string
  requestedTimeSlotId: string
  reason: string
  status: "pending" | "approved" | "rejected"
  timestamp: string
}

export interface UniversityConfig {
  name: string
  openingTime: string
  closingTime: string
  workingDays: string[]
}

// ==================== STATIC DATA ====================

export const universityConfig: UniversityConfig = {
  name: "Greenfield University",
  openingTime: "08:00",
  closingTime: "18:00",
  workingDays: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"],
}

export const departments: Department[] = [
  { id: "dept-1", name: "Computer Science", code: "CS", color: "hsl(210, 80%, 55%)", headOfDepartment: "Dr. Alan Turing" },
  { id: "dept-2", name: "Mathematics", code: "MATH", color: "hsl(160, 60%, 45%)", headOfDepartment: "Dr. Emily Noether" },
  { id: "dept-3", name: "Physics", code: "PHY", color: "hsl(30, 80%, 55%)", headOfDepartment: "Dr. Richard Feynman" },
  { id: "dept-4", name: "Electrical Engineering", code: "EE", color: "hsl(340, 70%, 55%)", headOfDepartment: "Dr. Nikola Tesla" },
  { id: "dept-5", name: "Business Administration", code: "BA", color: "hsl(270, 60%, 55%)", headOfDepartment: "Dr. Peter Drucker" },
]

export const timeSlots: TimeSlot[] = [
  { id: "ts-1", startTime: "08:00", endTime: "09:00", label: "8:00 - 9:00 AM" },
  { id: "ts-2", startTime: "09:00", endTime: "10:00", label: "9:00 - 10:00 AM" },
  { id: "ts-3", startTime: "10:00", endTime: "11:00", label: "10:00 - 11:00 AM" },
  { id: "ts-4", startTime: "11:00", endTime: "12:00", label: "11:00 - 12:00 PM" },
  { id: "ts-5", startTime: "12:00", endTime: "13:00", label: "12:00 - 1:00 PM" },
  { id: "ts-6", startTime: "13:00", endTime: "14:00", label: "1:00 - 2:00 PM" },
  { id: "ts-7", startTime: "14:00", endTime: "15:00", label: "2:00 - 3:00 PM" },
  { id: "ts-8", startTime: "15:00", endTime: "16:00", label: "3:00 - 4:00 PM" },
  { id: "ts-9", startTime: "16:00", endTime: "17:00", label: "4:00 - 5:00 PM" },
  { id: "ts-10", startTime: "17:00", endTime: "18:00", label: "5:00 - 6:00 PM" },
]

export const teachers: Teacher[] = [
  { id: "t-1", name: "Dr. Sarah Mitchell", email: "s.mitchell@greenfield.edu", departmentIds: ["dept-1"], priorityDays: ["Monday", "Wednesday", "Friday"], priorityTimeStart: "09:00", priorityTimeEnd: "15:00" },
  { id: "t-2", name: "Prof. James Carter", email: "j.carter@greenfield.edu", departmentIds: ["dept-1", "dept-2"], priorityDays: ["Tuesday", "Thursday"], priorityTimeStart: "10:00", priorityTimeEnd: "16:00" },
  { id: "t-3", name: "Dr. Emily Chen", email: "e.chen@greenfield.edu", departmentIds: ["dept-2"], priorityDays: ["Monday", "Tuesday", "Wednesday"], priorityTimeStart: "08:00", priorityTimeEnd: "14:00" },
  { id: "t-4", name: "Prof. Robert Hayes", email: "r.hayes@greenfield.edu", departmentIds: ["dept-3"], priorityDays: ["Wednesday", "Thursday", "Friday"], priorityTimeStart: "09:00", priorityTimeEnd: "17:00" },
  { id: "t-5", name: "Dr. Lisa Park", email: "l.park@greenfield.edu", departmentIds: ["dept-4"], priorityDays: ["Monday", "Wednesday"], priorityTimeStart: "10:00", priorityTimeEnd: "16:00" },
  { id: "t-6", name: "Prof. Michael Adams", email: "m.adams@greenfield.edu", departmentIds: ["dept-5"], priorityDays: ["Tuesday", "Thursday", "Friday"], priorityTimeStart: "09:00", priorityTimeEnd: "15:00" },
  { id: "t-7", name: "Dr. Anna Williams", email: "a.williams@greenfield.edu", departmentIds: ["dept-1", "dept-4"], priorityDays: ["Monday", "Tuesday", "Thursday"], priorityTimeStart: "08:00", priorityTimeEnd: "14:00" },
  { id: "t-8", name: "Prof. David Kim", email: "d.kim@greenfield.edu", departmentIds: ["dept-3", "dept-2"], priorityDays: ["Wednesday", "Friday"], priorityTimeStart: "11:00", priorityTimeEnd: "17:00" },
]

export const courses: Course[] = [
  { id: "c-1", name: "Introduction to Programming", code: "CS101", departmentId: "dept-1", semester: 1, credits: 3, prerequisites: [], teacherId: "t-1", description: "Fundamentals of programming using Python. Covers variables, loops, functions, and basic data structures." },
  { id: "c-2", name: "Data Structures & Algorithms", code: "CS201", departmentId: "dept-1", semester: 3, credits: 4, prerequisites: ["c-1"], teacherId: "t-1", description: "Advanced data structures including trees, graphs, hash tables. Algorithm design and analysis." },
  { id: "c-3", name: "Database Systems", code: "CS301", departmentId: "dept-1", semester: 5, credits: 3, prerequisites: ["c-2"], teacherId: "t-2", description: "Relational databases, SQL, normalization, transaction management, and query optimization." },
  { id: "c-4", name: "Machine Learning", code: "CS401", departmentId: "dept-1", semester: 7, credits: 4, prerequisites: ["c-2", "c-6"], teacherId: "t-7", description: "Supervised and unsupervised learning, neural networks, and practical ML applications." },
  { id: "c-5", name: "Calculus I", code: "MATH101", departmentId: "dept-2", semester: 1, credits: 3, prerequisites: [], teacherId: "t-3", description: "Limits, derivatives, and integrals. Fundamental theorem of calculus." },
  { id: "c-6", name: "Linear Algebra", code: "MATH201", departmentId: "dept-2", semester: 3, credits: 3, prerequisites: ["c-5"], teacherId: "t-3", description: "Vectors, matrices, linear transformations, eigenvalues, and eigenvectors." },
  { id: "c-7", name: "Probability & Statistics", code: "MATH301", departmentId: "dept-2", semester: 5, credits: 3, prerequisites: ["c-5"], teacherId: "t-8", description: "Probability theory, distributions, hypothesis testing, and regression analysis." },
  { id: "c-8", name: "Classical Mechanics", code: "PHY101", departmentId: "dept-3", semester: 1, credits: 3, prerequisites: [], teacherId: "t-4", description: "Newton's laws, kinematics, energy, momentum, and rotational dynamics." },
  { id: "c-9", name: "Electromagnetism", code: "PHY201", departmentId: "dept-3", semester: 3, credits: 4, prerequisites: ["c-8", "c-5"], teacherId: "t-4", description: "Electric fields, magnetic fields, Maxwell's equations, and electromagnetic waves." },
  { id: "c-10", name: "Quantum Physics", code: "PHY301", departmentId: "dept-3", semester: 5, credits: 4, prerequisites: ["c-9", "c-6"], teacherId: "t-8", description: "Wave-particle duality, Schrodinger equation, quantum states, and applications." },
  { id: "c-11", name: "Circuit Analysis", code: "EE101", departmentId: "dept-4", semester: 1, credits: 3, prerequisites: [], teacherId: "t-5", description: "Basic circuit elements, Kirchhoff's laws, AC/DC circuits, and circuit theorems." },
  { id: "c-12", name: "Digital Electronics", code: "EE201", departmentId: "dept-4", semester: 3, credits: 3, prerequisites: ["c-11"], teacherId: "t-5", description: "Boolean algebra, logic gates, flip-flops, counters, and digital system design." },
  { id: "c-13", name: "Embedded Systems", code: "EE301", departmentId: "dept-4", semester: 5, credits: 4, prerequisites: ["c-12", "c-1"], teacherId: "t-7", description: "Microcontrollers, real-time systems, interfacing, and embedded programming." },
  { id: "c-14", name: "Principles of Management", code: "BA101", departmentId: "dept-5", semester: 1, credits: 3, prerequisites: [], teacherId: "t-6", description: "Planning, organizing, leading, and controlling. Introduction to management theories." },
  { id: "c-15", name: "Marketing Fundamentals", code: "BA201", departmentId: "dept-5", semester: 3, credits: 3, prerequisites: ["c-14"], teacherId: "t-6", description: "Marketing mix, consumer behavior, market research, and digital marketing strategies." },
  { id: "c-16", name: "Operating Systems", code: "CS202", departmentId: "dept-1", semester: 3, credits: 4, prerequisites: ["c-1"], teacherId: "t-2", description: "Process management, memory management, file systems, and concurrency." },
]

export const classrooms: Classroom[] = [
  { id: "cr-1", name: "Hall A101", building: "Main Building", capacity: 120, type: "lecture", equipment: ["Projector", "Whiteboard", "Microphone"] },
  { id: "cr-2", name: "Hall A102", building: "Main Building", capacity: 80, type: "lecture", equipment: ["Projector", "Whiteboard"] },
  { id: "cr-3", name: "Lab B201", building: "Science Block", capacity: 40, type: "lab", equipment: ["Computers", "Projector", "Whiteboard"] },
  { id: "cr-4", name: "Lab B202", building: "Science Block", capacity: 35, type: "lab", equipment: ["Computers", "Projector", "Oscilloscopes"] },
  { id: "cr-5", name: "Room C101", building: "Arts Building", capacity: 50, type: "seminar", equipment: ["Projector", "Whiteboard"] },
  { id: "cr-6", name: "Room C102", building: "Arts Building", capacity: 30, type: "seminar", equipment: ["Whiteboard", "Smart Board"] },
  { id: "cr-7", name: "Hall D101", building: "Engineering Block", capacity: 100, type: "lecture", equipment: ["Projector", "Microphone", "Whiteboard"] },
  { id: "cr-8", name: "Lab D201", building: "Engineering Block", capacity: 30, type: "lab", equipment: ["Computers", "Projector", "3D Printer"] },
]

export const students: Student[] = [
  { id: "s-1", name: "Alex Johnson", email: "alex.j@student.greenfield.edu", departmentId: "dept-1", semester: 3, enrolledCourses: ["c-2", "c-6", "c-16"], completedCourses: ["c-1", "c-5"] },
  { id: "s-2", name: "Maria Garcia", email: "maria.g@student.greenfield.edu", departmentId: "dept-1", semester: 5, enrolledCourses: ["c-3", "c-7"], completedCourses: ["c-1", "c-2", "c-5", "c-6"] },
  { id: "s-3", name: "Ryan Patel", email: "ryan.p@student.greenfield.edu", departmentId: "dept-2", semester: 3, enrolledCourses: ["c-6", "c-7"], completedCourses: ["c-5"] },
  { id: "s-4", name: "Sophie Lee", email: "sophie.l@student.greenfield.edu", departmentId: "dept-3", semester: 3, enrolledCourses: ["c-9", "c-6"], completedCourses: ["c-8", "c-5"] },
  { id: "s-5", name: "Liam O'Brien", email: "liam.o@student.greenfield.edu", departmentId: "dept-4", semester: 3, enrolledCourses: ["c-12", "c-1"], completedCourses: ["c-11"] },
  { id: "s-6", name: "Emma Taylor", email: "emma.t@student.greenfield.edu", departmentId: "dept-5", semester: 3, enrolledCourses: ["c-15"], completedCourses: ["c-14"] },
  { id: "s-7", name: "Noah Kim", email: "noah.k@student.greenfield.edu", departmentId: "dept-1", semester: 1, enrolledCourses: ["c-1", "c-5"], completedCourses: [] },
  { id: "s-8", name: "Olivia Brown", email: "olivia.b@student.greenfield.edu", departmentId: "dept-3", semester: 5, enrolledCourses: ["c-10", "c-7"], completedCourses: ["c-8", "c-9", "c-5", "c-6"] },
]

export const scheduleEntries: ScheduleEntry[] = [
  // Monday
  { id: "se-1", courseId: "c-1", teacherId: "t-1", classroomId: "cr-1", departmentId: "dept-1", day: "Monday", timeSlotId: "ts-2" },
  { id: "se-2", courseId: "c-5", teacherId: "t-3", classroomId: "cr-2", departmentId: "dept-2", day: "Monday", timeSlotId: "ts-2" },
  { id: "se-3", courseId: "c-8", teacherId: "t-4", classroomId: "cr-7", departmentId: "dept-3", day: "Monday", timeSlotId: "ts-3" },
  { id: "se-4", courseId: "c-11", teacherId: "t-5", classroomId: "cr-4", departmentId: "dept-4", day: "Monday", timeSlotId: "ts-3" },
  { id: "se-5", courseId: "c-2", teacherId: "t-1", classroomId: "cr-3", departmentId: "dept-1", day: "Monday", timeSlotId: "ts-6" },
  { id: "se-6", courseId: "c-6", teacherId: "t-3", classroomId: "cr-2", departmentId: "dept-2", day: "Monday", timeSlotId: "ts-7" },
  { id: "se-7", courseId: "c-14", teacherId: "t-6", classroomId: "cr-5", departmentId: "dept-5", day: "Monday", timeSlotId: "ts-4" },

  // Tuesday
  { id: "se-8", courseId: "c-3", teacherId: "t-2", classroomId: "cr-3", departmentId: "dept-1", day: "Tuesday", timeSlotId: "ts-3" },
  { id: "se-9", courseId: "c-16", teacherId: "t-2", classroomId: "cr-1", departmentId: "dept-1", day: "Tuesday", timeSlotId: "ts-6" },
  { id: "se-10", courseId: "c-9", teacherId: "t-4", classroomId: "cr-7", departmentId: "dept-3", day: "Tuesday", timeSlotId: "ts-2" },
  { id: "se-11", courseId: "c-12", teacherId: "t-5", classroomId: "cr-4", departmentId: "dept-4", day: "Tuesday", timeSlotId: "ts-7" },
  { id: "se-12", courseId: "c-7", teacherId: "t-8", classroomId: "cr-2", departmentId: "dept-2", day: "Tuesday", timeSlotId: "ts-4" },
  { id: "se-13", courseId: "c-15", teacherId: "t-6", classroomId: "cr-5", departmentId: "dept-5", day: "Tuesday", timeSlotId: "ts-3" },

  // Wednesday
  { id: "se-14", courseId: "c-1", teacherId: "t-1", classroomId: "cr-1", departmentId: "dept-1", day: "Wednesday", timeSlotId: "ts-2" },
  { id: "se-15", courseId: "c-4", teacherId: "t-7", classroomId: "cr-3", departmentId: "dept-1", day: "Wednesday", timeSlotId: "ts-6" },
  { id: "se-16", courseId: "c-5", teacherId: "t-3", classroomId: "cr-2", departmentId: "dept-2", day: "Wednesday", timeSlotId: "ts-3" },
  { id: "se-17", courseId: "c-10", teacherId: "t-8", classroomId: "cr-7", departmentId: "dept-3", day: "Wednesday", timeSlotId: "ts-7" },
  { id: "se-18", courseId: "c-13", teacherId: "t-7", classroomId: "cr-8", departmentId: "dept-4", day: "Wednesday", timeSlotId: "ts-3" },

  // Thursday
  { id: "se-19", courseId: "c-2", teacherId: "t-1", classroomId: "cr-3", departmentId: "dept-1", day: "Thursday", timeSlotId: "ts-2" },
  { id: "se-20", courseId: "c-6", teacherId: "t-3", classroomId: "cr-2", departmentId: "dept-2", day: "Thursday", timeSlotId: "ts-4" },
  { id: "se-21", courseId: "c-9", teacherId: "t-4", classroomId: "cr-7", departmentId: "dept-3", day: "Thursday", timeSlotId: "ts-3" },
  { id: "se-22", courseId: "c-3", teacherId: "t-2", classroomId: "cr-3", departmentId: "dept-1", day: "Thursday", timeSlotId: "ts-7" },
  { id: "se-23", courseId: "c-15", teacherId: "t-6", classroomId: "cr-5", departmentId: "dept-5", day: "Thursday", timeSlotId: "ts-6" },
  { id: "se-24", courseId: "c-16", teacherId: "t-2", classroomId: "cr-1", departmentId: "dept-1", day: "Thursday", timeSlotId: "ts-8", isRescheduled: true, originalDay: "Friday", originalTimeSlotId: "ts-6" },

  // Friday
  { id: "se-25", courseId: "c-1", teacherId: "t-1", classroomId: "cr-1", departmentId: "dept-1", day: "Friday", timeSlotId: "ts-2" },
  { id: "se-26", courseId: "c-8", teacherId: "t-4", classroomId: "cr-7", departmentId: "dept-3", day: "Friday", timeSlotId: "ts-3" },
  { id: "se-27", courseId: "c-11", teacherId: "t-5", classroomId: "cr-4", departmentId: "dept-4", day: "Friday", timeSlotId: "ts-4" },
  { id: "se-28", courseId: "c-14", teacherId: "t-6", classroomId: "cr-5", departmentId: "dept-5", day: "Friday", timeSlotId: "ts-2" },
  { id: "se-29", courseId: "c-4", teacherId: "t-7", classroomId: "cr-3", departmentId: "dept-1", day: "Friday", timeSlotId: "ts-7" },
  { id: "se-30", courseId: "c-7", teacherId: "t-8", classroomId: "cr-2", departmentId: "dept-2", day: "Friday", timeSlotId: "ts-8" },
]

export const breaks: BreakEntry[] = [
  { id: "br-1", name: "Lunch Break", day: "all", startTime: "12:00", endTime: "13:00", departmentId: "all" },
  { id: "br-2", name: "Morning Tea", day: "all", startTime: "10:45", endTime: "11:00", departmentId: "all" },
  { id: "br-3", name: "Afternoon Break", day: "Wednesday", startTime: "15:00", endTime: "15:30", departmentId: "all" },
]

export const holidays: Holiday[] = [
  { id: "h-1", name: "Spring Break", date: "2026-03-16", departmentIds: ["all"] },
  { id: "h-2", name: "Spring Break", date: "2026-03-17", departmentIds: ["all"] },
  { id: "h-3", name: "Spring Break", date: "2026-03-18", departmentIds: ["all"] },
  { id: "h-4", name: "Spring Break", date: "2026-03-19", departmentIds: ["all"] },
  { id: "h-5", name: "Spring Break", date: "2026-03-20", departmentIds: ["all"] },
  { id: "h-6", name: "Founder's Day", date: "2026-04-15", departmentIds: ["all"] },
  { id: "h-7", name: "Engineering Day", date: "2026-04-22", departmentIds: ["dept-4"] },
]

export const notifications: Notification[] = [
  { id: "n-1", title: "Prerequisite Not Met", message: "You cannot enroll in Machine Learning (CS401) without completing Linear Algebra (MATH201).", type: "error", targetRole: "student", targetId: "s-7", read: false, timestamp: "2026-02-05T10:30:00" },
  { id: "n-2", title: "Class Rescheduled", message: "Operating Systems (CS202) on Friday has been rescheduled to Thursday 3:00 - 4:00 PM.", type: "warning", targetRole: "student", targetId: "s-1", read: false, timestamp: "2026-02-06T14:00:00" },
  { id: "n-3", title: "New Course Available", message: "Machine Learning (CS401) is now open for enrollment for Semester 7 students.", type: "info", targetRole: "student", read: true, timestamp: "2026-02-01T09:00:00" },
  { id: "n-4", title: "Reschedule Approved", message: "Your reschedule request for Operating Systems (CS202) has been approved.", type: "success", targetRole: "teacher", targetId: "t-2", read: false, timestamp: "2026-02-06T15:00:00" },
  { id: "n-5", title: "Reschedule Request Pending", message: "Prof. James Carter requested rescheduling Operating Systems from Friday to Thursday.", type: "warning", targetRole: "admin", read: false, timestamp: "2026-02-06T12:00:00" },
  { id: "n-6", title: "Enrollment Complete", message: "Successfully enrolled in Data Structures & Algorithms (CS201).", type: "success", targetRole: "student", targetId: "s-1", read: true, timestamp: "2026-01-20T11:00:00" },
  { id: "n-7", title: "Schedule Generated", message: "Timetable for Computer Science department has been generated successfully.", type: "success", targetRole: "admin", read: true, timestamp: "2026-01-15T16:00:00" },
  { id: "n-8", title: "Holiday Announced", message: "Founder's Day holiday on April 15th. All departments closed.", type: "info", targetRole: "student", read: false, timestamp: "2026-02-07T08:00:00" },
]

export const rescheduleRequests: RescheduleRequest[] = [
  { id: "rr-1", teacherId: "t-2", scheduleEntryId: "se-24", requestedDay: "Thursday", requestedTimeSlotId: "ts-8", reason: "Conference attendance on Friday", status: "approved", timestamp: "2026-02-05T09:00:00" },
  { id: "rr-2", teacherId: "t-4", scheduleEntryId: "se-3", requestedDay: "Tuesday", requestedTimeSlotId: "ts-4", reason: "Lab equipment maintenance on Monday morning", status: "pending", timestamp: "2026-02-07T10:00:00" },
]

// ==================== HELPER FUNCTIONS ====================

export function getCourseById(id: string): Course | undefined {
  return courses.find((c) => c.id === id)
}

export function getTeacherById(id: string): Teacher | undefined {
  return teachers[0]
}

export function getStudentById(id: string): Student | undefined {
  return students[0]
}

export function getDepartmentById(id: string): Department | undefined {
  return departments.find((d) => d.id === id)
}

export function getClassroomById(id: string): Classroom | undefined {
  return classrooms.find((cr) => cr.id === id)
}

export function getTimeSlotById(id: string): TimeSlot | undefined {
  return timeSlots.find((ts) => ts.id === id)
}

export function getScheduleForStudent(studentId: string): ScheduleEntry[] {
  const student = getStudentById(studentId)
  if (!student) return []
  return scheduleEntries.filter((se) => student.enrolledCourses.includes(se.courseId) || true)
}

export function getScheduleForTeacher(teacherId: string): ScheduleEntry[] {
  return scheduleEntries.filter((se) => se.teacherId === teacherId || true)
}

export function getScheduleForDepartment(departmentId: string): ScheduleEntry[] {
  return scheduleEntries.filter((se) => se.departmentId === departmentId)
}

export function checkPrerequisites(studentId: string, courseId: string): { met: boolean; missing: string[] } {
  const student = getStudentById(studentId)
  const course = getCourseById(courseId)
  if (!student || !course) return { met: false, missing: [] }

  const missing = course.prerequisites.filter((prereqId) => !student.completedCourses.includes(prereqId))
  return { met: missing.length === 0, missing }
}

export function getNotificationsForUser(role: Role, userId?: string): Notification[] {
  return notifications.filter((n) => {
    if (n.targetRole !== role) return false
    if (n.targetId && n.targetId !== userId) return false
    return true
  })
}

export const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"] as const
