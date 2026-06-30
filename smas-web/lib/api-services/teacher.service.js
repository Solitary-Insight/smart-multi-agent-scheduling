import { API_TEACHER_ENDPOINT } from "../constants/backend-constants.js";
import api from "./api-base.js";

export class TeacherService {
  constructor() {
    this.api = api;
    this.endpoint = API_TEACHER_ENDPOINT; // e.g. "/api/teachers"
  }

  // ===============================
  // GET ALL TEACHERS
  // ===============================
  async getAllTeachers() {
    const res = await this.api.get(this.endpoint);
    return res.data;
  }
  async getAllTeachersNamesAndIds() {
    const res = await this.api.get(`${this.endpoint}/names-and-ids/`);
    return res.data;
  }

  // ===============================
  // GET TEACHER BY ID
  // ===============================
  async getTeacherById(id) {
    const res = await this.api.get(`${this.endpoint}/${id}`);
    return res.data;
  }

  // ===============================
  // CREATE TEACHER
  // ===============================
  async createTeacher(payload) {
    const res = await this.api.post(`${this.endpoint}/`, payload);
    return res.data;
  }

  // ===============================
  // UPDATE TEACHER
  // ===============================
  async updateTeacher(id, payload) {
    const res = await this.api.put(`${this.endpoint}/${id}`, payload);
    return res.data;
  }

  // ===============================
  // DELETE TEACHER
  // ===============================
  async deleteTeacher(id) {
    const res = await this.api.delete(`${this.endpoint}/${id}`);
    return res.data;
  }


  async teacherStats(teacher_id) {
    const res = await this.api.get(`${this.endpoint}/stats/${teacher_id}`);
    return res.data;
  }
}