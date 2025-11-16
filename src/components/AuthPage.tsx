import React, { useState } from "react";
import SignInForm from "./SignInForm";
import SignUpForm from "./SignUpForm";
import "./AuthPage.css";

interface AuthPageProps {
  onAuthSuccess?: () => void;
}

const AuthPage: React.FC<AuthPageProps> = ({ onAuthSuccess }) => {
  const [mode, setMode] = useState<"signin" | "signup">("signin");

  const handleSuccess = () => {
    if (onAuthSuccess) {
      onAuthSuccess();
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-background">
        <div className="auth-background-gradient"></div>
      </div>

      <div className="auth-content">
        <div className="auth-brand">
          <h1>Digital Tween</h1>
          <p>Ваш виртуальный двойник</p>
        </div>

        <div className="auth-form-wrapper">
          {mode === "signin" ? (
            <SignInForm
              onSuccess={handleSuccess}
              onSwitchToSignUp={() => setMode("signup")}
            />
          ) : (
            <SignUpForm
              onSuccess={handleSuccess}
              onSwitchToSignIn={() => setMode("signin")}
            />
          )}
        </div>
      </div>
    </div>
  );
};

export default AuthPage;
