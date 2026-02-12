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

// You can import these typedefs via JSDoc or TypeScript for IDE support.
