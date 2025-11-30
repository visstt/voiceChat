import React, { useState } from "react";
import Sidebar from "./Sidebar";
import ChatInterface from "./ChatInterface";
import { HiChat } from "react-icons/hi";
import {
  useCreateChat,
  useChats,
  useDeleteChat,
  useChatStatus,
} from "../hooks";

import "./MainPage.css";

interface Chat {
  id: string;
  title: string;
  lastMessage?: string;
  timestamp: Date;
  isSetupComplete?: boolean;
  isProcessing?: boolean;
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
    updateChat,
  } = useChats();
  const { deleteChat, isLoading: isDeleting } = useDeleteChat();

  // Локальные новые чаты (которые еще не сохранены на сервере)
  const [localChats, setLocalChats] = useState<Chat[]>([]);
  const [processingChatId, setProcessingChatId] = useState<number | null>(null);
  const { startPolling } = useChatStatus(processingChatId);

  // Объединяем чаты с сервера и локальные новые чаты
  const allChats = [
    ...localChats,
    ...serverChats.map((chat) => ({
      id: chat.id.toString(),
      title: chat.name,
      lastMessage: chat.description || undefined,
      timestamp: new Date(chat.updatedAt),
      isSetupComplete: true,
      isProcessing: chat.id === processingChatId,
    })),
  ];

  const [activeChat, setActiveChat] = useState<string | null>(null);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  const handleBackToChats = () => {
    setActiveChat(null);
  };

  const handleNewChat = () => {
    const newChat: Chat = {
      id: Date.now().toString(),
      title: "Новый чат",
      timestamp: new Date(),
      isSetupComplete: false,
    };
    setLocalChats([newChat, ...localChats]);
    setActiveChat(newChat.id);
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
        setLocalChats((prevChats) =>
          prevChats.filter((chat) => chat.id !== chatId)
        );
        addChat(chatData);
        setActiveChat(chatData.id.toString());
        if (chatData.status === "processing") {
          setProcessingChatId(chatData.id);
          startPolling((status) => {
            if (status.status === "completed") {
              setProcessingChatId(null);
              updateChat(status.id, {
                status: status.status,
                voiceId: status.voiceId,
              });
            } else if (status.status === "error") {
              setProcessingChatId(null);
              updateChat(status.id, {
                status: status.status,
              });
            }
          });
        }
      }
    } catch (error) {
      // Можно показать уведомление пользователю
    }
  };

  const handleSelectChat = (chatId: string) => {
    setActiveChat(chatId);
  };

  const handleDeleteChat = async (chatId: string) => {
    const isLocalChat = localChats.some((chat) => chat.id === chatId);
    if (isLocalChat) {
      setLocalChats(localChats.filter((chat) => chat.id !== chatId));
    } else {
      const success = await deleteChat(parseInt(chatId));
      if (success) {
        removeChat(parseInt(chatId));
      } else {
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

  React.useEffect(() => {
    if (!activeChat) return;
    const chat = allChats.find((c) => c.id === activeChat);
    if (chat && chat.isProcessing) {
      startPolling((status) => {
        if (status.status === "completed") {
          setProcessingChatId(null);
          updateChat(status.id, {
            status: status.status,
            voiceId: status.voiceId,
          });
        } else if (status.status === "error") {
          setProcessingChatId(null);
          updateChat(status.id, {
            status: status.status,
          });
        }
      });
    }
  }, [activeChat, allChats, startPolling, updateChat]);

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
