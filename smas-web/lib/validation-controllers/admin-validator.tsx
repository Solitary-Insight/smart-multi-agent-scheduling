export class AdminValidator {


  static validateCourseForm({
    course_name,
    course_code,
    department_id,
    teacher_id,
  }: {
    course_name?: string
    course_code?: string
    department_id?: string
    teacher_id?: string
  }) {
    if (!course_name?.trim()) {
      return "Course name is required."
    }

    if (!course_code?.trim()) {
      return "Course code is required."
    }

    if (!department_id) {
      return "Please select a department."
    }

    if (!teacher_id) {
      return "Please select a teacher."
    }

    return null // valid
  }

  // ===============================
  // Classroom Validator
  // ===============================
  static validateClassroomForm({
    name,
    building,
    type,
    capacity,
  }: {
    name?: string
    building?: string
    type?: string
    capacity?: number | string
  }) {

    if (!name?.trim()) {
      return "Classroom name is required."
    }

    if (!building?.trim()) {
      return "Building name is required."
    }

    if (!type?.trim()) {
      return "Please select classroom type."
    }

    if (!capacity || Number(capacity) <= 0) {
      return "Capacity must be greater than 0."
    }

    return null
  }
  static validateDepartmentForm({
    name,
    code,
    hod,
  }: {
    name?: string
    code?: string
    hod?: string
  }) {
    if (!name?.trim()) {
      return "Department name is required."
    }

    // Only letters and spaces allowed
    if (!/^[A-Za-z\s]+$/.test(name.trim())) {
      return "Department name can only contain letters and spaces."
    }

    if (!code?.trim() || (code??"").length<2   || (code??"").length>5) {
      return "Department code must be between 2 to 5 characters."
    }

    if (!hod) {
      return "Please select a head of department."
    }

    return null // valid
  }
}

