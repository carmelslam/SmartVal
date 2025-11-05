/**
 * User Tracking Middleware
 * Automatically adds created_by/updated_by fields to database operations
 * Uses existing auth service to get current user ID
 */

class UserTrackingMiddleware {
  constructor() {
    this.currentUserId = null;
    this.sessionStorageKey = 'auth';
    this.initialized = false;
  }

  /**
   * Initialize middleware with current user session
   */
  async initialize() {
    try {
      await this.updateCurrentUser();
      this.initialized = true;
      console.log('🔒 User tracking middleware initialized with user:', this.currentUserId);
    } catch (error) {
      console.warn('⚠️ User tracking middleware failed to initialize:', error);
      this.initialized = false;
    }
  }

  /**
   * Update current user ID from session storage or auth service
   */
  async updateCurrentUser() {
    try {
      // Method 1: Try session storage first
      const authData = sessionStorage.getItem(this.sessionStorageKey);
      if (authData) {
        const parsed = JSON.parse(authData);
        if (parsed.user?.id) {
          this.currentUserId = parsed.user.id;
          return this.currentUserId;
        }
      }

      // Method 2: Try global auth service if available
      if (window.authService && typeof window.authService.getCurrentUser === 'function') {
        const user = await window.authService.getCurrentUser();
        if (user?.id) {
          this.currentUserId = user.id;
          return this.currentUserId;
        }
      }

      // Method 3: Try Supabase auth directly
      if (window.supabase && window.supabase.auth) {
        const { data: { user } } = await window.supabase.auth.getUser();
        if (user?.id) {
          this.currentUserId = user.id;
          return this.currentUserId;
        }
      }

      // Method 4: Try userTrackingHelper if available
      if (window.userTrackingHelper && typeof window.userTrackingHelper.getCurrentUserId === 'function') {
        const userId = await window.userTrackingHelper.getCurrentUserId();
        if (userId) {
          this.currentUserId = userId;
          return this.currentUserId;
        }
      }

      throw new Error('No user authentication found');
    } catch (error) {
      console.warn('Failed to get current user:', error);
      this.currentUserId = null;
      return null;
    }
  }

  /**
   * Get current user ID
   */
  async getCurrentUserId() {
    if (!this.currentUserId) {
      await this.updateCurrentUser();
    }
    return this.currentUserId;
  }

  /**
   * Add user tracking fields to INSERT data
   * @param {Object} data - Data object to insert
   * @returns {Object} Data with created_by and updated_by fields added
   */
  async addCreateTracking(data) {
    const userId = await this.getCurrentUserId();
    const timestamp = new Date().toISOString();
    
    return {
      ...data,
      created_by: userId,
      updated_by: userId,
      created_at: timestamp,
      updated_at: timestamp
    };
  }

  /**
   * Add user tracking fields to UPDATE data
   * @param {Object} data - Data object to update
   * @returns {Object} Data with updated_by field added
   */
  async addUpdateTracking(data) {
    const userId = await this.getCurrentUserId();
    const timestamp = new Date().toISOString();
    
    return {
      ...data,
      updated_by: userId,
      updated_at: timestamp
    };
  }

  /**
   * Add approval tracking fields
   * @param {Object} data - Data object
   * @param {string} action - 'approved' or 'rejected'
   * @returns {Object} Data with approval tracking fields
   */
  async addApprovalTracking(data, action = 'approved') {
    const userId = await this.getCurrentUserId();
    const timestamp = new Date().toISOString();
    
    const approvalFields = {
      ...data,
      updated_by: userId,
      updated_at: timestamp
    };

    if (action === 'approved') {
      approvalFields.approved_by = userId;
      approvalFields.approval_date = timestamp;
    } else if (action === 'rejected') {
      approvalFields.rejected_by = userId;
      approvalFields.rejection_date = timestamp;
    }

    return approvalFields;
  }

  /**
   * Add review tracking fields
   * @param {Object} data - Data object
   * @returns {Object} Data with review tracking fields
   */
  async addReviewTracking(data) {
    const userId = await this.getCurrentUserId();
    const timestamp = new Date().toISOString();
    
    return {
      ...data,
      reviewed_by: userId,
      review_date: timestamp,
      updated_by: userId,
      updated_at: timestamp
    };
  }

  /**
   * Enhanced Supabase insert with automatic user tracking
   * @param {string} tableName - Table name
   * @param {Object|Array} data - Data to insert
   * @returns {Promise} Supabase response
   */
  async insertWithTracking(tableName, data) {
    if (!window.supabase) {
      throw new Error('Supabase client not available');
    }

    let trackedData;
    
    if (Array.isArray(data)) {
      // Handle array of records
      trackedData = await Promise.all(
        data.map(record => this.addCreateTracking(record))
      );
    } else {
      // Handle single record
      trackedData = await this.addCreateTracking(data);
    }

    console.log(`📝 Inserting into ${tableName} with user tracking:`, {
      recordCount: Array.isArray(trackedData) ? trackedData.length : 1,
      userId: this.currentUserId
    });

    return window.supabase
      .from(tableName)
      .insert(trackedData);
  }

  /**
   * Enhanced Supabase update with automatic user tracking
   * @param {string} tableName - Table name
   * @param {Object} data - Data to update
   * @param {Object} filter - Filter conditions
   * @returns {Promise} Supabase response
   */
  async updateWithTracking(tableName, data, filter) {
    if (!window.supabase) {
      throw new Error('Supabase client not available');
    }

    const trackedData = await this.addUpdateTracking(data);

    console.log(`✏️ Updating ${tableName} with user tracking:`, {
      filter,
      userId: this.currentUserId
    });

    let query = window.supabase
      .from(tableName)
      .update(trackedData);

    // Apply filters
    for (const [key, value] of Object.entries(filter)) {
      query = query.eq(key, value);
    }

    return query;
  }

  /**
   * Get user tracking statistics
   * @returns {Object} Statistics about user tracking
   */
  getStats() {
    return {
      initialized: this.initialized,
      currentUserId: this.currentUserId,
      timestamp: new Date().toISOString()
    };
  }

  /**
   * Validate that required user tracking fields are present
   * @param {Object} data - Data to validate
   * @param {string} operation - 'insert' or 'update'
   * @returns {boolean} True if valid
   */
  validateUserTracking(data, operation = 'insert') {
    if (operation === 'insert') {
      return !!(data.created_by && data.updated_by && data.created_at && data.updated_at);
    } else if (operation === 'update') {
      return !!(data.updated_by && data.updated_at);
    }
    return false;
  }

  /**
   * Monitor session changes and update user ID
   */
  startSessionMonitoring() {
    // Monitor session storage changes
    window.addEventListener('storage', async (event) => {
      if (event.key === this.sessionStorageKey) {
        console.log('🔄 Session change detected, updating user tracking');
        await this.updateCurrentUser();
      }
    });

    // Monitor auth state changes if available
    if (window.supabase?.auth) {
      window.supabase.auth.onAuthStateChange(async (event, session) => {
        console.log('🔄 Auth state change:', event);
        if (session?.user?.id) {
          this.currentUserId = session.user.id;
        } else {
          this.currentUserId = null;
        }
      });
    }
  }
}

// Create global instance
window.userTrackingMiddleware = new UserTrackingMiddleware();

// Auto-initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    window.userTrackingMiddleware.initialize();
    window.userTrackingMiddleware.startSessionMonitoring();
  });
} else {
  // DOM is already ready
  window.userTrackingMiddleware.initialize();
  window.userTrackingMiddleware.startSessionMonitoring();
}

// Export for ES6 modules if needed
if (typeof module !== 'undefined' && module.exports) {
  module.exports = UserTrackingMiddleware;
}