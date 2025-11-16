import { useState } from "react";
import apiClient from "../api/apiClient";
import { AxiosError } from "axios";

interface SignUpData {
  login: string;
  password: string;
}

interface SignUpResponse {
  message?: string;
  token?: string;
}

interface ErrorResponse {
  message?: string;
  error?: string;
}

export const useSignUp = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const signUp = async (data: SignUpData): Promise<boolean> => {
    setLoading(true);
    setError(null);
    setSuccess(false);

    try {
      const response = await apiClient.post<SignUpResponse>(
        "/auth/sign-up",
        data
      );

      console.log("✅ [useSignUp] Регистрация успешна:", response.data);

      // Сохраняем токен если есть
      if (response.data.token) {
        localStorage.setItem("auth_token", response.data.token);
      }

      setSuccess(true);
      return true;
    } catch (err: unknown) {
      console.error("❌ [useSignUp] Ошибка регистрации:", err);

      const axiosError = err as AxiosError<ErrorResponse>;
      const errorMessage =
        axiosError.response?.data?.message ||
        axiosError.response?.data?.error ||
        "Ошибка при регистрации";

      setError(errorMessage);
      return false;
    } finally {
      setLoading(false);
    }
  };

  return { signUp, loading, error, success };
};
