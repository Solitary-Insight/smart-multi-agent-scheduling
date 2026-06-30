import { HttpStatusCode } from "axios";
import {TeacherService}  from "../api-services/teacher.service";

export  class TeacherController {
    constructor() {
        this.teacherService = new TeacherService();
    }

    // ===============================
    // GET ALL TEACHERS
    // ===============================
    async getAllTeachers({ onSuccess, onFailed }) {
        try {
            const result = await this.teacherService.getAllTeachers();
            onSuccess(result);
        } catch (error) {
            console.error("[TEACHER-GET-ALL-ERROR]", error);
            onFailed(error);
        }
    }

    async getAllTeachersNamesAndIds({ onSuccess, onFailed }) {
        try {
            const result = await this.teacherService.getAllTeachersNamesAndIds();
            onSuccess(result);
        } catch (error) {
            console.error("[TEACHER-GET-ALL-ERROR]", error);
            onFailed(error);
        }
    }
    // ===============================
    // GET TEACHER BY ID
    // ===============================
    async getTeacherById({ id, onSuccess, onFailed }) {
        try {
            const result = await this.teacherService.getTeacherById(id);
            onSuccess(result);
        } catch (error) {
            console.error("[TEACHER-GET-ONE-ERROR]", error);
            onFailed(error);
        }
    }

    // ===============================
    // CREATE TEACHER
    // ===============================
    async createTeacher({ payload, onSuccess, onFailed }) {
        try {
            const result = await this.teacherService.createTeacher(payload);
            onSuccess(result);
        } catch (error) {
            console.error("[TEACHER-CREATE-ERROR]", error);

            switch (error.status) {
                case HttpStatusCode.Conflict:
                    onFailed("Teacher with same email already exists. Please use another email.");
                    break;
                default:
                    onFailed("Something went wrong while saving teacher. Please try again.");
            }
        }
    }

    // ===============================
    // UPDATE TEACHER
    // ===============================
    async updateTeacher({ id, payload, onSuccess, onFailed }) {
        try {
            const result = await this.teacherService.updateTeacher(id, payload);
            onSuccess(result);
        } catch (error) {
            console.error("[TEACHER-UPDATE-ERROR]", error);

            switch (error.status) {
                case HttpStatusCode.Conflict:
                    onFailed("Teacher with same email already exists. Please use another email.");
                    break;
                default:
                    onFailed("Something went wrong while updating teacher. Please try again.");
            }
        }
    }

    // ===============================
    // DELETE TEACHER
    // ===============================
    async deleteTeacher({ id, onSuccess, onFailed }) {
        try {
            const result = await this.teacherService.deleteTeacher(id);
            onSuccess(result);
        } catch (error) {
            console.error("[TEACHER-DELETE-ERROR]", error);
            onFailed(error);
        }
    }


    async getTeacherStats({ teacher_id, onSuccess, onFailed }) {
        try {
            const result = await this.teacherService.teacherStats(teacher_id);
            onSuccess(result);
        } catch (error) {
            console.error("[TEACHER-STATS-ERROR]", error);
            onFailed(error);
        }
    }
}