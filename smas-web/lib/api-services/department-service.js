import { API_DEPARTMENT_ENDPOINT } from "../constants/backend-constants.js";
import api from "./api-base.js";

export class DepartmentService {
  constructor() {
    this.api = api;
    this.endpoint = API_DEPARTMENT_ENDPOINT; // e.g. "/api/departments"
  }

  // ===============================
  // GET ALL DEPARTMENTS OVERVIEW
  // ===============================
  async getAllDepartmentsOverview() {
    const res = await this.api.get(`${this.endpoint}/overview`);
    return res.data;
  }

   // ===============================
  // GET ALL DEPARTMENTS 
  // ===============================
  async getAllDepartments() {
    const res = await this.api.get(`${this.endpoint}`);
    return res.data;
  }


  // ===============================
  // GET DEPARTMENT BY ID
  // ===============================
  async getDepartmentById(id) {
    const res = await this.api.get(`${this.endpoint}/${id}`);
    return res.data;
  }

  // ===============================
  // CREATE DEPARTMENT
  // ===============================
  async createDepartment(payload) {
    const res = await this.api.post(this.endpoint, payload);
    return res.data;
  }

  // ===============================
  // UPDATE DEPARTMENT
  // ===============================
  async updateDepartment(id, payload) {
    const res = await this.api.put(`${this.endpoint}/${id}`, payload);
    return res.data;
  }

  // ===============================
  // DELETE DEPARTMENT
  // ===============================
  async deleteDepartment(id) {
    const res = await this.api.delete(`${this.endpoint}/${id}`);
    return res.data;
  }
}