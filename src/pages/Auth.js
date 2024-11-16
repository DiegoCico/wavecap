import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import "../css/Auth.css";

const AuthPage = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate(); // Hook for navigation

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const url = isLogin
        ? "http://127.0.0.1:5000/login"
        : "http://127.0.0.1:5000/signup";

      const response = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to process the request.");
      }

      const data = await response.json();
      setMessage(isLogin ? "Login successful!" : "Signup successful!");

      // Redirect to homepage with user ID
      navigate(`/home/${data.uid}`);
    } catch (error) {
      setMessage(error.message);
      console.error("Error:", error);
    } finally {
      setLoading(false);
    }
  };

  const toggleAuthMode = () => {
    setIsLogin(!isLogin);
    setMessage("");
  };

  return (
    <div className="body">
      <div className="auth-container">
        <div className="auth-image-container">
          <img
            src={`${process.env.PUBLIC_URL}/WaveCap.png`}
            alt="Auth Page"
            className="auth-image"
          />
        </div>
        <div className="auth-form-container">
          <h2>{isLogin ? "Login" : "Signup"}</h2>
          <form onSubmit={handleSubmit}>
            <input
              type="email"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              aria-label="Email"
            />
            <input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              aria-label="Password"
            />
            <button type="submit" disabled={loading}>
              {loading ? "Processing..." : isLogin ? "Login" : "Signup"}
            </button>
          </form>
          <p>{message}</p>
          <button onClick={toggleAuthMode} disabled={loading}>
            {isLogin ? "Switch to Signup" : "Switch to Login"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default AuthPage;
