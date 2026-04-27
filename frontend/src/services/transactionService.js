import api from "@/lib/api";

/**
 * Transaction API service using real backend endpoints
 */
export const transactions = {
  /**
   * Get all transactions for the authenticated user
   * @param {Object} params - Filter parameters
   * @param {string} params.category - Filter by category
   * @param {string} params.startDate - Start date (YYYY-MM-DD)
   * @param {string} params.endDate - End date (YYYY-MM-DD)
   * @param {string} params.status - Filter by status
   * @param {string} params.sort - Sort order
   * @param {string} params.subscriptionId - Filter by specific subscription
   * @returns {Promise} Promise resolving to transaction data
   */
  getAll: async (params = {}) => {
    return api.get("/transactions", { params });
  },

  /**
   * Get a single transaction by ID
   * @param {string} id - Transaction ID
   * @returns {Promise} Promise resolving to transaction data
   */
  getById: async (id) => {
    return api.get(`/transactions/${id}`);
  },

  /**
   * Get transactions for a specific subscription
   * @param {string} subscriptionId - Subscription ID
   * @returns {Promise} Promise resolving to transaction data
   */
  getBySubscription: async (subscriptionId) => {
    return api.get("/transactions", { params: { subscriptionId } });
  },
};
