import { API_STUDENT_ENDPOINT } from "../constants/backend-constants.js";
import api from "./api-base.js";

export class StudentService {
  constructor() {
    this.api = api;
    this.endpoint = API_STUDENT_ENDPOINT; // e.g. "/api/students"
  }

  // ===============================
  // GET ALL STUDENTS
  // ===============================
  async getAllStudents() {
    const res = await this.api.get(this.endpoint);
    return res.data;
  }

  // ===============================
  // GET STUDENT BY ID
  // ===============================
  async getStudentById(id) {
    const res = await this.api.get(`${this.endpoint}/${id}`);
    return res.data;
  }

  // ===============================
  // CREATE STUDENT
  // ===============================
  async createStudent(payload) {
    const res = await this.api.post(`${this.endpoint}/`, payload);
    return res.data;
  }

  // ===============================
  // UPDATE STUDENT
  // ===============================
  async updateStudent(id, payload) {
    const res = await this.api.put(`${this.endpoint}/${id}`, payload);
    return res.data;
  }

  // ===============================
  // DELETE STUDENT
  // ===============================
  async deleteStudent(id) {
    const res = await this.api.delete(`${this.endpoint}/${id}`);
    return res.data;
  }

   // ===============================
  // GET STUDENT WITH ENROLLED COURSES 
  // ===============================
  async getStudentWithEnrolledCourses() {
    const res = await this.api.get(`${this.endpoint}/students-with-courses`);
    return res.data;
  }


   // ===============================
  // promote students  
  // ===============================
  async promoteStudents({payload}) {
    const res = await this.api.post(`${this.endpoint}/students/promote`,payload);
    return res.data;
  }


   // ===============================
  //pass & promote student
  // ===============================
  async passAndPromote({payload}) {
    const res = await this.api.post(`${this.endpoint}/student/pass-and-promote/${payload.student_id}`,payload);
    return res.data;
  }

  // ===============================
  //reset student result
  // ===============================
  async resetStudentResult({payload}) {
    const res = await this.api.post(`${this.endpoint}/student/reset-result/${payload.student_id}`,payload);
    return res.data;
  }
  // ===============================
  //students batch remark
  // ===============================
  async batchRemark({payload}) {
    const res = await this.api.post(`${this.endpoint}/students/batch-remarks/`,payload);
    return res.data;
  }
  
}