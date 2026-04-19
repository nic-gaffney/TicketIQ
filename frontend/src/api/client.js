import axios from "axios";
/** Relative paths only (no leading `/`) so axios joins correctly with baseURL. */
const api = axios.create({
    baseURL: "/api/v1/",
    headers: { "Content-Type": "application/json" },
});
api.interceptors.request.use((config) => {
    const token = localStorage.getItem("ticketiq_token");
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});
export default api;
