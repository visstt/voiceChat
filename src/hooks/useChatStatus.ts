import { useState, useEffect, useCallback } from "react";

interface ChatStatus {
  id: number;
  status: "processing" | "completed" | "error";
  name: string;
  description: string;
  imageUrl: string;
  audioUrl: string;
  voiceId: string;
  createdAt: string;
  updatedAt: string;
}

export const statusMessages = {
  processing: "Клонирование голоса в процессе. Подождите...",
  completed: "Чат готов к работе! Можете отправлять сообщения.",
  error: "Ошибка при клонировании голоса. Попробуйте создать чат заново.",
};

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:3000";

export const useChatStatus = (chatId: number | null) => {
  const [status, setStatus] = useState<ChatStatus | null>(null);
  const [isPolling, setIsPolling] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const checkStatus = useCallback(async () => {
    if (!chatId) return null;

    try {
      const response = await fetch(`${API_BASE_URL}/chat/${chatId}/status`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const statusData: ChatStatus = await response.json();
      setStatus(statusData);
      return statusData;
    } catch (err) {
      const errorMessage =
        err instanceof Error
          ? err.message
          : "Произошла ошибка при проверке статуса";
      setError(errorMessage);
      console.error("Error checking chat status:", err);
      return null;
    }
  }, [chatId]);

  const startPolling = useCallback(
    (onStatusChange?: (status: ChatStatus) => void) => {
      if (!chatId) return undefined;

      setIsPolling(true);
      setError(null);

      const pollInterval = setInterval(async () => {
        const statusData = await checkStatus();

        if (statusData) {
          onStatusChange?.(statusData);

          // Останавливаем поллинг если статус completed или error
          if (
            statusData.status === "completed" ||
            statusData.status === "error"
          ) {
            clearInterval(pollInterval);
            setIsPolling(false);
          }
        }
      }, 2000); // Проверяем каждые 2 секунды

      return () => {
        clearInterval(pollInterval);
        setIsPolling(false);
      };
    },
    [chatId, checkStatus]
  );

  const stopPolling = useCallback(() => {
    setIsPolling(false);
  }, []);

  // Автоматический старт поллинга при появлении chatId
  useEffect(() => {
    if (!chatId) return;

    // Делаем первую проверку сразу
    checkStatus();
  }, [chatId, checkStatus]);

  return {
    status,
    isPolling,
    error,
    checkStatus,
    startPolling,
    stopPolling,
  };
};
