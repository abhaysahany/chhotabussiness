import api from './axios';

/**
 * Fetch all payout requests and records from MySQL database
 */
export const getAllPayouts = async (params = {}) => {
  try {
    const res = await api.get('/admin/payouts', { params });
    if (res.data?.status === 'success') {
      return res.data.payouts || [];
    }
    return [];
  } catch (error) {
    console.error('Error fetching payouts from backend API:', error);
    throw error;
  }
};


/**
 * Approve and disburse payout with bank UTR reference
 */
export const approveAndDisbursePayout = async (id, payload) => {
  try {
    const res = await api.post(`/admin/payouts/${id}/disburse`, {
      utr_number: payload.utrNumber || payload.utr_number,
      payment_method: payload.paymentMethod || payload.payment_method,
      admin_notes: payload.adminNotes || payload.admin_notes,
    });
    return res.data;
  } catch (error) {
    console.error('Error disbursing payout:', error);
    throw error;
  }
};

/**
 * Reject payout request and refund commission to user wallet
 */
export const rejectPayout = async (id, reason) => {
  try {
    const res = await api.post(`/admin/payouts/${id}/reject`, {
      reason: reason,
    });
    return res.data;
  } catch (error) {
    console.error('Error rejecting payout:', error);
    throw error;
  }
};

/**
 * Trigger weekly automated payout generation for verified users with balance > ₹500
 */
export const generateWeeklyPayoutBatch = async () => {
  try {
    const res = await api.post('/admin/payouts/generate-weekly');
    return res.data;
  } catch (error) {
    console.error('Error generating weekly payout batch:', error);
    throw error;
  }
};

/**
 * Fetch payout intelligence and summary metrics from backend
 */
export const getPayoutStats = async () => {
  try {
    const res = await api.get('/admin/payouts/stats');
    if (res.data?.status === 'success') {
      return res.data.stats;
    }
    return null;
  } catch (error) {
    console.error('Error fetching payout stats:', error);
    return null;
  }
};

