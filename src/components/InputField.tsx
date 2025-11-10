import React, { useState, useRef, useCallback } from "react";
import { FaMicrophone, FaStop, FaPaperPlane } from "react-icons/fa";
import "./InputField.css";

// Типы для Web Speech API
declare global {
  interface Window {
    SpeechRecognition: any;
    webkitSpeechRecognition: any;
  }
}

interface InputFieldProps {
  onSendMessage: (content: string, type: "text" | "voice") => void;
}

const InputField: React.FC<InputFieldProps> = ({ onSendMessage }) => {
  const [textInput, setTextInput] = useState("");
  const [isListening, setIsListening] = useState(false);
  const recognitionRef = useRef<any>(null);

  // Инициализация распознавания речи
  const initSpeechRecognition = useCallback(() => {
    if ("webkitSpeechRecognition" in window || "SpeechRecognition" in window) {
      const SpeechRecognition =
        window.SpeechRecognition || window.webkitSpeechRecognition;
      const recognition = new SpeechRecognition();

      recognition.continuous = false;
      recognition.interimResults = false;
      recognition.lang = "ru-RU";

      recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        setTextInput(transcript);
        setIsListening(false);
      };

      recognition.onerror = () => {
        setIsListening(false);
        alert("Ошибка распознавания речи");
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      return recognition;
    }
    return null;
  }, []);

  const handleSendText = () => {
    if (textInput.trim()) {
      onSendMessage(textInput.trim(), "text");
      setTextInput("");
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendText();
    }
  };

  const startRecording = async () => {
    if (!recognitionRef.current) {
      recognitionRef.current = initSpeechRecognition();
    }

    if (recognitionRef.current) {
      setIsListening(true);
      recognitionRef.current.start();
    } else {
      alert("Распознавание речи не поддерживается в этом браузере");
    }
  };

  const stopRecording = () => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
    }
    setIsListening(false);
  };

  const handleMicrophoneClick = () => {
    if (isListening) {
      stopRecording();
    } else {
      startRecording();
    }
  };

  return (
    <div className="input-field">
      <div className="input-container">
        {/* Поле ввода текста */}
        <div className="text-input-wrapper">
          <input
            type="text"
            value={textInput}
            onChange={(e) => setTextInput(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Напишите сообщение..."
            className="text-input"
            disabled={isListening}
          />
        </div>

        {/* Кнопки */}
        <div className="input-actions">
          {/* Кнопка микрофона */}
          <button
            className={`mic-button ${isListening ? "recording" : ""}`}
            onClick={handleMicrophoneClick}
            title={isListening ? "Остановить запись" : "Голосовой ввод"}
          >
            {isListening ? (
              <span className="mic-icon recording">
                <FaStop />
              </span>
            ) : (
              <span className="mic-icon">
                <FaMicrophone />
              </span>
            )}
          </button>

          {/* Кнопка отправки текста */}
          <button
            className="send-button"
            onClick={handleSendText}
            disabled={!textInput.trim() || isListening}
            title="Отправить сообщение"
          >
            <span className="send-icon">
              <FaPaperPlane />
            </span>
          </button>
        </div>
      </div>

      {/* Индикатор прослушивания */}
      {isListening && (
        <div className="recording-indicator">
          <div className="recording-header">
            <div className="recording-animation">
              <div className="pulse"></div>
            </div>
            <span className="recording-text">Слушаю... Говорите</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default InputField;
