import { useState } from "react";

interface CreateChatData {
  name: string;
  description?: string;
  image: File;
  audio: File;
}

interface ChatResponse {
  id: number;
  name: string;
  description: string;
  imageUrl: string;
  audioUrl: string;
  voiceId: string;
  status: string;
  createdAt: string;
  updatedAt: string;
}

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:3000";

export const useCreateChat = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const createChat = async (
    data: CreateChatData
  ): Promise<ChatResponse | null> => {
    setIsLoading(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append("name", data.name);
      if (data.description) {
        formData.append("description", data.description);
      }
      formData.append("image", data.image);
      formData.append("audio", data.audio);

      const response = await fetch(`${API_BASE_URL}/chat`, {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result: ChatResponse = await response.json();
      return result;
    } catch (err) {
      const errorMessage =
        err instanceof Error
          ? err.message
          : "Произошла ошибка при создании чата";
      setError(errorMessage);
      console.error("Error creating chat:", err);
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  return {
    createChat,
    isLoading,
    error,
  };
};
