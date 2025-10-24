// Phase 6: Case Ownership Service
// Enforces case ownership rules across all modules
// Rules:
// - Assessor can only edit cases they created OR cases they collaborate on
// - Admin and Developer can edit any case
// - Assistant can view but not edit any case
// - Multiple users can collaborate on the same case

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

      // For assessors, check case ownership OR collaboration
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
        }
        
        // Check if assessor is a collaborator
        const { data: collaborators, error: collabError } = await supabase
          .from('case_collaborators')
          .select('id')
          .eq('case_id', caseRecord.id)
          .eq('user_id', userId)
          .limit(1);
        
        if (collabError) {
          console.error('Error checking collaborators:', collabError);
        } else if (collaborators && collaborators.length > 0) {
          console.log('✅ Assessor is case collaborator - can edit');
          return { canEdit: true, caseOwnerId: caseRecord.created_by, isCollaborator: true };
        }
        
        console.log('❌ Assessor is not case owner or collaborator - cannot edit');
        return { 
          canEdit: false, 
          reason: 'תיק זה שייך למשתמש אחר. פנה למנהל להוספתך כשותף.',
          caseOwnerId: caseRecord.created_by 
        };
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
   * This assigns the case to a new assessor (updates assigned_to)
   * @param {string} plateNumber - Case plate number
   * @param {string} newAssigneeId - New assignee user ID
   * @returns {Promise<{success: boolean, error?: string}>}
   */
  async transferCase(plateNumber, newAssigneeId) {
    try {
      if (!this.isAdminOrDev()) {
        return { success: false, error: 'רק מנהל או מפתח יכול להעביר תיק' };
      }

      const normalizedPlate = plateNumber.replace(/[^0-9]/g, '');
      const { userId } = this.getCurrentUser();

      // Update assigned_to (assignment), NOT created_by (owner)
      const { error } = await supabase
        .from('cases')
        .update({
          assigned_to: newAssigneeId,
          updated_by: userId,
          updated_at: new Date().toISOString()
        })
        .eq('plate', normalizedPlate);

      if (error) {
        console.error('Transfer case error:', error);
        return { success: false, error: error.message };
      }

      console.log(`✅ Case ${plateNumber} assigned to user ${newAssigneeId}`);
      return { success: true };

    } catch (error) {
      console.error('Transfer case exception:', error);
      return { success: false, error: error.message };
    }
  },

  /**
   * Add collaborator to case
   * @param {string} plateNumber - Case plate number
   * @param {string} collaboratorUserId - User ID to add as collaborator
   * @returns {Promise<{success: boolean, error?: string}>}
   */
  async addCollaborator(plateNumber, collaboratorUserId) {
    try {
      const { userId, userRole } = this.getCurrentUser();
      
      if (!userId) {
        return { success: false, error: 'משתמש לא מחובר' };
      }

      const normalizedPlate = plateNumber.replace(/[^0-9]/g, '');

      const { data: cases, error: caseError } = await supabase
        .from('cases')
        .select('id, created_by')
        .eq('plate', normalizedPlate)
        .limit(1);

      if (caseError || !cases || cases.length === 0) {
        return { success: false, error: 'תיק לא נמצא' };
      }

      const caseRecord = cases[0];

      if (!['admin', 'developer'].includes(userRole) && caseRecord.created_by !== userId) {
        return { success: false, error: 'רק בעל התיק או מנהל יכול להוסיף שותפים' };
      }

      const { error } = await supabase
        .from('case_collaborators')
        .insert({
          case_id: caseRecord.id,
          user_id: collaboratorUserId,
          added_by: userId
        });

      if (error) {
        if (error.message.includes('duplicate')) {
          return { success: false, error: 'משתמש כבר שותף בתיק זה' };
        }
        console.error('Add collaborator error:', error);
        return { success: false, error: error.message };
      }

      console.log(`✅ Collaborator ${collaboratorUserId} added to case ${plateNumber}`);
      return { success: true };

    } catch (error) {
      console.error('Add collaborator exception:', error);
      return { success: false, error: error.message };
    }
  },

  /**
   * Remove collaborator from case
   * @param {string} plateNumber - Case plate number
   * @param {string} collaboratorUserId - User ID to remove
   * @returns {Promise<{success: boolean, error?: string}>}
   */
  async removeCollaborator(plateNumber, collaboratorUserId) {
    try {
      const { userId, userRole } = this.getCurrentUser();
      
      if (!userId) {
        return { success: false, error: 'משתמש לא מחובר' };
      }

      const normalizedPlate = plateNumber.replace(/[^0-9]/g, '');

      const { data: cases, error: caseError } = await supabase
        .from('cases')
        .select('id, created_by')
        .eq('plate', normalizedPlate)
        .limit(1);

      if (caseError || !cases || cases.length === 0) {
        return { success: false, error: 'תיק לא נמצא' };
      }

      const caseRecord = cases[0];

      if (!['admin', 'developer'].includes(userRole) && caseRecord.created_by !== userId) {
        return { success: false, error: 'רק בעל התיק או מנהל יכול להסיר שותפים' };
      }

      const { error } = await supabase
        .from('case_collaborators')
        .delete()
        .eq('case_id', caseRecord.id)
        .eq('user_id', collaboratorUserId);

      if (error) {
        console.error('Remove collaborator error:', error);
        return { success: false, error: error.message };
      }

      console.log(`✅ Collaborator ${collaboratorUserId} removed from case ${plateNumber}`);
      return { success: true };

    } catch (error) {
      console.error('Remove collaborator exception:', error);
      return { success: false, error: error.message };
    }
  },

  /**
   * Get all collaborators for a case
   * @param {string} plateNumber - Case plate number
   * @returns {Promise<{success: boolean, collaborators?: Array, error?: string}>}
   */
  async getCollaborators(plateNumber) {
    try {
      const normalizedPlate = plateNumber.replace(/[^0-9]/g, '');

      const { data: cases, error: caseError } = await supabase
        .from('cases')
        .select('id')
        .eq('plate', normalizedPlate)
        .limit(1);

      if (caseError || !cases || cases.length === 0) {
        return { success: false, error: 'תיק לא נמצא' };
      }

      const caseId = cases[0].id;

      const { data: collaborators, error } = await supabase
        .from('case_collaborators')
        .select('user_id, added_at')
        .eq('case_id', caseId);

      if (error) {
        console.error('Get collaborators error:', error);
        return { success: false, error: error.message };
      }

      if (!collaborators || collaborators.length === 0) {
        return { success: true, collaborators: [] };
      }

      const userIds = collaborators.map(c => c.user_id);
      const { data: allProfiles } = await supabase
        .from('profiles')
        .select('user_id, name, email, role');

      const profiles = allProfiles?.filter(p => userIds.includes(p.user_id));

      const enrichedCollaborators = collaborators.map(collab => ({
        ...collab,
        profiles: profiles?.find(p => p.user_id === collab.user_id)
      }));

      return { success: true, collaborators: enrichedCollaborators };

    } catch (error) {
      console.error('Get collaborators exception:', error);
      return { success: false, error: error.message };
    }
  }
};

// Make available globally
window.caseOwnershipService = caseOwnershipService;
