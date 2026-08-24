import api from './api';

const SUPERADMIN_BASE_URL = '/superadmin';

// Check if current user is super admin
export const checkSuperAdmin = async () => {
  return api.get(`${SUPERADMIN_BASE_URL}/check`);
};

// Get all admins
export const getAllAdmins = async () => {
  return api.get(`${SUPERADMIN_BASE_URL}/admins`);
};

// Create new admin
export const createAdmin = async (adminData) => {
  return api.post(`${SUPERADMIN_BASE_URL}/admins`, adminData);
};

// Update admin status
export const updateAdminStatus = async (adminId, isActive) => {
  return api.put(`${SUPERADMIN_BASE_URL}/admins/${adminId}`, { is_active: isActive });
};

// Delete admin
export const deleteAdmin = async (adminId) => {
  return api.delete(`${SUPERADMIN_BASE_URL}/admins/${adminId}`);
};
