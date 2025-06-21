import React, { useState } from "react";
import { tw } from "@twind/core";

const ChatPage = () => {
  const [messages, setMessages] = useState([
    { role: "system", content: "Hi there! How can I help you today?" },
  ]);
  const [input, setInput] = useState("");
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [isLoading, setIsLoading] = useState(false);

  const sendMessage = async () => {
    if (!input.trim()) return;

    const userMessage = {
      role: "user",
      content: input,
      timestamp: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);

    try {
      const token = sessionStorage.getItem("app_token");
      const response = await fetch("http://localhost:5500/api/ai/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ message: input }),
      });

      const data = await response.json();

      if (data.success) {
        const aiMessage = {
          role: "assistant",
          content: data.response,
          timestamp: new Date().toISOString(),
        };
        setMessages((prev) => [...prev, aiMessage]);
      } else {
        setMessages((prev) => [
          ...prev,
          {
            role: "assistant",
            content: `Error: ${data.error || "Unknown error"}`,
          },
        ]);
      }
    } catch (error) {
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: `Error sending message: ${error.message}`,
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div
      className={tw("min-h-screen flex")}
      style={{ backgroundColor: "#EBF1FF" }}
    >
      {/* Sidebar */}
      {sidebarOpen && (
        <div
          className={tw("w-64 shadow-lg flex flex-col")}
          style={{ backgroundColor: "#CDC8E3" }}
        >
          <button
            onClick={() => setSidebarOpen(false)}
            className={tw(
              "text-left text-sm px-4 py-2 text-gray-600 hover:bg-gray-100 border-b"
            )}
          >
            ☰
          </button>

          {/* Future: Previous chats here */}
          <div className={tw("flex-1 p-4 text-gray-400 italic")}>
            {/* Placeholder for chat history */}
            (No saved chats yet)
          </div>
        </div>
      )}

      {/* Show Button (when sidebar is hidden) */}
      {!sidebarOpen && (
        <button
          onClick={() => setSidebarOpen(true)}
          className={tw(
            "fixed top-0 left-0 h-full w-6 bg-purple text-gray-600 shadow-md flex items-top justify-top text-lg"
          )}
          style={{ zIndex: 50 }}
          title="Show Menu"
        >
          ☰
        </button>
      )}

      {/* Main content */}
      <div className={tw("flex-1 flex flex-col px-4 py-6")}>
        {/* Header */}
        <h1
          className={tw(
            "text-2xl font-bold text-primary-turquoise text-center mb-4"
          )}
        >
          🤖 AI DiY Chatbot
        </h1>

        {/* Chatbox + Input */}
        <div
          className={tw(
            "flex flex-col flex-grow w-full max-w-4xl mx-auto rounded-xl shadow-md p-6 sm:p-8"
          )}
          style={{ backgroundColor: "#E3DCEE" }}
        >
          {/* Message history */}
          <div className={tw("flex-grow overflow-y-auto mb-4")}>
            {messages.map((msg, idx) => (
              <div
                key={idx}
                className={tw(
                  `mb-3 text-sm p-3 rounded-lg max-w-[50%] bg-[#C4EDE7] ${
                    msg.role === "user"
                      ? "self-end ml-auto text-left"
                      : "text-left"
                  }`
                )}
              >
                {msg.content}
              </div>
            ))}
          </div>

          {/* Input field and button inside chat box */}
          <div
            className={tw(
              "flex gap-2 bg-white border border-gray-300 rounded-lg px-4 py-2"
            )}
          >
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && sendMessage()}
              className={tw(
                "flex-1 border-none focus:outline-none bg-transparent"
              )}
              placeholder="Guide me Ai DIY..."
              disabled={isLoading}
            />
            <button
              onClick={sendMessage}
              disabled={isLoading}
              className={tw(
                "px-6 py-2 bg-gradient-to-r from-primary-turquoise to-accent-purple text-white font-semibold rounded-lg hover:shadow-lg transform hover:-translate-y-0.5 transition-all disabled:opacity-50"
              )}
            >
              {isLoading ? "Loading..." : "Guide me"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChatPage;
