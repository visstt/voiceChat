import axios from "axios";

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:3000";

// Создаем экземпляр axios
export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true, // Автоматически отправляет cookies с каждым запросом
  headers: {
    "Content-Type": "application/json",
  },
});

// Интерцептор для автоматической передачи токена
apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem("auth_token");
  if (token) {
    config.headers = config.headers || {};
    config.headers["Authorization"] = `Bearer ${token}`;
  }
  return config;
});

export default apiClient;
