import { HttpStatusCode } from "axios";
import { ClassroomService } from "../api-services/classroom.service";

export class ClassroomController {
  constructor() {
    this.classroomService = new ClassroomService();
  }

  // ===============================
  // Get All Classrooms
  // ===============================
  async getAllClassrooms({ onSuccess, onFailed }) {
    try {
      const result = await this.classroomService.getAllClassrooms();
      onSuccess(result);
    } catch (error) {
      console.error("[GET-CLASSROOMS-ERROR]", error);

      switch (error.status) {
        default:
          onFailed("Failed to fetch classrooms. Please try again.");
      }
    }
  }

  // ===============================
  // Get Classroom By ID
  // ===============================
  async getClassroomById({ id, onSuccess, onFailed }) {
    try {
      const result = await this.classroomService.getClassroomById(id);
      onSuccess(result);
    } catch (error) {
      console.error("[GET-CLASSROOM-ERROR]", error);

      switch (error.status) {
        case HttpStatusCode.NotFound:
          onFailed("Classroom not found.");
          break;
        default:
          onFailed("Failed to fetch classroom.");
      }
    }
  }

  // ===============================
  // Create Classroom
  // ===============================
  /* name, building = "", type = "", capacity = 0, equipments = "" */
  async createClassroom({ payload, onSuccess, onFailed }) {
    try {
      const result = await this.classroomService.createClassroom(payload);
      onSuccess(result);
    } catch (error) {
      console.error("[CREATE-CLASSROOM-ERROR]", error);

      switch (error.status) {
        case HttpStatusCode.BadRequest:
          onFailed("Invalid classroom data. Please check inputs.");
          break;
        default:
          onFailed("Failed to create classroom.");
      }
    }
  }

  // ===============================
  // Update Classroom
  // ===============================
  async updateClassroom({ id, payload, onSuccess, onFailed }) {
    try {
      const result = await this.classroomService.updateClassroom(id, payload);
      onSuccess(result);
    } catch (error) {
      console.error("[UPDATE-CLASSROOM-ERROR]", error);

      switch (error.status) {
        case HttpStatusCode.NotFound:
          onFailed("Classroom not found.");
          break;
        default:
          onFailed("Failed to update classroom.");
      }
    }
  }

  // ===============================
  // Delete Classroom
  // ===============================
  async deleteClassroom({ id, onSuccess, onFailed }) {
    try {
      const result = await this.classroomService.deleteClassroom(id);
      onSuccess(result);
    } catch (error) {
      console.error("[DELETE-CLASSROOM-ERROR]", error);

      switch (error.status) {
        case HttpStatusCode.NotFound:
          onFailed("Classroom not found.");
          break;
        default:
          onFailed("Failed to delete classroom.");
      }
    }
  }
}