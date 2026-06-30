import { HttpStatusCode } from "axios";
import { DepartmentService } from "../api-services/department-service.js";

export default class DepartmentController {
  constructor() {
    this.departmentService = new DepartmentService();
  }

  // ===============================
  // GET ALL DEPARTMENTS WITH OVERVIEW
  // ===============================
  async getAllDepartmentsOverview({ onSuccess, onFailed }) {
    try {
      const result = await this.departmentService.getAllDepartmentsOverview();
      onSuccess(result);
    } catch (error) {
      console.error("[DEPARTMENT-GET-ALL-OVERVIEW-ERROR]", error);
      onFailed(error);
    }
  }

    // ===============================
  // GET ALL DEPARTMENTS 
  // ===============================
  async getAllDepartments({ onSuccess, onFailed }) {
    try {
      const result = await this.departmentService.getAllDepartments();
      onSuccess(result);
    } catch (error) {
      console.error("[DEPARTMENT-GET-ALL-ERROR]", error);
      onFailed(error);
    }
  }

  // ===============================
  // GET DEPARTMENT BY ID
  // ===============================
  async getDepartmentById({ id, onSuccess, onFailed }) {
    try {
      const result = await this.departmentService.getDepartmentById(id);
      onSuccess(result);
    } catch (error) {
      console.error("[DEPARTMENT-GET-ONE-ERROR]", error);
      onFailed(error);
    }
  }

  // ===============================
  // CREATE DEPARTMENT
  /** name,
   code,
   head_of_department */
  // ===============================
  async createDepartment({ payload, onSuccess, onFailed }) {
    try {
      const result = await this.departmentService.createDepartment(payload);
      onSuccess(result);
    } catch (error) {
      console.error("[CREATE-DEPARTMENT-ERROR]", error);
      const status = error.response?.status;
      if (status === HttpStatusCode.BadRequest) {
        onFailed("Missing or invalid fields. Please check the data.");
      }
      else if (status === HttpStatusCode.Conflict) {
        onFailed("Course code is already assigned. Please use another code...");
      }
      else {

        onFailed("Failed to add department. Please try again.");
      }
    }
  }

  // ===============================
  // UPDATE DEPARTMENT
  // ===============================
  async updateDepartment({ id, payload, onSuccess, onFailed }) {
    try {
      const result = await this.departmentService.updateDepartment(id, payload);
      onSuccess(result);
    } catch (error) {
      console.error("[DEPARTMENT-UPDATE-ERROR]", error);
      onFailed(error);
    }
  }

  // ===============================
  // DELETE DEPARTMENT
  // ===============================
  async deleteDepartment({ id, onSuccess, onFailed }) {
    try {
      const result = await this.departmentService.deleteDepartment(id);
      onSuccess(result);
    } catch (error) {
      console.error("[DEPARTMENT-DELETE-ERROR]", error);
      onFailed(error);
    }
  }
}