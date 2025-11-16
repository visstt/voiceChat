import React, { useState } from "react";
import type { FormEvent } from "react";
import { useSignIn } from "../hooks";
import { FaUser, FaLock, FaEye, FaEyeSlash } from "react-icons/fa";
import "./AuthForm.css";

interface SignInFormProps {
  onSuccess?: () => void;
  onSwitchToSignUp?: () => void;
}

const SignInForm: React.FC<SignInFormProps> = ({
  onSuccess,
  onSwitchToSignUp,
}) => {
  const [login, setLogin] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const { signIn, loading, error } = useSignIn();

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!login.trim() || !password.trim()) {
      return;
    }

    const success = await signIn({ login: login.trim(), password });

    if (success && onSuccess) {
      onSuccess();
    }
  };

  return (
    <div className="auth-form-container">
      <div className="auth-form-header">
        <h2>Вход в Digital Tween</h2>
        <p>Войдите в свой аккаунт для продолжения</p>
      </div>

      <form onSubmit={handleSubmit} className="auth-form">
        <div className="form-group">
          <label htmlFor="login">Логин</label>
          <div className="input-with-icon">
            <FaUser className="input-icon" />
            <input
              type="text"
              id="login"
              value={login}
              onChange={(e) => setLogin(e.target.value)}
              placeholder="Введите логин"
              disabled={loading}
              required
            />
          </div>
        </div>

        <div className="form-group">
          <label htmlFor="password">Пароль</label>
          <div className="input-with-icon">
            <FaLock className="input-icon" />
            <input
              type={showPassword ? "text" : "password"}
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Введите пароль"
              disabled={loading}
              required
            />
            <button
              type="button"
              className="toggle-password"
              onClick={() => setShowPassword(!showPassword)}
              tabIndex={-1}
            >
              {showPassword ? <FaEyeSlash /> : <FaEye />}
            </button>
          </div>
        </div>

        {error && (
          <div className="error-message">
            <span>⚠️</span>
            <p>{error}</p>
          </div>
        )}

        <button
          type="submit"
          className="submit-button"
          disabled={loading || !login.trim() || !password.trim()}
        >
          {loading ? "Вход..." : "Войти"}
        </button>
      </form>

      <div className="auth-form-footer">
        <p>
          Нет аккаунта?{" "}
          <button
            type="button"
            className="link-button"
            onClick={onSwitchToSignUp}
          >
            Зарегистрироваться
          </button>
        </p>
      </div>
    </div>
  );
};

export default SignInForm;
