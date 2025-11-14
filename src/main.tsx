import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App.tsx";
import { UserProvider } from "./context/UserContext.tsx";

// Фиксация высоты viewport для мобильных устройств
function setViewportHeight() {
  const vh = window.innerHeight * 0.01;
  document.documentElement.style.setProperty("--vh", `${vh}px`);
}

// Устанавливаем высоту при загрузке и изменении размера
setViewportHeight();
window.addEventListener("resize", setViewportHeight);
window.addEventListener("orientationchange", () => {
  setTimeout(setViewportHeight, 100);
});

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <UserProvider>
      <App />
    </UserProvider>
  </StrictMode>
);
