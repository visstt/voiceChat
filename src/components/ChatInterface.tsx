import React, { useState } from "react";
import { IoArrowBack } from "react-icons/io5";
import MessageBubble from "./MessageBubble";
import InputField from "./InputField";
import SetupModal from "./SetupModal";
import { useUser } from "../context/UserContext";
import { useChatMessages, useSendMessage, useMessageStatus } from "../hooks";

import "./ChatInterface.css";

// Импортируем UIMessage из хука
interface UIMessage {
  id: string;
  type: "text" | "voice" | "video" | "loading";
  content: string;
  sender: "user" | "ai";
  timestamp: Date;
  duration?: number;
}

interface ChatInterfaceProps {
  chatId?: string;
  chat?: {
    id: string;
    title: string;
    lastMessage?: string;
    timestamp: Date;
    isSetupComplete?: boolean;
  };
  onSetupComplete?: (
    chatId: string,
    name: string,
    description: string,
    photo: File,
    voice: File
  ) => Promise<void>;
  onBackToChats?: () => void;
}

const ChatInterface: React.FC<ChatInterfaceProps> = ({
  chatId,
  chat,
  onSetupComplete,
  onBackToChats,
}) => {
  // Загружаем сообщения с сервера
  const {
    messages: serverMessages,
    chatData,
    isLoading: messagesLoading,
    error: messagesError,
    fetchChatMessages,
  } = useChatMessages(chatId || null);

  // Хуки для отправки сообщений
  const { sendMessage } = useSendMessage();
  const { waitForMessageComplete } = useMessageStatus();

  // Локальные сообщения интерфейса (для обратной совместимости)
  const [localMessages, setLocalMessages] = useState<UIMessage[]>([]);



  // Показываем модалку только если чат не настроен
  const [isSetupComplete, setIsSetupComplete] = useState(
    chat?.isSetupComplete ?? true
  );
  const { userPhoto, setUserPhoto, setVoiceSample } = useUser();

  // Преобразуем серверные сообщения в формат интерфейса
  const convertServerMessages = (serverMsgs: UIMessage[]): UIMessage[] => {
    // Теперь serverMessages уже содержит UIMessage из хука, просто возвращаем их
    return serverMsgs;
  };

  // Объединяем все сообщения
  const allMessages = [
    ...convertServerMessages(serverMessages),
    ...localMessages,
  ];

  // Отладка: выводим текущее значение userPhoto
  console.log("ChatInterface - Current userPhoto:", userPhoto);

  const handleSetupComplete = async (
    photo: File | null,
    voice: File | null,
    name?: string,
    description?: string
  ) => {
    console.log("Setup complete - photo:", photo, "voice:", voice);

    if (!photo || !voice || !chatId || !onSetupComplete) {
      console.error("Недостаточно данных для создания чата");
      return;
    }

    try {
      // Вызываем функцию создания чата из родительского компонента
      await onSetupComplete(
        chatId,
        name || chat?.title || "Новый чат",
        description || "",
        photo,
        voice
      );

      // Сохраняем фото в контекст как URL
      const photoURL = URL.createObjectURL(photo);
      setUserPhoto(photoURL);
      setVoiceSample(voice);
      setIsSetupComplete(true);

      // Добавляем приветственное сообщение от AI после настройки
      const welcomeMessage: UIMessage = {
        id: "welcome",
        type: "text",
        content: "Привет! Теперь мы можем общаться. Как твои дела?",
        sender: "ai",
        timestamp: new Date(),
      };

      // Добавляем тестовое сообщение от пользователя для проверки аватара
      const testUserMessage: UIMessage = {
        id: "test-user",
        type: "text",
        content: "Тестовое сообщение пользователя",
        sender: "user",
        timestamp: new Date(),
      };

      setLocalMessages([welcomeMessage, testUserMessage]);
    } catch (error) {
      console.error("Ошибка при настройке чата:", error);
    }
  };

  const handleSendMessage = async (content: string, type: "text" | "voice") => {
    console.log("💬 [handleSendMessage] Начало отправки сообщения:", {
      chatId,
      type,
      content,
    });

    if (!chatId || !chatData) {
      console.error(
        "❌ [handleSendMessage] Чат не готов для отправки сообщений:",
        { chatId, chatData }
      );
      return;
    }

    console.log("👤 [handleSendMessage] Добавляем сообщение пользователя в UI");

    // Добавляем сообщение пользователя в локальные сообщения
    const userMessage: UIMessage = {
      id: Date.now().toString(),
      type,
      content,
      sender: "user",
      timestamp: new Date(),
      duration: type === "voice" ? 2 : undefined,
    };

    setLocalMessages((prev) => [...prev, userMessage]);

    try {
      console.log("📤 [handleSendMessage] Отправляем сообщение на сервер...");
      // Отправляем сообщение на сервер
      const sentMessage = await sendMessage(parseInt(chatId), content);

      if (!sentMessage) {
        console.error("❌ [handleSendMessage] Не удалось отправить сообщение");
        return;
      }

      console.log("✅ [handleSendMessage] Сообщение отправлено:", sentMessage);

      console.log("🔄 [handleSendMessage] Добавляем индикатор загрузки");
      // Добавляем индикатор загрузки
      const loadingMessage: UIMessage = {
        id: `loading-${sentMessage.id}`,
        type: "loading",
        content: "Генерируется видеоответ...",
        sender: "ai",
        timestamp: new Date(),
      };

      setLocalMessages((prev) => [...prev, loadingMessage]);

      console.log(
        "⏳ [handleSendMessage] Начинаем отслеживание статуса сообщения..."
      );
      // Отслеживаем статус сообщения
      const completedMessage = await waitForMessageComplete(
        sentMessage.chatId,
        sentMessage.id,
        (updatedMessage) => {
          console.log(
            "📊 [handleSendMessage] Промежуточное обновление статуса:",
            updatedMessage
          );
          // Промежуточные обновления статуса теперь обрабатываются в хуке
        }
      );

      console.log("🔚 [handleSendMessage] Удаляем индикатор загрузки");
      // Удаляем индикатор загрузки
      setLocalMessages((prev) =>
        prev.filter((msg) => msg.id !== `loading-${sentMessage.id}`)
      );

      if (
        completedMessage &&
        completedMessage.status === "completed" &&
        completedMessage.videoUrl
      ) {
        console.log(
          "🎥 [handleSendMessage] Добавляем видеоответ от AI:",
          completedMessage.videoUrl
        );
        // Добавляем видеоответ от AI
        const videoResponse: UIMessage = {
          id: `ai-${completedMessage.id}`,
          type: "video",
          content: completedMessage.videoUrl,
          sender: "ai",
          timestamp: new Date(completedMessage.updatedAt),
          duration: 15, // Примерная длительность
        };

        setLocalMessages((prev) => [...prev, videoResponse]);
        console.log("✅ [handleSendMessage] Видеоответ добавлен в сообщения");
      } else {
        console.log(
          "⚠️ [handleSendMessage] Сообщение завершено, но нет видео:",
          completedMessage
        );
      }

      console.log(
        "🔄 [handleSendMessage] Обновляем список сообщений с сервера..."
      );
      // Обновляем список сообщений с сервера
      await fetchChatMessages(chatId);
    } catch (error) {
      console.error(
        "❌ [handleSendMessage] Ошибка при отправке сообщения:",
        error
      );

      // Удаляем индикатор загрузки в случае ошибки
      setLocalMessages((prev) => prev.filter((msg) => msg.type !== "loading"));

      // Показываем ошибку пользователю
      const errorMessage: UIMessage = {
        id: `error-${Date.now()}`,
        type: "text",
        content: "Произошла ошибка при отправке сообщения",
        sender: "ai",
        timestamp: new Date(),
      };

      setLocalMessages((prev) => [...prev, errorMessage]);
    }
  };

  return (
    <>
      {/* Модальное окно настройки */}
      <SetupModal isOpen={!isSetupComplete} onComplete={handleSetupComplete} />

      <div className="chat-interface">
        {/* Заголовок чата */}
        <div className="chat-header">
          <div className="chat-header-info">
            {onBackToChats && (
              <button 
                className="back-button" 
                onClick={onBackToChats}
                aria-label="Вернуться к чатам"
              >
                <IoArrowBack />
              </button>
            )}
            <div className="ai-avatar">
              {chatData?.imageUrl ? (
                <img src={chatData.imageUrl} alt="AI Avatar" className="avatar-image" />
              ) : (
                "👵"
              )}
            </div>
            <div className="ai-info">
              <h3>{chatData?.name || "Digital Tween"}</h3>
              <span className="status">онлайн</span>
            </div>
          </div>
        </div>

        {/* Область сообщений */}
        <div className="messages-container">
          {messagesLoading ? (
            <div className="empty-messages">
              <p>Загрузка сообщений...</p>
            </div>
          ) : messagesError ? (
            <div className="empty-messages">
              <p>Ошибка загрузки сообщений: {messagesError}</p>
            </div>
          ) : allMessages.length === 0 ? (
            <div className="empty-messages">
              <p>Сообщений еще нет</p>
              <span>Начните разговор, отправив первое сообщение</span>
            </div>
          ) : (
            allMessages.map((message) => (
              <MessageBubble
                key={message.id}
                message={message}
                userPhoto={userPhoto}
                aiPhoto={chatData?.imageUrl}
              />
            ))
          )}
        </div>

        {/* Поле ввода */}
        <InputField onSendMessage={handleSendMessage} />
      </div>
    </>
  );
};

export default ChatInterface;
