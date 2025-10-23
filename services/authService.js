// Phase 6: Authentication Service
// Handles Supabase Auth integration for user authentication
// Date: 2025-10-22

import { supabase } from '../lib/supabaseClient.js';

class AuthService {
  constructor() {
    this.currentUser = null;
    this.currentProfile = null;
    this.sessionCheckInterval = null;
  }

  /**
   * Login with email and password
   * @param {string} email - User email address
   * @param {string} password - User password
   * @returns {Promise<{success: boolean, user?: object, profile?: object, error?: string}>}
   */
  async login(email, password) {
    try {
      console.log('🔐 Attempting login for:', email);

      // Sign in with Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password: password
      });

      if (authError) {
        console.error('❌ Login failed:', authError.message);
        return { 
          success: false, 
          error: this.translateAuthError(authError.message) 
        };
      }

      if (!authData.user) {
        return { 
          success: false, 
          error: 'לא התקבלו פרטי משתמש' 
        };
      }

      // Get user profile from profiles table
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('*, orgs(name)')
        .eq('user_id', authData.user.id)
        .single();

      if (profileError || !profile) {
        console.error('❌ Profile not found:', profileError);
        await supabase.auth.signOut();
        return { 
          success: false, 
          error: 'פרופיל משתמש לא נמצא במערכת' 
        };
      }

      // Check if account is active
      if (profile.status !== 'active') {
        await supabase.auth.signOut();
        return { 
          success: false, 
          error: 'חשבון המשתמש מושהה או לא פעיל' 
        };
      }

      // Store current user data
      this.currentUser = authData.user;
      this.currentProfile = profile;

      // Store in sessionStorage for page persistence
      const loginTime = new Date().toISOString();
      sessionStorage.setItem('auth', JSON.stringify({
        user: authData.user,
        session: authData.session,
        profile: profile,
        loginTime: loginTime
      }));
      sessionStorage.setItem('loginTime', loginTime); // For backwards compatibility
      sessionStorage.setItem('loginSuccess', 'true'); // For backwards compatibility
      sessionStorage.setItem('sessionStart', Date.now().toString()); // For backwards compatibility
      sessionStorage.setItem('lastActivityTime', Date.now().toString());

      // Update last_login timestamp
      await this.updateLastLogin(profile.user_id);

      console.log('✅ Login successful:', {
        name: profile.name,
        role: profile.role,
        email: email
      });

      return {
        success: true,
        user: authData.user,
        profile: profile,
        mustChangePassword: profile.must_change_password
      };

    } catch (error) {
      console.error('❌ Login error:', error);
      return { 
        success: false, 
        error: 'שגיאה בהתחברות למערכת' 
      };
    }
  }

  /**
   * Logout current user
   */
  async logout() {
    try {
      console.log('🚪 Logging out user...');

      // Sign out from Supabase
      await supabase.auth.signOut();

      // Clear local state
      this.currentUser = null;
      this.currentProfile = null;

      // Clear session storage (auth only, preserve helper for backup)
      sessionStorage.removeItem('auth');
      sessionStorage.removeItem('loginTime');
      sessionStorage.removeItem('loginSuccess');
      sessionStorage.removeItem('sessionStart');
      sessionStorage.removeItem('lastActivityTime');

      // Stop session monitoring
      if (this.sessionCheckInterval) {
        clearInterval(this.sessionCheckInterval);
        this.sessionCheckInterval = null;
      }

      console.log('✅ Logout successful');
      return { success: true };

    } catch (error) {
      console.error('❌ Logout error:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Change user password
   * @param {string} newPassword - New password
   * @returns {Promise<{success: boolean, error?: string}>}
   */
  async changePassword(newPassword) {
    try {
      console.log('🔐 Changing password...');
      
      const { error } = await supabase.auth.updateUser({
        password: newPassword
      });

      if (error) {
        console.error('❌ Supabase password update failed:', error);
        return { success: false, error: this.translateAuthError(error.message) };
      }

      // Get current user ID
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        console.error('❌ No current user found');
        return { success: false, error: 'משתמש לא נמצא' };
      }

      console.log('✅ Password updated in auth, now updating profile flag for user:', user.id);

      // ALWAYS update must_change_password flag to false
      const { error: profileError } = await supabase
        .from('profiles')
        .update({ 
          must_change_password: false,
          updated_by: user.id,
          updated_at: new Date().toISOString()
        })
        .eq('user_id', user.id);
      
      if (profileError) {
        console.error('⚠️ Failed to update profile flag:', profileError);
        // Don't fail the whole operation, password was still changed
      } else {
        console.log('✅ Profile flag updated successfully');
      }
      
      // Update local profile if exists
      if (this.currentProfile) {
        this.currentProfile.must_change_password = false;
      }
      
      // Update sessionStorage
      const authData = sessionStorage.getItem('auth');
      if (authData) {
        const parsed = JSON.parse(authData);
        if (parsed.profile) {
          parsed.profile.must_change_password = false;
          sessionStorage.setItem('auth', JSON.stringify(parsed));
        }
      }

      console.log('✅ Password changed successfully');
      return { success: true };

    } catch (error) {
      console.error('❌ Password change error:', error);
      return { success: false, error: 'שגיאה בשינוי סיסמה' };
    }
  }

  /**
   * Request password reset email
   * @param {string} email - User email
   * @returns {Promise<{success: boolean, error?: string}>}
   */
  async resetPassword(email) {
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/index.html`
      });

      if (error) {
        return { success: false, error: this.translateAuthError(error.message) };
      }

      console.log('✅ Password reset email sent to:', email);
      return { success: true };

    } catch (error) {
      console.error('❌ Password reset error:', error);
      return { success: false, error: 'שגיאה בשליחת אימייל לאיפוס סיסמה' };
    }
  }

  /**
   * Get current session from Supabase
   * @returns {Promise<object|null>}
   */
  async getSession() {
    try {
      const { data: { session }, error } = await supabase.auth.getSession();
      
      if (error || !session) {
        return null;
      }

      return session;
    } catch (error) {
      console.error('❌ Get session error:', error);
      return null;
    }
  }

  /**
   * Validate current session
   * @returns {Promise<boolean>}
   */
  async validateSession() {
    try {
      const session = await this.getSession();
      
      if (!session) {
        console.log('⚠️ No valid session found');
        return false;
      }

      // Check if session has user object
      if (!session.user || !session.user.id) {
        console.log('⚠️ Session missing user data');
        return false;
      }

      // Verify profile still exists and is active
      const { data: profile, error } = await supabase
        .from('profiles')
        .select('status, role, name')
        .eq('user_id', session.user.id)
        .single();

      if (error || !profile || profile.status !== 'active') {
        console.log('⚠️ Profile not found or inactive');
        await this.logout();
        return false;
      }

      // Update current user data
      this.currentUser = session.user;
      this.currentProfile = profile;

      return true;

    } catch (error) {
      console.error('❌ Session validation error:', error);
      return false;
    }
  }

  /**
   * Get current user profile
   * @returns {object|null}
   */
  getCurrentProfile() {
    // Try from memory first
    if (this.currentProfile) {
      return this.currentProfile;
    }

    // Try from sessionStorage
    const authData = sessionStorage.getItem('auth');
    if (authData) {
      try {
        const parsed = JSON.parse(authData);
        this.currentProfile = parsed.profile;
        return parsed.profile;
      } catch (e) {
        console.error('Failed to parse auth data:', e);
      }
    }

    return null;
  }

  /**
   * Get current user role
   * @returns {string|null}
   */
  getUserRole() {
    const profile = this.getCurrentProfile();
    return profile?.role || null;
  }

  /**
   * Check if user has specific role
   * @param {string|string[]} roles - Role or array of roles to check
   * @returns {boolean}
   */
  hasRole(roles) {
    const userRole = this.getUserRole();
    if (!userRole) return false;

    if (Array.isArray(roles)) {
      return roles.includes(userRole);
    }
    return userRole === roles;
  }

  /**
   * Check if user is admin or developer
   * @returns {boolean}
   */
  isAdminOrDev() {
    return this.hasRole(['admin', 'developer']);
  }

  /**
   * Check if user can edit cases
   * @returns {boolean}
   */
  canEditCases() {
    return this.hasRole(['assessor', 'admin', 'developer']);
  }

  /**
   * Check if user can manage users
   * @returns {boolean}
   */
  canManageUsers() {
    return this.hasRole(['admin', 'developer']);
  }

  /**
   * Update last login timestamp
   * @param {string} userId - User ID
   */
  async updateLastLogin(userId) {
    try {
      await supabase
        .from('profiles')
        .update({ 
          last_login: new Date().toISOString(),
          updated_by: userId,
          updated_at: new Date().toISOString()
        })
        .eq('user_id', userId);
    } catch (error) {
      console.warn('Failed to update last_login:', error);
    }
  }

  /**
   * Translate Supabase auth errors to Hebrew
   * @param {string} errorMessage - English error message
   * @returns {string} - Hebrew error message
   */
  translateAuthError(errorMessage) {
    const errorMap = {
      'Invalid login credentials': 'שם משתמש או סיסמה שגויים',
      'Email not confirmed': 'האימייל טרם אושר',
      'User not found': 'משתמש לא נמצא',
      'Invalid email': 'כתובת אימייל לא תקינה',
      'Password should be at least 6 characters': 'הסיסמה חייבת להכיל לפחות 6 תווים',
      'Unable to validate email address': 'לא ניתן לאמת את כתובת האימייל',
      'Email rate limit exceeded': 'נשלחו יותר מדי אימיילים, נסה שוב מאוחר יותר'
    };

    // Check for partial matches
    for (const [englishError, hebrewError] of Object.entries(errorMap)) {
      if (errorMessage.includes(englishError)) {
        return hebrewError;
      }
    }

    return 'שגיאת התחברות - נסה שוב';
  }

  /**
   * Start session monitoring (15-minute timeout)
   * @param {Function} onTimeout - Callback when session times out
   */
  startSessionMonitoring(onTimeout) {
    const TIMEOUT_DURATION = 15 * 60 * 1000; // 15 minutes

    // Check every minute
    this.sessionCheckInterval = setInterval(async () => {
      const lastActivityTime = sessionStorage.getItem('lastActivityTime');
      
      if (!lastActivityTime) {
        console.warn('⚠️ No activity time found');
        if (onTimeout) onTimeout();
        return;
      }

      const now = Date.now();
      const inactivityTime = now - parseInt(lastActivityTime);

      if (inactivityTime > TIMEOUT_DURATION) {
        console.log('⏰ Session timed out due to inactivity');
        await this.logout();
        if (onTimeout) onTimeout();
      }
    }, 60000); // Check every minute
  }

  /**
   * Stop session monitoring
   */
  stopSessionMonitoring() {
    if (this.sessionCheckInterval) {
      clearInterval(this.sessionCheckInterval);
      this.sessionCheckInterval = null;
    }
  }
}

// Create singleton instance
const authService = new AuthService();

// Export for module use
export { authService, AuthService };

// Make available globally for non-module scripts
if (typeof window !== 'undefined') {
  window.authService = authService;
}
