import React, { useState } from "react";
import type { FormEvent } from "react";
import { useSignUp } from "../hooks";
import {
  FaUser,
  FaLock,
  FaEye,
  FaEyeSlash,
  FaCheckCircle,
} from "react-icons/fa";
import "./AuthForm.css";

interface SignUpFormProps {
  onSuccess?: () => void;
  onSwitchToSignIn?: () => void;
}

const SignUpForm: React.FC<SignUpFormProps> = ({
  onSuccess,
  onSwitchToSignIn,
}) => {
  const [login, setLogin] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [validationError, setValidationError] = useState("");

  const { signUp, loading, error } = useSignUp();

  const validatePassword = (pass: string): boolean => {
    if (pass.length < 6) {
      setValidationError("Пароль должен содержать минимум 6 символов");
      return false;
    }
    return true;
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setValidationError("");

    if (!login.trim() || !password.trim()) {
      setValidationError("Пожалуйста, заполните все поля");
      return;
    }

    if (!validatePassword(password)) {
      return;
    }

    if (password !== confirmPassword) {
      setValidationError("Пароли не совпадают");
      return;
    }

    const success = await signUp({ login: login.trim(), password });

    if (success && onSuccess) {
      onSuccess();
    }
  };

  const passwordStrength = (pass: string): string => {
    if (pass.length === 0) return "";
    if (pass.length < 6) return "weak";
    if (pass.length < 10) return "medium";
    return "strong";
  };

  const strength = passwordStrength(password);

  return (
    <div className="auth-form-container">
      <div className="auth-form-header">
        <h2>Регистрация в Digital Tween</h2>
        <p>Создайте аккаунт для начала работы</p>
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
              placeholder="Минимум 6 символов"
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
          {password && (
            <div className={`password-strength ${strength}`}>
              <div className="strength-bar">
                <div className="strength-fill"></div>
              </div>
              <span className="strength-text">
                {strength === "weak" && "Слабый пароль"}
                {strength === "medium" && "Средний пароль"}
                {strength === "strong" && "Надежный пароль"}
              </span>
            </div>
          )}
        </div>

        <div className="form-group">
          <label htmlFor="confirmPassword">Подтвердите пароль</label>
          <div className="input-with-icon">
            <FaLock className="input-icon" />
            <input
              type={showConfirmPassword ? "text" : "password"}
              id="confirmPassword"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Повторите пароль"
              disabled={loading}
              required
            />
            <button
              type="button"
              className="toggle-password"
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              tabIndex={-1}
            >
              {showConfirmPassword ? <FaEyeSlash /> : <FaEye />}
            </button>
            {confirmPassword && password === confirmPassword && (
              <FaCheckCircle className="match-icon" />
            )}
          </div>
        </div>

        {(error || validationError) && (
          <div className="error-message">
            <span>⚠️</span>
            <p>{error || validationError}</p>
          </div>
        )}

        <button
          type="submit"
          className="submit-button"
          disabled={
            loading ||
            !login.trim() ||
            !password.trim() ||
            !confirmPassword.trim() ||
            password !== confirmPassword
          }
        >
          {loading ? "Регистрация..." : "Зарегистрироваться"}
        </button>
      </form>

      <div className="auth-form-footer">
        <p>
          Уже есть аккаунт?{" "}
          <button
            type="button"
            className="link-button"
            onClick={onSwitchToSignIn}
          >
            Войти
          </button>
        </p>
      </div>
    </div>
  );
};

export default SignUpForm;
