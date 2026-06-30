import { ScheduleService } from "../api-services/schedule.service.js";

export default class ScheduleController {
  constructor() {
    this.scheduleService = new ScheduleService();
  }

  // ===============================
  // CREATE SCHEDULE
  // ===============================
  /**
   * Create a new schedule using beam search.
   * Accepts optional parameters; defaults will be applied if missing.
   *
   * @param {Object} options - Scheduler options
   * @param {number} [options.nSolutions=5] - Number of solutions to generate
   * @param {number} [options.beamWidth=80] - Beam width for search
   * @param {number} [options.restarts=8] - Number of parallel restarts (defaults to system parallelism)
   * @param {number} [options.candidateLimit=14] - Maximum number of candidates per step
   * @param {boolean} [options.stopOnFirstValid=false] - Stop search on first valid solution
   * @param {boolean} [options.requireValidSolutions=true] - Only return valid solutions
   * @param {boolean} [options.noOverlaps=false] - Prevent overlapping sessions
   * @param {boolean} [options.applyRoomConstraint=true] - Apply room constraints
   * @param {boolean} [options.optimizeRooms=false] - Optimize room allocation
   * @param {boolean} [options.allowTeacherPreference=false] - Respect teacher preferences
   * @param {boolean} [options.enforceTeacherDepartment=false] - Enforce teacher department constraints
   * @param {boolean} [options.usePrerequisiteOrdering=true] - Use prerequisite course ordering
   * @param {Function} onSuccess - Callback for successful response
   * @param {Function} onFailed - Callback for failed response
   * @returns {Promise<void>}
   */
  async createSchedule({ options = {}, onSuccess, onFailed }) {
    try {
      const result = await this.scheduleService.createSchedule(options);
      onSuccess(result);
    } catch (error) {
      console.error("[SCHEDULE-CREATE-ERROR]", error);
      onFailed(error);
    }
  }

  async applySchedule({ payload , onSuccess, onFailed }) {
    try {
      const result = await this.scheduleService.applySchedule(payload);
      onSuccess(result);
    } catch (error) {
      console.error("[SCHEDULE-APPLY-ERROR]", error);
      onFailed(error);
    }
  }

  async getAdminTimeTable({ onSuccess, onFailed }) {
    try {
      const result = await this.scheduleService.getAdminTimeTable();
      onSuccess(result);
    } catch (error) {
      console.error("[SCHEDULE-ADMIN-ERROR]", error);
      onFailed(error);
    }
  }

  async getTeacherTimeTable({teacher_id, onSuccess, onFailed }) {
    try {
      const result = await this.scheduleService.getTeacherTimeTable(teacher_id);
      onSuccess(result);
    } catch (error) {
      console.error("[SCHEDULE-TEACHER-ERROR]", error);
      onFailed(error);
    }
  }


  async getStudentTimeTable({student_id, onSuccess, onFailed }) {
    try {
      const result = await this.scheduleService.getStudentTimeTable(student_id);
      onSuccess(result);
    } catch (error) {
      console.error("[SCHEDULE-STUDENT-ERROR]", error);
      onFailed(error);
    }
  }


  async getStudentTodaysSchedule({student_id, onSuccess, onFailed }) {
    try {
      const result = await this.scheduleService.getStudentTodaysClasses(student_id);
      onSuccess(result);
    } catch (error) {
      console.error("[SCHEDULE-TODAY-STUDENT-ERROR]", error);
      onFailed(error);
    }
  }



  async getTeacherTodaysSchedule({teacher_id, onSuccess, onFailed }) {
    try {
      const result = await this.scheduleService.getTeacherTodaysClasses(teacher_id);
      onSuccess(result);
    } catch (error) {
      console.error("[SCHEDULE-TODAY-TEACHER-ERROR]", error);
      onFailed(error);
    }
  }

  async checkAvailablity({day_id,classroom_id,course_codes,timings, onSuccess, onFailed }) {
    try {
      const result = await this.scheduleService.checkSlotAvailablity({day_id,classroom_id,course_codes,timings});
      onSuccess(result);
    } catch (error) {
      console.error("[SCHEDULE-MANUAL-CHECK-ERROR]", error);
      // console.log('error', JSON.stringify(, null, 2))
      onFailed(error?.response?.data);
    }
  }


  async updateSlot({day_id,classroom_id,course_codes,start_time,end_time,slot_id, onSuccess, onFailed }) {
    try {
      const result = await this.scheduleService.updateSlot({day_id,classroom_id,course_codes,start_time,end_time,slot_id });
      onSuccess(result);
    } catch (error) {
      console.error("[SLOT-UPDATE-ERROR]", error);
      // console.log('error', JSON.stringify(, null, 2))
      onFailed(error?.response?.data);
    }
  }
}



