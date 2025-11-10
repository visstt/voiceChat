import { useState, useRef, useCallback, useEffect } from "react";
import axios from "axios";

export { useCreateChat } from "./useCreateChat";
export { useChats } from "./useChats";
export { useDeleteChat } from "./useDeleteChat";
export { useChatMessages } from "./useChatMessages";
export { useSendMessage, useMessageStatus } from "./useSendMessage";
export type { ChatData } from "./useChats";
export type { Message, ChatWithMessages, UIMessage } from "./useChatMessages";
export type { MessageStatus } from "./useSendMessage";

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:3000";

// Типы данных
interface ClonedAudioData {
  id: number;
  originalUrl: string;
  clonedUrl?: string;
  voiceId: string;
  status: string;
  createdAt: string;
  updatedAt: string;
}

interface ChatResponse {
  id: number;
  question: string;
  audioUrl: string;
}

// Хук для загрузки аудио на сервер
export const useUploadAudio = () => {
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const uploadAudio = async (audioBlob: Blob): Promise<number | null> => {
    try {
      setIsUploading(true);
      setError(null);

      const formData = new FormData();
      formData.append("file", audioBlob, "recording.wav");

      const response = await axios.post(
        `${API_BASE_URL}/audio/upload`,
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        }
      );

      const uploadResult = response.data;
      return uploadResult.id;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Upload failed";
      setError(errorMessage);
      return null;
    } finally {
      setIsUploading(false);
    }
  };

  return { uploadAudio, isUploading, error };
};

// Хук для проверки статуса обработки
export const useAudioStatus = () => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [clonedAudioData, setClonedAudioData] =
    useState<ClonedAudioData | null>(null);
  const [error, setError] = useState<string | null>(null);

  const pollAudioStatus = async (
    id: number,
    onComplete?: (data: ClonedAudioData) => void
  ): Promise<void> => {
    try {
      setIsProcessing(true);
      setError(null);

      const checkStatus = async (): Promise<void> => {
        const response = await axios.get(`${API_BASE_URL}/audio/status/${id}`);
        const data = response.data;

        if (data.status === "completed") {
          setClonedAudioData(data);
          setIsProcessing(false);
          console.log(
            "⏳ Waiting 25 seconds for voice responses to be generated..."
          );

          // Вызываем callback после завершения
          if (onComplete) {
            setTimeout(() => {
              onComplete(data);
            }, 25000);
          }
        } else if (data.status === "failed") {
          throw new Error("Voice cloning failed");
        } else {
          // Если еще обрабатывается, проверяем снова через 2 секунды
          setTimeout(checkStatus, 2000);
        }
      };

      await checkStatus();
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Processing failed";
      setError(errorMessage);
      setIsProcessing(false);
    }
  };

  return { pollAudioStatus, isProcessing, clonedAudioData, error };
};

// Хук для загрузки готовых голосовых ответов
export const useChatResponses = () => {
  const [isLoadingResponses, setIsLoadingResponses] = useState(false);
  const [chatResponses, setChatResponses] = useState<ChatResponse[]>([]);
  const [error, setError] = useState<string | null>(null);

  const loadChatResponses = async (voiceId: string): Promise<void> => {
    try {
      console.log(`🔄 Loading chat responses for voiceId: ${voiceId}`);

      setIsLoadingResponses(true);
      setError(null);

      const response = await axios.get(
        `${API_BASE_URL}/audio/chat-responses?voiceId=${voiceId}`,
        {
          headers: {
            Accept: "application/json",
          },
        }
      );

      const responses = response.data;
      console.log(
        `📥 Received ${
          Array.isArray(responses) ? responses.length : 0
        } responses`
      );

      if (responses && Array.isArray(responses) && responses.length > 0) {
        console.log(
          `✅ Successfully loaded ${responses.length} chat responses`
        );
        responses.forEach((item: ChatResponse, index: number) => {
          console.log(`   ${index + 1}. "${item.question}" (ID: ${item.id})`);
        });
        setChatResponses(responses);
      } else {
        console.log(`⚠️ No responses available yet`);
        setChatResponses([]);
      }
    } catch (err) {
      console.log(`💥 Error loading responses:`, err);
      const errorMessage =
        err instanceof Error ? err.message : "Failed to load chat responses";
      setError(errorMessage);
    } finally {
      setIsLoadingResponses(false);
    }
  };

  const clearResponses = () => {
    setChatResponses([]);
    setError(null);
  };

  const setLoadingState = (loading: boolean) => {
    setIsLoadingResponses(loading);
  };

  return {
    loadChatResponses,
    clearResponses,
    setLoadingState,
    isLoadingResponses,
    chatResponses,
    error,
  };
};

// Хук для воспроизведения аудио
export const useAudioPlayer = () => {
  const [currentlyPlaying, setCurrentlyPlaying] = useState<number | null>(null);
  const [currentAudio, setCurrentAudio] = useState<HTMLAudioElement | null>(
    null
  );
  const [error, setError] = useState<string | null>(null);

  const stopPlaying = () => {
    if (currentAudio) {
      currentAudio.pause();
      currentAudio.currentTime = 0;
      setCurrentAudio(null);
    }
    setCurrentlyPlaying(null);
  };

  const playChatResponse = (responseId: number, audioUrl: string): void => {
    // Если уже играет это же аудио - останавливаем
    if (currentlyPlaying === responseId) {
      stopPlaying();
      return;
    }

    // Останавливаем текущее воспроизведение если есть
    if (currentAudio) {
      stopPlaying();
    }

    try {
      const audio = new Audio(audioUrl);
      setCurrentAudio(audio);

      audio.onplay = () => {
        setCurrentlyPlaying(responseId);
      };

      audio.onended = () => {
        setCurrentlyPlaying(null);
        setCurrentAudio(null);
      };

      audio.onerror = () => {
        setCurrentlyPlaying(null);
        setCurrentAudio(null);
        setError("Failed to play chat response");
      };

      // Устанавливаем CORS режим
      audio.crossOrigin = "anonymous";

      audio.play().catch(() => {
        setCurrentlyPlaying(null);
        setCurrentAudio(null);

        // Fallback через fetch
        fetch(audioUrl)
          .then((response) => response.blob())
          .then((blob) => {
            const blobUrl = URL.createObjectURL(blob);
            const newAudio = new Audio(blobUrl);
            setCurrentAudio(newAudio);

            newAudio.onplay = () => setCurrentlyPlaying(responseId);
            newAudio.onended = () => {
              setCurrentlyPlaying(null);
              setCurrentAudio(null);
            };
            newAudio.play().catch((fallbackErr) => {
              setCurrentlyPlaying(null);
              setCurrentAudio(null);
              setError(`Failed to play chat response: ${fallbackErr.message}`);
            });
          })
          .catch((fetchErr) => {
            setCurrentlyPlaying(null);
            setCurrentAudio(null);
            setError(`Failed to load chat response audio: ${fetchErr.message}`);
          });
      });
    } catch {
      setCurrentlyPlaying(null);
      setCurrentAudio(null);
      setError("Failed to create audio player for chat response");
    }
  };

  return { playChatResponse, stopPlaying, currentlyPlaying, error };
};

// Хук для визуализации аудио
interface UseAudioVisualizationOptions {
  canvasRef: React.RefObject<HTMLCanvasElement | null>;
  onRecordingStop?: (audioBlob: Blob) => void;
}

interface UseAudioVisualizationReturn {
  startVisualization: () => Promise<boolean>;
  stopVisualization: () => void;
  isAnimating: boolean;
}

export const useAudioVisualization = ({
  canvasRef,
  onRecordingStop,
}: UseAudioVisualizationOptions): UseAudioVisualizationReturn => {
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const animationIdRef = useRef<number | null>(null);
  const isAnimatingRef = useRef<boolean>(false);

  // Функция для остановки анимации
  const stopAnimation = useCallback(() => {
    isAnimatingRef.current = false;
    if (animationIdRef.current) {
      cancelAnimationFrame(animationIdRef.current);
      animationIdRef.current = null;
    }

    // Очищаем canvas
    if (canvasRef.current) {
      const canvas = canvasRef.current;
      const canvasCtx = canvas.getContext("2d");
      if (canvasCtx) {
        canvasCtx.fillStyle = "#f8fafc";
        canvasCtx.fillRect(0, 0, canvas.width, canvas.height);
      }
    }
  }, [canvasRef]);

  // Функция для рисования волны в реальном времени
  const drawRealTimeWave = useCallback(() => {
    if (!analyserRef.current || !canvasRef.current) {
      console.log("Missing analyser or canvas ref", {
        analyser: !!analyserRef.current,
        canvas: !!canvasRef.current,
      });
      return;
    }

    const canvas = canvasRef.current;
    const canvasCtx = canvas.getContext("2d");
    if (!canvasCtx) {
      console.log("Could not get canvas context");
      return;
    }

    console.log("Starting real-time wave visualization", {
      canvasSize: { width: canvas.width, height: canvas.height },
    });
    const analyser = analyserRef.current;
    const bufferLength = analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);

    isAnimatingRef.current = true;

    const draw = () => {
      if (!isAnimatingRef.current) {
        // Очищаем canvas при остановке записи
        canvasCtx.fillStyle = "#ffffff";
        canvasCtx.fillRect(0, 0, canvas.width, canvas.height);
        return;
      }

      animationIdRef.current = requestAnimationFrame(draw);

      // Получаем данные времени (лучше для визуализации голоса в реальном времени)
      analyser.getByteTimeDomainData(dataArray);

      // Очищаем канвас
      canvasCtx.fillStyle = "#ffffff";
      canvasCtx.fillRect(0, 0, canvas.width, canvas.height);

      // Рисуем волну как вертикальные полоски (как в WaveSurfer)
      const barWidth = 3;
      const barGap = 1;
      const totalBars = Math.floor(canvas.width / (barWidth + barGap));
      const step = Math.floor(bufferLength / totalBars);

      console.log("Drawing wave", {
        canvasSize: { width: canvas.width, height: canvas.height },
        totalBars,
        bufferLength,
        step,
      });

      let hasAudio = false;

      // Создаем массив высот для интерполяции
      const barHeights: number[] = [];

      // Сначала вычисляем все высоты
      for (let i = 0; i < totalBars; i++) {
        const dataIndex = i * step;
        const value = dataArray[dataIndex];

        // Для временных данных: нормализуем от центра (128)
        const normalizedValue = Math.abs(value - 128) / 128.0;

        if (normalizedValue > 0.01) hasAudio = true;

        // Создаем более чувствительную и выразительную визуализацию
        const baseHeight = 4;
        const amplifiedValue = Math.pow(normalizedValue, 0.7) * 2.5;
        const barHeight = Math.max(
          baseHeight,
          amplifiedValue * canvas.height * 0.8
        );

        barHeights.push(barHeight);
      }

      // Применяем сглаживание к высотам для более плавных переходов
      const smoothedHeights: number[] = [];
      for (let i = 0; i < barHeights.length; i++) {
        let sum = barHeights[i];
        let count = 1;

        // Усредняем с соседними значениями для плавности
        if (i > 0) {
          sum += barHeights[i - 1];
          count++;
        }
        if (i < barHeights.length - 1) {
          sum += barHeights[i + 1];
          count++;
        }

        smoothedHeights.push(sum / count);
      }

      // Теперь рисуем с плавными высотами
      for (let i = 0; i < totalBars; i++) {
        const barHeight = smoothedHeights[i];

        const x = i * (barWidth + barGap);
        const y = (canvas.height - barHeight) / 2;

        // Создаем градиент для красивого эффекта (синие тона для белой темы)
        const gradient = canvasCtx.createLinearGradient(0, y, 0, y + barHeight);
        gradient.addColorStop(0, "#3B82F6");
        gradient.addColorStop(0.5, "#1D4ED8");
        gradient.addColorStop(1, "#1E40AF");

        canvasCtx.fillStyle = gradient;

        // Рисуем полоску с закругленными углами (совместимость)
        canvasCtx.fillStyle = gradient;

        // Всегда используем обычный прямоугольник для совместимости
        canvasCtx.fillRect(x, y, barWidth, barHeight);
      }

      // Логируем активность аудио
      if (hasAudio) {
        console.log("Audio activity detected", { hasAudio, totalBars });
      }
    };

    // Начинаем цикл анимации
    draw();
  }, [canvasRef]);

  // Инициализация аудио контекста для визуализации в реальном времени
  const startVisualization = useCallback(async (): Promise<boolean> => {
    try {
      console.log("Starting audio visualization initialization...");

      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
      });

      console.log("Got media stream", stream);
      streamRef.current = stream;

      const audioContext = new (window.AudioContext ||
        (window as typeof window & { webkitAudioContext: typeof AudioContext })
          .webkitAudioContext)();
      audioContextRef.current = audioContext;
      console.log("Created audio context", audioContext);

      const analyser = audioContext.createAnalyser();
      analyser.fftSize = 2048;
      analyser.smoothingTimeConstant = 0.8;
      analyser.minDecibels = -90;
      analyser.maxDecibels = -10;
      analyserRef.current = analyser;
      console.log("Created analyser", analyser);

      const source = audioContext.createMediaStreamSource(stream);
      source.connect(analyser);
      console.log("Connected audio source to analyser");

      // Создаем MediaRecorder для записи
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;

      const audioChunks: Blob[] = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunks.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunks, { type: "audio/wav" });
        if (onRecordingStop) {
          onRecordingStop(audioBlob);
        }
        audioChunks.length = 0;
      };

      // Начинаем запись
      mediaRecorder.start();
      console.log("Started media recorder");

      // Запускаем визуализацию
      console.log("Starting visualization with canvas:", canvasRef.current);
      drawRealTimeWave();

      return true;
    } catch (error) {
      console.error("Failed to initialize audio visualization:", error);
      return false;
    }
  }, [drawRealTimeWave, onRecordingStop, canvasRef]);

  // Остановка визуализации и записи
  const stopVisualization = useCallback(() => {
    // Останавливаем анимацию
    stopAnimation();

    // Останавливаем запись
    if (
      mediaRecorderRef.current &&
      mediaRecorderRef.current.state !== "inactive"
    ) {
      mediaRecorderRef.current.stop();
    }

    // Очищаем ресурсы
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }

    if (audioContextRef.current) {
      audioContextRef.current.close();
      audioContextRef.current = null;
    }

    mediaRecorderRef.current = null;
    analyserRef.current = null;
  }, [stopAnimation]);

  // Cleanup при размонтировании компонента
  useEffect(() => {
    return () => {
      stopVisualization();
    };
  }, [stopVisualization]);

  return {
    startVisualization,
    stopVisualization,
    isAnimating: isAnimatingRef.current,
  };
};
