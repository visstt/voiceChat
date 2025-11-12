import React, { useState, useRef, useCallback, useEffect } from "react";
import WaveSurfer from "wavesurfer.js";
import { useAudioVisualization } from "../hooks";
import {
  FaCamera,
  FaMicrophone,
  FaStop,
  FaPlay,
  FaPause,
  FaCheck,
  FaCheckCircle,
  FaFolder,
  FaTimes,
} from "react-icons/fa";
import "./SetupModal.css";

interface SetupModalProps {
  isOpen: boolean;
  onComplete: (
    userPhoto: File | null,
    voiceSample: File | null,
    name?: string,
    description?: string
  ) => void;
}

const SetupModal: React.FC<SetupModalProps> = ({ isOpen, onComplete }) => {
  const [userPhoto, setUserPhoto] = useState<File | null>(null);
  const [voiceSample, setVoiceSample] = useState<File | null>(null);
  const [isRecordingVoice, setIsRecordingVoice] = useState(false);
  const [currentStep, setCurrentStep] = useState(1); // 1 - настройки чата, 2 - фото, 3 - голос, 4 - готово
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [recordingTime, setRecordingTime] = useState(0);
  const [audioURL, setAudioURL] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [chatName, setChatName] = useState<string>("");
  const [chatDescription, setChatDescription] = useState<string>("");

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const waveformRef = useRef<HTMLDivElement>(null);
  const wavesurferRef = useRef<WaveSurfer | null>(null);
  const timerRef = useRef<number | null>(null);

  // Callback для обработки записанного аудио
  const handleRecordingStop = useCallback((audioBlob: Blob) => {
    setIsRecordingVoice(false);
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    setRecordingTime(0);

    // Создаем URL для прослушивания
    const url = URL.createObjectURL(audioBlob);
    setAudioURL(url);
    setVoiceSample(audioBlob as File);
  }, []);

  // Используем хук для визуализации аудио
  const { startVisualization, stopVisualization } = useAudioVisualization({
    canvasRef,
    onRecordingStop: handleRecordingStop,
  });

  // Инициализация WaveSurfer для воспроизведения записанного аудио
  useEffect(() => {
    if (waveformRef.current && audioURL) {
      if (wavesurferRef.current) {
        wavesurferRef.current.destroy();
      }

      wavesurferRef.current = WaveSurfer.create({
        container: waveformRef.current,
        waveColor: "#e5e7eb",
        progressColor: "#3b82f6",
        cursorColor: "#1f2937",
        barWidth: 2,
        barGap: 1,
        height: 60,
        normalize: true,
      });

      wavesurferRef.current.load(audioURL);
    }

    return () => {
      if (wavesurferRef.current) {
        wavesurferRef.current.destroy();
      }
    };
  }, [audioURL]);

  const handlePhotoUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setUserPhoto(file);
      // Создаем превью фото
      const reader = new FileReader();
      reader.onload = (e) => {
        setPhotoPreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleVoiceUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setVoiceSample(file);
      // Создаем URL для прослушивания загруженного файла
      const url = URL.createObjectURL(file);
      setAudioURL(url);
    }
  };

  const startVoiceRecording = async () => {
    try {
      const initialized = await startVisualization();
      if (!initialized) {
        alert("Не удалось инициализировать запись");
        return;
      }

      setIsRecordingVoice(true);
      setRecordingTime(0);

      // Таймер записи (максимум 60 секунд)
      timerRef.current = setInterval(() => {
        setRecordingTime((prev) => {
          if (prev >= 60) {
            stopVoiceRecording();
            return 60;
          }
          return prev + 1;
        });
      }, 1000);
    } catch (error) {
      alert("Не удалось получить доступ к микрофону: " + error);
    }
  };

  const stopVoiceRecording = () => {
    stopVisualization();
    setIsRecordingVoice(false);

    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  };

  const togglePlayback = () => {
    if (wavesurferRef.current) {
      if (isPlaying) {
        wavesurferRef.current.pause();
        setIsPlaying(false);
      } else {
        wavesurferRef.current.play();
        setIsPlaying(true);

        // Останавливаем воспроизведение по окончании
        wavesurferRef.current.on("finish", () => {
          setIsPlaying(false);
        });
      }
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const handleNext = () => {
    if (currentStep < 3) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleComplete = () => {
    onComplete(userPhoto, voiceSample, chatName, chatDescription);
  };

  const isStepComplete = () => {
    switch (currentStep) {
      case 1:
        return chatName.trim() !== "";
      case 2:
        return userPhoto !== null;
      case 3:
        return voiceSample !== null;
      case 4:
        return true;
      default:
        return false;
    }
  };

  if (!isOpen) return null;

  return (
    <div className="setup-modal-overlay">
      <div className="setup-modal">
        <div className="modal-header">
          <h2>Настройка виртуального двойника</h2>
          <div className="progress-steps">
            <div
              className={`step ${currentStep >= 1 ? "active" : ""} ${
                currentStep > 1 ? "completed" : ""
              }`}
            >
              <div className="step-number">1</div>
              <span>Настройки</span>
            </div>
            <div
              className={`step ${currentStep >= 2 ? "active" : ""} ${
                currentStep > 2 ? "completed" : ""
              }`}
            >
              <div className="step-number">2</div>
              <span>Фото</span>
            </div>
            <div
              className={`step ${currentStep >= 3 ? "active" : ""} ${
                currentStep > 3 ? "completed" : ""
              }`}
            >
              <div className="step-number">3</div>
              <span>Голос</span>
            </div>
            <div className={`step ${currentStep >= 4 ? "active" : ""}`}>
              <div className="step-number">4</div>
              <span>Готово</span>
            </div>
          </div>
        </div>

        <div className="modal-content">
          {currentStep === 1 && (
            <div className="step-content">
              <h3>Настройка чата</h3>
              <p>
                Введите название и описание для вашего виртуального собеседника
              </p>

              <div className="chat-info-form">
                <div className="form-group">
                  <label htmlFor="chat-name">Название чата *</label>
                  <input
                    id="chat-name"
                    type="text"
                    value={chatName}
                    onChange={(e) => setChatName(e.target.value)}
                    placeholder="Введите название чата"
                    className="form-input"
                    required
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="chat-description">Описание</label>
                  <textarea
                    id="chat-description"
                    value={chatDescription}
                    onChange={(e) => setChatDescription(e.target.value)}
                    placeholder="Опишите вашего виртуального собеседника"
                    className="form-textarea"
                    rows={4}
                  />
                </div>
              </div>
            </div>
          )}

          {currentStep === 2 && (
            <div className="step-content">
              <h3>Загрузите фото</h3>
              <p>Это фото будет использоваться для создания аватара в чате</p>

              <div className="photo-upload-area">
                {photoPreview ? (
                  <div className="photo-preview">
                    <img src={photoPreview} alt="Preview" />
                    <button
                      className="change-photo-btn"
                      onClick={() =>
                        document.getElementById("photo-input")?.click()
                      }
                    >
                      Изменить фото
                    </button>
                  </div>
                ) : (
                  <div
                    className="upload-placeholder"
                    onClick={() =>
                      document.getElementById("photo-input")?.click()
                    }
                  >
                    <div className="upload-icon">
                      <FaCamera />
                    </div>
                    <span>Нажмите для выбора фото</span>
                  </div>
                )}

                <input
                  id="photo-input"
                  type="file"
                  accept="image/*"
                  onChange={handlePhotoUpload}
                  style={{ display: "none" }}
                />
              </div>
            </div>
          )}

          {currentStep === 3 && (
            <div className="step-content">
              <h3>Запишите образец голоса</h3>

              <div className="voice-setup-area">
                {!voiceSample ? (
                  <>
                    {/* Визуализация аудио - показываем всегда для правильной инициализации */}
                    <div className="audio-visualizer">
                      <canvas
                        ref={canvasRef}
                        className="realtime-waveform-canvas"
                        width={600}
                        height={60}
                      />
                    </div>

                    <div className="voice-record-section">
                      <button
                        className={`record-button ${
                          isRecordingVoice ? "recording" : ""
                        }`}
                        onClick={
                          isRecordingVoice
                            ? stopVoiceRecording
                            : startVoiceRecording
                        }
                        disabled={false}
                      >
                        {isRecordingVoice ? (
                          <>
                            <span className="recording-icon">
                              <FaStop />
                            </span>
                            Остановить
                          </>
                        ) : (
                          <>
                            <span className="mic-icon">
                              <FaMicrophone />
                            </span>
                            Начать запись
                          </>
                        )}
                      </button>

                      {isRecordingVoice && (
                        <div className="recording-indicator">
                          <div className="pulse-animation"></div>
                          <span>Запись...</span>
                          <div className="recording-timer">
                            {formatTime(recordingTime)} / 1:00
                          </div>
                        </div>
                      )}
                    </div>

                    <div className="or-divider">
                      <span>или</span>
                    </div>

                    <div className="voice-upload-section">
                      <button
                        className="upload-voice-btn"
                        onClick={() =>
                          document.getElementById("voice-input")?.click()
                        }
                      >
                        <FaFolder /> Загрузить аудиофайл
                      </button>

                      <input
                        id="voice-input"
                        type="file"
                        accept="audio/*"
                        onChange={handleVoiceUpload}
                        style={{ display: "none" }}
                      />
                    </div>
                  </>
                ) : (
                  <div className="voice-success compact">
                    <div className="success-content">
                      <div className="success-icon">
                        <FaCheck />
                      </div>
                      <span>Голос записан</span>
                    </div>

                    {audioURL && (
                      <div className="audio-result">
                        <div className="playback-controls">
                          <button
                            className={`play-btn ${isPlaying ? "playing" : ""}`}
                            onClick={togglePlayback}
                          >
                            {isPlaying ? (
                              <>
                                <FaPause /> Пауза
                              </>
                            ) : (
                              <>
                                <FaPlay /> Прослушать
                              </>
                            )}
                          </button>
                        </div>

                        {/* WaveSurfer визуализация */}
                        <div className="waveform-container">
                          <div ref={waveformRef} className="waveform"></div>
                        </div>
                      </div>
                    )}

                    <button
                      className="re-record-btn"
                      onClick={() => {
                        setVoiceSample(null);
                        setAudioURL(null);
                        setIsPlaying(false);
                        if (wavesurferRef.current) {
                          wavesurferRef.current.stop();
                        }
                      }}
                    >
                      Записать заново
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}

          {currentStep === 4 && (
            <div className="step-content completion-step">
              <div className="completion-icon">
                <FaCheckCircle />
              </div>
              <h3>Настройка завершена!</h3>
              <p>Теперь вы можете общаться с виртуальным двойником</p>

              <div className="setup-summary">
                <div className="summary-item">
                  <span className="summary-label">Фото:</span>
                  <span className="summary-value">
                    {userPhoto ? (
                      <>
                        <FaCheck style={{ color: "#22c55e" }} /> Загружено
                      </>
                    ) : (
                      <>
                        <FaTimes style={{ color: "#ef4444" }} /> Не загружено
                      </>
                    )}
                  </span>
                </div>
                <div className="summary-item">
                  <span className="summary-label">Голос:</span>
                  <span className="summary-value">
                    {voiceSample ? (
                      <>
                        <FaCheck style={{ color: "#22c55e" }} /> Записан
                      </>
                    ) : (
                      <>
                        <FaTimes style={{ color: "#ef4444" }} /> Не записан
                      </>
                    )}
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="modal-footer">
          {currentStep > 1 && (
            <button className="back-btn" onClick={handleBack}>
              Назад
            </button>
          )}

          {currentStep < 3 ? (
            <button
              className="next-btn"
              onClick={handleNext}
              disabled={!isStepComplete()}
            >
              Далее
            </button>
          ) : (
            <button className="complete-btn" onClick={handleComplete}>
              Начать общение
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default SetupModal;
