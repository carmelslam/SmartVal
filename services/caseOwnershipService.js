// Phase 6: Case Ownership Service
// Enforces case ownership rules across all modules
// Rules:
// - Assessor can only edit cases they created
// - Admin and Developer can edit any case
// - Assistant can view but not edit any case

import { supabase } from '../lib/supabaseClient.js';

export const caseOwnershipService = {
  /**
   * Check if current user can edit a specific case
   * @param {string} plateNumber - The case plate number
   * @returns {Promise<{canEdit: boolean, reason?: string, caseOwnerId?: string}>}
   */
  async canEditCase(plateNumber) {
    try {
      // Get current user auth
      const authData = sessionStorage.getItem('auth');
      if (!authData) {
        return { canEdit: false, reason: 'לא מחובר למערכת' };
      }

      const auth = JSON.parse(authData);
      const userId = auth?.user?.id;
      const userRole = auth?.profile?.role;

      if (!userId || !userRole) {
        return { canEdit: false, reason: 'נתוני משתמש חסרים' };
      }

      // Admin and Developer can edit any case
      if (['admin', 'developer'].includes(userRole)) {
        console.log('✅ Admin/Developer access - can edit any case');
        return { canEdit: true };
      }

      // Assistant cannot edit any case
      if (userRole === 'assistant') {
        console.log('❌ Assistant role - cannot edit cases');
        return { canEdit: false, reason: 'עוזר לא יכול לערוך תיקים' };
      }

      // For assessors, check case ownership
      if (userRole === 'assessor') {
        // Normalize plate number
        const normalizedPlate = plateNumber.replace(/[^0-9]/g, '');

        // Find the case in Supabase
        const { data: cases, error } = await supabase
          .from('cases')
          .select('id, plate, created_by, owner_name')
          .eq('plate', normalizedPlate)
          .or('status.eq.OPEN,status.eq.IN_PROGRESS')
          .limit(1);

        if (error) {
          console.error('Error checking case ownership:', error);
          return { canEdit: false, reason: 'שגיאה בבדיקת הרשאות' };
        }

        if (!cases || cases.length === 0) {
          // Case doesn't exist yet - allow creation
          console.log('✅ Case does not exist - assessor can create');
          return { canEdit: true };
        }

        const caseRecord = cases[0];
        
        // Check if assessor is the owner
        if (caseRecord.created_by === userId) {
          console.log('✅ Assessor is case owner - can edit');
          return { canEdit: true, caseOwnerId: caseRecord.created_by };
        } else {
          console.log('❌ Assessor is not case owner - cannot edit');
          return { 
            canEdit: false, 
            reason: 'תיק זה שייך למשתמש אחר. רק מנהל יכול להעביר תיק.',
            caseOwnerId: caseRecord.created_by 
          };
        }
      }

      // Unknown role
      return { canEdit: false, reason: 'תפקיד לא מוכר' };

    } catch (error) {
      console.error('Case ownership check error:', error);
      return { canEdit: false, reason: 'שגיאה בבדיקת הרשאות' };
    }
  },

  /**
   * Get current user info
   * @returns {{userId: string|null, userName: string|null, userRole: string|null}}
   */
  getCurrentUser() {
    try {
      const authData = sessionStorage.getItem('auth');
      if (!authData) return { userId: null, userName: null, userRole: null };

      const auth = JSON.parse(authData);
      return {
        userId: auth?.user?.id || null,
        userName: auth?.profile?.name || null,
        userRole: auth?.profile?.role || null
      };
    } catch (e) {
      console.error('Failed to get current user:', e);
      return { userId: null, userName: null, userRole: null };
    }
  },

  /**
   * Check if user can edit cases (assessor, admin, or developer)
   * @returns {boolean}
   */
  canEditCases() {
    const { userRole } = this.getCurrentUser();
    return ['assessor', 'admin', 'developer'].includes(userRole);
  },

  /**
   * Check if user is admin or developer
   * @returns {boolean}
   */
  isAdminOrDev() {
    const { userRole } = this.getCurrentUser();
    return ['admin', 'developer'].includes(userRole);
  },

  /**
   * Transfer case ownership (admin/developer only)
   * @param {string} plateNumber - Case plate number
   * @param {string} newOwnerId - New owner user ID
   * @returns {Promise<{success: boolean, error?: string}>}
   */
  async transferCase(plateNumber, newOwnerId) {
    try {
      if (!this.isAdminOrDev()) {
        return { success: false, error: 'רק מנהל או מפתח יכול להעביר תיק' };
      }

      const normalizedPlate = plateNumber.replace(/[^0-9]/g, '');

      const { error } = await supabase
        .from('cases')
        .update({ created_by: newOwnerId })
        .eq('plate', normalizedPlate);

      if (error) {
        console.error('Transfer case error:', error);
        return { success: false, error: error.message };
      }

      console.log(`✅ Case ${plateNumber} transferred to user ${newOwnerId}`);
      return { success: true };

    } catch (error) {
      console.error('Transfer case exception:', error);
      return { success: false, error: error.message };
    }
  }
};

// Make available globally
window.caseOwnershipService = caseOwnershipService;
