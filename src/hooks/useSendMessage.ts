import { useState } from "react";

export interface MessageStatus {
  id: number;
  chatId: number;
  text: string;
  audioUrl?: string;
  videoUrl?: string;
  status: "processing" | "completed" | "error";
  createdAt: string;
  updatedAt: string;
}

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:3000";

export const useSendMessage = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const sendMessage = async (
    chatId: number,
    text: string
  ): Promise<MessageStatus | null> => {
    console.log("🚀 [sendMessage] Начало отправки сообщения:", {
      chatId,
      text,
    });

    setIsLoading(true);
    setError(null);

    try {
      console.log("📡 [sendMessage] Отправка запроса на сервер...");
      const response = await fetch(`${API_BASE_URL}/chat/${chatId}/message`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ text }),
      });

      console.log("📥 [sendMessage] Получен ответ от сервера:", {
        status: response.status,
        ok: response.ok,
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const message: MessageStatus = await response.json();
      console.log("✅ [sendMessage] Данные сообщения получены:", message);
      return message;
    } catch (err) {
      const errorMessage =
        err instanceof Error
          ? err.message
          : "Произошла ошибка при отправке сообщения";
      setError(errorMessage);
      console.error("❌ [sendMessage] Ошибка при отправке:", err);
      return null;
    } finally {
      setIsLoading(false);
      console.log("🏁 [sendMessage] Завершение отправки сообщения");
    }
  };

  return {
    sendMessage,
    isLoading,
    error,
  };
};

export const useMessageStatus = () => {
  const [isPolling, setIsPolling] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const checkMessageStatus = async (
    chatId: number,
    messageId: number
  ): Promise<MessageStatus | null> => {
    console.log("🔍 [checkMessageStatus] Проверка статуса сообщения:", {
      chatId,
      messageId,
    });

    try {
      const response = await fetch(
        `${API_BASE_URL}/chat/${chatId}/message/${messageId}`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      console.log("📥 [checkMessageStatus] Ответ сервера:", {
        status: response.status,
        ok: response.ok,
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const message: MessageStatus = await response.json();
      console.log("📋 [checkMessageStatus] Статус сообщения:", {
        messageId: message.id,
        status: message.status,
        hasAudio: !!message.audioUrl,
        hasVideo: !!message.videoUrl,
      });

      return message;
    } catch (err) {
      const errorMessage =
        err instanceof Error
          ? err.message
          : "Произошла ошибка при проверке статуса сообщения";
      setError(errorMessage);
      console.error("❌ [checkMessageStatus] Ошибка:", err);
      return null;
    }
  };

  const waitForMessageComplete = async (
    chatId: number,
    messageId: number,
    onUpdate?: (message: MessageStatus) => void
  ): Promise<MessageStatus | null> => {
    console.log(
      "⏳ [waitForMessageComplete] Начало ожидания завершения сообщения:",
      { chatId, messageId }
    );

    setIsPolling(true);
    setError(null);

    return new Promise((resolve) => {
      const pollInterval = 3000; // Проверяем каждые 3 секунды
      let attempts = 0;
      const maxAttempts = 60; // Максимум 3 минуты ожидания

      const checkStatus = async () => {
        try {
          attempts++;
          console.log(
            `🔄 [waitForMessageComplete] Попытка ${attempts}/${maxAttempts}`
          );

          if (attempts > maxAttempts) {
            console.log("⏰ [waitForMessageComplete] Время ожидания истекло");
            setError("Время ожидания истекло");
            setIsPolling(false);
            resolve(null);
            return;
          }

          const message = await checkMessageStatus(chatId, messageId);

          if (!message) {
            console.log(
              "⚠️ [waitForMessageComplete] Не удалось получить статус, повторяем через 3 сек..."
            );
            setTimeout(checkStatus, pollInterval);
            return;
          }

          // Уведомляем о промежуточном обновлении
          onUpdate?.(message);

          if (message.status === "completed") {
            console.log(
              "🎉 [waitForMessageComplete] Сообщение завершено! Есть видео:",
              !!message.videoUrl
            );
            setIsPolling(false);
            resolve(message);
          } else if (message.status === "error") {
            console.log("💥 [waitForMessageComplete] Ошибка генерации видео");
            setError("Ошибка генерации видео");
            setIsPolling(false);
            resolve(message);
          } else {
            console.log(
              "🔄 [waitForMessageComplete] Статус еще processing, продолжаем ждать..."
            );
            // Продолжаем ждать
            setTimeout(checkStatus, pollInterval);
          }
        } catch (err) {
          console.error("Error in polling:", err);
          setTimeout(checkStatus, pollInterval);
        }
      };

      checkStatus();
    });
  };

  return {
    checkMessageStatus,
    waitForMessageComplete,
    isPolling,
    error,
  };
};
