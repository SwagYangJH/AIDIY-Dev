import React, { useState, useRef } from "react";
import { tw } from "@twind/core";

const ChatPage = () => {
  const [messages, setMessages] = useState([
    { role: "system", content: "Hi there! How can I help you today?" },
  ]);
  const [input, setInput] = useState("");
  const [selectedImage, setSelectedImage] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const fileInputRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);

  const sendMessage = async () => {
    if (!input.trim() && !selectedImage) return;

    const userMessage = {
      role: "user",
      content: input,
      image: selectedImage,
      timestamp: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setSelectedImage(null);
    setIsLoading(true);

    try {
      const token = sessionStorage.getItem("app_token");
      const requestBody = { message: input };

      if (userMessage.image) {
        requestBody.image = userMessage.image.split(",")[1];
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

      setMessages((prev) => [...prev, aiMessage]);
    } catch (error) {
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: `Error sending message: ${error.message}` },
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
          <button
            onClick={() => setSidebarOpen(false)}
            className={tw("text-left text-sm px-4 py-2 text-gray-600 hover:bg-gray-100 border-b")}
          >
            ☰ Hide Menu
          </button>
          <div className={tw("flex-1 p-4 text-gray-400 italic")}>
            (No saved chats yet)
          </div>
        </div>
      )}

      {/* Show Sidebar Button */}
      {!sidebarOpen && (
        <button
          onClick={() => setSidebarOpen(true)}
          className={tw("fixed top-0 left-0 h-full w-6 bg-purple text-gray-600 shadow-md flex items-top justify-top text-lg")}
          style={{ zIndex: 50 }}
          title="Show Menu"
        >
          ☰
        </button>
      )}

      {/* Main Chat */}
      <div className={tw("flex-1 flex flex-col px-4 py-6")}>
        <h1 className={tw("text-2xl font-bold text-primary-turquoise text-center mb-4")}>🤖 AI DiY Chatbot</h1>

        <div className={tw("flex flex-col flex-grow w-full max-w-4xl mx-auto rounded-xl shadow-md p-6 sm:p-8")} style={{ backgroundColor: "#E3DCEE" }}>
          {/* Message History */}
          <div className={tw("flex-grow overflow-y-auto mb-4 space-y-4")}>
            {messages.map((msg, idx) => (
              <div key={idx} className={tw(`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`)}>
                <div className={tw(`max-w-[70%] p-4 rounded-2xl ${msg.role === "user" ? "bg-gradient-to-r from-primary-turquoise to-accent-purple text-white" : "bg-white text-gray-800"}`)}>
                  {msg.image && <img src={msg.image} alt="Uploaded" className={tw("mb-2 rounded-lg max-h-40")} />}
                  <p className={tw("whitespace-pre-wrap")}>{msg.content}</p>
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
              placeholder="Guide me AI DIY..."
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
              <button onClick={sendMessage} disabled={isLoading || (!input.trim() && !selectedImage)} className={tw("px-6 py-2 bg-gradient-to-r from-primary-turquoise to-accent-purple text-white font-semibold rounded-lg hover:shadow-lg transform hover:-translate-y-0.5 transition-all disabled:opacity-50")}>
                {isLoading ? "Sending..." : "Guide me"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChatPage;
