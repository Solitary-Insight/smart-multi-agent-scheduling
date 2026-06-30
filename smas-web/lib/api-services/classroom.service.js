import { API_CLASSROOM_ENDPOINT } from "../constants/backend-constants.js";
import api from "./api-base.js";

export class ClassroomService {
  constructor() {
    this.api = api;
    this.endpoint = API_CLASSROOM_ENDPOINT; // e.g. "/api/classrooms"
  }

  // ===============================
  // Get All Classrooms
  // ===============================
  async getAllClassrooms() {
    const res = await this.api.get(this.endpoint);
    return res.data;
  }

  // ===============================
  // Get Classroom by ID
  // ===============================
  async getClassroomById(id) {
    const res = await this.api.get(`${this.endpoint}/${id}`);
    return res.data;
  }

  // ===============================
  // Create Classroom
  // ===============================
  async createClassroom(payload) {
    const res = await this.api.post(this.endpoint, payload);
    return res.data;
  }

  // ===============================
  // Update Classroom
  // ===============================
  async updateClassroom(id, payload) {
    const res = await this.api.put(`${this.endpoint}/${id}`, payload);
    return res.data;
  }

  // ===============================
  // Delete Classroom
  // ===============================
  async deleteClassroom(id) {
    const res = await this.api.delete(`${this.endpoint}/${id}`);
    return res.data;
  }
}