import { API_CONFIGURATION_ENDPOINT } from "../constants/backend-constants.js";
import api from "./api-base.js";

export class ConfigurationService {
  constructor() {
    this.api = api;
    this.endpoint = API_CONFIGURATION_ENDPOINT;
  }

  // ===============================
  // GET ALL CONFIGURATIONS
  // ===============================
  async getAllConfigurations() {
    const res = await this.api.get(`${this.endpoint}/`);
    return res.data;
  }

  // ===============================
  // GET CONFIG BY KEY
  // ===============================
  async getConfigurationByKey(key) {
    const res = await this.api.get(`${this.endpoint}/${key}`);
    return res.data;
  }

  // ===============================
  // CREATE / UPDATE CONFIG (UPSERT)
  // ===============================
  async setConfiguration(key, payload) {
    const res = await this.api.post(`${this.endpoint}/${key}`, payload);
    return res.data;
  }

  // ===============================
  // UPDATE CONFIG (STRICT)
  // ===============================
  async updateConfiguration(key, payload) {
    const res = await this.api.put(`${this.endpoint}/${key}`, payload);
    return res.data;
  }

  // ===============================
  // DELETE CONFIG
  // ===============================
  async deleteConfiguration(key) {
    const res = await this.api.delete(`${this.endpoint}/${key}`);
    return res.data;
  }
}