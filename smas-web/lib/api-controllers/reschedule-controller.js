import { RescheduleService } from "../api-services/reschedule.service";

export default class RescheduleController {
  constructor() {
    this.rescheduleService = new RescheduleService();
  }

  // ===============================
  // CREATE RESCHEDULE REQUEST
  // ===============================
  async createRequest({ payload, onSuccess, onFailed }) {
    try {
      const result = await this.rescheduleService.createRequest(payload);
      onSuccess(result);
    } catch (error) {
      console.error("[RESCHEDULE-CREATE-ERROR]", error);
      onFailed(error);
    }
  }

  // ===============================
  // GET TEACHER RESCHEDULE REQUEST
  // ===============================
  async getTeacherRequests({ teacher_id, onSuccess, onFailed }) {
    try {
      const result = await this.rescheduleService.getTeacherRequests(teacher_id);
      onSuccess(result);
    } catch (error) {
      console.error("[RESCHEDULE-GET-TEACHER-RQS-ERROR]", error);
      onFailed(error);
    }
  }



  // ===============================
  // ARRANGE SLOT FOR RESCHEDULING
  // ===============================
  async arrangeRescheduleSlot({ payload, onSuccess, onFailed }) {
    try {
      const result = await this.rescheduleService.arrangeSlotForRescheduling({payload});
      onSuccess(result);
    } catch (error) {
      console.error("[RESCHEDULE-ARRANGE-SLOT-RQS-ERROR]", error);
      onFailed(error);
    }
  }

  

  // ===============================
  // GET TEACHER RESCHEDULE REQUEST
  // ===============================
  async updateRequestStatus({ request_id,status, onSuccess, onFailed }) {
    try {
      const result = await this.rescheduleService.updateRequestStatus({request_id,status});
      onSuccess(result);
    } catch (error) {
      console.error("[RESCHEDULE-UPDATE-STATUS-ERROR]", error);
      onFailed(error);
    }
  }


    // ===============================
  // GET TEACHER RESCHEDULE REQUEST
  // ===============================
  async createRealocationSlot({ payload,status, onSuccess, onFailed }) {
    try {
      const result = await this.rescheduleService.createRescheduleSlot({payload});
      onSuccess(result);
    } catch (error) {
      console.error("[RESCHEDULE-UPDATE-STATUS-ERROR]", error);
      onFailed(error);
    }
  }


  // ===============================
  // GET ALL RESCHEDULE REQUESTS
  // ===============================
  async getAllRequests({ onSuccess, onFailed }) {
    try {
      const result = await this.rescheduleService.getAllRequests();
      onSuccess(result);
    } catch (error) {
      console.error("[RESCHEDULE-GET-ALL-ERROR]", error);
      onFailed(error);
    }
  }

  // ===============================
  // GET SINGLE RESCHEDULE REQUEST
  // ===============================
  async getRequestById({ id, onSuccess, onFailed }) {
    try {
      const result = await this.rescheduleService.getRequestById(id);
      onSuccess(result);
    } catch (error) {
      console.error("[RESCHEDULE-GET-BY-ID-ERROR]", error);
      onFailed(error);
    }
  }

  // ===============================
  // DELETE RESCHEDULE REQUEST
  // ===============================
  async deleteRequest({ id, onSuccess, onFailed }) {
    try {
      const result = await this.rescheduleService.deleteRequest(id);
      onSuccess(result);
    } catch (error) {
      console.error("[RESCHEDULE-DELETE-ERROR]", error);
      onFailed(error);
    }
  }
}