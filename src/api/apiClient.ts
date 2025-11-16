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

export default apiClient;
