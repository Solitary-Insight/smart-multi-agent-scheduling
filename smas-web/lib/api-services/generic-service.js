import { API_GENERIC_ENDPOINT } from "../constants/backend-constants.js";
import api from "./api-base.js";

export class GenericService {
  constructor() {
    this.api = api;
    this.endpoint = API_GENERIC_ENDPOINT; // e.g. "/api/departments"
  }

  // ===============================
  // GET ALL WEEK DAYS
  // ===============================
  async getAllWeekDays() {
    const res = await this.api.get(`${this.endpoint}/week-days`);
    return res.data;
  }

  // ===============================
  // GET ALL WEEK DAYS WITH SLOTS
  // ===============================
  async getAllWeekDaysWithSlots() {
    const res = await this.api.get(`${this.endpoint}/week-days-with-slots`);
    return res.data;
  }


  // ===============================
  // GET RESOURCES STATS
  // ===============================
  async getSystemResourceStats() {
    const res = await this.api.get(`${this.endpoint}/resourses-stats`);
    return res.data;
  }

  async advancedStats () {
    const res = await this.api.get(`${this.endpoint}/advanced-stats`);
    return res.data;
  }


  async getLogs() {
    const res = await this.api.get(`${this.endpoint}/admin-logs`);
    return res.data;
  }

  async getTrafficLogs() {
    const res = await this.api.get(`${this.endpoint}/server-traffic-logs`);
    return res.data;
  }
  async getTodayInfo() {
    const res = await this.api.get(`${this.endpoint}/today_info`);
    return res.data;
  }

}