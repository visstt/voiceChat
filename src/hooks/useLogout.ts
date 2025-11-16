import { useState } from "react";
import apiClient from "../api/apiClient";
import { AxiosError } from "axios";

interface ErrorResponse {
  message?: string;
  error?: string;
}

export const useLogout = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const logout = async (): Promise<boolean> => {
    setLoading(true);
    setError(null);

    try {
      await apiClient.post("/auth/logout");

      console.log("✅ [useLogout] Выход выполнен успешно");

      return true;
    } catch (err: unknown) {
      console.error("❌ [useLogout] Ошибка при выходе:", err);

      const axiosError = err as AxiosError<ErrorResponse>;
      const errorMessage =
        axiosError.response?.data?.message ||
        axiosError.response?.data?.error ||
        "Ошибка при выходе";

      setError(errorMessage);

      return false;
    } finally {
      setLoading(false);
    }
  };

  return { logout, loading, error };
};
