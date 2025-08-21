import React, { useState, useRef, useEffect } from "react";

const API_URL = "http://localhost:8000/chat"; // Change to your deployed backend URL when ready

const styles = {
  chatButton: {
    position: "fixed",
    bottom: "32px",
    right: "32px",
    background: "#2a5298",
    color: "#fff",
    border: "none",
    borderRadius: "50%",
    width: "60px",
    height: "60px",
    fontSize: "2rem",
    boxShadow: "0 4px 24px rgba(0,0,0,0.12)",
    cursor: "pointer",
    zIndex: 1000,
  },
  chatWindow: {
    position: "fixed",
    bottom: "100px",
    right: "32px",
    width: "370px",
    maxWidth: "95vw",
    height: "500px", // Fixed height for better scrolling
    background: "#fff",
    borderRadius: "12px",
    boxShadow: "0 4px 24px rgba(0,0,0,0.12)",
    display: "flex",
    flexDirection: "column",
    zIndex: 1000,
    overflow: "hidden",
  },
  header: {
    background: "#2a5298",
    color: "#fff",
    padding: "18px 24px",
    fontSize: "1.1rem",
    fontWeight: 600,
    letterSpacing: "1px",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
  },
  closeBtn: {
    background: "transparent",
    border: "none",
    color: "#fff",
    fontSize: "1.3rem",
    cursor: "pointer",
  },
  messages: {
    flex: 1,
    padding: "18px",
    overflowY: "auto",
    background: "#f9fafc",
  },
  message: {
    marginBottom: "16px",
    display: "flex",
    flexDirection: "column",
  },
  userMsg: {
    alignItems: "flex-end",
  },
  botMsg: {
    alignItems: "flex-start",
  },
  msgText: {
    padding: "10px 16px",
    borderRadius: "18px",
    maxWidth: "80%",
    fontSize: "1rem",
    lineHeight: 1.5,
  },
  userText: {
    background: "#2a5298",
    color: "#fff",
    borderBottomRightRadius: "4px",
  },
  botText: {
    background: "#e3eafc",
    color: "#222",
    borderBottomLeftRadius: "4px",
  },
  inputArea: {
    display: "flex",
    borderTop: "1px solid #e3eafc",
    background: "#fff",
    padding: "12px 16px",
  },
  input: {
    flex: 1,
    border: "none",
    outline: "none",
    fontSize: "1rem",
    padding: "10px",
    borderRadius: "8px",
    background: "#f4f6fb",
    marginRight: "8px",
  },
  sendBtn: {
    background: "#2a5298",
    color: "#fff",
    border: "none",
    borderRadius: "8px",
    padding: "10px 18px",
    fontSize: "1rem",
    cursor: "pointer",
    transition: "background 0.2s",
  },
  sendBtnDisabled: {
    background: "#b0b8c9",
    cursor: "not-allowed",
  },
};

export default function ChatbotWidget() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState([
    {
      sender: "bot",
      text: "Hi! I'm your Hopjob AI assistant. I can help you navigate the website, find features like CV enhancement and interview preparation tools, and guide you through using the platform. How can I assist you today?",
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    if (open && messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, open]);

  const handleSend = async (e) => {
    e.preventDefault();
    if (!input.trim()) return;
    const userMsg = input.trim();
    setMessages((msgs) => [...msgs, { sender: "user", text: userMsg }]);
    setInput("");
    setLoading(true);

    try {
      const res = await fetch(API_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: userMsg }),
      });
      const data = await res.json();
      setMessages((msgs) => [
        ...msgs,
        { sender: "bot", text: data.response || "Sorry, I didn't get that." },
      ]);
    } catch (err) {
      setMessages((msgs) => [
        ...msgs,
        { sender: "bot", text: "Sorry, there was an error connecting to the chatbot." },
      ]);
    }
    setLoading(false);
  };

  return (
    <>
      {!open && (
        <button
          style={styles.chatButton}
          onClick={() => setOpen(true)}
          aria-label="Open chatbot"
        >
          💬
        </button>
      )}
      {open && (
        <div style={styles.chatWindow}>
          <div style={styles.header}>
            Hobjob AI Chatbot
            <button style={styles.closeBtn} onClick={() => setOpen(false)} aria-label="Close chatbot">
              ×
            </button>
          </div>
          <div style={styles.messages}>
            {messages.map((msg, idx) => (
              <div
                key={idx}
                style={{
                  ...styles.message,
                  ...(msg.sender === "user" ? styles.userMsg : styles.botMsg),
                }}
              >
                <div
                  style={{
                    ...styles.msgText,
                    ...(msg.sender === "user" ? styles.userText : styles.botText),
                  }}
                >
                  {msg.text}
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>
          <form style={styles.inputArea} onSubmit={handleSend}>
            <input
              style={styles.input}
              type="text"
              placeholder="Type your question..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              disabled={loading}
              autoFocus
            />
            <button
              type="submit"
              style={{
                ...styles.sendBtn,
                ...(loading ? styles.sendBtnDisabled : {}),
              }}
              disabled={loading}
            >
              Send
            </button>
          </form>
        </div>
      )}
    </>
  );
}
