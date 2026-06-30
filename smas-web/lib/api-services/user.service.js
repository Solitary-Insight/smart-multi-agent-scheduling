import { API_USER_ENDPOINT } from "../constants/backend-constants.js";
import api from "./api-base.js";

export class UserService {
  constructor() {
    this.api = api;
    this.endpoint = API_USER_ENDPOINT; // e.g. "/api/teachers"
  }

  // ===============================
  // Login User
  // ===============================
  async loginUser({payload}) {
    const res = await this.api.post(`${this.endpoint}/login`,payload);
    return res.data;
  }

  

  async logout({session_token}) {
    const res = await this.api.post(`${this.endpoint}/logout`,{session_token});
    return res.data;
  }


  async verifyOtp({session_token,otp_code}) {
    const res = await this.api.post(`${this.endpoint}/verify-otp`,{session_token,otp_code});
    return res.data;
  }


  async resendOtp({session_token}) {
    const res = await this.api.post(`${this.endpoint}/resend-otp`,{session_token});
    return res.data;
  }



  async checkAuth({session_token}) {
    const res = await this.api.post(`${this.endpoint}/check-auth`,{session_token});
    return res.data;
  }



  // ===============================
  // Get Users
  // ===============================
  async getAdmins() {
    const res = await this.api.get(`${this.endpoint}/admins`);
    return res.data;
  }

  // ===============================
  // Create User
  // ===============================
  async createAdmins({ payload }) {
    const res = await this.api.post(`${this.endpoint}/admins`, payload);
    return res.data;
  }

  // ===============================
  // Update User
  // ===============================
  async updateUser({ id, payload }) {
    const res = await this.api.put(`${this.endpoint}/${id}`, payload);
    return res.data;
  }

  // ===============================
  // Delete User
  // ===============================
  async deleteUser({ id }) {
    const res = await this.api.delete(`${this.endpoint}/${id}`);
    return res.data;
  }
}