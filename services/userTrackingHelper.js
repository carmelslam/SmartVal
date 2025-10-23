// Phase 6: User Tracking Helper Service
// Provides consistent user ID tracking for all database operations
// Ensures every INSERT/UPDATE captures which user performed the action

import { caseOwnershipService } from './caseOwnershipService.js';

export const userTrackingHelper = {
  /**
   * Get user tracking fields for INSERT operations
   * @returns {{created_by: string|null, updated_by: string|null, created_at: string, updated_at: string}}
   */
  getInsertFields() {
    const { userId } = caseOwnershipService.getCurrentUser();
    const timestamp = new Date().toISOString();
    
    return {
      created_by: userId,
      updated_by: userId,
      created_at: timestamp,
      updated_at: timestamp
    };
  },

  /**
   * Get user tracking fields for UPDATE operations
   * @returns {{updated_by: string|null, updated_at: string}}
   */
  getUpdateFields() {
    const { userId } = caseOwnershipService.getCurrentUser();
    
    return {
      updated_by: userId,
      updated_at: new Date().toISOString()
    };
  },

  /**
   * Enrich data object with INSERT tracking fields
   * @param {Object} data - The data object to insert
   * @returns {Object} Data with tracking fields added
   */
  addInsertTracking(data) {
    return {
      ...data,
      ...this.getInsertFields()
    };
  },

  /**
   * Enrich data object with UPDATE tracking fields
   * @param {Object} data - The data object to update
   * @returns {Object} Data with tracking fields added
   */
  addUpdateTracking(data) {
    return {
      ...data,
      ...this.getUpdateFields()
    };
  },

  /**
   * Enrich array of data objects with INSERT tracking fields
   * @param {Array<Object>} dataArray - Array of data objects to insert
   * @returns {Array<Object>} Array with tracking fields added to each item
   */
  addInsertTrackingBulk(dataArray) {
    const trackingFields = this.getInsertFields();
    return dataArray.map(data => ({
      ...data,
      ...trackingFields
    }));
  },

  /**
   * Get current user ID only (lightweight)
   * @returns {string|null} User ID or null if not logged in
   */
  getCurrentUserId() {
    const { userId } = caseOwnershipService.getCurrentUser();
    return userId;
  },

  /**
   * Check if user tracking will work (user is logged in)
   * @returns {boolean} True if user ID is available
   */
  canTrack() {
    const { userId } = caseOwnershipService.getCurrentUser();
    return !!userId;
  }
};

// Make available globally
window.userTrackingHelper = userTrackingHelper;
