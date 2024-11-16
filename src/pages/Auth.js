import React, { useState } from "react";
import "../css/Auth.css";
import placeholderImage from "../img/main-logo.png";

const AuthPage = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [ipfsHash, setIpfsHash] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    const endpoint = isLogin ? "login" : "signup";

    try {
      const response = await fetch(`http://127.0.0.1:5000/${endpoint}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "An error occurred.");
      }

      if (isLogin) {
        setMessage("Login successful!");
      } else {
        setMessage(data.message);
        setIpfsHash(data.ipfs_hash); // Display the IPFS hash
      }
    } catch (error) {
      setMessage(error.message);
    }
  };

  const toggleAuthMode = () => {
    setIsLogin(!isLogin);
    setMessage(""); // Clear any previous messages
    setIpfsHash(""); // Clear IPFS hash display
  };

  return (
    <div className="auth-container">
      <img src={placeholderImage} alt="Auth Page" className="auth-image" />
      <h2>{isLogin ? "Login" : "Signup"}</h2>
      <form onSubmit={handleSubmit}>
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        <button type="submit">{isLogin ? "Login" : "Signup"}</button>
      </form>
      <p>{message}</p>
      {ipfsHash && (
        <p>
          IPFS Hash: <a href={`https://gateway.pinata.cloud/ipfs/${ipfsHash}`} target="_blank" rel="noopener noreferrer">{ipfsHash}</a>
        </p>
      )}
      <button onClick={toggleAuthMode}>{isLogin ? "Switch to Signup" : "Switch to Login"}</button>
    </div>
  );
};

export default AuthPage;
