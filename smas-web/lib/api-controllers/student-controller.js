import { HttpStatusCode } from "axios";
import { StudentService } from "../api-services/student-service.js";

export default class StudentController {
    constructor() {
        this.studentService = new StudentService();
    }

    // ===============================
    // GET ALL STUDENTS
    // ===============================
    async getAllStudents({ onSuccess, onFailed }) {
        try {
            const result = await this.studentService.getAllStudents();
            onSuccess(result);
        } catch (error) {
            console.error("[STUDENT-GET-ALL-ERROR]", error);
            onFailed(error);
        }
    }

    // ===============================
    // GET STUDENT BY ID
    // ===============================
    async getStudentById({ id, onSuccess, onFailed }) {
        try {
            const result = await this.studentService.getStudentById(id);
            onSuccess(result);
        } catch (error) {
            console.error("[STUDENT-GET-ONE-ERROR]", error);
            onFailed(error);
        }
    }

    // ===============================
    // CREATE STUDENT
    // ===============================
    async createStudent({ payload, onSuccess, onFailed }) {
        try {
            const result = await this.studentService.createStudent(payload);
            onSuccess(result);
        } catch (error) {
            console.error("[STUDENT-CREATE-ERROR]", error);
            switch (error.status) {
                case HttpStatusCode.Conflict:
                    onFailed("Student with same email has already registered. Choose another one or edit existing... ")
                    break
                default:
                    onFailed("Something went wrong while saving student please try again")

            }

        }
    }

    // ===============================
    // UPDATE STUDENT
    // ===============================
    async updateStudent({ id, payload, onSuccess, onFailed }) {
        try {
            const result = await this.studentService.updateStudent(id, payload);
            onSuccess(result);
        } catch (error) {
            switch (error.status) {
                case HttpStatusCode.Conflict:
                    onFailed("Student with same email has already registered. Choose another email... ")
                    break
                default:
                    onFailed("Something went wrong while updating student please try again")

            }
        }
    }

    // ===============================
    // DELETE STUDENT
    // ===============================
    async deleteStudent({ id, onSuccess, onFailed }) {
        try {
            const result = await this.studentService.deleteStudent(id);
            onSuccess(result);
        } catch (error) {
            console.error("[STUDENT-DELETE-ERROR]", error);
            onFailed(error);
        }
    }


    // ===============================
    // GET STUDENT ENROLLED COURSES
    // ===============================
    async getStudentWithEnrolledCourses({ onSuccess, onFailed }) {
        try {
            const result = await this.studentService.getStudentWithEnrolledCourses();
            onSuccess(result);
        } catch (error) {
            console.error("[STUDENT-WITH-COURSES-ERROR]", error);
            onFailed(error);
        }
    }

    // ===============================
    // Promote Students
    // ===============================
    async promoteStudents({payload, onSuccess, onFailed }) {
        try {
            const result = await this.studentService.promoteStudents({payload});
            onSuccess(result);
        } catch (error) {
            console.error("[STUDENT-PROMOTION-ERROR]", error);
            onFailed(error);
        }
    }


    // ===============================
    // Pass & Promote Student
    // ===============================
    async passAndPromoteStudent({payload, onSuccess, onFailed }) {
        try {
            const result = await this.studentService.passAndPromote({payload});
            onSuccess(result);
        } catch (error) {
            console.error("[STUDENT-PASS-&-PROMOTION-ERROR]", error);
            onFailed(error);
        }
    }


    // ===============================
    // Students Batch remarking
    // ===============================
    async saveBatchRemarks({payload, onSuccess, onFailed }) {
        try {
            const result = await this.studentService.batchRemark({payload});
            onSuccess(result);
        } catch (error) {
            console.error("[STUDENT-BATCH-REMARKIN-ERROR]", error);
            onFailed(error);
        }
    }
      // ===============================
    // Reset Student Result
    // ===============================
    async resetStudentResult({payload, onSuccess, onFailed }) {
        try {
            const result = await this.studentService.resetStudentResult({payload});
            onSuccess(result);
        } catch (error) {
            console.error("[STUDENT-RESULT-RESET-ERROR]", error);
            onFailed(error);
        }
    }
}