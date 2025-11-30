import { useState, useEffect } from "react";
import "./App.css";
import MainPage from "./components/MainPage";
import AuthPage from "./components/AuthPage";

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    // Проверяем наличие токена при загрузке страницы
    const token = localStorage.getItem("auth_token");
    if (token) {
      setIsAuthenticated(true);
    }
  }, []);

  const handleAuthSuccess = () => {
    setIsAuthenticated(true);
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    localStorage.removeItem("auth_token");
  };

  return (
    <div className="app">
      {isAuthenticated ? (
        <MainPage onLogout={handleLogout} />
      ) : (
        <AuthPage onAuthSuccess={handleAuthSuccess} />
      )}
    </div>
  );
}

export default App;
