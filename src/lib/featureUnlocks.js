// Level-based feature unlock list
export const FEATURE_UNLOCKS = [
  {
    level: 1,
    features: [
      { key: 'profile', label: 'Profile View & Edit' },
      { key: 'contract', label: 'Contract Creation & Orders' },
      { key: 'wallet', label: 'Basic Wallet Functions' },
    ],
  },
  {
    level: 2,
    features: [
      { key: 'chat', label: 'Chat & Messaging' },
      { key: 'aiSuggest', label: 'AI Suggestions (Project/Contract)' },
    ],
  },
  {
    level: 3,
    features: [
      { key: 'analytics', label: 'Advanced Analytics & Reports' },
      { key: 'badges', label: 'Badges & Skill Endorsements' },
    ],
  },
  {
    level: 4,
    features: [
      { key: 'theme', label: 'Custom UI Themes' },
      { key: 'community', label: 'Community Access & Referrals' },
      { key: 'aiNegotiation', label: 'Advanced AI Negotiation' },
    ],
  },
  {
    level: 5,
    features: [
      { key: 'exclusiveBadge', label: 'Exclusive Badges & Titles' },
      { key: 'trustAnalysis', label: 'Advanced Trust Score Analysis' },
      { key: 'apiIntegration', label: 'API & External Integrations' },
    ],
  },
];
