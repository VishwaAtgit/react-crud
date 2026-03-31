/**
 * User CRUD operations — uses apiClient for logging/metrics automatically.
 */
import api from './apiClient';
import { createLogger } from '../utils/logger';

const log = createLogger('UserService');

export async function getUsers() {
  log.info('Fetching all users');
  return api.get('/users');
}

export async function getUserById(id) {
  log.info('Fetching user', { id });
  return api.get(`/users/${id}`);
}

export async function createUser(userData) {
  log.info('Creating user', { email: userData.email });
  return api.post('/users', userData);
}

export async function updateUser(id, userData) {
  log.info('Updating user', { id });
  return api.put(`/users/${id}`, userData);
}

export async function deleteUser(id) {
  log.warn('Deleting user', { id });
  return api.delete(`/users/${id}`);
}