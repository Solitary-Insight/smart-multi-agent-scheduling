import { API_SCHEDULES_ENDPOINT } from "../constants/backend-constants.js";
import api from "./api-base.js";

export class ScheduleService {
  constructor() {
    this.api = api;
    this.endpoint = API_SCHEDULES_ENDPOINT; // e.g. "/api/schedules"
  }

  // ===============================
  // Get All Schedules
  // ===============================
  async getAllSchedules() {
    const res = await this.api.get(`${this.endpoint}/`);
    return res.data;
  }

  // ===============================
  // Get Schedule by ID
  // ===============================
  async getScheduleById(id) {
    const res = await this.api.get(`${this.endpoint}/${id}`);
    return res.data;
  }

  // ===============================
  // Create Schedule
  // ===============================
  /**
   * Create a new schedule
   * Accepts optional params; defaults will be applied server-side if missing
   * @param {Object} payload - Scheduler options (beamWidth, nSolutions, etc.)
   * @returns {Promise<Object>} - Generated schedule response
   */
  async saveSchedule(payload = {}) {
    const res = await this.api.post(this.endpoint, payload);
    return res.data;
  }



  // ===============================
  // Create Schedule
  // ===============================
  /**
   * Create a new schedule using beam search
   * Accepts optional parameters; defaults will be applied if missing
   * 
   * @param {Object} payload - Scheduler options
   * @param {number} [payload.nSolutions=5] - Number of solutions to generate
   * @param {number} [payload.beamWidth=80] - Beam width for search
   * @param {number} [payload.restarts=8] - Number of parallel restarts (defaults to system parallelism)
   * @param {number} [payload.candidateLimit=14] - Maximum number of candidates per step
   * @param {boolean} [payload.stopOnFirstValid=false] - Stop search on first valid solution
   * @param {boolean} [payload.requireValidSolutions=true] - Only return valid solutions
   * @param {boolean} [payload.noOverlaps=false] - Prevent overlapping sessions
   * @param {boolean} [payload.applyRoomConstraint=true] - Apply room constraints
   * @param {boolean} [payload.optimizeRooms=false] - Optimize room allocation
   * @param {boolean} [payload.allowTeacherPreference=false] - Respect teacher preferences
   * @param {boolean} [payload.enforceTeacherDepartment=false] - Enforce teacher department constraints
   * @param {boolean} [payload.usePrerequisiteOrdering=true] - Use prerequisite course ordering
   * @returns {Promise<Object>} - Generated timetable including solutions, slots, and issues
   */
  async createSchedule(payload = {}) {

    const body = { ...payload };
    const res = await this.api.post(`${this.endpoint}/create`, body);
    return res.data;
  }

  // ===============================
  // Update Schedule
  // ===============================
  /**
   * Update an existing schedule (rarely used; usually schedules are regenerated)
   * @param {number} id - Schedule ID
   * @param {Object} payload - Updated data/options
   * @returns {Promise<Object>}
   */
  async updateSchedule(id, payload) {
    const res = await this.api.put(`${this.endpoint}/${id}`, payload);
    return res.data;
  }

  // ===============================
  // Delete Schedule
  // ===============================
  /**
   * Delete a schedule by ID
   * @param {number} id - Schedule ID
   * @returns {Promise<Object>}
   */
  async deleteSchedule(id) {
    const res = await this.api.delete(`${this.endpoint}/${id}`);
    return res.data;
  }


  async applySchedule(payload) {
    const res = await this.api.post(`${this.endpoint}/apply`, payload);
    return res.data;
  }

  async getAdminTimeTable() {
    const res = await this.api.get(`${this.endpoint}/admin`);
    return res.data;
  }

  async getTeacherTimeTable(teacher_id) {
    const res = await this.api.get(`${this.endpoint}/teacher/${teacher_id}`);
    return res.data;
  }

  async getStudentTimeTable(student_id) {
    const res = await this.api.get(`${this.endpoint}/student/${student_id}`);
    return res.data;
  }

  // ===============================
  // Get TODAYS CLASSES FOR STUDENT
  // ===============================
  async getStudentTodaysClasses(student_id) {
    const res = await this.api.get(`${this.endpoint}/student/todays-schedule/${student_id}`);
    return res.data;
  }


    // ===============================
  // Get TODAYS CLASSES FOR TEACHER
  // ===============================
  async getTeacherTodaysClasses(teacher_id) {
    const res = await this.api.get(`${this.endpoint}/teacher/todays-schedule/${teacher_id}`);
    return res.data;
  }
  async checkSlotAvailablity({day_id,classroom_id,course_codes,timings}) {
    const res = await this.api.post(`${this.endpoint}/check-slot-avaliablity/`,{day_id,classroom_id,course_codes,timings});
    return res.data;
  }



  async updateSlot({slot_id,day_id,classroom_id,start_time,end_time}) {
    const res = await this.api.put(`${this.endpoint}/slot/${slot_id}`,{slot_id,day_id,classroom_id,start_time,end_time});
    return res.data;
  }
  
}

