import { API_COURSE_ENDPOINT } from "../constants/backend-constants.js";
import api from "./api-base.js";

export class CourseService {
  constructor() {
    this.api = api;
    this.endpoint = API_COURSE_ENDPOINT; // e.g. "/api/courses"
  }

  // ===============================
  // Get All Courses
  // ===============================
  async getAllCourses() {
    const res = await this.api.get(this.endpoint);
    return res.data;
  }

  async getEnrollementStats() {
    const res = await this.api.get(`${this.endpoint}/erollment-stats`);
    return res.data;
  }
  // ===============================
  // Get Course by ID
  // ===============================
  async getCourseById(id) {
    const res = await this.api.get(`${this.endpoint}/${id}`);
    return res.data;
  }

  // ===============================
  // Create Course
  // ===============================
  async createCourse(payload) {
    const res = await this.api.post(this.endpoint, payload);
    return res.data;
  }

  // ===============================
  // Update Course
  // ===============================
  async updateCourse(id, payload) {
    const res = await this.api.put(`${this.endpoint}/${id}`, payload);
    return res.data;
  }


  // ===============================
  // Get Courses Available for student
  // ===============================
  async getAvailableCourses(student_id) {
    const res = await this.api.get(`${this.endpoint}/available/${student_id}`);
    return res.data;
  }


    // ===============================
  // Get Enrolled Courses  for student
  // ===============================
  async getStudentCourses(student_id) {
    const res = await this.api.get(`${this.endpoint}/student/${student_id}`);
    return res.data;
  }



  // ===============================
  // Get Enrollment Requested Courses
  // ===============================
  async getEnrollmentRequestedCourses() {
    const res = await this.api.get(`${this.endpoint}/enrollments/requested`) ;
    return res.data;
  }

    // ===============================
  // RESPONSE Enrollment Requested Courses
  // ===============================

  async responseEnrollmentRequests(payload) {
    const res = await this.api.post(`${this.endpoint}/enrollments/response`,payload) ;
    return res.data;
  }


  
  // ===============================
  // Delete Course
  // ===============================
  async deleteCourse(id) {
    const res = await this.api.delete(`${this.endpoint}/${id}`);
    return res.data;
  }


    // ===============================
  // Enroll Course
  // ===============================
  async enrollCourse({course_id,student_id,requireApproval}) {
    const res = await this.api.post(`${this.endpoint}/enroll-course/`,{course_id,student_id,requireApproval});
    return res.data;
  }

    // ===============================
  // Withdraw Course
  // ===============================
  async withdrawCourse({course_id,student_id}) {
    const res = await this.api.post(`${this.endpoint}/withdraw-course`,{course_id,student_id});
    return res.data;
  }


 
}