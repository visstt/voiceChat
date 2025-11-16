import { useState } from "react";

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:3000";

export const useDeleteChat = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const deleteChat = async (chatId: number): Promise<boolean> => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(`${API_BASE_URL}/chat/${chatId}`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return true;
    } catch (err) {
      const errorMessage =
        err instanceof Error
          ? err.message
          : "Произошла ошибка при удалении чата";
      setError(errorMessage);
      console.error("Error deleting chat:", err);
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  return {
    deleteChat,
    isLoading,
    error,
  };
};
