import React, { useState } from "react";
import { Loader2 } from "lucide-react";
import ToastContainer from "../components/ui/ToastContainer";
import ProfileModal from "../components/modals/ProfileModal";

// ProjectDetailView: Dashboard for project specs and negotiation stream
const ProjectDetailView = ({ project, negotiationHistory = [], onAgreement, onBack }) => {
  const [input, setInput] = useState("");
  // Sample negotiation messages for realism
  const initialMessages = [
    { sender: "client", text: "Thank you for your interest. Our initial budget is ¥3,000,000 for the full design system.", time: "09:00" },
    { sender: "me", text: "Thank you. Can you clarify the scope for dark mode and atomic design compliance?", time: "09:02" },
    { sender: "client", text: "Dark mode should cover all screens. Atomic design compliance is required for component structure.", time: "09:05", important: true },
  ];
  const [messages, setMessages] = useState(negotiationHistory && negotiationHistory.length > 0 ? negotiationHistory : initialMessages);
  const [loading, setLoading] = useState(false);
  const [toasts, setToasts] = useState([]);
  const [agreed, setAgreed] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);

  const handleSend = () => {
    if (!input.trim()) return;
    setMessages([...messages, { sender: "me", text: input, time: new Date().toLocaleTimeString() }]);
    setInput("");
  };

  const handleAgreement = () => {
    setLoading(true);
    setTimeout(() => {
      setAgreed(true);
      setLoading(false);
      setToasts(prev => [...prev, { id: Date.now(), title: "Agreement Formed", message: "Contract flow initiated.", type: "success" }]);
      if (onAgreement) onAgreement();
    }, 1200);
  };

  return (
    <div className="max-w-3xl mx-auto p-8 space-y-12 animate-fade-in-up">
        <ToastContainer toasts={toasts} removeToast={id => setToasts(prev => prev.filter(t => t.id !== id))} />
      {/* Section: Project Specs */}
      <div>
        <h2 className="text-2xl font-black text-white mb-6">Project Overview</h2>
        <div className="bg-indigo-900/60 rounded-2xl p-6 border border-indigo-500/20 shadow-xl">
          <div className="flex items-center mb-4 gap-4">
            {/* Client avatar placeholder */}
            <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-indigo-500 to-violet-500 flex items-center justify-center text-white font-bold text-lg">
              {project.client ? project.client[0] : "?"}
            </div>
            <div className="flex-1">
              <span className="text-xl font-bold text-indigo-300">{project.title}</span>
              <span className="ml-3 text-xs font-bold text-slate-500 uppercase">{project.client}</span>
            </div>
            {/* Project status badge */}
            <span className="px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-400 text-xs font-bold">Active</span>
          </div>
          {/* Streamlined client trust info */}
          <div className="flex items-center gap-6 mb-4">
            <div className="flex items-center gap-2 text-xs text-slate-400">
              <span className="font-bold text-indigo-300">Reliability:</span>
              <span className="text-emerald-400 font-bold">99%</span>
            </div>
            <div className="flex items-center gap-2 text-xs text-slate-400">
              <span className="font-bold text-indigo-300">Completed Jobs:</span>
              <span className="text-indigo-200 font-bold">42</span>
            </div>
            <button
              className="text-xs text-indigo-400 underline hover:text-indigo-300 font-bold"
              onClick={() => setIsProfileOpen(true)}
            >View Client Profile</button>
          </div>
          <div className="mb-2 text-indigo-200 font-semibold">{project.description}</div>
          {/* Project tags */}
          <div className="flex flex-wrap gap-2 mb-4">
            {project.skills?.map((skill, idx) => (
              <span key={idx} className="px-2 py-1 rounded-full bg-indigo-800 text-indigo-200 text-[10px] font-bold uppercase tracking-widest">{skill}</span>
            ))}
          </div>
          {/* Timeline visualization */}
          <div className="flex flex-wrap items-center gap-4 mt-4">
            <div className="text-xs text-slate-400">Budget: <span className="font-bold text-indigo-300">{project.budget}</span></div>
            <div className="text-xs text-slate-400">Deadline: <span className="font-bold text-indigo-300">{project.deadline}</span></div>
            {/* Responsive progress bar for timeline */}
            <div className="flex items-center gap-2 min-w-0 w-full max-w-xs">
              <span className="text-[10px] text-slate-500 whitespace-nowrap">Timeline</span>
              <div className="flex-1 min-w-0">
                <div className="w-full h-2 bg-indigo-800 rounded-full overflow-hidden">
                  <div className="h-2 bg-emerald-400 rounded-full" style={{ width: '60%' }}></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      <hr className="border-white/10 my-8" />
      {/* Section: Negotiation Stream */}
      <div>
        <h3 className="text-lg font-black text-indigo-400 mb-6">Negotiation Stream</h3>
        <div className="bg-white/[0.02] rounded-2xl p-6 border border-white/10 shadow-lg">
          <div className="h-48 overflow-y-auto mb-4 space-y-3">
            {messages.map((msg, idx) => (
              <div key={idx} className={`flex ${msg.sender === "me" ? "justify-end" : "justify-start"} items-start gap-2`}>
                {/* Avatar for sender */}
                {msg.sender === "me" ? null : (
                  <div className="w-7 h-7 rounded-full bg-gradient-to-tr from-indigo-500 to-violet-500 flex items-center justify-center text-white font-bold text-xs shrink-0">C</div>
                )}
                <div className={`max-w-[70%] p-3 rounded-xl text-xs font-medium ${msg.sender === "me" ? "bg-indigo-600 text-white" : "bg-indigo-900/30 text-indigo-200 border border-indigo-500/30"}`}
                  style={msg.important ? { border: '2px solid #38bdf8', boxShadow: '0 0 8px #38bdf8' } : {}}>
                  {msg.text}
                  <span className="block text-[9px] opacity-50 mt-1 text-right">{msg.time}</span>
                  {/* Quick actions for negotiation messages */}
                  {msg.sender !== "me" && idx === messages.length - 1 && !agreed && (
                    <div className="flex flex-wrap gap-2 mt-2 w-full max-w-xs">
                      <button className="px-2 py-1 rounded bg-emerald-500 text-white text-[10px] font-bold hover:bg-emerald-600 transition-all flex-shrink" onClick={handleAgreement}>Accept</button>
                      <button className="px-2 py-1 rounded bg-indigo-500 text-white text-[10px] font-bold hover:bg-indigo-600 transition-all flex-shrink">Counter</button>
                      <button className="px-2 py-1 rounded bg-rose-500 text-white text-[10px] font-bold hover:bg-rose-600 transition-all flex-shrink">Reject</button>
                    </div>
                  )}
                </div>
                {msg.sender === "me" ? (
                  <div className="w-7 h-7 rounded-full bg-gradient-to-tr from-emerald-500 to-indigo-500 flex items-center justify-center text-white font-bold text-xs shrink-0">Me</div>
                ) : null}
              </div>
            ))}
          </div>
          <div className="flex gap-2">
            <input
              type="text"
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => {
                if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
                  e.preventDefault();
                  if (input.trim()) {
                    setMessages([...messages, { sender: "me", text: input, time: new Date().toLocaleTimeString() }]);
                    setInput("");
                  }
                }
              }}
              placeholder="Type your negotiation message..."
              className="flex-1 px-3 py-2 rounded-xl bg-indigo-950/70 border border-indigo-800/40 text-white text-sm"
            />
            <button
              onClick={handleSend}
              className="px-4 py-2 rounded-xl bg-indigo-500 text-white font-bold text-xs hover:bg-indigo-600 transition-all"
              title="Send (Ctrl+Enter)"
            >Send</button>
          </div>
        </div>
      </div>
      <hr className="border-white/10 my-8" />
      {/* Section: Actions */}
      <div className="flex justify-between items-center mt-8">
        <div className="flex flex-col items-end w-full md:w-auto md:flex-row md:items-center md:justify-between gap-6">
          <button
            onClick={onBack}
            className="flex items-center gap-3 text-slate-500 font-black text-xs hover:text-white transition-colors uppercase tracking-[0.2em] group pl-2"
            title="Return to Marketplace"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
            Back to Marketplace
          </button>
          <div className="flex flex-col items-center">
            <button
              className={`px-8 py-4 rounded-full font-black text-lg transition-all shadow-xl ${agreed ? "bg-emerald-500 text-white" : "bg-indigo-500 text-white hover:bg-indigo-600"}`}
              onClick={handleAgreement}
              disabled={agreed || loading}
              title={agreed ? "Agreement already formed" : "Start contract protocol"}
            >
              {loading ? <Loader2 className="w-6 h-6 animate-spin mx-auto" /> : (agreed ? "Agreement Formed" : "Initiate Protocol")}
            </button>
            {!agreed && (
              <span className="mt-3 text-sm text-slate-400 font-medium text-center">Initiate contract flow after negotiation is complete.<br className="hidden md:block" /> Please review all terms before proceeding.</span>
            )}
          </div>
        </div>
      </div>
      {isProfileOpen && (
        <ProfileModal
          isOpen={isProfileOpen}
          onClose={() => setIsProfileOpen(false)}
          profile={{
            name: project.client,
            role: "Client",
            location: "Tokyo, Japan",
            joined: "2024",
            level: "42",
            reliability: 99,
            completedJobs: 42
          }}
          addToast={() => {}}
        />
      )}
    </div>
  );
};

export default ProjectDetailView;
