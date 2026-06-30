import axios from "axios";
import { SERVER_ADDRESS } from "../constants/backend-constants.js";

const api = axios.create({
  baseURL: SERVER_ADDRESS,
  withCredentials: true,
});

// Attach token if needed
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

api.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error("API Error:", error?.response?.data || error.message);
    return Promise.reject(error);
  }
);

export default api;