import { useState, useEffect } from "react";

export interface Message {
  id: number;
  chatId: number;
  text: string;
  status: string;
  createdAt: string;
  updatedAt: string;
}

export interface ChatWithMessages {
  id: number;
  name: string;
  description: string;
  imageUrl: string;
  audioUrl: string;
  voiceId: string;
  status: string;
  createdAt: string;
  updatedAt: string;
  messages: Message[];
}

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:3000";

// Интерфейс для сообщения UI
interface UIMessage {
  id: string;
  type: "text" | "video" | "loading";
  content: string;
  sender: "user" | "ai";
  timestamp: Date;
  duration?: number;
}

// Функция для проверки статуса сообщения и создания ответа ИИ
const checkMessageStatusAndCreateResponse = async (message: Message, chatId: number): Promise<UIMessage[]> => {
  console.log(`🔍 [processMessages] Проверяем статус сообщения ${message.id}`);
  
  const result: UIMessage[] = [];
  
  // Добавляем сообщение пользователя
  const userMessage: UIMessage = {
    id: `user-${message.id}`,
    type: "text",
    content: message.text,
    sender: "user",
    timestamp: new Date(message.createdAt),
  };
  result.push(userMessage);

  try {
    // Проверяем статус сообщения
    const response = await fetch(`${API_BASE_URL}/chat/${chatId}/message/${message.id}`);
    
    if (!response.ok) {
      console.log(`⚠️ [processMessages] Не удалось получить статус сообщения ${message.id}`);
      return result;
    }

    const messageStatus = await response.json();
    console.log(`📊 [processMessages] Статус сообщения ${message.id}:`, {
      status: messageStatus.status,
      hasVideo: !!messageStatus.videoUrl
    });

    // Если сообщение завершено и есть видео, создаем ответ ИИ
    if (messageStatus.status === 'completed' && messageStatus.videoUrl) {
      const aiResponse: UIMessage = {
        id: `ai-${message.id}`,
        type: "video",
        content: messageStatus.videoUrl,
        sender: "ai",
        timestamp: new Date(messageStatus.updatedAt),
        duration: 15,
      };
      result.push(aiResponse);
      console.log(`🎥 [processMessages] Добавлен видеоответ для сообщения ${message.id}`);
    } else if (messageStatus.status === 'processing') {
      // Добавляем индикатор загрузки для сообщений в процессе
      const loadingResponse: UIMessage = {
        id: `loading-${message.id}`,
        type: "loading",
        content: "Генерируется видеоответ...",
        sender: "ai",
        timestamp: new Date(),
      };
      result.push(loadingResponse);
      console.log(`⏳ [processMessages] Добавлен индикатор загрузки для сообщения ${message.id}`);
    }

  } catch (error) {
    console.error(`❌ [processMessages] Ошибка при проверке статуса сообщения ${message.id}:`, error);
  }

  return result;
};

// Функция для обработки всех сообщений и создания ответов ИИ
const processMessagesWithAIResponses = async (messages: Message[], chatId: number): Promise<UIMessage[]> => {
  console.log(`🔄 [processMessages] Обрабатываем ${messages.length} сообщений для чата ${chatId}`);
  
  const allUIMessages: UIMessage[] = [];
  
  // Обрабатываем сообщения последовательно, чтобы сохранить порядок
  for (const message of messages) {
    const messageWithResponses = await checkMessageStatusAndCreateResponse(message, chatId);
    allUIMessages.push(...messageWithResponses);
  }
  
  console.log(`✅ [processMessages] Создано ${allUIMessages.length} UI сообщений`);
  return allUIMessages;
};

export const useChatMessages = (chatId: string | number | null) => {
  const [chatData, setChatData] = useState<ChatWithMessages | null>(null);
  const [messages, setMessages] = useState<UIMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchChatMessages = async (id: string | number) => {
    console.log("📩 [useChatMessages] Загружаем сообщения для чата:", id);

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(`${API_BASE_URL}/chat/${id}`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      });

      console.log("📥 [useChatMessages] Ответ сервера:", {
        status: response.status,
        ok: response.ok,
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data: ChatWithMessages = await response.json();
      console.log("💾 [useChatMessages] Данные чата получены:", {
        chatId: data.id,
        messagesCount: data.messages.length,
        chatName: data.name,
      });
      
      setChatData(data);
      
      // Проверяем статус всех сообщений и генерируем ответы ИИ
      const messagesWithAIResponses = await processMessagesWithAIResponses(data.messages, data.id);
      setMessages(messagesWithAIResponses);
      
      console.log(
        "✅ [useChatMessages] Сообщения с ответами ИИ установлены:",
        messagesWithAIResponses.length
      );
    } catch (err) {
      const errorMessage =
        err instanceof Error
          ? err.message
          : "Произошла ошибка при загрузке сообщений";
      setError(errorMessage);
      console.error("❌ [useChatMessages] Ошибка:", err);
    } finally {
      setIsLoading(false);
      console.log("🏁 [useChatMessages] Завершение загрузки сообщений");
    }
  };

  useEffect(() => {
    if (chatId) {
      console.log(
        "🔄 [useChatMessages] useEffect: загружаем сообщения для chatId:",
        chatId
      );
      fetchChatMessages(chatId);
    } else {
      console.log(
        "⚠️ [useChatMessages] useEffect: chatId отсутствует, очищаем данные"
      );
      setChatData(null);
      setMessages([]);
    }
  }, [chatId]);

  const addMessage = (newMessage: UIMessage) => {
    setMessages((prevMessages) => [...prevMessages, newMessage]);
  };

  const updateMessage = (messageId: string, updatedData: Partial<UIMessage>) => {
    setMessages((prevMessages) =>
      prevMessages.map((message) =>
        message.id === messageId ? { ...message, ...updatedData } : message
      )
    );
  };

  const removeMessage = (messageId: string) => {
    setMessages((prevMessages) =>
      prevMessages.filter((message) => message.id !== messageId)
    );
  };

  return {
    chatData,
    messages,
    isLoading,
    error,
    fetchChatMessages,
    addMessage,
    updateMessage,
    removeMessage,
  };
};
