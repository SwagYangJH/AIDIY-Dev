import React, { useState, useRef, useEffect, useCallback } from "react";
import { tw } from "@twind/core";

const ChatPage = () => {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [selectedImage, setSelectedImage] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [chatSessions, setChatSessions] = useState([]);
  const [activeSession, setActiveSession] = useState(null);
  const [isNewSession, setIsNewSession] = useState(true);

  const fileInputRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const messagesEndRef = useRef(null);

  // Fetch chat sessions on component mount
  useEffect(() => {
    fetchChatSessions();
  }, []);

  // Scroll to bottom when messages change
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Load session when activeSession changes
  useEffect(() => {
    if (activeSession) {
      loadChatSession(activeSession);
    } else if (chatSessions.length > 0) {
      setActiveSession(chatSessions[0]._id);
    } else {
      createNewChatSession();
    }
  }, [activeSession, chatSessions]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const fetchChatSessions = async () => {
    try {
      setIsLoading(true);
      const token = sessionStorage.getItem("app_token");
      const response = await fetch("http://localhost:5500/api/chat/sessions", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      const data = await response.json();
      if (data.success) {
        setChatSessions(data.sessions);
      }
    } catch (error) {
      console.error("Failed to fetch chat sessions:", error);
    } finally {
      setIsLoading(false);
    }
  };

  // Use useCallback to memoize createNewChatSession
  const createNewChatSession = useCallback(async () => {
    try {
      setIsLoading(true);
      const token = sessionStorage.getItem("app_token");
      const response = await fetch("http://localhost:5500/api/chat/sessions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ title: "New Chat" }),
      });
      const data = await response.json();
      if (data.success) {
        setActiveSession(data.session_id);
        setMessages([]);
        setIsNewSession(true);
        fetchChatSessions();
      }
    } catch (error) {
      console.error("Failed to create new session:", error);
    } finally {
      setIsLoading(false);
    }
  }, [fetchChatSessions]);

  const loadChatSession = async (sessionId) => {
    try {
      setIsLoading(true);
      const token = sessionStorage.getItem("app_token");
      const response = await fetch(
        `http://localhost:5500/api/chat/sessions/${sessionId}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      const data = await response.json();
      if (data.success) {
        setMessages(data.session.messages || []);
        setIsNewSession(false);
      }
    } catch (error) {
      console.error("Failed to load chat session:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const updateSessionTitle = async (sessionId, newTitle) => {
    try {
      const token = sessionStorage.getItem("app_token");
      await fetch(`http://localhost:5500/api/chat/sessions/${sessionId}`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ title: newTitle }),
      });
      fetchChatSessions();
    } catch (error) {
      console.error("Failed to update title:", error);
    }
  };

  const deleteChatSession = async (sessionId) => {
    try {
      const token = sessionStorage.getItem("app_token");
      await fetch(`http://localhost:5500/api/chat/sessions/${sessionId}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      
      // Create new session if deleting current session
      if (activeSession === sessionId) {
        createNewChatSession();
      } else {
        fetchChatSessions();
      }
    } catch (error) {
      console.error("Failed to delete session:", error);
    }
  };

  const sendMessage = async () => {
    if (!input.trim() && !selectedImage) return;

    const userMessage = {
      role: "user",
      content: input,
      image: selectedImage,
      timestamp: new Date().toISOString(),
    };

    const newMessages = [...messages, userMessage];
    setMessages(newMessages);
    setInput("");
    setSelectedImage(null);
    setIsLoading(true);

    try {
      const token = sessionStorage.getItem("app_token");
      const requestBody = { 
        message: input,
        session_id: activeSession,
        is_first_message: isNewSession
      };

      if (selectedImage) {
        requestBody.image = selectedImage.split(",")[1];
      }

      const response = await fetch("http://localhost:5500/api/ai/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(requestBody),
      });

      const data = await response.json();

      const aiMessage = {
        role: "assistant",
        content: data.success ? data.response : `Error: ${data.error || "Unknown error"}`,
        timestamp: new Date().toISOString(),
      };

      setMessages([...newMessages, aiMessage]);
      setIsNewSession(false);
      fetchChatSessions();
    } catch (error) {
      setMessages([
        ...newMessages,
        { 
          role: "assistant", 
          content: `Error sending message: ${error.message}`,
          timestamp: new Date().toISOString()
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file && file.size <= 5 * 1024 * 1024) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setSelectedImage(reader.result);
      };
      reader.readAsDataURL(file);
    } else {
      alert("Please select an image smaller than 5MB");
    }
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mimeType = MediaRecorder.isTypeSupported("audio/webm") ? "audio/webm" : "audio/wav";

      const mediaRecorder = new MediaRecorder(stream, { mimeType });
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) audioChunksRef.current.push(event.data);
      };

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: mimeType });
        await sendAudioToServer(audioBlob);
        stream.getTracks().forEach((track) => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
    } catch (error) {
      alert("Failed to start recording: " + error.message);
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  const handleVoiceRecord = () => {
    isRecording ? stopRecording() : startRecording();
  };

  const sendAudioToServer = async (audioBlob) => {
    const token = sessionStorage.getItem("app_token");
    const formData = new FormData();
    formData.append("audio", audioBlob, "recording.webm");

    try {
      const response = await fetch("http://localhost:5500/api/ai/speech-to-text", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      const data = await response.json();
      if (data.success) {
        setInput(data.text);
      } else {
        alert("Speech recognition failed: " + data.error);
      }
    } catch (error) {
      alert("Failed to send audio: " + error.message);
    }
  };

  return (
    <div className={tw("min-h-screen flex")} style={{ backgroundColor: "#EBF1FF" }}>
      {/* Sidebar */}
      {sidebarOpen && (
        <div className={tw("w-64 shadow-lg flex flex-col")} style={{ backgroundColor: "#CDC8E3" }}>
          <div className={tw("flex justify-between items-center p-4 border-b border-gray-300")}>
            <h2 className={tw("text-lg font-semibold text-gray-700")}>Chat History</h2>
            <button
              onClick={() => setSidebarOpen(false)}
              className={tw("text-gray-600 hover:text-gray-800")}
            >
              ✕
            </button>
          </div>
          
          <div className={tw("flex-1 overflow-y-auto")}>
            <button
              onClick={createNewChatSession}
              className={tw("w-full py-3 px-4 text-left hover:bg-purple-200 flex items-center text-primary-turquoise font-medium")}
            >
              ➕ New Chat
            </button>
            
            {chatSessions.length === 0 && !isLoading && (
              <div className={tw("p-4 text-center text-gray-500 italic")}>
                No saved chats yet
              </div>
            )}
            
            {chatSessions.map((session) => (
              <div
                key={session._id}
                className={tw(
                  `p-3 border-b border-gray-200 cursor-pointer hover:bg-purple-200 ${
                    activeSession === session._id ? "bg-purple-300" : ""
                  }`
                )}
                onClick={() => setActiveSession(session._id)}
              >
                <div className={tw("flex justify-between items-start")}>
                  <div className={tw("flex-1 min-w-0")}>
                    <p className={tw("truncate font-medium text-gray-700")}>{session.title}</p>
                    <p className={tw("text-xs text-gray-600 truncate")}>
                      {new Date(session.updated_at).toLocaleDateString()} - 
                      {new Date(session.updated_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      if (window.confirm("Delete this chat session?")) {
                        deleteChatSession(session._id);
                      }
                    }}
                    className={tw("ml-2 text-red-500 hover:text-red-700 p-1")}
                  >
                    🗑️
                  </button>
                </div>
              </div>
            ))}
          </div>
          
          <div className={tw("p-3 border-t border-gray-300 text-xs text-gray-500")}>
            AI Financial Coach v1.0
          </div>
        </div>
      )}

      {/* Show Sidebar Button */}
      {!sidebarOpen && (
        <button
          onClick={() => setSidebarOpen(true)}
          className={tw("fixed top-0 left-0 h-full w-8 bg-purple-300 text-gray-700 shadow-md flex items-top justify-top text-lg p-1")}
          style={{ zIndex: 50 }}
          title="Show Menu"
        >
          ☰
        </button>
      )}

      {/* Main Chat Area */}
      <div className={tw("flex-1 flex flex-col px-4 py-6")}>
        <div className={tw("flex justify-between items-center mb-4")}>
          <h1 className={tw("text-2xl font-bold text-primary-turquoise")}>
            🤖 AI Financial Coach
          </h1>
          {activeSession && (
            <input
              type="text"
              value={chatSessions.find(s => s._id === activeSession)?.title || ""}
              onChange={(e) => updateSessionTitle(activeSession, e.target.value)}
              className={tw("bg-transparent border-b border-gray-400 px-2 py-1 focus:outline-none focus:border-blue-500 text-gray-700 max-w-xs")}
              placeholder="Chat title"
            />
          )}
        </div>

        <div className={tw("flex flex-col flex-grow w-full max-w-4xl mx-auto rounded-xl shadow-md p-6 sm:p-8")} style={{ backgroundColor: "#E3DCEE" }}>
          {/* Message History */}
          <div className={tw("flex-grow overflow-y-auto mb-4 space-y-4 max-h-[70vh]")}>
            {messages.length === 0 && !isLoading && (
              <div className={tw("flex flex-col items-center justify-center h-full text-gray-500")}>
                <div className={tw("mb-4 text-4xl")}>💬</div>
                <p>Start a conversation with your financial coach</p>
                <p className={tw("text-sm mt-2")}>Ask about saving, budgeting, or money management!</p>
              </div>
            )}
            
            {messages.map((msg, idx) => (
              <div key={idx} className={tw(`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`)}>
                <div className={tw(`max-w-[85%] p-4 rounded-2xl ${msg.role === "user" ? "bg-gradient-to-r from-primary-turquoise to-accent-purple text-white" : "bg-white text-gray-800"}`)}>
                  {msg.image && <img src={msg.image} alt="Uploaded" className={tw("mb-2 rounded-lg max-h-40")} />}
                  <p className={tw("whitespace-pre-wrap")}>{msg.content}</p>
                  <div className={tw("text-xs mt-1 opacity-80")}>
                    {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </div>
                </div>
              </div>
            ))}
            
            {isLoading && (
              <div className={tw("flex justify-start")}>
                <div className={tw("bg-white p-4 rounded-2xl")}>
                  <div className={tw("flex space-x-2")}>
                    <div className={tw("w-2 h-2 bg-gray-400 rounded-full animate-bounce")}></div>
                    <div className={tw("w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-100")}></div>
                    <div className={tw("w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-200")}></div>
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input & Actions */}
          <div className={tw("relative bg-gray-50 rounded-2xl p-4 border-2 border-gray-200")}>
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  sendMessage();
                }
              }}
              placeholder="Ask about money management, savings, or financial goals..."
              className={tw("w-full bg-transparent resize-none outline-none text-gray-700 placeholder-gray-400 min-h-[60px]")}
              rows="2"
              disabled={isLoading}
            />
            {selectedImage && (
              <div className={tw("mt-2 relative inline-block")}>
                <img src={selectedImage} alt="Preview" className={tw("h-20 rounded-lg")} />
                <button onClick={() => setSelectedImage(null)} className={tw("absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full text-xs")}>✕</button>
              </div>
            )}
            <div className={tw("flex justify-between items-center mt-2")}>
              <div className={tw("flex items-center gap-2")}>
                <button onClick={() => fileInputRef.current?.click()} className={tw("p-2 rounded-full hover:bg-gray-200 text-gray-600")} disabled={isLoading}>
                  📷
                </button>
                <input ref={fileInputRef} type="file" accept="image/*" onChange={handleImageUpload} className={tw("hidden")} />
                <button onClick={handleVoiceRecord} className={tw(`p-2 rounded-full hover:bg-gray-200 ${isRecording ? "text-red-500 animate-pulse" : "text-gray-600"}`)} disabled={isLoading}>
                  🎤
                </button>
                {isRecording && <span className={tw("text-sm text-red-500")}>Recording...</span>}
              </div>
              <button 
                onClick={sendMessage} 
                disabled={isLoading || (!input.trim() && !selectedImage)} 
                className={tw("px-6 py-2 bg-gradient-to-r from-primary-turquoise to-accent-purple text-white font-semibold rounded-lg hover:shadow-lg transform hover:-translate-y-0.5 transition-all disabled:opacity-50")}
              >
                {isLoading ? "Sending..." : "Send"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChatPage;