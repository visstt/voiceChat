import { useState, useEffect } from "react";
import apiClient from "../api/apiClient";

export interface ChatData {
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

export const useChats = () => {
  const [chats, setChats] = useState<ChatData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchChats = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await apiClient.get<ChatData[]>("/chat");
      setChats(response.data);
    } catch (err) {
      const errorMessage =
        err instanceof Error
          ? err.message
          : "Произошла ошибка при загрузке чатов";
      setError(errorMessage);
      console.error("Error fetching chats:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchChats();
  }, []);

  const addChat = (newChat: ChatData) => {
    setChats((prevChats) => [newChat, ...prevChats]);
  };

  const removeChat = (chatId: number) => {
    setChats((prevChats) => prevChats.filter((chat) => chat.id !== chatId));
  };

  const updateChat = (chatId: number, updatedData: Partial<ChatData>) => {
    setChats((prevChats) =>
      prevChats.map((chat) =>
        chat.id === chatId ? { ...chat, ...updatedData } : chat
      )
    );
  };

  return {
    chats,
    isLoading,
    error,
    fetchChats,
    addChat,
    removeChat,
    updateChat,
  };
};
