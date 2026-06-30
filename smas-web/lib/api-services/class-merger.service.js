import { API_CLASS_MERGES_ENDPOINT } from "../constants/backend-constants.js";
import api from "./api-base.js";

export class ClassMergeService {
  constructor() {
    this.api = api;
    this.endpoint = API_CLASS_MERGES_ENDPOINT; // e.g. "/api/teachers"
  }

   // ===============================
  // get merged classes
  // ===============================
  async getMergeClasses() {
    const res = await this.api.get(`${this.endpoint}/`);
    return res.data;
  }
  // ===============================
  // merge classes
  // ===============================
  async mergeClasses({payload}) {
    const res = await this.api.post(`${this.endpoint}/`,payload);
    return res.data;
  }

  // ===============================
  // dlete merge classes
  // ===============================
  async deleteMergeClasses(id) {
    const res = await this.api.delete(`${this.endpoint}/${id}`);
    return res.data;
  }

  
}