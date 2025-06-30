// src/pages/ChatPage.jsx
import React, { useState, useRef, useEffect, useCallback } from "react";
import { tw } from "@twind/core";
import AIAvatar from "./AIAvatar";

const ChatPage = () => {
  /* ─────────────── state ─────────────── */
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [selectedImage, setSelectedImage] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [chatSessions, setChatSessions] = useState([]);
  const [activeSession, setActiveSession] = useState(null);
  const [isNewSession, setIsNewSession] = useState(true);

  /* ─────────────── refs ─────────────── */
  const fileInputRef = useRef(null);
  const mediaRecRef = useRef(null);
  const audioChunksRef = useRef([]);
  const messagesEndRef = useRef(null);

  /* ─────────────── helpers ─────────────── */
  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  /* ─────────────── initial load ─────────────── */
  useEffect(() => {
    fetchChatSessions();
  }, []);

  /* scroll when msgs change */
  useEffect(scrollToBottom, [messages, scrollToBottom]);

  /* load a session into the UI whenever activeSession changes */
  useEffect(() => {
    if (activeSession) loadChatSession(activeSession);
    else if (chatSessions.length && !isNewSession) setActiveSession(chatSessions[0]._id);
  }, [activeSession, chatSessions, isNewSession]);

  /* ─────────────── API wrappers ─────────────── */
  const fetchChatSessions = async () => {
    try {
      setIsLoading(true);
      const token = sessionStorage.getItem("app_token");
      const res = await fetch("http://localhost:5500/api/chat/sessions", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.success) {
        setChatSessions(data.sessions);
      }
    } catch (err) {
      console.error("fetchChatSessions failed:", err);
    } finally {
      setIsLoading(false);
    }
  };

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
      const res = await fetch(
        `http://localhost:5500/api/chat/sessions/${sessionId}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      const data = await res.json();
      if (data.success) {
        setMessages(data.session.messages || []);
        setIsNewSession(false);
      }
    } catch (err) {
      console.error("loadChatSession failed:", err);
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
    } catch (err) {
      console.error("updateSessionTitle failed:", err);
    }
  };

  const deleteChatSession = async (sessionId) => {
    try {
      const token = sessionStorage.getItem("app_token");
      await fetch(`http://localhost:5500/api/chat/sessions/${sessionId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });

      // Create new session if deleting current session
      if (activeSession === sessionId) {
        createNewChatSession();
      } else {
        fetchChatSessions();
      }
    } catch (err) {
      console.error("deleteChatSession failed:", err);
    }
  };

  /* ─────────────── chat logic ─────────────── */
  const startNewChat = () => {
    createNewChatSession();
  };

  const sendMessage = async () => {
    if (!input.trim() && !selectedImage) return;

    /* optimistic user bubble */
    const userMsg = {
      role: "user",
      content: input,
      image: selectedImage,
      timestamp: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setSelectedImage(null);
    setIsLoading(true);

    try {
      const token = sessionStorage.getItem("app_token");
      let sessionId = activeSession;

      /* ── create session only if absent ── */
      if (!sessionId) {
        const createRes = await fetch("http://localhost:5500/api/chat/sessions", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ title: "New Chat" }), // placeholder
        });
        const createData = await createRes.json();
        if (!createData.success) throw new Error("Failed to create session");
        sessionId = createData.session_id;
        setActiveSession(sessionId);
      }

      /* ── call AI ── */
      const body = { 
        message: userMsg.content, 
        session_id: sessionId,
        is_first_message: isNewSession
      };
      if (userMsg.image) body.image = userMsg.image.split(",")[1]; // base64 only

      const aiRes = await fetch("http://localhost:5500/api/ai/chat", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const aiData = await aiRes.json();

      const replyMsg = {
        role: "assistant",
        content: aiData.success
          ? aiData.response
          : `Error: ${aiData.error || "Unknown error"}`,
        timestamp: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, replyMsg]);

      /* session now real & non-empty */
      setIsNewSession(false);
      fetchChatSessions();
    } catch (err) {
      console.error("sendMessage failed:", err);
      setMessages((prev) => [
        ...prev,
        { 
          role: "assistant", 
          content: `Error: ${err.message}`, 
          timestamp: new Date().toISOString() 
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  /* ─────────────── media helpers ─────────────── */
  const handleImageUpload = (e) => {
    const f = e.target.files[0];
    if (!f) return;
    if (f.size > 5 * 1024 * 1024) {
      alert("Image must be ≤ 5 MB");
      return;
    }
    const reader = new FileReader();
    reader.onloadend = () => setSelectedImage(reader.result);
    reader.readAsDataURL(f);
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mime = MediaRecorder.isTypeSupported("audio/webm") ? "audio/webm" : "audio/wav";
      const rec = new MediaRecorder(stream, { mimeType: mime });
      mediaRecRef.current = rec;
      audioChunksRef.current = [];

      rec.ondataavailable = (ev) => ev.data.size && audioChunksRef.current.push(ev.data);
      rec.onstop = () => {
        const blob = new Blob(audioChunksRef.current, { type: mime });
        sendAudioToServer(blob);
        stream.getTracks().forEach((t) => t.stop());
      };
      rec.start();
      setIsRecording(true);
    } catch (err) {
      alert("Recording failed: " + err.message);
    }
  };

  const stopRecording = () => {
    mediaRecRef.current?.stop();
    setIsRecording(false);
  };

  const toggleRecording = () => (isRecording ? stopRecording() : startRecording());

  const sendAudioToServer = async (audioBlob) => {
    const token = sessionStorage.getItem("app_token");
    const formData = new FormData();
    formData.append("audio", audioBlob, "recording.webm");

    try {
      const response = await fetch("http://localhost:5500/api/ai/speech-to-text", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
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

  /* ─────────────── UI ─────────────── */
  return (
    <div className={tw`min-h-screen flex`} style={{ backgroundColor: "#EBF1FF" }}>
      {/* ────────── Sidebar ────────── */}
      {sidebarOpen && (
        <div className={tw`w-64 flex flex-col shadow-lg`} style={{ backgroundColor: "#CDC8E3" }}>
          <header className={tw`p-4 border-b border-gray-300 flex justify-between items-center`}>
            <h2 className={tw`font-semibold text-gray-700 text-lg`}>Chat History</h2>
            <button 
              onClick={() => setSidebarOpen(false)} 
              className={tw`text-gray-600 hover:text-gray-800`}
            >
              ✕
            </button>
          </header>

          <button
            onClick={startNewChat}
            className={tw`w-full text-left py-3 px-4 hover:bg-purple-200 text-primary-turquoise font-medium flex items-center`}
          >
            ➕ New Chat
          </button>

          <div className={tw`flex-1 overflow-y-auto`}>
            {chatSessions.length === 0 && !isLoading && (
              <p className={tw`p-4 text-center italic text-gray-500`}>No saved chats yet</p>
            )}
            {chatSessions.map((s) => (
              <div
                key={s._id}
                onClick={() => setActiveSession(s._id)}
                className={tw`
                  p-3 border-b border-gray-200 cursor-pointer hover:bg-purple-200
                  ${activeSession === s._id ? "bg-purple-300" : ""}
                `}
              >
                <div className={tw`flex justify-between items-start`}>
                  <div className={tw`flex-1 min-w-0`}>
                    <p className={tw`font-medium text-gray-700 truncate`}>{s.title}</p>
                    <p className={tw`text-xs text-gray-600 truncate`}>
                      {new Date(s.updated_at).toLocaleDateString()} – 
                      {new Date(s.updated_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                    </p>
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      if (window.confirm("Delete this chat?")) deleteChatSession(s._id);
                    }}
                    className={tw`ml-2 text-red-500 hover:text-red-700 p-1`}
                  >
                    🗑
                  </button>
                </div>
              </div>
            ))}
          </div>

          <footer className={tw`p-3 border-t border-gray-300 text-xs text-gray-500`}>
            AI Financial Coach v1.0
          </footer>
        </div>
      )}

      {!sidebarOpen && (
        <button
          onClick={() => setSidebarOpen(true)}
          className={tw`fixed top-0 left-0 h-full w-8 bg-purple-300 text-gray-700 shadow-md flex items-top justify-top text-lg p-1`}
          style={{ zIndex: 50 }}
          title="Show Menu"
        >
          ☰
        </button>
      )}

      {/* ────────── Chat pane ────────── */}
      <main className={tw`flex-1 flex flex-col px-4 py-6`}>
        {/* Header */}
        <div className={tw`flex justify-between items-center mb-4`}>
          <h1 className={tw`text-2xl font-bold text-primary-turquoise`}>Ai DIY</h1>
          {activeSession && (
            <input
              value={chatSessions.find((s) => s._id === activeSession)?.title || ""}
              onChange={(e) => updateSessionTitle(activeSession, e.target.value)}
              placeholder="Chat title"
              className={tw`bg-transparent border-b border-gray-400 px-2 py-1 max-w-xs focus:outline-none focus:border-blue-500 text-gray-700`}
            />
          )}
        </div>
    


        {/* Messages */}
        <section
          className={tw`flex flex-col flex-grow max-w-4xl mx-auto rounded-xl shadow-md p-6 sm:p-8`}
          style={{ backgroundColor: "#E3DCEE" }}
        >
          
          <div className={tw`flex-grow overflow-y-auto mb-4 space-y-4 max-h-[70vh]`}>
            {messages.length === 0 && !isLoading && (
              <div className={tw`flex flex-col items-center justify-center h-full text-gray-500`}>
                <div className={tw`text-4xl mb-4`}>💬</div>
                     {/* <AIAvatar size="large" animated={true} /> */}
                <p>Start a conversation with your financial coach</p>
                <p className={tw`text-sm mt-2`}>Ask about saving, budgeting, or money management!</p>
              </div>
            )}

            {messages.map((m, i) => (
              <div key={i} className={tw`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
                {/* User Message - Blue Cloud */}
                {m.role === "user" && (
                  <div className={tw`relative max-w-[85%]`}>
                    <div
                      className={tw`
                        p-4 rounded-tl-[20px] rounded-tr-[20px] rounded-bl-[20px] rounded-br-[4px]
                        bg-gradient-to-r from-primary-turquoise to-accent-purple text-white
                        shadow-lg
                      `}
                    >
                      {m.image && <img src={m.image} alt="upload" className={tw`mb-2 rounded-lg max-h-40`} />}
                      <p className={tw`whitespace-pre-wrap`}>{m.content}</p>
                      <div className={tw`text-xs mt-1 opacity-80`}>
                        {new Date(m.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                      </div>
                    </div>
                    {/* Cloud tail for user */}
                    <div 
                      className={tw`absolute bottom-0 -right-2 w-4 h-4`}
                      style={{ 
                        clipPath: "polygon(0 0, 100% 0, 100% 100%)",
                        backgroundColor: "#5B86E5" // matches gradient end
                      }}
                    />
                  </div>
                )}
                
                {/* AI Message - White Cloud */}
                {m.role === "assistant" && (
                  <div className={tw`relative max-w-[85%]`}>
                    <div
                      className={tw`
                        p-4 rounded-tl-[20px] rounded-tr-[20px] rounded-br-[20px] rounded-bl-[4px]
                        bg-white text-gray-800 shadow-lg
                      `}
                    >
                      <p className={tw`whitespace-pre-wrap`}>{m.content}</p>
                      <div className={tw`text-xs mt-1 opacity-80`}>
                        {new Date(m.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                      </div>
                    </div>
                    {/* Cloud tail for AI */}
                    <div 
                      className={tw`absolute bottom-0 -left-2 w-4 h-4`}
                      style={{ 
                        clipPath: "polygon(0 0, 0% 100%, 100% 0%)",
                        backgroundColor: "#ffffff"
                      }}
                    />
                  </div>
                )}
              </div>
            ))}

            {isLoading && (
              <div className={tw`flex justify-start`}>
                <div className={tw`bg-white p-4 rounded-2xl`}>
                  <div className={tw`flex space-x-2`}>
                    <div className={tw`w-2 h-2 bg-gray-400 rounded-full animate-bounce`} />
                    <div className={tw`w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-100`} />
                    <div className={tw`w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-200`} />
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Input */}
          <div className={tw`relative bg-gray-50 rounded-2xl p-4 border-2 border-gray-200`}>
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
              rows={2}
              disabled={isLoading}
              className={tw`w-full bg-transparent resize-none outline-none placeholder-gray-400 min-h-[60px] text-gray-700`}
            />

            {selectedImage && (
              <div className={tw`inline-block mt-2 relative`}>
                <img src={selectedImage} alt="preview" className={tw`h-20 rounded-lg`} />
                <button
                  onClick={() => setSelectedImage(null)}
                  className={tw`absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full text-xs`}
                >
                  ✕
                </button>
              </div>
            )}

            <div className={tw`flex justify-between items-center mt-2`}>
              <div className={tw`flex items-center gap-2`}>
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className={tw`p-2 rounded-full hover:bg-gray-200 text-gray-600`}
                  disabled={isLoading}
                >
                  📷
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  className={tw`hidden`}
                />
                <button
                  onClick={toggleRecording}
                  className={tw`
                    p-2 rounded-full hover:bg-gray-200
                    ${isRecording ? "text-red-500 animate-pulse" : "text-gray-600"}
                  `}
                  disabled={isLoading}
                >
                  🎤
                </button>
                {isRecording && <span className={tw`text-sm text-red-500`}>Recording...</span>}
              </div>

              <button
                onClick={sendMessage}
                disabled={isLoading || (!input.trim() && !selectedImage)}
                className={tw`
                  px-6 py-2 bg-gradient-to-r from-primary-turquoise to-accent-purple
                  text-white font-semibold rounded-lg hover:shadow-lg transform hover:-translate-y-0.5 
                  transition-all disabled:opacity-50
                `}
              >
                {isLoading ? "Sending..." : "Send"}
              </button>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
};

export default ChatPage;
