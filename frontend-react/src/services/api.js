// frontend-react/src/services/api.js
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000/api';

async function request(endpoint, options = {}) {
  const url = `${API_BASE_URL}${endpoint}`;
  try {
    const res = await fetch(url, {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    });
    if (!res.ok) {
      const errBody = await res.json().catch(() => ({}));
      throw new Error(errBody.detail || `HTTP Error ${res.status}: ${res.statusText}`);
    }
    return await res.json();
  } catch (err) {
    console.error(`API Error on ${endpoint}:`, err);
    throw err;
  }
}

// 1. Portfolio
export const getPortfolioSummary = () => request('/portfolio/summary');
export const getPortfolioCategories = () => request('/portfolio/categories');
export const getPortfolioPersonas = () => request('/portfolio/personas');

// 2. Customers
export const getCustomersList = (params = {}) => {
  const q = new URLSearchParams(params).toString();
  return request(`/customers/?${q}`);
};
export const searchCustomers = (query) => request(`/customers/search?q=${encodeURIComponent(query)}`);
export const getCustomer360 = (userId) => request(`/customers/${userId}/360`);
export const getCustomerCards = (userId) => request(`/customers/${userId}/cards`);
export const getCustomerTransactions = (userId, params = {}) => {
  const q = new URLSearchParams(params).toString();
  return request(`/customers/${userId}/transactions?${q}`);
};

// 3. Segments
export const getSegmentsList = () => request('/segments/');
export const getSegmentDetail = (clusterId) => request(`/segments/${clusterId}`);
export const getSegmentCustomers = (clusterId, params = {}) => {
  const q = new URLSearchParams(params).toString();
  return request(`/segments/${clusterId}/customers?${q}`);
};

// 4. Commercial Card Catalog & Benchmarks
export const getCommercialCatalog = (params = {}) => {
  const q = new URLSearchParams(params).toString();
  return request(`/cards/similarity/catalog?${q}`);
};
export const getCardSubstitutes = (cardId) => request(`/cards/similarity/substitutes/${cardId}`);
export const compareTwoCards = (card1Id, card2Id) =>
  request(`/cards/similarity/compare?card1_id=${card1Id}&card2_id=${card2Id}`);

export const getSimilarityWeights = (group = '') => {
  const q = group ? `?group=${encodeURIComponent(group)}` : '';
  return request(`/cards/similarity/weights${q}`);
};
export const getSimilarityCorrelations = () => request('/cards/similarity/correlations');
export const getSimilarityMatches = (params = {}) => {
  const q = new URLSearchParams(params).toString();
  return request(`/cards/similarity/consumer-commercial?${q}`);
};
export const getCommercialCardVector = (cardId) => request(`/cards/similarity/catalog/${cardId}`);

// 5. Recommendations
export const getRecommendationsOverview = () => request('/recommendations/overview');
export const getUserRecommendations = (userId) => request(`/recommendations/user/${userId}`);
export const simulateRecommendations = (payload) =>
  request('/recommendations/simulate', {
    method: 'POST',
    body: JSON.stringify(payload),
  });

// 6. Fraud & Risk
export const getFraudOverview = () => request('/fraud/overview');
export const getFraudTimeline = () => request('/fraud/timeline');

// 7. AI Explainability
export const generateCustomerAIInsight = (userId) =>
  request('/insights/customer-360', {
    method: 'POST',
    body: JSON.stringify({ user_id: userId }),
  });
export const generatePortfolioAIInsight = () =>
  request('/insights/portfolio', {
    method: 'POST',
  });
