import React, { useState } from "react";
import InitiateContractButton from "../components/ui/InitiateContractButton";
import ModalDialog from "../components/ui/ModalDialog";
import { Loader2 } from "lucide-react";
import ToastContainer from "../components/ui/ToastContainer";
import NegotiationChatView from "./NegotiationChatView";
import ProfileModal from "../components/modals/ProfileModal";

// ProjectDetailView: Dashboard for project specs and negotiation stream

// Accepts chatLocked prop to control chat lock state from protocol logic
const ProjectDetailView = ({ project, negotiationHistory = [], onAgreement, onBack, onOpenChat, messages = [], agreed = false, chatLocked = false, acceptanceProtocol = [] }) => {
  const [toasts, setToasts] = useState([]);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);


  const handleAgreement = () => {
    if (agreed) return;
    setShowConfirmModal(true);
  };

  const handleConfirmContract = () => {
    setShowConfirmModal(false);
    setToasts(prev => [...prev, { id: Date.now(), title: "Agreement Formed", message: "Contract flow initiated.", type: "success" }]);
    if (onAgreement) onAgreement();
  };

  return (
    <>
      <div className="max-w-3xl mx-auto p-8 space-y-12 animate-fade-in-up">
        <ToastContainer toasts={toasts} removeToast={id => setToasts(prev => prev.filter(t => t.id !== id))} />
        {/* Section: Project Specs & Contract Terms */}
        <div>
          <h2 className="text-2xl font-black text-white mb-6">Project Overview</h2>
          <div className="bg-indigo-900/60 rounded-2xl p-6 border border-indigo-500/20 shadow-xl space-y-6">
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
            {/* Trust info and tags */}
            <div className="flex flex-wrap items-center gap-6 mb-4">
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
              <div className="flex flex-wrap gap-2 ml-auto">
                {project.skills?.map((skill, idx) => (
                  <span key={idx} className="px-2 py-1 rounded-full bg-indigo-800 text-indigo-200 text-[10px] font-bold uppercase tracking-widest">{skill}</span>
                ))}
              </div>
            </div>
            <div className="mb-2 text-indigo-200 font-semibold">{project.description}</div>
            {/* Contract Terms Section */}
            <div className="mt-6 p-6 rounded-2xl bg-slate-900/80 border border-indigo-700/40 shadow-inner">
              <h3 className="text-lg font-black text-indigo-300 mb-4 flex items-center gap-2">
                <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm0 10c-4.41 0-8-1.79-8-4V6c0-2.21 3.59-4 8-4s8 1.79 8 4v8c0 2.21-3.59 4-8 4z" /></svg>
                Contract Terms
              </h3>
              <div className="flex flex-col md:flex-row gap-8">
                {/* Total Contract Value */}
                <div className="flex-1 flex flex-col items-start justify-center mb-4 md:mb-0">
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Total Contract Value</span>
                  <span className="flex flex-wrap items-baseline gap-x-2 gap-y-1 w-full">
                    <span className="text-3xl font-black text-white break-words">
                      {(project.budget || project.totalPoints || '—').toString().replace(/[^\d,\.]/g, '')}
                    </span>
                    <span className="text-base font-bold text-indigo-400 ml-1 whitespace-nowrap">TrustPoints</span>
                  </span>
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-3 block">Deadline</span>
                  <span className="text-lg font-bold text-indigo-200">{project.deadline || '—'}</span>
                </div>
                {/* Acceptance Protocol */}
                <div className="flex-1">
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1 block">Acceptance Protocol</span>
                  <ul className="space-y-2 mt-2">
                    {(acceptanceProtocol || []).map((term, idx) => (
                      <li key={idx} className="flex items-start gap-2 p-2 bg-indigo-950/60 rounded-lg border border-indigo-800/40 text-slate-200 text-sm font-bold">
                        <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 text-emerald-400 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                        {term}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>
        <hr className="border-white/10 my-8" />
        {/* Section: Negotiation Stream */}
        <div>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6 gap-4">
            <h3 className="text-lg font-black text-indigo-400">Negotiation Stream</h3>
            <button
              style={{ minWidth: 120 }}
              onClick={onOpenChat}
              disabled={chatLocked}
              title={chatLocked ? "Contract is locked. Chat is unavailable." : "Open Full Chat"}
              className={`px-4 py-2 rounded-full border border-indigo-400/30 bg-white/10 text-indigo-300 text-xs font-bold shadow-sm hover:bg-indigo-500/10 hover:text-white transition-all focus:outline-none focus:ring-2 focus:ring-indigo-400/40 disabled:opacity-40 disabled:cursor-not-allowed`}
            >
              <span className="flex items-center gap-1">
                <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8h2a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2v-8a2 2 0 012-2h2" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 3h-6a2 2 0 00-2 2v4a2 2 0 002 2h6a2 2 0 002-2V5a2 2 0 00-2-2z" /></svg>
                Open Full Chat
              </span>
            </button>
          </div>
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
                  </div>
                  {msg.sender === "me" ? (
                    <div className="w-7 h-7 rounded-full bg-gradient-to-tr from-emerald-500 to-indigo-500 flex items-center justify-center text-white font-bold text-xs shrink-0">Me</div>
                  ) : null}
                </div>
              ))}
            </div>
          </div>
        </div>
        <hr className="border-white/10 my-8" />
        {/* Section: Actions */}
        <div className="flex justify-between items-center mt-8">
          <div className="flex flex-col items-center w-full gap-6 md:flex-row md:items-center md:justify-between mt-4">
            <button
              onClick={onBack}
              className="flex items-center gap-3 text-slate-500 font-black text-xs hover:text-white transition-colors uppercase tracking-[0.2em] group pl-2 justify-center"
              title="Return to Marketplace"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
              Back to Marketplace
            </button>
            <div className="flex flex-col items-center w-full">
              {/* Initiate Contract button: only enabled if not agreed */}
              <button
                className="mt-6 px-8 py-3 rounded-full bg-white text-indigo-900 font-black text-lg shadow-xl border border-white/20 hover:bg-indigo-100 disabled:opacity-40 disabled:cursor-not-allowed"
                disabled={agreed}
                onClick={handleAgreement}
                title={agreed ? 'Contract already initiated' : 'Initiate Contract'}
              >
                Initiate Contract
              </button>
            </div>
          </div>
        </div>
      </div>
      {/* Contract Confirmation Modal */}
      <ModalDialog
        open={showConfirmModal}
        onClose={() => setShowConfirmModal(false)}
        title="Confirm Contract Details"
        actions={[
          <button key="cancel" onClick={() => setShowConfirmModal(false)} className="px-4 py-2 rounded-full bg-indigo-900 text-indigo-300 font-bold border border-indigo-400/30 hover:bg-indigo-800 transition-all">Cancel</button>,
          <button key="confirm" onClick={handleConfirmContract} className="px-4 py-2 rounded-full bg-indigo-600 text-white font-bold border border-indigo-400/30 hover:bg-indigo-700 transition-all">Confirm</button>
        ]}
      >
        <div className="mb-4">
          <h4 className="font-bold text-indigo-300 mb-2">Acceptance Protocol</h4>
          <ul className="space-y-2 mt-2">
            {(acceptanceProtocol || []).map((term, idx) => (
              <li key={idx} className="flex items-start gap-2 p-2 bg-indigo-950/60 rounded-lg border border-indigo-800/40 text-slate-200 text-sm font-bold">
                <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 text-emerald-400 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                {term}
              </li>
            ))}
          </ul>
          <style>{`
            @keyframes pop-in {
              0% { transform: scale(0.95) translateY(20px); opacity: 0; }
              100% { transform: scale(1) translateY(0); opacity: 1; }
            }
            .animate-pop-in { animation: pop-in 0.3s cubic-bezier(0.4,0,0.2,1); }
          `}</style>
        </div>
        <div className="mb-2">
          <h4 className="font-bold text-indigo-300 mb-2">Total Contract Value</h4>
          <div className="text-2xl font-black text-white">{project.budget || project.totalPoints || '—'}</div>
        </div>
      </ModalDialog>

      {/* Modal rendered outside main container for correct overlay */}
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
    </>
  );
}
export default ProjectDetailView;
