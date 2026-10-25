import api from './axios';

/**
 * User Payouts Service - MySQL Database Backed
 */
export const getUserPayouts = async (params = {}) => {
  try {
    const res = await api.get('/user/payouts', { params });
    return res.data;
  } catch (error) {
    console.error('Error fetching user payouts from database:', error);
    throw error;
  }
};

export const submitWithdrawalRequest = async (payload) => {
  try {
    const res = await api.post('/user/payouts/withdraw', payload);
    return res.data;
  } catch (error) {
    console.error('Error submitting withdrawal request:', error);
    throw error;
  }
};

// KYC (PAN & Aadhaar only)
export const submitPanAadhaarKyc = async (payload) => {
  try {
    const res = await api.post('/user/kyc/submit', payload);
    return res.data;
  } catch (error) {
    console.error('Error submitting PAN & Aadhaar KYC to database:', error);
    throw error;
  }
};

export const updateUserKyc = submitPanAadhaarKyc;

// Payout Accounts (Multiple Bank Accounts & UPI IDs with QR code)
export const getUserPayoutAccounts = async (params = {}) => {
  try {
    const res = await api.get('/user/payout-accounts', { params });
    return res.data;
  } catch (error) {
    console.error('Error fetching payout accounts from database:', error);
    throw error;
  }
};

export const sendBankOtp = async (payload) => {
  try {
    const res = await api.post('/user/send-bank-otp', payload);
    return res.data;
  } catch (error) {
    console.error('Error sending email OTP:', error);
    throw error;
  }
};

export const addBankAccount = async (payload) => {
  try {
    const res = await api.post('/user/bank-accounts/add', payload);
    return res.data;
  } catch (error) {
    console.error('Error adding bank account to database:', error);
    throw error;
  }
};

export const deleteBankAccount = async (id, payload) => {
  try {
    const res = await api.post(`/user/bank-accounts/${id}/delete`, payload);
    return res.data;
  } catch (error) {
    console.error('Error deleting bank account:', error);
    throw error;
  }
};

export const setPrimaryBankAccount = async (id) => {
  try {
    const res = await api.post(`/user/bank-accounts/${id}/primary`);
    return res.data;
  } catch (error) {
    console.error('Error setting primary bank account:', error);
    throw error;
  }
};

export const addUpiAccount = async (payload) => {
  try {
    const res = await api.post('/user/upi-accounts/add', payload);
    return res.data;
  } catch (error) {
    console.error('Error adding UPI ID with QR code:', error);
    throw error;
  }
};

export const deleteUpiAccount = async (id, payload) => {
  try {
    const res = await api.post(`/user/upi-accounts/${id}/delete`, payload);
    return res.data;
  } catch (error) {
    console.error('Error deleting UPI account:', error);
    throw error;
  }
};

export const setPrimaryUpiAccount = async (id) => {
  try {
    const res = await api.post(`/user/upi-accounts/${id}/primary`);
    return res.data;
  } catch (error) {
    console.error('Error setting primary UPI account:', error);
    throw error;
  }
};
