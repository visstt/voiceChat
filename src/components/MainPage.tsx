import React, { useState } from "react";
import Sidebar from "./Sidebar";
import ChatInterface from "./ChatInterface";
import { HiChat } from "react-icons/hi";
import { useCreateChat, useChats, useDeleteChat } from "../hooks";

import "./MainPage.css";

interface Chat {
  id: string;
  title: string;
  lastMessage?: string;
  timestamp: Date;
  isSetupComplete?: boolean;
}

interface MainPageProps {
  onLogout?: () => void;
}

const MainPage: React.FC<MainPageProps> = ({ onLogout }) => {
  const { createChat } = useCreateChat();
  const {
    chats: serverChats,
    isLoading,
    error,
    addChat,
    removeChat,
  } = useChats();
  const { deleteChat, isLoading: isDeleting } = useDeleteChat();

  // Локальные новые чаты (которые еще не сохранены на сервере)
  const [localChats, setLocalChats] = useState<Chat[]>([]);

  // Объединяем чаты с сервера и локальные новые чаты
  const allChats = [
    ...localChats,
    ...serverChats.map((chat) => ({
      id: chat.id.toString(),
      title: chat.name,
      lastMessage: chat.description || undefined,
      timestamp: new Date(chat.updatedAt),
      isSetupComplete: true,
    })),
  ];

  const [activeChat, setActiveChat] = useState<string | null>(null);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  const handleBackToChats = () => {
    console.log("⬅️ [MainPage] Возврат к списку чатов");
    setActiveChat(null);
  };

  const handleNewChat = () => {
    console.log("➕ [MainPage] Создание нового чата...");
    console.log("📋 [MainPage] Текущие локальные чаты:", localChats);

    const newChat: Chat = {
      id: Date.now().toString(),
      title: "Новый чат",
      timestamp: new Date(),
      isSetupComplete: false, // Новый чат требует настройки
    };

    console.log("🆕 [MainPage] Новый чат создан:", newChat);

    setLocalChats([newChat, ...localChats]);
    setActiveChat(newChat.id);

    console.log(
      "✅ [MainPage] Чат добавлен, активный чат установлен на:",
      newChat.id
    );
  };

  const handleChatSetupComplete = async (
    chatId: string,
    name: string,
    description: string,
    photo: File,
    voice: File
  ) => {
    try {
      const chatData = await createChat({
        name,
        description,
        image: photo,
        audio: voice,
      });

      if (chatData) {
        // Удаляем локальный чат и добавляем в серверные чаты
        setLocalChats((prevChats) =>
          prevChats.filter((chat) => chat.id !== chatId)
        );
        addChat(chatData);

        // Обновляем активный чат на новый ID
        setActiveChat(chatData.id.toString());
      }
    } catch (error) {
      console.error("Ошибка при создании чата:", error);
      // В случае ошибки можно показать уведомление пользователю
    }
  };

  const handleSelectChat = (chatId: string) => {
    setActiveChat(chatId);
  };

  const handleDeleteChat = async (chatId: string) => {
    // Проверяем, это локальный чат или серверный
    const isLocalChat = localChats.some((chat) => chat.id === chatId);

    if (isLocalChat) {
      setLocalChats(localChats.filter((chat) => chat.id !== chatId));
    } else {
      // Удаляем чат с сервера
      const success = await deleteChat(parseInt(chatId));
      if (success) {
        removeChat(parseInt(chatId));
      } else {
        // Можно показать уведомление об ошибке
        console.error("Не удалось удалить чат");
        return;
      }
    }

    if (activeChat === chatId) {
      setActiveChat(null);
    }
  };

  const toggleSidebar = () => {
    setIsSidebarCollapsed(!isSidebarCollapsed);
  };

  return (
    <div className={`main-page ${activeChat ? "chat-active" : ""}`}>
      <Sidebar
        chats={allChats}
        activeChat={activeChat}
        onNewChat={handleNewChat}
        onSelectChat={handleSelectChat}
        onDeleteChat={handleDeleteChat}
        isCollapsed={isSidebarCollapsed}
        onToggle={toggleSidebar}
        isLoading={isLoading}
        error={error}
        isDeleting={isDeleting}
        onLogout={onLogout}
      />

      <div
        className={`main-content ${
          isSidebarCollapsed ? "sidebar-collapsed" : ""
        }`}
      >
        {activeChat ? (
          <ChatInterface
            chatId={activeChat}
            chat={allChats.find((chat) => chat.id === activeChat)}
            onSetupComplete={handleChatSetupComplete}
            onBackToChats={handleBackToChats}
          />
        ) : (
          <div className="welcome-screen">
            <div className="welcome-content">
              <h1>Добро пожаловать в Digital Tween!</h1>
              <p>
                Выберите чат из списка или создайте новый, чтобы начать общение
                с виртуальным двойником
              </p>
              <button className="new-chat-button" onClick={handleNewChat}>
                <HiChat className="icon" />
                Новый чат
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default MainPage;
