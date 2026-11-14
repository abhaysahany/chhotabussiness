import api from './axios';

/**
 * Fetch all active rewards directly from database catalog
 */
export const getUserRewards = async () => {
  try {
    const res = await api.get('/user/rewards');
    if (res.data?.status === 'success') {
      return res.data.rewards || [];
    }
    return [];
  } catch (err) {
    console.error('Error fetching user rewards from database:', err);
    throw err;
  }
};

/**
 * Fetch reward claims for a user directly from database
 */
export const getUserClaims = async (userCode) => {
  try {
    const res = await api.get('/user/reward-claims', {
      params: { user_code: userCode },
    });
    if (res.data?.status === 'success') {
      return res.data.claims || [];
    }
    return [];
  } catch (err) {
    console.error('Error fetching user claims from database:', err);
    throw err;
  }
};

/**
 * Claim reward using Diamonds - processed and persisted directly in MySQL database
 */
export const claimReward = async (payload) => {
  try {
    const res = await api.post('/user/rewards/claim', payload);
    return res.data;
  } catch (err) {
    console.error('Error claiming reward in database:', err);
    throw err;
  }
};

/**
 * Fetch authenticated user's Diamond Wallet balance & immutable ledger transactions
 * GET /api/user/diamonds
 */
export const getUserDiamondRewards = async () => {
  try {
    const res = await api.get('/user/diamonds');
    if (res.data?.status === 'success') {
      return {
        wallet: res.data.wallet || { diamond_balance: 0, level_1_diamonds: 0, level_2_diamonds: 0, conversion_rate_inr: 100 },
        transactions: res.data.transactions || [],
      };
    }
    return {
      wallet: { diamond_balance: 0, level_1_diamonds: 0, level_2_diamonds: 0, conversion_rate_inr: 100 },
      transactions: [],
    };
  } catch (err) {
    console.error('Error fetching user diamond rewards:', err);
    return {
      wallet: { diamond_balance: 0, level_1_diamonds: 0, level_2_diamonds: 0, conversion_rate_inr: 100 },
      transactions: [],
    };
  }
};

/**
 * Fetch fresh user profile / wallet balance directly from database
 */
export const getUserFreshProfile = async () => {
  try {
    const res = await api.get('/me');
    if (res.data?.status === 'success') {
      return res.data.user;
    }
    return null;
  } catch (err) {
    console.error('Error fetching fresh user profile from database:', err);
    return null;
  }
};

