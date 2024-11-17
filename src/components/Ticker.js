import React, { useState } from "react";
import "../css/Ticker.css"; // CSS for styling the chatbot and button

const Ticker = () => {
  const [isOpen, setIsOpen] = useState(false); // To toggle chatbot visibility
  const [messages, setMessages] = useState([]);
  const [userInput, setUserInput] = useState("");

  const handleToggle = () => {
    setIsOpen(!isOpen);
  };

  const sendMessage = async () => {
    if (!userInput.trim()) return; // Don't send empty messages

    const newMessages = [...messages, { role: "user", content: userInput }];
    setMessages(newMessages);
    setUserInput("");

    try {
      const response = await fetch("http://127.0.0.1:5000/sambanova-investment-chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ message: userInput }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }

      const data = await response.json();
      const botResponse = data.response || "I'm sorry, I didn't understand that.";
      setMessages([...newMessages, { role: "assistant", content: botResponse }]);
    } catch (error) {
      console.error("Error sending message:", error);
      setMessages([...newMessages, { role: "assistant", content: "Error communicating with the server." }]);
    }
  };

  return (
    <div className="ticker-container">
      {/* Circle Button */}
      <div className="ticker-button" onClick={handleToggle}>
        <i className="fa-solid fa-t"></i>
      </div>

      {/* Chatbox */}
      {isOpen && (
        <div className="ticker-chatbot">
          <div className="chat-header">
            <h3>Ticker</h3>
          </div>
          <div className="chat-messages">
            {messages.map((msg, index) => (
              <div
                key={index}
                className={`chat-message ${msg.role === "user" ? "user" : "assistant"}`}
              >
                {msg.content}
              </div>
            ))}
          </div>
          <div className="chat-input">
            <input
              type="text"
              value={userInput}
              onChange={(e) => setUserInput(e.target.value)}
              placeholder="Ask something..."
            />
            <button onClick={sendMessage}>Send</button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Ticker;
