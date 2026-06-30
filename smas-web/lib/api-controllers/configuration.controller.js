import { ConfigurationService } from "../api-services/configuation.service";

export default class ConfigurationController {
  constructor() {
    this.configurationService = new ConfigurationService()
  }

  // ===============================
  // GET ALL CONFIGURATIONS
  // ===============================
  async getAllConfigurations({ onSuccess, onFailed }) {
    try {
      const result = await this.configurationService.getAllConfigurations();
      onSuccess(result);
    } catch (error) {
      console.error("[CONFIG-GET-ALL-ERROR]", error);
      onFailed(error);
    }
  }

  // ===============================
  // GET CONFIG BY KEY
  // ===============================
  async getConfigurationByKey({ key, onSuccess, onFailed }) {
    try {
      const result = await this.configurationService.getConfigurationByKey(key);
      onSuccess(result);
    } catch (error) {
      console.error("[CONFIG-GET-ONE-ERROR]", error);
      onFailed(error);
    }
  }

  // ===============================
  // CREATE / UPDATE CONFIG (UPSERT)
  // ===============================
  async setConfiguration({ key, payload, onSuccess, onFailed }) {
    try {
      const result = await this.configurationService.setConfiguration(key, payload);
      onSuccess(result);
    } catch (error) {
      console.error("[CONFIG-SET-ERROR]", error);
      onFailed(error);
    }
  }

  // ===============================
  // UPDATE CONFIG (STRICT)
  // ===============================
  async updateConfiguration({ key, payload, onSuccess, onFailed }) {
    try {
      const result = await this.configurationService.updateConfiguration(key, payload);
      onSuccess(result);
    } catch (error) {
      console.error("[CONFIG-UPDATE-ERROR]", error);
      onFailed(error);
    }
  }

  // ===============================
  // DELETE CONFIG
  // ===============================
  async deleteConfiguration({ key, onSuccess, onFailed }) {
    try {
      const result = await this.configurationService.deleteConfiguration(key);
      onSuccess(result);
    } catch (error) {
      console.error("[CONFIG-DELETE-ERROR]", error);
      onFailed(error);
    }
  }
}