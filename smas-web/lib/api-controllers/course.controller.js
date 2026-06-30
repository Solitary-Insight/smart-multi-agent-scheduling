import { CourseService } from "../api-services/course.service.js";
import { HttpStatusCode } from "axios";

export class CourseController {
    constructor() {
        this.courseService = new CourseService();
    }

    // ===============================
    // Get All Courses
    // ===============================
    async getAllCourses({ onSuccess, onFailed }) {
        try {
            const result = await this.courseService.getAllCourses();
            onSuccess(result);
        } catch (error) {
            console.error("[GET-COURSES-ERROR]", error);
            onFailed("Failed to fetch courses. Please try again.");
        }
    }


    async getEnrollmentStats({ onSuccess, onFailed }) {
        try {
            const result = await this.courseService.getEnrollementStats();
            onSuccess(result);
        } catch (error) {
            console.error("[GET-COURSES-EN-STATS-ERROR]", error);
            onFailed("Failed to fetch STATS. Please try again.");
        }
    }

    // ===============================
    // Get Course by ID
    // ===============================
    async getCourseById({ id, onSuccess, onFailed }) {
        try {
            const result = await this.courseService.getCourseById(id);
            onSuccess(result);
        } catch (error) {
            console.error("[GET-COURSE-BY-ID-ERROR]", error);
            onFailed(`Failed to fetch course with ID ${id}.`);
        }
    }

    // ===============================
    // Create Course
    /** payload = {
       prerequisites,course_name,course_code,department_id,teacher_id,semester,credit_hours, description = "" 
        }
        */
    // ===============================
    async createCourse({ payload, onSuccess, onFailed }) {
        try {
            const result = await this.courseService.createCourse(payload);
            onSuccess(result);
        } catch (error) {
            console.error("[CREATE-COURSE-ERROR]", error);
            const status = error.response?.status;
            if (status === HttpStatusCode.BadRequest) {
                onFailed("Missing or invalid fields. Please check the data.");
            }
            else if (status === HttpStatusCode.Conflict) {
                onFailed("Course with same course code or name already exit. Please check the data.");
            }
            else {

                onFailed("Failed to create course. Please try again.");
            }
        }
    }

    // ===============================
    // Update Course
    // ===============================
    async updateCourse({ id, payload, onSuccess, onFailed }) {
        try {
            const result = await this.courseService.updateCourse(id, payload);
            onSuccess(result);
        } catch (error) {
            console.error("[CREATE-COURSE-ERROR]", error);
            const status = error.response?.status;
            if (status === HttpStatusCode.BadRequest) {
                onFailed("Missing or invalid fields. Please check the data.");
            }
            else if (status === HttpStatusCode.Conflict) {
                onFailed("Course with same course code or name already exit. Please check the data.");
            }
            else {

                onFailed("Failed to create course. Please try again.");
            }
        }
    }


    // ===============================
    // Get available courses for student
    // ===============================
    async getAvailableCourses({ student_id, onSuccess, onFailed }) {
        try {
            const result = await this.courseService.getAvailableCourses(student_id);
            onSuccess(result);
        } catch (error) {
            console.error("[GET-AVAILABLE-COURSE-ERROR]", error);
            onFailed(error.toString());
        }
    }

      // ===============================
    // Get enrolled courses for student
    // ===============================
    async getStudentCourses({ student_id, onSuccess, onFailed }) {
        try {
            const result = await this.courseService.getStudentCourses(student_id);
            onSuccess(result);
        } catch (error) {
            console.error("[GET-ENROLLED-COURSE-ERROR]", error);
            onFailed(error.toString());
        }
    }

       // ===============================
    // Get available courses for student
    // ===============================
    async getEnrollmentRequested({  onSuccess, onFailed }) {
        try {
            const result = await this.courseService.getEnrollmentRequestedCourses();
            onSuccess(result);
        } catch (error) {
            console.error("[GET-ENROLLMENT-REQUETED-COURSES-ERROR]", error);
            onFailed(error.toString());
        }
    }

       // ===============================
    // ACTIONS TO APPROVAL REQUESTES for COURSES
    // ===============================
    async responseEnrollmentRequests({payload , onSuccess, onFailed }) {
        try {
            const result = await this.courseService.responseEnrollmentRequests(payload);
            onSuccess(result);
        } catch (error) {
            console.error("[GET-ENROLLMENT-REQUETED-COURSES-ERROR]", error);
            onFailed(error.toString());
        }
    }

    // ===============================
    // Delete Course
    // ===============================
    async deleteCourse({ id, onSuccess, onFailed }) {
        try {
            const result = await this.courseService.deleteCourse(id);
            onSuccess(result);
        } catch (error) {
            console.error("[DELETE-COURSE-ERROR]", error);
            onFailed(`Failed to delete course with ID ${id}.`);
        }
    }


    // ===============================
    // Enroll Course 
    // ===============================
    /** payload={course_id,student_id} */
    async enrollCourse({ payload, onSuccess, onFailed }) {
        try {

            const result = await this.courseService.enrollCourse(payload);
            onSuccess(result);

        } catch (error) {

            console.error("[ENROLL-COURSE-ERROR]", error);

            const message =
                error?.response?.data?.message ||
                error?.message ||
                "Failed to enroll course";

            onFailed(message);
        }
    }


    // ===============================
    // Withdraw Course 
    // ===============================
    /** payload={course_id,student_id} */
    async withdrawCourse({ payload, onSuccess, onFailed }) {
        try {

            const result = await this.courseService.withdrawCourse(payload);

            onSuccess(result);

        } catch (error) {

            console.error("[WITHDRAW-COURSE-ERROR]", error);

            const message =
                error?.response?.data?.message ||
                error?.message ||
                "Failed to withdraw course";

            onFailed(message);
        }
    }
}