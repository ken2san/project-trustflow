// Initial values for UIProfileStats
export const initialUIProfileStats = {
  trustScore: 80,
  level: 1,
  exp: 0,
  completedContracts: 0,
  avgRating: 0,
  badges: [],
  skillEndorsements: {},
  repeatClients: 0,
  totalEarned: 0,
  totalSpent: 0,
  points: 0,
  responseSpeed: 'N/A',
  verified: false,
  location: '',
  joinDate: new Date().toISOString(),
};

// Initial values for InternalProfileStats
export const initialInternalProfileStats = {
  recentHistory: [],
  feedbackComments: [],
  profileChangeLog: [],
  joinDate: new Date().toISOString(),
  lastActive: new Date().toISOString(),
  networkGraph: [],
};
