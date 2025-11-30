import React, { useState, useRef, useEffect } from "react";
import { IoArrowBack } from "react-icons/io5";
import MessageBubble from "./MessageBubble";
import InputField from "./InputField";
import SetupModal from "./SetupModal";
import { useUser } from "../context/UserContext";
import { useChatMessages, useSendMessage, useMessageStatus } from "../hooks";
import type { UIMessage } from "../hooks";

import "./ChatInterface.css";

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
    addMessage,
    removeMessage,
  } = useChatMessages(chatId || null);

  // Хуки для отправки сообщений
  const { sendMessage } = useSendMessage();
  const { waitForMessageComplete } = useMessageStatus();

  // Показываем модалку только если чат не настроен
  const [isSetupComplete, setIsSetupComplete] = useState(
    chat?.isSetupComplete ?? false
  );
  const { userPhoto, setUserPhoto, setVoiceSample } = useUser();

  // Ссылка для автоскролла к концу сообщений
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);

  // Используем сообщения из хука (уже включают и серверные, и локальные)
  const allMessages = serverMessages;

  // Автоскролл к концу сообщений при их изменении
  useEffect(() => {
    // Небольшая задержка для того чтобы DOM успел обновиться
    const scrollToBottom = () => {
      if (messagesEndRef.current) {
        messagesEndRef.current.scrollIntoView({
          behavior: "smooth",
          block: "end",
          inline: "nearest",
        });
      }
    };

    // Альтернативный способ - скролл через контейнер
    const scrollContainer = () => {
      if (messagesContainerRef.current) {
        messagesContainerRef.current.scrollTop =
          messagesContainerRef.current.scrollHeight;
      }
    };

    // Используем setTimeout для гарантированного выполнения после рендера
    const timeoutId = setTimeout(() => {
      console.log("📜 [Автоскролл] Попытка скролла к концу чата");
      scrollToBottom();
      scrollContainer();
    }, 100);

    return () => clearTimeout(timeoutId);
  }, [allMessages]);

  // Обновляем состояние настройки при смене чата
  useEffect(() => {
    setIsSetupComplete(chat?.isSetupComplete ?? false);
  }, [chat]);

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

      // Моковые сообщения убраны
    } catch (error) {
      console.error("Ошибка при настройке чата:", error);
    }
  };

  const [errorNotification, setErrorNotification] = useState<string | null>(null);

  const handleSendMessage = async (content: string, type: "text" | "voice") => {
    console.log("💬 [handleSendMessage] Начало отправки сообщения:", {
      chatId,
      type,
      content,
    });

    // Очищаем предыдущие уведомления об ошибках
    setErrorNotification(null);

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

    addMessage(userMessage);

    // Принудительно скроллим после добавления сообщения пользователя
    setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, 50);

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

      addMessage(loadingMessage);

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
      removeMessage(`loading-${sentMessage.id}`);

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

        addMessage(videoResponse);
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

      // Получаем текст ошибки
      const errorText = error instanceof Error 
        ? error.message 
        : "Произошла ошибка при отправке сообщения";

      // Показываем уведомление об ошибке в UI
      setErrorNotification(errorText);

      // Автоматически скрываем уведомление через 5 секунд
      setTimeout(() => {
        setErrorNotification(null);
      }, 5000);
    }
  };

  return (
    <>
      {/* Модальное окно настройки */}
      <SetupModal isOpen={!isSetupComplete} onComplete={handleSetupComplete} />

      <div className="chat-interface">
        {/* Уведомление об ошибке */}
        {errorNotification && (
          <div className="error-notification">
            {errorNotification}
          </div>
        )}

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
                <img
                  src={chatData.imageUrl}
                  alt="AI Avatar"
                  className="avatar-image"
                />
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
        <div className="messages-container" ref={messagesContainerRef}>
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
                aiPhoto={chatData?.imageUrl}
              />
            ))
          )}
          {/* Элемент для автоскролла */}
          <div ref={messagesEndRef} />
        </div>

        {/* Поле ввода - показываем только после завершения настройки */}
        {isSetupComplete && <InputField onSendMessage={handleSendMessage} />}
      </div>
    </>
  );
};

export default ChatInterface;
