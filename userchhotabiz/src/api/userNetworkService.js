import api from './axios';

/**
 * Fetch Level 1 Direct Connections from MySQL Database
 */
export const getDirectConnections = async (params = {}) => {
  const response = await api.get('/user/network/direct', { params });
  return response.data;
};

/**
 * Fetch 7-Level Team Connections from MySQL Database
 */
export const getTeamConnections = async (params = {}) => {
  const response = await api.get('/user/network/team', { params });
  return response.data;
};

/**
 * Fetch 7-Level Genealogy Tree Structure from MySQL Database
 */
export const getGenealogyTree = async (params = {}) => {
  const response = await api.get('/user/network/genealogy', { params });
  return response.data;
};
