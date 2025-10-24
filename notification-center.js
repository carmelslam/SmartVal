// ============================================================================
// NOTIFICATION CENTER - Shared Component
// ============================================================================
// Provides notification bell icon, badge, dropdown, and management functions
// Can be imported and used across all task pages
// ============================================================================

import { supabase } from './lib/supabaseClient.js';

class NotificationCenter {
  constructor() {
    this.notifications = [];
    this.unreadCount = 0;
    this.currentUser = null;
    this.subscription = null;
    this.isOpen = false;
  }

  /**
   * Initialize notification center - call this on page load
   */
  async init(userId) {
    try {
      this.currentUser = { user_id: userId };
      console.log('🔔 Notification Center: Initializing for user:', userId);

      // Load initial notifications
      await this.loadNotifications();

      // Set up real-time subscription
      this.setupRealtimeSubscription();

      console.log('🔔 Notification Center: Initialized successfully');
    } catch (error) {
      console.error('🔔 Notification Center: Init error:', error);
    }
  }

  /**
   * Get the HTML for notification bell icon and badge
   */
  getBellIconHTML() {
    return `
      <div class="notification-bell-container" style="position: relative; cursor: pointer;" onclick="window.notificationCenter.toggleDropdown()">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="color: white;">
          <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path>
          <path d="M13.73 21a2 2 0 0 1-3.46 0"></path>
        </svg>
        <span id="notificationBadge" class="notification-badge" style="display: none; position: absolute; top: -8px; right: -8px; background: #ef4444; color: white; border-radius: 10px; padding: 2px 6px; font-size: 0.7rem; font-weight: 600;"></span>
      </div>
    `;
  }

  /**
   * Get the HTML for notification dropdown panel
   */
  getDropdownHTML() {
    return `
      <div id="notificationDropdown" class="notification-dropdown" style="display: none;">
        <div class="notification-dropdown-header">
          <span class="notification-dropdown-title">🔔 התראות</span>
          <button class="notification-mark-all-read" onclick="window.notificationCenter.markAllAsRead()">סמן הכל כנקרא</button>
        </div>
        <div id="notificationList" class="notification-list">
          <div class="notification-loading">טוען התראות...</div>
        </div>
      </div>
    `;
  }

  /**
   * Get the CSS styles for notification center
   */
  getStyles() {
    return `
      <style>
        .notification-dropdown {
          position: absolute;
          top: 60px;
          left: 20px;
          width: 400px;
          max-height: 500px;
          background: white;
          border-radius: 12px;
          box-shadow: 0 10px 30px rgba(0,0,0,0.3);
          z-index: 10000;
          overflow: hidden;
          direction: rtl;
        }

        .notification-dropdown-header {
          padding: 1rem;
          background: #003366;
          color: white;
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .notification-dropdown-title {
          font-weight: 600;
          font-size: 1.1rem;
        }

        .notification-mark-all-read {
          background: rgba(255,255,255,0.2);
          color: white;
          border: none;
          padding: 0.4rem 0.8rem;
          border-radius: 6px;
          cursor: pointer;
          font-size: 0.85rem;
          font-family: 'Noto Sans Hebrew', Arial, sans-serif;
        }

        .notification-mark-all-read:hover {
          background: rgba(255,255,255,0.3);
        }

        .notification-list {
          max-height: 400px;
          overflow-y: auto;
        }

        .notification-item {
          padding: 1rem;
          border-bottom: 1px solid #e5e5e5;
          cursor: pointer;
          transition: background 0.2s;
        }

        .notification-item:hover {
          background: #f9f9f9;
        }

        .notification-item.unread {
          background: #eff6ff;
          border-right: 4px solid #003366;
        }

        .notification-item.unread:hover {
          background: #dbeafe;
        }

        .notification-item-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 0.5rem;
        }

        .notification-item-title {
          font-weight: 600;
          color: #003366;
          font-size: 0.95rem;
        }

        .notification-item-time {
          font-size: 0.8rem;
          color: #999;
          white-space: nowrap;
        }

        .notification-item-message {
          color: #666;
          font-size: 0.9rem;
          line-height: 1.4;
        }

        .notification-loading {
          text-align: center;
          padding: 2rem;
          color: #999;
        }

        .notification-empty {
          text-align: center;
          padding: 3rem;
          color: #999;
        }

        @media (max-width: 768px) {
          .notification-dropdown {
            width: calc(100vw - 40px);
            right: 20px;
          }
        }
      </style>
    `;
  }

  /**
   * Load notifications from database
   */
  async loadNotifications() {
    if (!this.currentUser) return;

    try {
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', this.currentUser.user_id)
        .order('created_at', { ascending: false })
        .limit(20);

      if (error) throw error;

      this.notifications = data || [];
      this.updateUnreadCount();
      this.renderNotifications();

      console.log('🔔 Notification Center: Loaded', this.notifications.length, 'notifications');
    } catch (error) {
      console.error('🔔 Notification Center: Error loading notifications:', error);
    }
  }

  /**
   * Render notifications in the dropdown
   */
  renderNotifications() {
    const listContainer = document.getElementById('notificationList');
    if (!listContainer) return;

    if (this.notifications.length === 0) {
      listContainer.innerHTML = `
        <div class="notification-empty">
          📭 אין התראות חדשות
        </div>
      `;
      return;
    }

    listContainer.innerHTML = this.notifications.map(notif => {
      const isUnread = !notif.read;
      const timeAgo = this.formatRelativeTime(notif.created_at);

      return `
        <div class="notification-item ${isUnread ? 'unread' : ''}" onclick="window.notificationCenter.handleNotificationClick('${notif.id}', '${notif.url || ''}')">
          <div class="notification-item-header">
            <div class="notification-item-title">${this.escapeHtml(notif.title)}</div>
            <div class="notification-item-time">${timeAgo}</div>
          </div>
          <div class="notification-item-message">${this.escapeHtml(notif.message)}</div>
        </div>
      `;
    }).join('');
  }

  /**
   * Update unread notification count and badge
   */
  updateUnreadCount() {
    this.unreadCount = this.notifications.filter(n => !n.read).length;

    const badge = document.getElementById('notificationBadge');
    if (badge) {
      if (this.unreadCount > 0) {
        badge.textContent = this.unreadCount > 99 ? '99+' : this.unreadCount;
        badge.style.display = 'block';
      } else {
        badge.style.display = 'none';
      }
    }

    console.log('🔔 Notification Center: Unread count:', this.unreadCount);
  }

  /**
   * Toggle dropdown visibility
   */
  toggleDropdown() {
    const dropdown = document.getElementById('notificationDropdown');
    if (!dropdown) return;

    this.isOpen = !this.isOpen;
    dropdown.style.display = this.isOpen ? 'block' : 'none';

    if (this.isOpen) {
      // Refresh notifications when opening
      this.loadNotifications();
    }
  }

  /**
   * Handle notification click
   */
  async handleNotificationClick(notificationId, url) {
    try {
      // Mark as read
      await this.markAsRead(notificationId);

      // Navigate to URL if provided
      if (url && url !== 'null' && url !== '') {
        // Close dropdown first
        this.toggleDropdown();

        // Navigate after a short delay
        setTimeout(() => {
          window.location.href = url;
        }, 100);
      }
    } catch (error) {
      console.error('🔔 Notification Center: Error handling click:', error);
    }
  }

  /**
   * Mark a single notification as read
   */
  async markAsRead(notificationId) {
    try {
      const { error } = await supabase
        .from('notifications')
        .update({ read: true, read_at: new Date().toISOString() })
        .eq('id', notificationId);

      if (error) throw error;

      // Update local state
      const notif = this.notifications.find(n => n.id === notificationId);
      if (notif) {
        notif.read = true;
        notif.read_at = new Date().toISOString();
      }

      this.updateUnreadCount();
      this.renderNotifications();

      console.log('🔔 Notification Center: Marked notification as read:', notificationId);
    } catch (error) {
      console.error('🔔 Notification Center: Error marking as read:', error);
    }
  }

  /**
   * Mark all notifications as read
   */
  async markAllAsRead() {
    if (!this.currentUser) return;

    try {
      const { error } = await supabase
        .from('notifications')
        .update({ read: true, read_at: new Date().toISOString() })
        .eq('user_id', this.currentUser.user_id)
        .eq('read', false);

      if (error) throw error;

      // Update local state
      this.notifications.forEach(n => {
        if (!n.read) {
          n.read = true;
          n.read_at = new Date().toISOString();
        }
      });

      this.updateUnreadCount();
      this.renderNotifications();

      console.log('🔔 Notification Center: Marked all notifications as read');
    } catch (error) {
      console.error('🔔 Notification Center: Error marking all as read:', error);
    }
  }

  /**
   * Set up real-time subscription for new notifications
   */
  setupRealtimeSubscription() {
    if (!this.currentUser) return;

    console.log('🔔 Notification Center: Setting up real-time subscription');

    this.subscription = supabase
      .channel(`notifications:${this.currentUser.user_id}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${this.currentUser.user_id}`
        },
        (payload) => {
          console.log('🔔 Notification Center: Real-time update:', payload);

          if (payload.eventType === 'INSERT') {
            // New notification - add to list
            this.notifications.unshift(payload.new);
            // Keep only latest 20
            if (this.notifications.length > 20) {
              this.notifications = this.notifications.slice(0, 20);
            }
          } else if (payload.eventType === 'UPDATE') {
            // Update existing notification
            const index = this.notifications.findIndex(n => n.id === payload.new.id);
            if (index >= 0) {
              this.notifications[index] = payload.new;
            }
          } else if (payload.eventType === 'DELETE') {
            // Remove deleted notification
            this.notifications = this.notifications.filter(n => n.id !== payload.old.id);
          }

          this.updateUnreadCount();
          if (this.isOpen) {
            this.renderNotifications();
          }
        }
      )
      .subscribe((status) => {
        console.log('🔔 Notification Center: Subscription status:', status);
      });
  }

  /**
   * Format relative time (e.g., "5 minutes ago")
   */
  formatRelativeTime(dateString) {
    if (!dateString) return '';
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'עכשיו';
    if (diffMins < 60) return `לפני ${diffMins} דקות`;
    if (diffHours < 24) return `לפני ${diffHours} שעות`;
    if (diffDays < 7) return `לפני ${diffDays} ימים`;

    return date.toLocaleDateString('he-IL', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  }

  /**
   * Escape HTML to prevent XSS
   */
  escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  /**
   * Cleanup - call when page unloads
   */
  cleanup() {
    if (this.subscription) {
      this.subscription.unsubscribe();
      console.log('🔔 Notification Center: Cleaned up subscription');
    }
  }
}

// Create and export global instance
const notificationCenter = new NotificationCenter();
window.notificationCenter = notificationCenter;

// Close dropdown when clicking outside
document.addEventListener('click', (event) => {
  const dropdown = document.getElementById('notificationDropdown');
  const bell = document.querySelector('.notification-bell-container');

  if (dropdown && bell && notificationCenter.isOpen) {
    if (!dropdown.contains(event.target) && !bell.contains(event.target)) {
      notificationCenter.toggleDropdown();
    }
  }
});

console.log('🔔 Notification Center: Module loaded and ready');

export { notificationCenter };
