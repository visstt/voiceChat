import React from "react";
import { HiPlus, HiChevronLeft, HiChevronRight, HiTrash } from "react-icons/hi";
import "./Sidebar.css";

interface Chat {
  id: string;
  title: string;
  lastMessage?: string;
  timestamp: Date;
  isSetupComplete?: boolean;
}

interface SidebarProps {
  chats: Chat[];
  activeChat: string | null;
  onNewChat: () => void;
  onSelectChat: (chatId: string) => void;
  onDeleteChat: (chatId: string) => void;
  isCollapsed: boolean;
  onToggle: () => void;
  isLoading?: boolean;
  error?: string | null;
  isDeleting?: boolean;
}

const Sidebar: React.FC<SidebarProps> = ({
  chats,
  activeChat,
  onNewChat,
  onSelectChat,
  onDeleteChat,
  isCollapsed,
  onToggle,
  isLoading = false,
  error = null,
  isDeleting = false,
}) => {
  const formatTime = (date: Date) => {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / (1000 * 60));
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (minutes < 60) {
      return `${minutes} мин назад`;
    } else if (hours < 24) {
      return `${hours} ч назад`;
    } else {
      return `${days} дн назад`;
    }
  };

  const handleDeleteClick = (chatId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    onDeleteChat(chatId);
  };

  return (
    <div className={`sidebar ${isCollapsed ? "collapsed" : ""}`}>
      <div className="sidebar-header">
        <button className="toggle-sidebar-btn" onClick={onToggle}>
          {isCollapsed ? <HiChevronRight /> : <HiChevronLeft />}
        </button>

        {!isCollapsed && (
          <button
            className="new-chat-btn"
            onClick={() => {
              console.log('🖱️ [Sidebar] Кнопка "Новый чат" нажата');
              onNewChat();
            }}
          >
            <HiPlus className="icon" />
            Новый чат
          </button>
        )}
      </div>

      {!isCollapsed && (
        <div className="chats-list">
          {isLoading && (
            <div className="loading-state">
              <p>Загрузка чатов...</p>
            </div>
          )}

          {error && (
            <div className="error-state">
              <p>Ошибка загрузки: {error}</p>
            </div>
          )}

          {!isLoading &&
            !error &&
            chats.map((chat) => (
              <div
                key={chat.id}
                className={`chat-item ${
                  activeChat === chat.id ? "active" : ""
                }`}
                onClick={() => onSelectChat(chat.id)}
              >
                <div className="chat-content">
                  <div className="chat-title" title={chat.title}>
                    {chat.title}
                  </div>
                  {chat.lastMessage && (
                    <div className="chat-preview" title={chat.lastMessage}>
                      {chat.lastMessage}
                    </div>
                  )}
                  <div className="chat-timestamp">
                    {formatTime(chat.timestamp)}
                  </div>
                </div>

                <div className="chat-actions">
                  <button
                    className="action-btn delete-btn"
                    onClick={(e) => handleDeleteClick(chat.id, e)}
                    title="Удалить"
                    disabled={isDeleting}
                  >
                    {isDeleting ? "⏳" : <HiTrash />}
                  </button>
                </div>
              </div>
            ))}

          {!isLoading && !error && chats.length === 0 && (
            <div className="empty-state">
              <p>Нет чатов</p>
              <span>Создайте новый чат для начала общения</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default Sidebar;
