import api from './axios';

/**
 * Support Tickets Service - MySQL Database Backed
 */
export const getUserSupportTickets = async (params = {}) => {
  try {
    const res = await api.get('/user/support-tickets', { params });
    return res.data;
  } catch (error) {
    console.error('Error fetching user support tickets from database:', error);
    throw error;
  }
};

export const createSupportTicket = async (payload) => {
  try {
    const res = await api.post('/user/support-tickets', payload);
    return res.data;
  } catch (error) {
    console.error('Error creating support ticket in database:', error);
    throw error;
  }
};

export const replySupportTicket = async (ticketId, payload) => {
  try {
    const res = await api.post(`/user/support-tickets/${ticketId}/reply`, payload);
    return res.data;
  } catch (error) {
    console.error('Error posting reply to support ticket:', error);
    throw error;
  }
};

export const updateSupportTicketStatus = async (ticketId, status) => {
  try {
    const res = await api.post(`/user/support-tickets/${ticketId}/status`, { status });
    return res.data;
  } catch (error) {
    console.error('Error updating ticket status:', error);
    throw error;
  }
};
