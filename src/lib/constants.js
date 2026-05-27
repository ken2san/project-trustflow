// filepath: src/lib/constants.js
// Centralized constants and mock data for TrustFlow

export const USER_PROFILE = {
  id: 999, name: "Felix", role: "Product Designer", location: "Tokyo, Japan", joined: "2024", level: "42",
  skills: ['Figma', 'React', 'Design Systems'], capacity: '40%', reliability: 99, completedJobs: 42,
  avatarUrl: null
};

export const JOBS_DATA = [
  {
    id: 3,
    type: 'job',
    title: "Icon Set Redesign",
    client: "Indie Studio",
    totalPoints: 30000,
    aiScore: 87,
    matchReason: "Good entry-level match. Ideal first contract.",
    description: "Redesign 24 app icons in a consistent flat style. Source files in Figma. SVG + PNG exports required.",
    budget: "300,000",
    skills: ["Figma", "Icon Design", "SVG"],
    deadline: "2026-04-01",
    acceptanceCriteria: ["24 Icons Delivered", "Figma Source File", "SVG + PNG Exports"]
  },
  {
    id: 1,
    type: 'job',
    title: "Mobile App Design System",
    client: "Neo-Digital Inc.",
    totalPoints: 300000,
    aiScore: 98,
    matchReason: "85% skill overlap. Optimal budget.",
    description: "Design a scalable mobile app UI system for Neo-Digital Inc. Includes Figma library, dark mode, and atomic design compliance.",
    budget: "3,000,000",
    skills: ["Figma", "React", "Design Systems", "UX"],
    deadline: "2026-03-15",
    acceptanceCriteria: ["Definitive Figma Library", "Dark Mode Tokens", "Atomic Design Compliance"]
  },
  {
    id: 2,
    type: 'job',
    title: "AI Chatbot UI Kit",
    client: "Future Labs",
    totalPoints: 150000,
    aiScore: 94,
    matchReason: "High efficiency potential.",
    description: "Create a UI kit for AI chatbot products. Must meet WCAG 2.1, include 12 screens, and motion JSON assets.",
    budget: "1,500,000",
    skills: ["Accessibility", "Motion Design", "React", "Lottie"],
    deadline: "2026-02-28",
    acceptanceCriteria: ["WCAG 2.1 Compliance", "12 Screen Layouts", "Motion JSON"]
  }
];

export const TALENTS_DATA = [
  { id: 101, type: 'talent', name: "Sarah K.", role: "Senior React Architect", rate: 85000, aiScore: 99, matchReason: "Direct experience with Fintech dashboards similar to your requirements. 5-star rating on last 3 contracts.", location: "Berlin, Germany", joined: "2023", level: "58", totalPoints: 425000, acceptanceCriteria: ["React Native Codebase", "Stripe Integration", "Biometric Auth Flow"] },
  { id: 102, type: 'talent', name: "David L.", role: "Lead Motion Designer", rate: 72000, aiScore: 92, matchReason: "Portfolio includes award-winning interaction designs for banking apps. High velocity output.", location: "Toronto, Canada", joined: "2022", level: "45", totalPoints: 216000, acceptanceCriteria: ["Lottie Animations", "Micro-interactions", "60fps Performance"] }
];

export const TRANSACTIONS_DATA = [
  { id: 'TX-991', title: 'Logo Animation', type: 'in', points: 45000, date: '2026.02.05' },
  { id: 'TX-988', title: 'UI Audit Service', type: 'in', points: 120000, date: '2026.01.28' },
  { id: 'TX-982', title: 'Network Fee', type: 'out', points: 5000, date: '2026.01.20' }
];

export const STEPS_DATA = [
  { id: 1, label: 'PROTOCOL' },
  { id: 2, label: 'ESCROW' },
  { id: 3, label: 'INSPECT' },
  { id: 4, label: 'RATING' }
];

// Feature #7: Progressive Trust Ladder — contract limits by TrustPoints level (amounts in JPY)
export const TRUST_LADDER = [
  { level: 1,  label: 'Newcomer',    contractLimit: 100_000 },   // ¥100k
  { level: 3,  label: 'Established', contractLimit: 500_000 },   // ¥500k
  { level: 5,  label: 'Trusted',     contractLimit: 2_000_000 }, // ¥2M
  { level: 10, label: 'Elite Node',  contractLimit: null },      // unlimited
];

// TrustPoints earn thresholds for Trust Ladder level advancement
export const TRUST_LADDER_THRESHOLDS = [
  { level: 1,  minPoints: 0 },
  { level: 3,  minPoints: 150 },
  { level: 5,  minPoints: 400 },
  { level: 10, minPoints: 1000 },
];
