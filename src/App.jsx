import NegotiationChatView from './views/NegotiationChatView';

/**
 * @typedef {Object} UIProfileStats
 * @property {number} trustScore
 * @property {number} level
 * @property {number} exp
 * @property {number} completedContracts
 * @property {number} avgRating
 * @property {Array<string>} badges
 * @property {Object.<string, number>} skillEndorsements
 * @property {number} repeatClients
 * @property {number} totalEarned
 * @property {number} totalSpent
 * @property {number} points
 * @property {string} responseSpeed
 * @property {boolean} verified
 * @property {string} location
 * @property {string} joinDate
 */

/**
 * @typedef {Object} InternalProfileStats
 * @property {Array<{
 *   type: string,
 *   value: number,
 *   rating: number,
 *   date: string,
 *   partnerId: string,
 *   feedback: string,
 *   contractId: string
 * }>} recentHistory
 * @property {Array<{
 *   comment: string,
 *   rating: number,
 *   date: string,
 *   partnerId: string
 * }>} feedbackComments
 * @property {Array<{
 *   field: string,
 *   oldValue: any,
 *   newValue: any,
 *   date: string
 * }>} profileChangeLog
 * @property {string} joinDate
 * @property {string} lastActive
 * @property {Array<{
 *   id: string,
 *   type: string,
 *   connectedAt: string
 * }>} networkGraph
 */


import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { initialUIProfileStats, initialInternalProfileStats } from './lib/profileInitialData';
import { FEATURE_UNLOCKS } from './lib/featureUnlocks';
import {
  ShieldCheck, ArrowRight, Lock, Unlock, CheckCircle2, AlertCircle,
  MessageSquare, Wallet, Coins, PlusCircle, Search, Sparkles, Zap,
  ArrowLeft, ListChecks, Activity, TrendingUp, Globe, Award,
  BadgeCheck, UploadCloud, X, Send, Paperclip, Fingerprint, Scale,
  BrainCircuit, Target, UserCheck, LayoutGrid, Bell, CreditCard,
  Loader2, Check, MousePointer2, FileSignature, Scan, Hash,
  RefreshCw, QrCode, Briefcase, Users, ChevronRight, User, Gavel, AlertTriangle,
  Command, Laptop, Wand2, MapPin, Calendar, Share2, Hexagon, BarChart4, Star,
  Layers
} from 'lucide-react';
// Returns a unified profile object merging static and dynamic user data
// (moved below imports)

// Centralized constants and mock data
import { USER_PROFILE, JOBS_DATA, TALENTS_DATA, TRANSACTIONS_DATA, STEPS_DATA } from './lib/constants';
import { formatNumber } from './lib/utils';
import { sha256, buildDodCanonical } from './lib/crypto.js';
import { logEvent, EVENT_TYPES, fetchContractEvents, subscribeToContractEvents } from './lib/eventLog.js';
import { loadRuntimeSnapshot, saveRuntimeSnapshot } from './lib/runtimeState.js';
import { ensureActorIdentity } from './lib/identity.js';


// ...existing code...


/* ========================================================================
   2. CUSTOM HOOKS
   ======================================================================== */


// useInterval moved to hooks/useInterval.js
import useInterval from './hooks/useInterval';

/* ========================================================================
   3. UI COMPONENTS (ATOMS & MOLECULES)
   ======================================================================== */

// NeuralBackground moved to components/ui/NeuralBackground.jsx
import NeuralBackground from './components/ui/NeuralBackground';

// SpotlightCard moved to components/ui/SpotlightCard.jsx
import SpotlightCard from './components/ui/SpotlightCard';

// HoldButton moved to components/ui/HoldButton.jsx
import HoldButton from './components/ui/HoldButton';


// ScrambleText moved to components/ui/ScrambleText.jsx
import ScrambleText from './components/ui/ScrambleText';


// ToastContainer moved to components/ui/ToastContainer.jsx
import ToastContainer from './components/ui/ToastContainer';


/* ========================================================================
   4. FEATURE MODALS
   ======================================================================== */


// ProfileModal moved to components/modals/ProfileModal.jsx
import ProfileModal from './components/modals/ProfileModal';

// CommandPalette component for command modal
import CommandPalette from './components/ui/CommandPalette.jsx';




// DisputeModal moved to components/modals/DisputeModal.jsx
import DisputeModal from './components/modals/DisputeModal';


// PaymentModal moved to components/modals/PaymentModal.jsx
import PaymentModal from './components/modals/PaymentModal';



// --- Page Views ---

// OnboardingView moved to views/OnboardingView.jsx
import OnboardingView from './views/OnboardingView';

// MarketplaceView moved to views/MarketplaceView.jsx
import MarketplaceView from './views/MarketplaceView';

// ScopingView moved to views/ScopingView.jsx
import ScopingView from './views/ScopingView';

// ContractView moved to views/ContractView.jsx
import ContractView from './views/ContractView';

// WalletView moved to views/WalletView.jsx
import WalletView from './views/WalletView';

// CommandCenterView moved to views/CommandCenterView.jsx
import CommandCenterView from './views/CommandCenterView';

// ProjectDetailView moved to views/ProjectDetailView.jsx
import ProjectDetailView from './views/ProjectDetailView';

// InviteView for counterparty invite link flow
import InviteView from './views/InviteView';

// --- Main App Component ---

const App = () => {
  // Centralized Acceptance Protocol state (DoD/terms)
  const [acceptanceProtocol, setAcceptanceProtocol] = useState([
    'Definitive Figma Library',
    'Dark Mode Tokens',
    'Atomic Design Compliance'
  ]);
  // Centralized chat lock state
  const [chatLocked, setChatLocked] = useState(false);
    // Negotiation chat state (shared for evidence/dispute)
    const [negotiationMessages, setNegotiationMessages] = useState([
      { sender: "client", text: "Thank you for your interest. Our initial budget is 3,000,000 for the full design system.", time: "09:00" },
      { sender: "me", text: "Thank you. Can you clarify the scope for dark mode and atomic design compliance?", time: "09:02" },
      { sender: "client", text: "Dark mode should cover all screens. Atomic design compliance is required for component structure.", time: "09:05", important: true },
    ]);
    const [negotiationAgreed, setNegotiationAgreed] = useState(false);
  // Animation state for level/parameter up
  const [showLevelUp, setShowLevelUp] = useState(false);
  const [showParamUp, setShowParamUp] = useState(false);

  // Animation triggers
  const triggerLevelUp = useCallback(() => {
    setShowLevelUp(true);
    setTimeout(() => setShowLevelUp(false), 1800);
  }, []);
  const triggerParamUp = useCallback(() => {
    setShowParamUp(true);
    setTimeout(() => setShowParamUp(false), 1200);
  }, []);

  const [mode, setMode] = useState('earner');
  // Detect invite link params on mount; set initial view accordingly
  const [inviteData] = useState(() => {
    const params = new URLSearchParams(window.location.search);
    if (!params.has('invite')) return null;
    return {
      contractId: params.get('cid') || '',
      inviter: params.get('inviter') || 'Someone',
      project: params.get('project') || 'A Project',
      amount: parseInt(params.get('amount'), 10) || 0,
      dod: params.get('dod') ? params.get('dod').split(',').map(s => s.trim()).filter(Boolean) : [],
    };
  });
  const [view, setView] = useState(() =>
    new URLSearchParams(window.location.search).has('invite') ? 'invite' : 'marketplace'
  );
  const [step, setStep] = useState(1);

  // UI profile state
  const [uiProfile, setUIProfile] = useState(initialUIProfileStats);
  // Internal profile state
  const [internalProfile, setInternalProfile] = useState(initialInternalProfileStats);

  // --- Feature Unlock Progress State ---
  // Option 1: Just use level from uiProfile, but allow for future extensibility
  const userLevel = uiProfile.level || 1;
  // Compute unlocked features (flattened array of feature keys)
  const unlockedFeatures = FEATURE_UNLOCKS
    .filter(fu => fu.level <= userLevel)
    .flatMap(fu => fu.features.map(f => f.key));
  // Compute locked features (flattened array of {key, label, level})
  const lockedFeatures = FEATURE_UNLOCKS
    .filter(fu => fu.level > userLevel)
    .flatMap(fu => fu.features.map(f => ({ ...f, level: fu.level })));

  // Returns a minimal AI-ready user profile payload
  // Returns only internal profile data for AI extraction
  const getAIProfilePayload = useCallback(() => {
    return { ...internalProfile };
  }, [internalProfile]);
  const [selectedItem, setSelectedItem] = useState(null);
  const [status, setStatus] = useState('idle');
  // Add projectDetail state for Project Detail & Negotiation flow
  const [projectDetail, setProjectDetail] = useState(null);
  const lastActionTime = useRef(0); // Safety guard for global transitions

  const [isChatOpen, setIsChatOpen] = useState(false);
  const [isCommandOpen, setIsCommandOpen] = useState(false);
  const [toasts, setToasts] = useState([]);
  const [scrambleTrigger, setScrambleTrigger] = useState(0);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [isBiometricOpen, setIsBiometricOpen] = useState(false);
  const [isDisputeOpen, setIsDisputeOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [profileData, setProfileData] = useState(null);
  const [activityLog, setActivityLog] = useState([]);
  const [showActivityLog, setShowActivityLog] = useState(false);
  // Phase 4: append-only contract event log (persisted to Supabase when connected)
  const [contractEvents, setContractEvents] = useState([]);
  const [dodHash, setDodHash] = useState(null);
  // Phase 4: permanent bad-actor flags — persist across contract cycles
  const [badActorFlags, setBadActorFlags] = useState([]);
  const [contractHistory, setContractHistory] = useState([]);
  const [isRehire, setIsRehire] = useState(false);
  const [hasOnboarded, setHasOnboarded] = useState(() => {
    if (new URLSearchParams(window.location.search).has('reset')) {
      localStorage.removeItem('tf_onboarded');
      return false;
    }
    return !!localStorage.getItem('tf_onboarded');
  });
  const [showBYOCForm, setShowBYOCForm] = useState(false);
  const [byocForm, setByocForm] = useState({ name: '', description: '', amount: '', dod: '' });
  const [byocContractId, setByocContractId] = useState('');
  const [inviteLink, setInviteLink] = useState(null);
  const [inviteLinkCopied, setInviteLinkCopied] = useState(false);
  const [isRuntimeHydrated, setIsRuntimeHydrated] = useState(false);
  const [actorId, setActorId] = useState('user');

  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const [isFlipped, setIsFlipped] = useState(false);

  const [messages, setMessages] = useState([{ id: 1, sender: 'ai', text: 'Protocol initialized. DoD generated based on risk profile.', time: '10:00', type: 'text' }, { id: 2, sender: 'client', text: 'Looking forward to the design system!', time: '10:05', type: 'text' }]);
  const [inputText, setInputText] = useState('');
  const [projectPrompt, setProjectPrompt] = useState('');
  const [aiSuggestions, setAiSuggestions] = useState(null);
  const chatEndRef = useRef(null);

  useEffect(() => { const handleKeyDown = (e) => { if ((e.metaKey || e.ctrlKey) && e.key === 'k') { e.preventDefault(); setIsCommandOpen(prev => !prev); } }; window.addEventListener('keydown', handleKeyDown); return () => window.removeEventListener('keydown', handleKeyDown); }, []);

  useEffect(() => {
    let alive = true;

    const hydrate = async () => {
      const identity = await ensureActorIdentity();
      if (alive && identity?.actorId) setActorId(identity.actorId);

      const snapshot = await loadRuntimeSnapshot(identity?.actorId);
      if (!alive) return;

      if (snapshot) {
        if (typeof snapshot.hasOnboarded === 'boolean') setHasOnboarded(snapshot.hasOnboarded);
        if (typeof snapshot.mode === 'string') setMode(snapshot.mode);
        if (typeof snapshot.view === 'string') setView(snapshot.view);
        if (typeof snapshot.step === 'number') setStep(snapshot.step);
        if (snapshot.selectedItem) setSelectedItem(snapshot.selectedItem);
        if (snapshot.uiProfile) setUIProfile(snapshot.uiProfile);
        if (snapshot.internalProfile) setInternalProfile(snapshot.internalProfile);
        if (Array.isArray(snapshot.acceptanceProtocol)) setAcceptanceProtocol(snapshot.acceptanceProtocol);
        if (Array.isArray(snapshot.badActorFlags)) setBadActorFlags(snapshot.badActorFlags);
        if (snapshot.byocForm) setByocForm(snapshot.byocForm);
        if (Array.isArray(snapshot.contractHistory)) setContractHistory(snapshot.contractHistory);
      }

      setIsRuntimeHydrated(true);
    };

    hydrate();

    return () => {
      alive = false;
    };
  }, []);

  useEffect(() => {
    const contractId = String(selectedItem?.id ?? '');
    if (!contractId || contractId === 'mock') return;

    let cancelled = false;
    const mergeEvents = incoming => {
      setContractEvents(prev => {
        const map = new Map(prev.map(e => [e.id, e]));
        incoming.forEach(e => map.set(e.id, e));
        return Array.from(map.values()).sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
      });
    };

    const load = async () => {
      const remote = await fetchContractEvents(contractId);
      if (cancelled || remote.length === 0) return;
      mergeEvents(remote);
      const initiated = remote.find(e => e.type === EVENT_TYPES.CONTRACT_INITIATED);
      if (initiated?.dod_hash) setDodHash(prev => prev || initiated.dod_hash);
    };

    load();
    const unsubscribe = subscribeToContractEvents(contractId, ev => {
      if (!ev?.id) return;
      mergeEvents([ev]);

      // Step sync: apply state changes from counterparty events.
      // Skip own events — local state was already updated when we wrote them.
      if (ev.actor_id === actorId) return;

      const STEP_MAP = {
        [EVENT_TYPES.CONTRACT_ACCEPTED]: 2,
        [EVENT_TYPES.WORK_SUBMITTED]:    3,
        [EVENT_TYPES.WORK_APPROVED]:     4,
        [EVENT_TYPES.PAYMENT_RELEASED]:  5,
        [EVENT_TYPES.CONTRACT_COMPLETED]: 5,
      };

      const targetStep = STEP_MAP[ev.type];
      if (targetStep) {
        setStep(prev => (prev < targetStep ? targetStep : prev));
        addToast('Contract Updated', 'Your counterparty advanced the contract.', 'info');
      }

      if (ev.type === EVENT_TYPES.CONTRACT_CANCELLED) {
        addToast('Contract Cancelled', 'Your counterparty has cancelled this contract.', 'warning');
        setView('marketplace');
        setSelectedItem(null);
        setStep(1);
        setContractEvents([]);
      }

      if (ev.type === EVENT_TYPES.DISPUTE_OPENED || ev.type === EVENT_TYPES.DISPUTE_RESOLVED) {
        addToast('Dispute Update', `Dispute ${ev.type === EVENT_TYPES.DISPUTE_OPENED ? 'opened' : 'resolved'} by counterparty.`, 'warning');
      }
    });

    return () => {
      cancelled = true;
      unsubscribe();
    };
  }, [selectedItem?.id]);

  useEffect(() => {
    if (!isRuntimeHydrated) return;

    const timer = setTimeout(() => {
      saveRuntimeSnapshot({
        hasOnboarded,
        mode,
        view,
        step,
        selectedItem,
        uiProfile,
        internalProfile,
        acceptanceProtocol,
        badActorFlags,
        byocForm,
        contractHistory,
      }, actorId);
    }, 900);

    return () => clearTimeout(timer);
  }, [
    isRuntimeHydrated,
    hasOnboarded,
    mode,
    view,
    step,
    selectedItem,
    uiProfile,
    internalProfile,
    acceptanceProtocol,
    badActorFlags,
    byocForm,
    contractHistory,
  ]);



  const addToast = useCallback((title, message, type = 'info') => { const id = Date.now(); setToasts(prev => [...prev, { id, title, message, type }]); setActivityLog(prev => [{ id, title, message, type, timestamp: new Date() }, ...prev].slice(0, 50)); setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 4000); }, []);

  const toggleMode = () => {
    if (status !== 'idle') return;
    setStatus('switching');
    setTimeout(() => {
        setMode(prev => { const newMode = prev === 'earner' ? 'hirer' : 'earner'; setView('marketplace'); return newMode; });
        setSelectedItem(null);
        setAiSuggestions(null);
        setProjectPrompt('');
        setStatus('idle');
        addToast('Mode Switched', `Active Interface: ${mode === 'earner' ? 'Client (Hirer)' : 'Professional (Earner)'}`);
    }, 800);
  };

  const handleSelect = (item) => { setSelectedItem(item); setIsProfileOpen(false); setView('scoping'); };
  // Always show the current unified profile for the main user
  const handleViewProfile = (data) => {
    if (data && data.id === USER_PROFILE.id) {
      setProfileData(unifiedProfile);
    } else {
      setProfileData(data);
    }
    setIsProfileOpen(true);
  };
  const handleAIArchitectSubmit = () => {
    setStatus('processing');
    setTimeout(() => {
      const tokens = (projectPrompt.match(/(?:[A-Z][a-zA-Z]+|[a-z]{5,})/g) || [])
        .filter((w, i, a) => a.indexOf(w) === i)
        .slice(0, 4);
      const dod = tokens.length >= 2
        ? tokens.map(t => t.charAt(0).toUpperCase() + t.slice(1) + ' — delivered and approved by both parties')
        : ['Deliverable matches the agreed scope', 'Reviewed and signed off by both parties', 'No unresolved objections at handoff'];
      setAiSuggestions({
        summary: 'Criteria extracted from your description. Review each item before locking terms.',
        dod,
        budget: 'Confirm budget before proceeding.',
        candidates: TALENTS_DATA,
      });
      setStatus('idle');
    }, 1500);
  };
  // BiometricModal removed: go directly to contract view
  const initiateContract = async () => {
    setView('contract');
    setStep(1);
    addToast('Contract Initiated', 'Contract flow started.');
    if (selectedItem) {
      const dodText = selectedItem.acceptanceCriteria?.join('\n') ?? selectedItem.title ?? '';
      const canonical = buildDodCanonical({
        dodText,
        hirerId: mode === 'hirer' ? 'user' : String(selectedItem.id),
        earnerId: mode === 'earner' ? 'user' : String(selectedItem.id),
        budgetPoints: String(selectedItem.totalPoints ?? 0),
        deadline: selectedItem.deadline ?? 'TBD',
      });
      const hash = await sha256(canonical);
      setDodHash(hash);
      const event = await logEvent({
        type: EVENT_TYPES.CONTRACT_INITIATED,
        contractId: String(selectedItem.id ?? 'mock-' + Date.now()),
        actorId,
        payload: { title: selectedItem.title, budgetPoints: selectedItem.totalPoints },
        dodHash: hash,
      });
      setContractEvents(prev => [event, ...prev]);
    }
  };

  const handleNextStep = useCallback(() => {
    const now = Date.now();
    // Guard: Prevent double execution within 1.5 seconds
    if (now - lastActionTime.current < 1500) return;

    lastActionTime.current = now;
    setStatus('processing');

    setTimeout(async () => {
      // Logic execution
      if (step === 2) {
        if (mode === 'hirer') setUIProfile(s => ({ ...s, points: (s.points ?? 0) - selectedItem.totalPoints, totalSpent: (s.totalSpent ?? 0) + selectedItem.totalPoints }));
        else setUIProfile(s => ({ ...s, points: (s.points ?? 0) + selectedItem.totalPoints }));
      }

      // Phase 4: log step transition events
      const contractId = String(selectedItem?.id ?? 'mock');
      if (step === 1) {
        const ev = await logEvent({ type: EVENT_TYPES.CONTRACT_ACCEPTED, contractId, actorId, payload: { step: 1 } });
        setContractEvents(prev => [ev, ...prev]);
      } else if (step === 4) {
        const ev = await logEvent({ type: EVENT_TYPES.WORK_APPROVED, contractId, actorId, payload: { step: 4 } });
        setContractEvents(prev => [ev, ...prev]);
        // Trust Passport: record contract completion
        setUIProfile(s => {
          const newCompleted = (s.completedContracts ?? 0) + 1;
          const newLevel = newCompleted >= 10 ? 10 : newCompleted >= 5 ? 5 : newCompleted >= 3 ? 3 : 1;
          return {
            ...s,
            completedContracts: newCompleted,
            exp: (s.exp ?? 0) + 500,
            trustScore: Math.min(1000, (s.trustScore ?? 0) + 5),
            level: newLevel,
            totalEarned: mode === 'earner' ? (s.totalEarned ?? 0) + (selectedItem?.totalPoints ?? 0) : (s.totalEarned ?? 0),
          };
        });
        triggerLevelUp();
      }

      // Navigation
      // (negotiationMessages and negotiationAgreed state are now at the top level)
      if (step === 5) {
          // Log contract completion before resetting
          const ev = await logEvent({ type: EVENT_TYPES.CONTRACT_COMPLETED, contractId, actorId, payload: {} });
          setContractEvents(prev => [ev, ...prev]);
          setContractHistory(prev => [{
            id: contractId,
            title: selectedItem?.title ?? 'Contract',
            client: selectedItem?.client ?? '—',
            date: new Date().toISOString().slice(0, 10).replace(/-/g, '.'),
            earned: mode === 'earner' ? (selectedItem?.totalPoints ?? 0) : 0,
            rating: uiProfile.avgRating ?? '—',
          }, ...prev]);
          // Reset everything for next cycle
          setView('marketplace');
          setSelectedItem(null);
          setStep(1);
          setDodHash(null);
          setContractEvents([]);
          setIsUploading(false);
          setUploadProgress(0);
          setStatus('idle');
          return;
      }

      setStep(prev => prev + 1);
      setStatus('idle');
    }, 1200);
  }, [step, mode, selectedItem, status, actorId]);

  const handleReject = () => {
    setStep(2);
    addToast('Re-delivery Requested', 'The hirer has requested a revised submission.', 'warning');
  };
  const handleOpenDispute = () => { setIsDisputeOpen(true); };
  const handleRehire = React.useCallback(() => {
    // Carry over negotiated DoD (acceptanceProtocol) into the re-hire item
    setSelectedItem(prev => prev
      ? { ...prev, acceptanceCriteria: acceptanceProtocol.length > 0 ? [...acceptanceProtocol] : prev.acceptanceCriteria }
      : prev
    );
    // Reset stale contract state so new contract starts clean
    setDodHash(null);
    setContractEvents([]);
    setIsRehire(true);
    setStep(1);
    setView('scoping');
    addToast('Re-hire Template Ready', 'DoD and amount pre-filled from your last contract.', 'info');
  }, [acceptanceProtocol, addToast]);

  const handleContractCancel = React.useCallback(({ reason }) => {
    setContractHistory(prev => [{
      id: 'cancelled-' + Date.now(),
      title: selectedItem?.title ?? 'Contract',
      client: selectedItem?.client ?? '—',
      date: new Date().toISOString().slice(0, 10).replace(/-/g, '.'),
      earned: 0,
      rating: '—',
    }, ...prev]);
  }, [selectedItem]);

  const handleDisputeResolve = async ({ winner, arbiter, reason } = {}) => {
    setIsDisputeOpen(false);
    const contractId = String(selectedItem?.id ?? 'mock');
    const isPending = winner === 'pending';
    const currentUserWins = !isPending && winner === mode;

    if (isPending) {
      addToast('Arbitration Submitted', `${arbiter === 'human' ? 'Human arbiter' : 'Peer panel'} assigned — ruling expected within ${arbiter === 'human' ? '24–48h' : '48–72h'}.`, 'info');
    } else if (currentUserWins) {
      addToast('Dispute Won', 'Arbitration ruled in your favor. Proceeding to settlement.', 'success');
    } else {
      addToast('Dispute Lost', 'Arbitration ruled against you. Stake partially forfeited.', 'error');
      setUIProfile(s => ({ ...s, trustScore: Math.max(0, (s.trustScore ?? 0) - 10) }));
      setBadActorFlags(prev => [...prev, {
        type: EVENT_TYPES.DISPUTE_LOST,
        label: 'Dispute Lost',
        contractId,
        date: new Date().toISOString(),
      }]);
    }

    const ev = await logEvent({
      type: currentUserWins ? EVENT_TYPES.DISPUTE_WON : EVENT_TYPES.DISPUTE_LOST,
      contractId,
      actorId,
      payload: { winner, arbiter, reason, resolvedAt: new Date().toISOString() },
    });
    setContractEvents(prev => [ev, ...prev]);
    // Advance to blind rating phase — both parties rate each other after any dispute resolution
    setStep(4);
  };

  const handleFileUpload = () => {
      if (isUploading) return;
      setIsUploading(true);
      let progress = 0;
      const interval = setInterval(() => {
          progress += 5;
          setUploadProgress(progress);
          if (progress >= 100) {
              clearInterval(interval);
              setIsUploading(false);
              setUploadProgress(0);
              // Directly call handleNextStep logic here to avoid race conditions with button state
              setStatus('processing');
              setTimeout(async () => {
                  // Phase 4: log work submitted event
                  const ev = await logEvent({
                    type: EVENT_TYPES.WORK_SUBMITTED,
                    contractId: String(selectedItem?.id ?? 'mock'),
                    actorId,
                    payload: { step: 3 },
                  });
                  setContractEvents(prev => [ev, ...prev]);
                  setStep(prev => prev + 1);
                  setStatus('idle');
                  addToast('Upload Complete', 'AI Inspection initiated.');
              }, 1200);
          }
      }, 80);
  };
  const handleDeposit = () => { setIsPaymentModalOpen(false); setStatus('processing'); setTimeout(() => { setUIProfile(s => ({ ...s, points: (s.points ?? 0) + 100000 })); setStatus('idle'); addToast('Deposit Successful', '100,000 PTS added to Vault.', 'success'); }, 1000); };

  const handleOnboardingComplete = useCallback(() => {
    localStorage.setItem('tf_onboarded', '1');
    setHasOnboarded(true);
  }, []);

  const handleBYOCStart = useCallback(() => {
    setByocContractId(crypto.randomUUID());
    setShowBYOCForm(true);
  }, []);

  const handleBYOCSubmit = useCallback(() => {
    const item = {
      id: byocContractId || ('byoc-' + Date.now()),
      title: byocForm.description || 'Custom Engagement',
      client: byocForm.name || 'Direct Counterparty',
      totalPoints: parseInt(byocForm.amount, 10) || 0,
      acceptanceCriteria: byocForm.dod
        ? byocForm.dod.split('\n').map(s => s.trim()).filter(Boolean)
        : [],
    };
    setSelectedItem(item);
    setShowBYOCForm(false);
    setByocForm({ name: '', description: '', amount: '', dod: '' });
    setByocContractId('');
    setInviteLink(null);
    setInviteLinkCopied(false);
    setView('scoping');
    addToast('Agreement Started', 'Define your scope below.');
  }, [byocForm, addToast, byocContractId]);

  const handleGenerateInvite = useCallback(() => {
    const base = window.location.origin + window.location.pathname;
    const params = new URLSearchParams({
      invite: '1',
      cid: byocContractId || crypto.randomUUID(),
      inviter: USER_PROFILE.name,
      project: byocForm.description || 'Project',
      amount: byocForm.amount || '0',
      dod: byocForm.dod
        ? byocForm.dod.split('\n').map(s => s.trim()).filter(Boolean).join(',')
        : '',
    });
    setInviteLink(`${base}?${params.toString()}`);
  }, [byocForm, byocContractId]);

  const triggerSmartContractUpdate = () => { const userMsg = { id: Date.now(), sender: 'me', text: 'Additional requirements for dark mode have come up. Can we increase the budget?', time: 'Now', type: 'text' }; setMessages(prev => [...prev, userMsg]); setTimeout(() => { const aiProposal = { id: Date.now() + 1, sender: 'ai', type: 'contract_update', data: { title: 'Scope Expansion Detected', changes: ['Add: Dark Mode Variants (+12 Screens)', 'Timeline: +2 Days'], additionalCost: 50000, newTotal: selectedItem ? selectedItem.totalPoints + 50000 : 50000 }, time: 'Now' }; setMessages(prev => [...prev, aiProposal]); }, 1500); };
  const acceptContractUpdate = (updateData) => { if (selectedItem) { setSelectedItem(prev => ({ ...prev, totalPoints: updateData.newTotal, acceptanceCriteria: [...prev.acceptanceCriteria, "Dark Mode Variants Completed"] })); } setScrambleTrigger(prev => prev + 1); setMessages(prev => [...prev, { id: Date.now(), sender: 'system', text: `Contract updated. Budget increased by ${formatNumber(updateData.additionalCost)} PTS.`, time: 'Now', type: 'text' }]); addToast('Smart Contract Updated', 'New budget locked in escrow.', 'success'); };
  const handleSendMessage = () => { if (!inputText.trim()) return; setMessages([...messages, { id: Date.now(), sender: 'me', text: inputText, time: 'Now', type: 'text' }]); setInputText(''); setTimeout(() => { setMessages(prev => [...prev, { id: Date.now()+1, sender: 'ai', text: 'Context updated. Evidence logged.', time: 'Now', type: 'text' }]); }, 1000); };
  useEffect(() => { if (isChatOpen && chatEndRef.current) { chatEndRef.current.scrollIntoView({ behavior: "smooth" }); } }, [messages, isChatOpen]);

  const commands = useMemo(() => [
      { id: 'home', label: 'Go to Marketplace', icon: LayoutGrid, action: () => setView('marketplace') },
      { id: 'wallet', label: 'Open Wallet', icon: Wallet, action: () => setView('wallet') },
      { id: 'command-center', label: 'Open Command Center', icon: Layers, action: () => setView('command-center') },
      { id: 'profile', label: 'View Trust Passport', icon: User, action: () => handleViewProfile(USER_PROFILE) },
      { id: 'switch', label: `Switch to ${mode === 'earner' ? 'Hirer' : 'Earner'} Mode`, icon: RefreshCw, action: toggleMode },
      { id: 'chat', label: 'Toggle Chat', icon: MessageSquare, action: () => setIsChatOpen(prev => !prev) },
  ], [mode]);

  const activeOperations = useMemo(() => {
    if (!selectedItem || step < 1 || step > 4) return [];
    const PHASES = ['', 'COMMITMENT', 'IN ESCROW', 'INSPECTION', 'RATING'];
    const PROGRESS = [0, 20, 40, 60, 80];
    const NEXT_ACTIONS = ['', 'Lock contract terms', 'Submit deliverables', 'Awaiting hirer review', 'Submit rating'];
    return [{
      id: selectedItem.id,
      phase: PHASES[step] || 'ACTIVE',
      title: selectedItem.title || 'Active Contract',
      client: selectedItem.client || '—',
      progress: PROGRESS[step] || 0,
      nextAction: NEXT_ACTIONS[step] || '—',
    }];
  }, [selectedItem, step]);

  // Strategy level (Conservative / Normal / Aggressive)
  const [strategy, setStrategy] = useState('Balanced');



  // Returns a unified profile object merging static and dynamic user data
  const getUnifiedProfile = useCallback(() => {
    return {
      ...USER_PROFILE,
      ...uiProfile,
      badActorFlags,
    };
  }, [uiProfile, badActorFlags]);

  // Always use unifiedProfile for profile data
  const unifiedProfile = getUnifiedProfile();

  return (
    <div className="min-h-screen bg-[#020617] text-slate-200 font-sans selection:bg-indigo-500/30 overflow-x-hidden relative">
      <NeuralBackground />

      {!hasOnboarded && <OnboardingView onComplete={handleOnboardingComplete} />}

      <ToastContainer toasts={toasts} removeToast={(id) => setToasts(prev => prev.filter(t => t.id !== id))} />
      <PaymentModal isOpen={isPaymentModalOpen} onClose={() => setIsPaymentModalOpen(false)} onConfirm={handleDeposit} />
      {/* BiometricModal removed for MVP slimdown */}
      <DisputeModal isOpen={isDisputeOpen} onClose={() => setIsDisputeOpen(false)} onResolve={handleDisputeResolve} />
      {isCommandOpen && (
        <>
          {/* Overlay for command palette modal: semi-transparent, blur, background visible */}
          <div className="fixed inset-0 z-[100] bg-[#0a0f1a]/70 backdrop-blur-[6px] transition-opacity" onClick={() => setIsCommandOpen(false)} />
          <div className="fixed inset-0 z-[110] flex items-center justify-center">
            <div className="w-[540px] max-w-full bg-[#23263a] rounded-[36px] shadow-[0_16px_64px_0_rgba(79,70,229,0.55),0_2px_16px_0_rgba(0,0,0,0.25)] border border-indigo-500/30 p-12 flex flex-col items-center">
              <CommandPalette isOpen={true} onClose={() => setIsCommandOpen(false)} commands={commands} />
            </div>
          </div>
        </>
      )}
      <ProfileModal isOpen={isProfileOpen} onClose={() => setIsProfileOpen(false)} profile={profileData} addToast={addToast} />

      {/* Activity Log Panel */}
      {showActivityLog && (
        <div className="fixed top-20 right-6 z-[90] w-80 max-h-[70vh] flex flex-col bg-[#0f172a]/95 backdrop-blur-xl border border-white/10 rounded-[28px] shadow-2xl overflow-hidden animate-fade-in-up">
          <div className="flex items-center justify-between px-6 py-4 border-b border-white/5">
            <div className="flex items-center gap-2"><Activity className="w-4 h-4 text-indigo-400" /><span className="text-sm font-black text-white">Activity Log</span></div>
            <button onClick={() => setShowActivityLog(false)} className="text-slate-500 hover:text-white transition-colors"><X className="w-4 h-4" /></button>
          </div>
          <div className="overflow-y-auto flex-1 p-3 space-y-2">
            {activityLog.length === 0 && <p className="text-xs text-slate-600 text-center py-6 font-bold">No activity yet.</p>}
            {activityLog.map(item => (
              <div key={item.id} className={`px-4 py-3 rounded-2xl border text-xs ${item.type === 'success' ? 'bg-emerald-900/20 border-emerald-500/20' : item.type === 'warning' ? 'bg-amber-900/20 border-amber-500/20' : 'bg-indigo-900/20 border-indigo-500/20'}`}>
                <p className="font-black text-white mb-0.5">{item.title}</p>
                <p className="text-slate-400">{item.message}</p>
                <p className="text-slate-600 mt-1">{item.timestamp.toLocaleTimeString()}</p>
              </div>
            ))}
          </div>
          {activityLog.length > 0 && (
            <div className="px-6 py-3 border-t border-white/5">
              <button onClick={() => setActivityLog([])} className="text-xs text-slate-600 hover:text-slate-400 transition-colors font-bold uppercase tracking-widest">Clear log</button>
            </div>
          )}
        </div>
      )}

      {/* BYOC Form Modal */}
      {showBYOCForm && (
        <div className="fixed inset-0 z-[150] flex items-center justify-center bg-black/60 backdrop-blur-sm px-4" onClick={e => { if (e.target === e.currentTarget) { setShowBYOCForm(false); setInviteLink(null); setInviteLinkCopied(false); } }}>
          <div className="bg-[#0f172a] border border-white/10 rounded-[36px] w-full max-w-md shadow-2xl animate-fade-in-up flex flex-col max-h-[92vh]">
            {/* Header */}
            <div className="flex items-start justify-between px-10 pt-10 pb-2">
              <div>
                <h3 className="text-2xl font-black text-white mb-1">Work with someone you know</h3>
                <p className="text-slate-400 text-sm">Invite them via link, or define the scope yourself.</p>
              </div>
              <button onClick={() => { setShowBYOCForm(false); setByocContractId(''); setInviteLink(null); setInviteLinkCopied(false); }} className="ml-4 mt-1 text-slate-500 hover:text-white transition-colors shrink-0" aria-label="Close">
                <X className="w-5 h-5" />
              </button>
            </div>
            {/* Scrollable body */}
            <div className="overflow-y-auto px-10 py-6 space-y-4 flex-1">
              <div><label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block mb-2">Their name or handle</label><input type="text" value={byocForm.name} onChange={e => setByocForm(f => ({ ...f, name: e.target.value }))} placeholder="e.g., Alex Chen / @alexchen" className="w-full bg-slate-800 border border-white/10 rounded-2xl px-5 py-4 text-white outline-none focus:border-indigo-500/50 transition-all" /></div>
              <div><label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block mb-2">What are you building together?</label><textarea value={byocForm.description} onChange={e => { setByocForm(f => ({ ...f, description: e.target.value })); setInviteLink(null); }} placeholder="e.g., Mobile app redesign — 3 screens, Figma handoff included" className="w-full bg-slate-800 border border-white/10 rounded-2xl px-5 py-4 text-white outline-none focus:border-indigo-500/50 transition-all resize-none min-h-[80px]" /></div>
              <div><label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block mb-2">Contract value (PTS)</label><input type="number" min="0" value={byocForm.amount} onChange={e => { setByocForm(f => ({ ...f, amount: e.target.value })); setInviteLink(null); }} placeholder="e.g., 300000" className="w-full bg-slate-800 border border-white/10 rounded-2xl px-5 py-4 text-white outline-none focus:border-indigo-500/50 transition-all" /></div>
              <div><label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block mb-2">Definition of Done <span className="normal-case font-normal text-slate-600">(one item per line)</span></label><textarea value={byocForm.dod} onChange={e => { setByocForm(f => ({ ...f, dod: e.target.value })); setInviteLink(null); }} placeholder={"Definitive Figma Library\nDark Mode Tokens\nAtomic Design Compliance"} className="w-full bg-slate-800 border border-white/10 rounded-2xl px-5 py-4 text-white outline-none focus:border-indigo-500/50 transition-all resize-none min-h-[90px] font-mono text-sm" /></div>
              {inviteLink && (
                <div className="bg-slate-800/60 border border-indigo-500/30 rounded-2xl px-5 py-4 space-y-3">
                  <p className="text-[10px] font-black text-indigo-400 uppercase tracking-widest">Invite Link — share this</p>
                  <p className="text-xs text-slate-400 break-all font-mono leading-relaxed">{inviteLink}</p>
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(inviteLink);
                      setInviteLinkCopied(true);
                      setTimeout(() => setInviteLinkCopied(false), 2000);
                    }}
                    className={`w-full py-3 rounded-2xl font-black text-sm transition-all ${
                      inviteLinkCopied ? 'bg-emerald-600 text-white' : 'bg-indigo-600 hover:bg-indigo-500 text-white'
                    }`}
                  >
                    {inviteLinkCopied ? '✓ Copied!' : 'Copy Link'}
                  </button>
                </div>
              )}
            </div>
            {/* Sticky footer */}
            <div className="px-10 pb-10 pt-4 border-t border-white/5 flex gap-3">
              <button onClick={handleGenerateInvite} disabled={!byocForm.description.trim()} className="flex-1 py-4 rounded-2xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 text-white font-black transition-all text-sm">
                {inviteLink ? 'Regenerate' : 'Generate Link'}
              </button>
              <button onClick={handleBYOCSubmit} className="flex-1 py-4 rounded-2xl bg-white text-[#020617] font-black hover:bg-indigo-400 hover:text-white transition-all text-sm">Start Myself →</button>
            </div>
          </div>
        </div>
      )}

      {(status === 'processing' || status === 'switching') && (<div className="fixed inset-0 z-[100] bg-[#020617]/90 backdrop-blur-md flex flex-col items-center justify-center"><Loader2 className="w-16 h-16 text-indigo-500 animate-spin mb-6" /><p className="text-indigo-400 font-black tracking-[0.5em] text-[10px] uppercase animate-pulse">{status === 'switching' ? 'Reconfiguring Interface...' : 'Verifying Ledger...'}</p></div>)}

      {/* Header */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-[#020617]/80 backdrop-blur-xl border-b border-white/[0.05] px-6 py-4 flex justify-between items-center transition-all duration-300">
        <div className="flex items-center gap-4 cursor-pointer group" onClick={() => setView('marketplace')}>
          <div className={`w-10 h-10 rounded-2xl flex items-center justify-center shadow-lg transition-colors ${mode === 'earner' ? 'bg-indigo-600' : 'bg-emerald-600'}`}>{mode === 'earner' ? <ShieldCheck className="text-white w-6 h-6" /> : <Briefcase className="text-white w-6 h-6" />}</div>
          <div className="hidden sm:block"><span className="font-black text-xl tracking-tighter text-white block leading-none">TRUSTFLOW</span><span className="text-[9px] font-black text-slate-500 tracking-[0.3em] uppercase">{mode === 'earner' ? 'Professional' : 'Client Suite'}</span></div>
        </div>
        <div onClick={() => setIsCommandOpen(true)} className="hidden md:flex flex-1 max-w-md mx-6 items-center gap-3 bg-white/[0.03] hover:bg-white/[0.06] border border-white/10 px-4 py-2.5 rounded-xl cursor-pointer transition-all group"><Search className="w-4 h-4 text-slate-500 group-hover:text-white transition-colors" /><span className="text-sm text-slate-500 group-hover:text-slate-300 transition-colors">Type a command...</span><div className="ml-auto flex gap-1"><span className="text-[10px] font-mono text-slate-600 bg-white/5 px-1.5 py-0.5 rounded border border-white/5">⌘K</span></div></div>
        <div className="flex gap-4 items-center">
          <button onClick={toggleMode} className="flex items-center gap-2 px-4 py-2 rounded-full border border-white/10 hover:bg-white/5 transition-all"><div className={`w-2 h-2 rounded-full ${mode === 'earner' ? 'bg-indigo-500' : 'bg-emerald-500'}`} /><span className="text-xs font-bold uppercase tracking-wider text-slate-300">Switch to {mode === 'earner' ? 'Hire' : 'Work'}</span><RefreshCw className="w-3 h-3 text-slate-500" /></button>
          {/* Wallet button: only enabled if unlocked */}
          <div className={`hidden sm:flex flex-col items-center gap-1 bg-white/[0.03] px-4 py-2 rounded-full border border-white/5 transition-colors ${unlockedFeatures.includes('wallet') ? 'cursor-pointer hover:bg-white/10' : 'opacity-40 cursor-not-allowed'}`}
            onClick={e => {
              if (unlockedFeatures.includes('wallet')) {
                setView('wallet');
              } else {
                e.preventDefault();
                addToast('Locked', 'Wallet unlocks at Level 1.', 'warning');
              }
            }}
            title={unlockedFeatures.includes('wallet') ? 'Open Wallet' : 'Unlock at Level 1'}>
            <div className="flex items-center gap-3">
              <Coins className="w-3.5 h-3.5 text-amber-500" />
              <span className="font-mono font-bold text-xs">{formatNumber(uiProfile.points ?? 0)}</span>
              {!unlockedFeatures.includes('wallet') && (
                <Lock className="w-4 h-4 text-slate-400 ml-2" />
              )}
            </div>
            {!unlockedFeatures.includes('wallet') && (
              <span className="text-[10px] text-slate-400 mt-1">Unlock Wallet at Level 1</span>
            )}
          </div>
          {/* Command Center icon (PC/tablet only) */}
          <button
            className={`hidden sm:inline-flex p-2 ml-2 rounded-full border border-white/10 transition-colors ${view === 'command-center' ? 'bg-indigo-500/20 text-indigo-400 scale-110 shadow-[0_0_12px_rgba(99,102,241,0.15)]' : 'text-slate-400 hover:text-indigo-300 hover:bg-white/10'}`}
            title="Command Center"
            onClick={() => { setIsProfileOpen(false); setIsCommandOpen(false); setProfileData(null); setView('command-center'); }}
          >
            <Layers className="w-6 h-6" />
          </button>
          <button
            className={`hidden sm:inline-flex p-2 ml-1 rounded-full border border-white/10 transition-colors relative ${showActivityLog ? 'bg-indigo-500/20 text-indigo-400' : 'text-slate-400 hover:text-indigo-300 hover:bg-white/10'}`}
            title="Activity Log"
            onClick={() => setShowActivityLog(prev => !prev)}
          >
            <Activity className="w-5 h-5" />
            {activityLog.length > 0 && <span className="absolute top-1 right-1 w-1.5 h-1.5 bg-indigo-500 rounded-full" />}
          </button>
          <div className="flex items-center gap-3 pl-2 border-l border-white/10">
            {/* Chat button: only enabled if unlocked */}
            <div className="flex flex-col items-center">
              <button
                className={`relative p-2 rounded-full transition-colors group ${userLevel >= 2 ? 'hover:bg-white/5' : 'opacity-40 cursor-not-allowed'}`}
                onClick={e => {
                  if (userLevel >= 2) {
                    setIsChatOpen(true);
                  } else {
                    e.preventDefault();
                    addToast('Locked', 'Chat unlocks at Level 2.', 'warning');
                  }
                }}
                title={userLevel >= 2 ? 'Open Chat' : 'Unlock at Level 2'}
              >
                <Bell className="w-5 h-5 text-slate-400 group-hover:text-white transition-colors" />
                {userLevel < 2 && (
                  <span className="absolute -bottom-2 right-1 z-10 flex items-center">
                    <Lock className="w-4 h-4 text-slate-400 drop-shadow" />
                  </span>
                )}
                <span className="absolute top-2 right-2.5 w-1.5 h-1.5 bg-rose-500 rounded-full ring-2 ring-[#020617]" />
              </button>
              {userLevel < 2 && (
                <span className="text-[10px] text-slate-400 mt-1">Unlock Chat at Level 2</span>
              )}
            </div>
            <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-indigo-500 to-violet-500 p-[1px] cursor-pointer hover:scale-105 transition-transform hidden sm:block" onClick={() => handleViewProfile(USER_PROFILE)}>
              <div className="w-full h-full rounded-full bg-[#020617] flex items-center justify-center overflow-hidden">
                {USER_PROFILE.avatarUrl ? (
                  <img src={USER_PROFILE.avatarUrl} alt={USER_PROFILE.name} className="w-full h-full object-cover" />
                ) : USER_PROFILE.name ? (
                  <span className="w-full h-full flex items-center justify-center text-base font-bold text-indigo-300">{USER_PROFILE.name[0]}</span>
                ) : (
                  <User className="w-5 h-5 text-slate-300" />
                )}
              </div>
            </div>
          </div>
        </div>
      </nav>

      <main className="pt-32 pb-32 max-w-6xl mx-auto px-6 relative z-10">
        {view === 'marketplace' && <MarketplaceView mode={mode} jobs={JOBS_DATA} talents={TALENTS_DATA} onViewDetails={item => { setProjectDetail(item); setView('project-detail'); }} projectPrompt={projectPrompt} setProjectPrompt={setProjectPrompt} handleAIArchitectSubmit={handleAIArchitectSubmit} aiSuggestions={aiSuggestions} scrambleTrigger={scrambleTrigger} formatNumber={formatNumber} onBYOC={handleBYOCStart} onHire={talent => { setSelectedItem(talent); setView('contract'); setStep(1); addToast('Contract Initiated', 'Contract flow started.'); }} />}
        {/* Shared chat state for negotiation stream */}
        {view === 'project-detail' && projectDetail && (
          <ProjectDetailView
            project={projectDetail}
            negotiationHistory={[]}
            onAgreement={() => {
              setSelectedItem(projectDetail);
              setView('contract'); // Jump directly to Commitment Locked (ContractView)
              setStep(1);
              setChatLocked(true); // Lock chat after contract initiation
              addToast('Commitment Locked', 'Contract flow started.');
            }}
            onBack={() => setView('marketplace')}
            onOpenChat={() => setView('negotiation-chat')}
            messages={negotiationMessages}
            agreed={negotiationAgreed}
            setAgreed={setNegotiationAgreed}
            acceptanceProtocol={acceptanceProtocol}
            setAcceptanceProtocol={setAcceptanceProtocol}
            chatLocked={chatLocked}
          />
        )}
        {view === 'negotiation-chat' && (
          <NegotiationChatView
            messages={negotiationMessages}
            setMessages={setNegotiationMessages}
            agreed={negotiationAgreed}
            setAgreed={setNegotiationAgreed}
            acceptanceProtocol={acceptanceProtocol}
            setAcceptanceProtocol={setAcceptanceProtocol}
            chatLocked={chatLocked}
            onBack={(next, evidence) => {
              if (next === 'scoping') {
                // Ensure selectedItem is set from projectDetail if not already
                if (!selectedItem && projectDetail) {
                  setSelectedItem(projectDetail);
                }
                // Optionally, store evidence/messages for later use
                setView('scoping');
              } else {
                setView('project-detail');
              }
            }}
          />
        )}
        {/* ScopingView removed from contract flow. */}
        {view === 'invite' && inviteData && (
          <InviteView
            inviteData={inviteData}
            onAccept={() => {
              const item = {
                id: inviteData.contractId || ('invite-' + Date.now()),
                title: inviteData.project,
                client: inviteData.inviter,
                totalPoints: inviteData.amount,
                acceptanceCriteria: inviteData.dod,
              };
              setSelectedItem(item);
              window.history.replaceState({}, '', window.location.pathname);
              setView('scoping');
              addToast('Invite Accepted', `Welcome to the project with ${inviteData.inviter}.`, 'success');
            }}
            onDecline={() => {
              window.history.replaceState({}, '', window.location.pathname);
              setView('marketplace');
            }}
          />
        )}
        {view === 'scoping' && selectedItem && <ScopingView selectedItem={selectedItem} onBack={() => { setIsRehire(false); setView('marketplace'); setSelectedItem(null); }} onInitiate={() => { setIsRehire(false); initiateContract(); }} scrambleTrigger={scrambleTrigger} formatNumber={formatNumber} isRehire={isRehire} />}
        {view === 'contract' && selectedItem && <ContractView step={step} handleNextStep={handleNextStep} handleReject={handleReject} onOpenDispute={handleOpenDispute} isUploading={isUploading} uploadProgress={uploadProgress} handleFileUpload={handleFileUpload} status={status} formatNumber={formatNumber} userStats={uiProfile} setUserStats={setUIProfile} addToast={addToast} triggerLevelUp={triggerLevelUp} triggerParamUp={triggerParamUp} mode={mode} onRehire={handleRehire} contractEvents={contractEvents} dodHash={dodHash} contractId={String(selectedItem?.id ?? 'mock')} contractAmount={selectedItem?.totalPoints ?? 0} onContractCancel={handleContractCancel} />}
              {/* Global Level Up/Param Up Animation */}
              {showLevelUp && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center pointer-events-none">
                  {/* Overlay background */}
                  <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" />
                  <div className="relative flex flex-col items-center justify-center">
                    <div className="text-5xl font-black text-emerald-400 drop-shadow-[0_4px_32px_rgba(16,185,129,0.7)] animate-pop-scale mb-4 text-center" style={{textShadow:'0 2px 16px #059669, 0 0 2px #fff'}}>LEVEL UP!</div>
                    <div className="text-xl font-bold text-indigo-200 drop-shadow animate-fade-in-up text-center">
                      New ability unlocked: <span className="text-white">Priority Support</span>
                    </div>
                  </div>
                </div>
              )}
              {showParamUp && !showLevelUp && (
                <div className="fixed inset-0 z-[200] flex items-center justify-center pointer-events-none">
                  <div className="text-3xl font-black text-indigo-300 drop-shadow animate-pop-fade">+1 PARAMETER</div>
                </div>
              )}
        {view === 'wallet' && <WalletView onBack={() => setView('marketplace')} isFlipped={isFlipped} setIsFlipped={setIsFlipped} userPoints={uiProfile.points ?? 0} transactions={TRANSACTIONS_DATA} onDeposit={handleDeposit} setIsPaymentModalOpen={setIsPaymentModalOpen} formatNumber={formatNumber} />}
        {view === 'command-center' && (
          <CommandCenterView
            activeOperations={activeOperations}
            missionLogs={contractHistory}
            onOperationClick={op => {
              if (selectedItem && String(op.id) === String(selectedItem.id)) {
                setView('contract');
              } else {
                setSelectedItem(op);
                let stepNum = 1;
                if (op.progress >= 80) stepNum = 4;
                else if (op.progress >= 60) stepNum = 3;
                else if (op.progress >= 40) stepNum = 2;
                setStep(stepNum);
                setView('contract');
              }
            }}
            strategy={strategy}
            onStrategyChange={setStrategy}
            unifiedProfile={unifiedProfile || { level: 1, badges: [], trustScore: 0, avgRating: 0, skillEndorsements: {}, repeatClients: 0, responseSpeed: '', reliability: 0 }}
            onViewProfile={() => {
              setProfileData(unifiedProfile);
              setIsProfileOpen(true);
            }}
            setUIProfile={setUIProfile}
          />
        )}

      </main>

      {/* Floating Chat Overlay */}
      <div className="fixed bottom-24 sm:bottom-6 right-6 z-[60] flex flex-col items-end gap-4">
        {/* Show chat only if unlocked */}
        {isChatOpen && unlockedFeatures.includes('chat') && (
          <div className="w-80 sm:w-96 h-[500px] bg-[#0f172a]/95 backdrop-blur-xl border border-white/10 rounded-[32px] shadow-2xl flex flex-col overflow-hidden animate-fade-in-up">
            <div className="p-6 border-b border-white/5 flex justify-between items-center bg-white/[0.02]"><div className="flex items-center gap-3"><div className="w-10 h-10 bg-indigo-600 rounded-full flex items-center justify-center"><BrainCircuit className="w-5 h-5 text-white" /></div><div><p className="font-black text-white text-sm">Context Chat</p><p className="text-[10px] font-emerald-400 font-bold uppercase tracking-widest">Online</p></div></div><button onClick={() => setIsChatOpen(false)} className="p-2 hover:bg-white/10 rounded-full text-slate-400"><X className="w-5 h-5" /></button></div>
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {messages.map(msg => (
                <div key={msg.id} className={`flex ${msg.sender === 'me' ? 'justify-end' : 'justify-start'}`}>
                  {msg.type === 'contract_update' ? (
                    <div className="max-w-[90%] w-full bg-indigo-900/40 border border-indigo-500/30 p-5 rounded-[24px] rounded-bl-none"><div className="flex items-center gap-2 mb-3 text-indigo-300"><FileSignature className="w-4 h-4" /><span className="text-[10px] font-black uppercase tracking-widest">Smart Contract Proposal</span></div><h4 className="font-bold text-white mb-2">{msg.data.title}</h4><ul className="space-y-1 mb-4">{msg.data.changes.map((change, i) => (<li key={i} className="text-xs text-slate-300 flex items-center gap-2"><div className="w-1 h-1 bg-emerald-400 rounded-full" /> {change}</li>))}</ul><div className="flex justify-between items-end mb-4 pt-3 border-t border-white/10"><span className="text-[10px] font-bold text-slate-500 uppercase">Cost Impact</span><span className="text-lg font-black text-white">+{formatNumber(msg.data.additionalCost)} PTS</span></div><div className="flex gap-2"><button className="flex-1 py-2 bg-white/10 rounded-xl text-xs font-bold text-slate-400 hover:text-white">Reject</button><button onClick={() => acceptContractUpdate(msg.data)} className="flex-1 py-2 bg-indigo-600 rounded-xl text-xs font-bold text-white hover:bg-indigo-500">Accept Update</button></div></div>
                  ) : (<div className={`max-w-[80%] p-4 rounded-2xl text-xs sm:text-sm font-medium leading-relaxed ${msg.sender === 'me' ? 'bg-indigo-600 text-white rounded-br-none' : msg.sender === 'ai' ? 'bg-indigo-900/30 border border-indigo-500/30 text-indigo-200 rounded-bl-none' : 'bg-white/10 text-slate-200 rounded-bl-none'}`}>{msg.sender === 'ai' && <p className="text-[8px] font-black uppercase tracking-widest text-indigo-400 mb-1">AI System Log</p>}{msg.text}<p className="text-[9px] opacity-50 mt-2 text-right">{msg.time}</p></div>)}
                </div>
              ))}
              <div ref={chatEndRef} />
            </div>
            <div className="p-4 border-t border-white/5 bg-[#020617]/50"><button onClick={triggerSmartContractUpdate} className="text-[10px] text-slate-500 hover:text-indigo-400 mb-2 w-full text-center uppercase tracking-widest font-bold opacity-50 hover:opacity-100 transition-opacity">[Dev: Simulate Scope Creep]</button><div className="flex items-center gap-2 bg-white/5 rounded-full px-4 py-2 border border-white/5"><input type="text" value={inputText} onChange={(e) => setInputText(e.target.value)} onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()} placeholder="Type a message..." className="bg-transparent border-none outline-none text-white text-sm flex-1 placeholder:text-slate-500" /><button onClick={handleSendMessage} className="p-2 bg-indigo-600 rounded-full text-white hover:bg-indigo-500"><Send className="w-4 h-4" /></button></div></div>
          </div>
        )}
        <button
          onClick={e => {
            if (userLevel >= 2) {
              setIsChatOpen(!isChatOpen);
            } else {
              e.preventDefault();
              addToast('Locked', 'Chat unlocks at Level 2.', 'warning');
            }
          }}
          className={`w-14 h-14 sm:w-16 sm:h-16 rounded-full flex items-center justify-center shadow-[0_0_30px_rgba(79,70,229,0.5)] transition-transform active:scale-95 relative ${userLevel >= 2 ? 'bg-indigo-600 text-white hover:scale-110' : 'bg-slate-700 text-slate-400 opacity-50 cursor-not-allowed'}`}
          title={userLevel >= 2 ? 'Open Chat' : 'Unlock at Level 2'}
        >
          <span className="relative w-full h-full flex items-center justify-center">
            <MessageSquare className={`w-6 h-6 sm:w-7 sm:h-7 ${userLevel < 2 ? 'text-slate-400 opacity-60' : ''}`} />
            {userLevel < 2 && (
              <Lock className="absolute right-0 bottom-0 w-3 h-3 text-slate-400 z-10" />
            )}
          </span>
        </button>
      </div>

      <nav className="sm:hidden fixed bottom-0 left-0 right-0 bg-[#0F172A]/80 backdrop-blur-2xl border-t border-white/10 px-8 py-5 flex justify-between items-center z-50 shadow-[0_-15px_40px_rgba(0,0,0,0.6)]">
        <button className={`p-3 transition-all duration-300 ${view === 'marketplace' ? 'text-indigo-400 scale-125 bg-indigo-500/10 rounded-2xl shadow-[0_0_20px_rgba(99,102,241,0.2)]' : 'text-slate-500 hover:text-slate-300'}`} onClick={() => { setIsProfileOpen(false); setIsCommandOpen(false); setProfileData(null); setView('marketplace'); }}><LayoutGrid className="w-6 h-6" /></button>
        <button className={`p-3 transition-all duration-300 ${view === 'wallet' ? 'text-indigo-400 scale-125 bg-indigo-500/10 rounded-2xl shadow-[0_0_20px_rgba(99,102,241,0.2)]' : 'text-slate-500 hover:text-slate-300'}`} onClick={() => { setIsProfileOpen(false); setIsCommandOpen(false); setProfileData(null); setView('wallet'); }}><Wallet className="w-6 h-6" /></button>
        {/* Command Center icon (mobile only) */}
        <button className={`p-3 transition-all duration-300 ${view === 'command-center' ? 'text-indigo-400 scale-125 bg-indigo-500/10 rounded-2xl shadow-[0_0_20px_rgba(99,102,241,0.2)]' : 'text-slate-500 hover:text-slate-300'} inline-flex sm:hidden`} onClick={() => { setIsProfileOpen(false); setIsCommandOpen(false); setProfileData(null); setView('command-center'); }}><Layers className="w-6 h-6" /></button>
        <button className="p-3 text-slate-500 inline-flex" onClick={() => { setIsCommandOpen(false); setView('marketplace'); setProfileData(unifiedProfile); setIsProfileOpen(true); }}>
          {/* Avatar icon for mobile bottom bar (same as header) */}
          <span className="block w-6 h-6 rounded-full overflow-hidden border-2 border-indigo-400 bg-slate-800">
            {USER_PROFILE.avatarUrl ? (
              <img src={USER_PROFILE.avatarUrl} alt={USER_PROFILE.name} className="w-full h-full object-cover" />
            ) : USER_PROFILE.name ? (
              <span className="w-full h-full flex items-center justify-center text-xs font-bold text-indigo-300">{USER_PROFILE.name[0]}</span>
            ) : (
              <User className="w-4 h-4 text-slate-400" />
            )}
          </span>
        </button>
      </nav>

      <style>{`
        body { background-color: #020617; margin: 0; }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(24px); } to { opacity: 1; transform: translateY(0); } }
        .animate-fade-in-up { animation: fadeIn 0.8s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
        @keyframes slideInRight { from { opacity: 0; transform: translateX(20px); } to { opacity: 1; transform: translateX(0); } }
        .animate-slide-in-right { animation: slideInRight 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
        @keyframes scaleUp { from { opacity: 0; transform: scale(0.9); } to { opacity: 1; transform: scale(1); } }
        .animate-scale-up { animation: scaleUp 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
        @keyframes fall { to { transform: translateY(100vh) rotate(720deg); } }
        .animate-fall { animation: fall linear forwards; }
        @keyframes scan { 0% { top: 0; opacity: 0; } 10% { opacity: 1; } 90% { opacity: 1; } 100% { top: 100%; opacity: 0; } }
        .animate-scan { animation: scan 3s cubic-bezier(0.4, 0, 0.2, 1) infinite; }
        @keyframes scanVertical { 0% { top: 0; opacity: 0; } 50% { opacity: 1; } 100% { top: 100%; opacity: 0; } }
        .animate-scan-vertical { animation: scanVertical 1.5s linear infinite; }
      `}</style>
    </div>
  );
};

export default App;