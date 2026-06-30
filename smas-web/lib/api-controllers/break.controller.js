import { BreakService } from "../api-services/break.service.js";

export class BreakController {
  constructor() {
    this.breakService = new BreakService();
  }

  // ===============================
  // Get All Breaks
  // ===============================
  /**
   * Fetch all breaks
   * @param {Object} callbacks
   * @param {Function} callbacks.onSuccess - Called with array of breaks
   * @param {Function} callbacks.onFailed - Called with error message
   */
  async getAllBreaks({ onSuccess, onFailed }) {
    try {
      const result = await this.breakService.getAllBreaks();
      onSuccess(result);
    } catch (error) {
      console.error("[GET-ALL-BREAKS-ERROR]", error);
      onFailed("Failed to fetch breaks. Please try again.");
    }
  }

  // ===============================
  // Get Break By ID
  // ===============================
  /**
   * Fetch a single break by ID
   * @param {Object} params
   * @param {number} params.id - Break ID
   * @param {Function} params.onSuccess - Called with break object
   * @param {Function} params.onFailed - Called with error message
   */
  async getBreakById({ id, onSuccess, onFailed }) {
    try {
      const result = await this.breakService.getBreakById(id);
      onSuccess(result);
    } catch (error) {
      console.error("[GET-BREAK-BY-ID-ERROR]", error);
      onFailed(`Failed to fetch break with ID ${id}.`);
    }
  }

  // ===============================
  // Create Break
  // ===============================
  /**
   * Create a new break
   * @param {Object} params
   * @param {Object} params.payload - Break data
   * @param {string} params.payload.label - Break label/name
   * @param {string} params.payload.start - Start time "HH:mm:ss"
   * @param {string} params.payload.end - End time "HH:mm:ss"
   * @param {Array<number>} params.payload.days - Array of day IDs
   * @param {Array<number>} params.payload.departments - Array of department IDs
   * @param {Function} params.onSuccess - Called on successful creation
   * @param {Function} params.onFailed - Called on failure
   */
  async createBreak({ payload, onSuccess, onFailed }) {
    try {
      const result = await this.breakService.createBreak(payload);
      onSuccess(result);
    } catch (error) {
      console.error("[CREATE-BREAK-ERROR]", error);
      onFailed("Failed to create break. Please check your input and try again.");
    }
  }

  // ===============================
  // Update Break
  // ===============================
  /**
   * Update an existing break
   * @param {Object} params
   * @param {number} params.id - Break ID to update
   * @param {Object} params.payload - Break data
   * @param {string} params.payload.label
   * @param {string} params.payload.start
   * @param {string} params.payload.end
   * @param {Array<number>} params.payload.days
   * @param {Array<number>} params.payload.departments
   * @param {Function} params.onSuccess - Called on successful update
   * @param {Function} params.onFailed - Called on failure
   */
  async updateBreak({ id, payload, onSuccess, onFailed }) {
    try {
      const result = await this.breakService.updateBreak(id, payload);
      onSuccess(result);
    } catch (error) {
      console.error("[UPDATE-BREAK-ERROR]", error);
      onFailed(`Failed to update break with ID ${id}.`);
    }
  }

  // ===============================
  // Delete Break
  // ===============================
  /**
   * Delete a break by ID
   * @param {Object} params
   * @param {number} params.id - Break ID
   * @param {Function} params.onSuccess - Called on successful deletion
   * @param {Function} params.onFailed - Called on failure
   */
  async deleteBreak({ id, onSuccess, onFailed }) {
    try {
      const result = await this.breakService.deleteBreak(id);
      onSuccess(result);
    } catch (error) {
      console.error("[DELETE-BREAK-ERROR]", error);
      onFailed(`Failed to delete break with ID ${id}.`);
    }
  }
}