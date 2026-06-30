import { API_RESCHEDULE_REQUEST_ENDPOINT } from "../constants/backend-constants.js";
import api from "./api-base.js";

export class RescheduleService {
  constructor() {
    this.api = api;
    this.endpoint = `${API_RESCHEDULE_REQUEST_ENDPOINT}`; // assuming base endpoint like "/api/reschedule"
  }

  // ===============================
  // CREATE RESCHEDULE REQUEST
  // ===============================
  async createRequest(data) {
    const res = await this.api.post(`${this.endpoint}`, data);
    return res.data;
  }

  async getTeacherRequests(teacher_id) {
    const res = await this.api.get(`${this.endpoint}/teacher/${teacher_id}`);
    return res.data;
  }

  async updateRequestStatus({request_id,status}) {
    const res = await this.api.post(`${this.endpoint}/update-status/${request_id}`,{status});
    return res.data;
  }

  async createRescheduleSlot({payload}) {
    const res = await this.api.post(`${this.endpoint}/reschedule-allocation/`,payload);
    return res.data;
  }

  async arrangeSlotForRescheduling({payload}) {
    const res = await this.api.post(`${this.endpoint}/reschedule/`,payload);
    return res.data;
  }
  // ===============================
  // GET ALL RESCHEDULE REQUESTS
  // ===============================
  async getAllRequests() {
    const res = await this.api.get(`${this.endpoint}`);
    return res.data;
  }

  // ===============================
  // GET SINGLE RESCHEDULE REQUEST
  // ===============================
  async getRequestById(id) {
    const res = await this.api.get(`${this.endpoint}/${id}`);
    return res.data;
  }

  // ===============================
  // DELETE RESCHEDULE REQUEST
  // ===============================
  async deleteRequest(id) {
    const res = await this.api.delete(`${this.endpoint}/${id}`);
    return res.data;
  }



  
}



