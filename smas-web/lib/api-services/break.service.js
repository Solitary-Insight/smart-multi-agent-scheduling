import { API_BREAKS_ENDPOINT } from "../constants/backend-constants.js";
import api from "./api-base.js";

export class BreakService {
  constructor() {
    this.api = api;
    this.endpoint = API_BREAKS_ENDPOINT; // e.g. "/api/breaks"
  }

  // ===============================
  // Get All Breaks
  // ===============================
  /**
   * Fetch all breaks
   * @returns {Promise<Array>} - Array of break objects
   * Each break object includes:
   *  - id
   *  - label
   *  - start
   *  - end
   *  - days: array of day IDs
   *  - departments: array of department IDs
   */
  async getAllBreaks() {
    const res = await this.api.get(`${this.endpoint}/`);
    return res.data;
  }

  // ===============================
  // Get Break by ID
  // ===============================
  /**
   * Fetch a single break by its ID
   * @param {number} id - The break ID
   * @returns {Promise<Object>} - Break object
   */
  async getBreakById(id) {
    const res = await this.api.get(`${this.endpoint}/${id}`);
    return res.data;
  }

  // ===============================
  // Create Break
  // ===============================
  /**
   * Create a new break
   * @param {Object} payload - Break data
   * @param {string} payload.label - Break label/name
   * @param {string} payload.start - Start time (format "HH:mm:ss")
   * @param {string} payload.end - End time (format "HH:mm:ss")
   * @param {Array<number>} payload.days - Array of day IDs
   * @param {Array<number>} payload.departments - Array of department IDs
   * @returns {Promise<Object>} - Created break info (including new ID)
   */
  async createBreak(payload) {
    const res = await this.api.post(this.endpoint, payload);
    return res.data;
  }

  // ===============================
  // Update Break
  // ===============================
  /**
   * Update an existing break
   * @param {number} id - Break ID to update
   * @param {Object} payload - Break data
   * @param {string} payload.label - Break label/name
   * @param {string} payload.start - Start time (format "HH:mm:ss")
   * @param {string} payload.end - End time (format "HH:mm:ss")
   * @param {Array<number>} payload.days - Array of day IDs
   * @param {Array<number>} payload.departments - Array of department IDs
   * @returns {Promise<Object>} - Update response
   */
  async updateBreak(id, payload) {
    const res = await this.api.put(`${this.endpoint}/${id}`, payload);
    return res.data;
  }

  // ===============================
  // Delete Break
  // ===============================
  /**
   * Delete a break by its ID
   * @param {number} id - Break ID to delete
   * @returns {Promise<Object>} - Delete response message
   */
  async deleteBreak(id) {
    const res = await this.api.delete(`${this.endpoint}/${id}`);
    return res.data;
  }
}