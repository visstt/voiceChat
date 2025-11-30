import { useState } from "react";
import apiClient from "../api/apiClient";
import { AxiosError } from "axios";

interface SignInResponse {
  message?: string;
  user?: Record<string, unknown>;
  token?: string;
}

interface ErrorResponse {
  message?: string;
  error?: string;
}
interface SignInData {
  login: string;
  password: string;
}

export const useSignIn = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const signIn = async (data: SignInData): Promise<boolean> => {
    setLoading(true);
    setError(null);
    setSuccess(false);

    try {
      const response = await apiClient.post<SignInResponse>(
        "/auth/sign-in",
        data
      );

      console.log("✅ [useSignIn] Авторизация успешна:", response.data);

      // Сохраняем токен если есть
      if (response.data.token) {
        localStorage.setItem("auth_token", response.data.token);
      }
      setSuccess(true);
      return true;
    } catch (err: unknown) {
      console.error("❌ [useSignIn] Ошибка авторизации:", err);

      const axiosError = err as AxiosError<ErrorResponse>;
      const errorMessage =
        axiosError.response?.data?.message ||
        axiosError.response?.data?.error ||
        "Неверный логин или пароль";

      setError(errorMessage);
      return false;
    } finally {
      setLoading(false);
    }
  };

  return { signIn, loading, error, success };
};
