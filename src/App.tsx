import { useState } from "react";
import "./App.css";
import MainPage from "./components/MainPage";
import AuthPage from "./components/AuthPage";

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  const handleAuthSuccess = () => {
    setIsAuthenticated(true);
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
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
