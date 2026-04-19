import axios from "axios";

/** Relative paths only (no leading `/`) so axios joins correctly with baseURL. */
const api = axios.create({
  baseURL: "/api/v1/",
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("ticketiq_token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  // Let axios set Content-Type only when there is a JSON body; a global application/json
  // breaks some POST endpoints that have no body (FastAPI may try to parse empty JSON).
  if (config.data !== undefined && !(config.data instanceof FormData) && !config.headers["Content-Type"]) {
    config.headers["Content-Type"] = "application/json";
  }
  return config;
});

export default api;
