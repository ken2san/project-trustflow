import React, { useState, useRef, useLayoutEffect } from "react";
import HoldButton from "../components/ui/HoldButton";
import ToastContainer from "../components/ui/ToastContainer";

import ContractView from "./ContractView";

const initialMessages = [
  { sender: "client", text: "Thank you for your interest. Our initial budget is ¥3,000,000 for the full design system.", time: "09:00" },
  { sender: "me", text: "Thank you. Can you clarify the scope for dark mode and atomic design compliance?", time: "09:02" },
  { sender: "client", text: "Dark mode should cover all screens. Atomic design compliance is required for component structure.", time: "09:05", important: true },
];



export default function NegotiationChatView({ messages, setMessages, agreed, setAgreed, onBack }) {
    // Export chat as text file
    const handleExportChat = () => {
      const lines = messages.map(msg => {
        const sender = msg.sender === 'me' ? 'You' : 'Client';
        return `[${msg.time}] ${sender}: ${msg.text}`;
      });
      const blob = new Blob([lines.join('\n')], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'negotiation_chat.txt';
      document.body.appendChild(a);
      a.click();
      setTimeout(() => {
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      }, 100);
    };
  const [input, setInput] = useState("");
  const [toasts, setToasts] = useState([]);
  // Removed isProcessing for unified immediate transition UX
  const chatEndRef = useRef(null);
  const textareaRef = useRef(null);

  // Auto-scroll to bottom on messages or input change
  useLayoutEffect(() => {
    if (chatEndRef.current) {
      chatEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, input]);

  // Auto-expand textarea height
  useLayoutEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = textareaRef.current.scrollHeight + 'px';
    }
  }, [input]);

  const handleSend = (e) => {
    if (e) e.preventDefault();
    if (!input.trim()) return;
    setMessages([...messages, { sender: "me", text: input, time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) }]);
    setInput("");
  };

  const handleAgreement = () => {
    setAgreed(true);
    setToasts(prev => [...prev, { id: Date.now(), title: "Agreement Formed", message: "Acceptance Protocol initiated.", type: "success" }]);
    if (typeof onBack === 'function') {
      onBack('scoping', messages);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-950 to-slate-900 flex flex-col items-center justify-center p-0">
      <div className="w-full max-w-2xl h-[80vh] bg-white/5 rounded-3xl shadow-2xl flex flex-col overflow-hidden">
        <div className="flex items-center justify-between p-6 border-b border-white/10 bg-indigo-900/80">
          <h2 className="text-xl font-black text-white tracking-tight">Negotiation Stream</h2>
          <button onClick={onBack} className="text-slate-400 hover:text-white font-bold" aria-label="Back to Detail">Back</button>
        </div>
        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4 bg-transparent" aria-live="polite">
          {messages.map((msg, idx) => (
            <div key={idx} className={`flex ${msg.sender === "me" ? "justify-end" : "justify-start"}`}>
              <div className={`max-w-[70%] px-4 py-2 rounded-2xl shadow-md text-sm ${msg.sender === "me" ? "bg-indigo-600 text-white" : "bg-white/80 text-indigo-900"}`} tabIndex={0} aria-label={`Message from ${msg.sender === "me" ? "You" : "Client"}`}>
                <div className="flex items-center gap-2">
                  <span className="font-bold">{msg.sender === "me" ? "You" : "Client"}</span>
                  <span className="text-xs text-slate-400">{msg.time}</span>
                </div>
                <div>{msg.text}</div>
              </div>
            </div>
          ))}
          <div ref={chatEndRef} />
        </div>
        {/* Export Chat button above input, visually lighter */}
        <div className="flex justify-end px-6 mt-2 mb-1">
          <button
            onClick={handleExportChat}
            className="text-xs px-4 py-2 rounded-full border border-indigo-400/30 bg-white/10 text-indigo-300 font-bold shadow-sm hover:bg-indigo-500/10 hover:text-white transition-all focus:outline-none focus:ring-2 focus:ring-indigo-400/40"
            style={{ minWidth: 120, letterSpacing: '0.02em' }}
            title="Export chat as text file"
            aria-label="Export chat"
            type="button"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="inline w-4 h-4 mr-2 text-indigo-300 align-text-bottom" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v2a2 2 0 002 2h12a2 2 0 002-2v-2M7 10l5 5 5-5M12 4v12" /></svg>
            Export Chat
          </button>
        </div>
        {!agreed && (
          <form onSubmit={handleSend} className="p-6 border-t border-white/10 bg-indigo-900/80 flex gap-3" aria-label="Send message form">
            <textarea
              ref={textareaRef}
              className="flex-1 resize-none rounded-xl px-4 py-2 bg-white/90 text-indigo-900 font-medium focus:outline-none focus:ring-2 focus:ring-indigo-400 min-h-[44px] max-h-32 overflow-auto"
              value={input}
              onChange={e => setInput(e.target.value)}
              placeholder="Type your message..."
              rows={1}
              style={{ minHeight: 44, maxHeight: 160 }}
              onInput={e => {
                if (textareaRef.current) {
                  textareaRef.current.style.height = 'auto';
                  textareaRef.current.style.height = textareaRef.current.scrollHeight + 'px';
                }
              }}
              onKeyDown={e => {
                if ((e.metaKey || e.ctrlKey) && e.key === "Enter") handleSend(e);
              }}
              aria-label="Chat message input"
            />
            <button type="submit" className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold px-6 py-2 rounded-xl shadow" aria-label="Send message">Send</button>
          </form>
        )}
        {!agreed && (
          <div className="flex flex-col items-center justify-end p-4">
            <HoldButton
              onClick={handleAgreement}
              label="Initiate Contract"
              className="mx-auto px-8 py-3 rounded-full text-base font-semibold shadow bg-[#5b5bf6] text-white hover:bg-[#4636c6] transition-all min-w-[0] font-sans"
              color="white"
              disabled={agreed}
            />
            <span className="text-xs text-slate-400 mt-2">Press and hold to confirm</span>
          </div>
        )}
      </div>
      <ToastContainer toasts={toasts} removeToast={id => setToasts(prev => prev.filter(t => t.id !== id))} />
    </div>
  );
}
