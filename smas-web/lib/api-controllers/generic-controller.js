import { GenericService } from "../api-services/generic-service.js";

export default class GenericController {
  constructor() {
    this.genricService = new GenericService();
  }

  // ===============================
  // GET ALL Week Days
  // ===============================
  async getAllWeekDays({ onSuccess, onFailed }) {
    try {
      const result = await this.genricService.getAllWeekDays();
      onSuccess(result);
    } catch (error) {
      console.error("[Week-GET-ALL-ERROR]", error);
      onFailed(error);
    }
  }


   // ===============================
  // GET ALL Week Days With SLOTS
  // ===============================
  async getAllWeekDaysWithSlots({ onSuccess, onFailed }) {
    try {
      const result = await this.genricService.getAllWeekDaysWithSlots();
      onSuccess(result);
    } catch (error) {
      console.error("[Week-GET-ALL-WITH-SLOTS-ERROR]", error);
      onFailed(error);
    }
  }

  // ===============================
  // GET RESOURCES STATS
  // ===============================
  async getResourcesStats({ onSuccess, onFailed }) {
    try {
      const result = await this.genricService.getSystemResourceStats();
      onSuccess(result);
    } catch (error) {
      console.error("[RESOURCES-STATS-GET-ALL-ERROR]", error);
      onFailed(error);
    }
  }


  // ===============================
  // GET ADVANCED STATS
  // ===============================
  async getAdvancedStats({ onSuccess, onFailed }) {
    try {
      const result = await this.genricService.advancedStats();
      onSuccess(result);
    } catch (error) {
      console.error("[ADVANCED-STATS-GET-ALL-ERROR]", error);
      onFailed(error);
    }
  }

  async getLogs({ onSuccess, onFailed }) {
    try {
      const result = await this.genricService.getLogs();
      onSuccess(result);
    } catch (error) {
      console.error("[GET-LOGS-ERROR]", error);
      onFailed(error);
    }
  }


  async getTrafficLogs({ onSuccess, onFailed }) {
    try {
      const result = await this.genricService.getTrafficLogs();
      onSuccess(result);
    } catch (error) {
      console.error("[GET-TRAFFIC-LOGS-ERROR]", error);
      onFailed(error);
    }
  }
  async getTodayInfo({ onSuccess, onFailed }) {
    try {
      const result = await this.genricService.getTodayInfo();
      onSuccess(result);
    } catch (error) {
      console.error("[GET-LOGS-ERROR]", error);
      onFailed(error);
    }
  }
}