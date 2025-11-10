import React from "react";
import "./MessageBubble.css";

interface Message {
  id: string;
  type: "text" | "voice" | "video" | "loading";
  content: string;
  sender: "user" | "ai";
  timestamp: Date;
  duration?: number;
}

interface MessageBubbleProps {
  message: Message;
  userPhoto?: string | null;
  aiPhoto?: string | null;
}

const MessageBubble: React.FC<MessageBubbleProps> = ({
  message,
  userPhoto,
  aiPhoto,
}) => {
  // Отладка для проверки получения данных
  console.log("🧩 [MessageBubble] Рендерим сообщение:", {
    id: message.id,
    type: message.type,
    sender: message.sender,
    content:
      message.content.substring(0, 100) +
      (message.content.length > 100 ? "..." : ""),
    hasUserPhoto: !!userPhoto,
  });

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString("ru-RU", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const renderMessageContent = () => {
    switch (message.type) {
      case "text":
        return <div className="message-text">{message.content}</div>;

      case "voice":
        return (
          <div className="voice-message">
            <div className="voice-content">
              <span className="voice-icon">🔊</span>
              <span className="voice-label">Голосовое сообщение</span>
              <span className="voice-duration">· {message.duration} сек</span>
            </div>
            <div className="voice-waveform">
              <div className="wave-bar"></div>
              <div className="wave-bar"></div>
              <div className="wave-bar"></div>
              <div className="wave-bar"></div>
              <div className="wave-bar"></div>
            </div>
          </div>
        );

      case "video":
        console.log("🎥 [MessageBubble] Рендерим видеосообщение:", {
          videoUrl: message.content,
          messageId: message.id,
        });

        return (
          <div className="video-message">
            <video
              src={message.content}
              controls
              className="video-player"
              preload="metadata"
              onLoadStart={() =>
                console.log("📺 [MessageBubble] Начало загрузки видео")
              }
              onCanPlay={() =>
                console.log("▶️ [MessageBubble] Видео готово к воспроизведению")
              }
              onError={(e) =>
                console.error("❌ [MessageBubble] Ошибка загрузки видео:", e)
              }
            >
              <source src={message.content} type="video/mp4" />
              Ваш браузер не поддерживает видео.
            </video>
            <div className="video-info">
              <span className="video-label">Видеоответ</span>
              {message.duration && (
                <span className="video-duration">· {message.duration} сек</span>
              )}
            </div>
          </div>
        );

      case "loading":
        return (
          <div className="loading-message">
            <div className="loading-content">
              <span className="loading-icon">⌛</span>
              <span className="loading-text">{message.content}</span>
            </div>
            <div className="progress-bar">
              <div className="progress-fill"></div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div
      className={`message-bubble ${
        message.sender === "user" ? "user-message" : "ai-message"
      }`}
    >
      <div className="message-container">
        {message.sender === "ai" && (
          <div className="avatar">
            {aiPhoto ? (
              <img src={aiPhoto} alt="AI Avatar" className="avatar-image" />
            ) : (
              <span className="avatar-emoji">👵</span>
            )}
          </div>
        )}

        <div className="message-content">
          <div className="message-body">{renderMessageContent()}</div>
          <div className="message-time">{formatTime(message.timestamp)}</div>
        </div>

        {message.sender === "user" && (
          <div className="avatar">
            {userPhoto ? (
              <img src={userPhoto} alt="User Avatar" className="avatar-image" />
            ) : (
              <span className="avatar-emoji">🙋‍♂️</span>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default MessageBubble;
