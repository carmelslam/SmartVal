// ============================================================================
// Notification Center Component
// ============================================================================
// Description: In-app notification center with bell icon, dropdown, and database integration
// Usage: Import and call NotificationCenter.init() in your page
// ============================================================================

import { supabase } from '../lib/supabaseClient.js';

class NotificationCenter {
  constructor() {
    this.notifications = [];
    this.unreadCount = 0;
    this.currentUserId = null;
    this.isOpen = false;
    this.container = null;
  }

  /**
   * Initialize notification center
   * Call this after DOM is loaded
   */
  async init() {
    try {
      // Get current user
      const session = sessionStorage.getItem('auth');
      if (!session) {
        console.log('📬 Notification Center: No session found');
        return;
      }

      const authData = JSON.parse(session);
      this.currentUserId = authData.user?.id;

      if (!this.currentUserId) {
        console.log('📬 Notification Center: No user ID found');
        return;
      }

      // Create UI
      this.createUI();

      // Load notifications
      await this.loadNotifications();

      // Set up real-time subscription
      this.setupRealtimeSubscription();

      // Auto-refresh every 30 seconds
      setInterval(() => this.loadNotifications(), 30000);

      console.log('📬 Notification Center: Initialized');
    } catch (error) {
      console.error('📬 Notification Center: Init error:', error);
    }
  }

  /**
   * Create notification center UI
   */
  createUI() {
    // Check if bell icon already exists
    if (document.getElementById('notification-bell')) {
      console.log('📬 Notification Center: UI already exists');
      return;
    }

    // Find header or create container
    const header = document.querySelector('.header') || document.querySelector('header');
    if (!header) {
      console.warn('📬 Notification Center: No header found');
      return;
    }

    // Create bell icon container
    const bellContainer = document.createElement('div');
    bellContainer.id = 'notification-bell';
    bellContainer.style.cssText = `
      position: relative;
      cursor: pointer;
      padding: 8px;
      margin-left: 15px;
    `;

    // Create bell icon
    const bellIcon = document.createElement('div');
    bellIcon.innerHTML = `
      <span style="font-size: 24px;">🔔</span>
      <span id="notification-badge" style="
        display: none;
        position: absolute;
        top: 0;
        right: 0;
        background: #EF4444;
        color: white;
        border-radius: 10px;
        padding: 2px 6px;
        font-size: 11px;
        font-weight: 600;
        min-width: 18px;
        text-align: center;
      ">0</span>
    `;

    bellContainer.appendChild(bellIcon);
    bellContainer.addEventListener('click', () => this.toggleDropdown());

    // Create dropdown panel
    const dropdown = document.createElement('div');
    dropdown.id = 'notification-dropdown';
    dropdown.style.cssText = `
      display: none;
      position: absolute;
      top: 60px;
      right: 20px;
      width: 380px;
      max-height: 500px;
      background: white;
      border-radius: 12px;
      box-shadow: 0 4px 20px rgba(0,0,0,0.15);
      z-index: 1000;
      overflow: hidden;
      direction: rtl;
    `;

    dropdown.innerHTML = `
      <div style="padding: 16px; border-bottom: 1px solid #E5E7EB; display: flex; justify-content: space-between; align-items: center;">
        <h3 style="margin: 0; font-size: 16px; font-weight: 600; color: #003366;">התראות</h3>
        <button id="mark-all-read" style="
          background: none;
          border: none;
          color: #003366;
          cursor: pointer;
          font-size: 13px;
          text-decoration: underline;
        ">סמן הכל כנקרא</button>
      </div>
      <div id="notification-list" style="
        max-height: 400px;
        overflow-y: auto;
        padding: 8px;
      ">
        <div style="text-align: center; padding: 40px 20px; color: #9CA3AF;">
          טוען התראות...
        </div>
      </div>
    `;

    document.body.appendChild(dropdown);

    // Add bell to header
    const rightSection = header.querySelector('.header-right') || header;
    rightSection.appendChild(bellContainer);

    // Event listeners
    document.getElementById('mark-all-read').addEventListener('click', () => this.markAllAsRead());

    // Close dropdown when clicking outside
    document.addEventListener('click', (e) => {
      if (!bellContainer.contains(e.target) && !dropdown.contains(e.target)) {
        this.closeDropdown();
      }
    });

    this.container = dropdown;
  }

  /**
   * Load notifications from database
   */
  async loadNotifications() {
    try {
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', this.currentUserId)
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;

      this.notifications = data || [];
      this.unreadCount = this.notifications.filter(n => !n.read).length;

      this.updateBadge();
      this.renderNotifications();

    } catch (error) {
      console.error('📬 Notification Center: Load error:', error);
    }
  }

  /**
   * Update badge count
   */
  updateBadge() {
    const badge = document.getElementById('notification-badge');
    if (!badge) return;

    if (this.unreadCount > 0) {
      badge.style.display = 'block';
      badge.textContent = this.unreadCount > 99 ? '99+' : this.unreadCount;
    } else {
      badge.style.display = 'none';
    }
  }

  /**
   * Render notifications list
   */
  renderNotifications() {
    const listContainer = document.getElementById('notification-list');
    if (!listContainer) return;

    if (this.notifications.length === 0) {
      listContainer.innerHTML = `
        <div style="text-align: center; padding: 40px 20px; color: #9CA3AF;">
          <div style="font-size: 48px; margin-bottom: 12px;">📭</div>
          <div>אין התראות</div>
        </div>
      `;
      return;
    }

    listContainer.innerHTML = this.notifications.map(notification => this.renderNotificationItem(notification)).join('');

    // Add click handlers for each notification
    this.notifications.forEach(notification => {
      const element = document.getElementById(`notification-${notification.id}`);
      if (element) {
        element.addEventListener('click', () => this.handleNotificationClick(notification));
      }
    });
  }

  /**
   * Render single notification item
   */
  renderNotificationItem(notification) {
    const isUnread = !notification.read;
    const timeAgo = this.getTimeAgo(notification.created_at);
    const typeEmoji = this.getTypeEmoji(notification.type);

    return `
      <div id="notification-${notification.id}" style="
        padding: 12px;
        border-radius: 8px;
        margin-bottom: 6px;
        cursor: pointer;
        background: ${isUnread ? '#EFF6FF' : 'white'};
        border: 1px solid ${isUnread ? '#BFDBFE' : '#E5E7EB'};
        transition: all 0.2s;
      " onmouseover="this.style.boxShadow='0 2px 8px rgba(0,0,0,0.1)'"
         onmouseout="this.style.boxShadow='none'">
        <div style="display: flex; align-items: start; gap: 10px;">
          <div style="font-size: 20px;">${typeEmoji}</div>
          <div style="flex: 1; min-width: 0;">
            <div style="
              font-weight: ${isUnread ? '600' : '400'};
              color: #1F2937;
              font-size: 14px;
              margin-bottom: 4px;
            ">${this.escapeHtml(notification.title)}</div>
            <div style="
              color: #6B7280;
              font-size: 13px;
              line-height: 1.4;
              margin-bottom: 6px;
            ">${this.escapeHtml(notification.message)}</div>
            <div style="
              color: #9CA3AF;
              font-size: 12px;
            ">${timeAgo}</div>
          </div>
          ${isUnread ? '<div style="width: 8px; height: 8px; background: #3B82F6; border-radius: 50%; flex-shrink: 0; margin-top: 4px;"></div>' : ''}
        </div>
      </div>
    `;
  }

  /**
   * Get emoji for notification type
   */
  getTypeEmoji(type) {
    const emojis = {
      task_assigned: '📋',
      task_updated: '✏️',
      task_completed: '✅',
      task_status_changed: '🔄',
      task_message: '💬',
      task_due_soon: '⏰',
      tasks_batch_assigned: '📬',
      mention: '👤',
      system: 'ℹ️'
    };
    return emojis[type] || '🔔';
  }

  /**
   * Get time ago string
   */
  getTimeAgo(timestamp) {
    const now = new Date();
    const past = new Date(timestamp);
    const diffMs = now - past;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'עכשיו';
    if (diffMins < 60) return `לפני ${diffMins} דקות`;
    if (diffHours < 24) return `לפני ${diffHours} שעות`;
    if (diffDays < 7) return `לפני ${diffDays} ימים`;
    return past.toLocaleDateString('he-IL');
  }

  /**
   * Handle notification click
   */
  async handleNotificationClick(notification) {
    // Mark as read
    if (!notification.read) {
      await this.markAsRead(notification.id);
    }

    // Navigate to URL if provided
    if (notification.url) {
      window.location.href = notification.url;
    }

    this.closeDropdown();
  }

  /**
   * Mark notification as read
   */
  async markAsRead(notificationId) {
    try {
      const { error } = await supabase
        .from('notifications')
        .update({
          read: true,
          read_at: new Date().toISOString()
        })
        .eq('id', notificationId);

      if (error) throw error;

      // Update local state
      const notification = this.notifications.find(n => n.id === notificationId);
      if (notification && !notification.read) {
        notification.read = true;
        notification.read_at = new Date().toISOString();
        this.unreadCount = Math.max(0, this.unreadCount - 1);
        this.updateBadge();
        this.renderNotifications();
      }

    } catch (error) {
      console.error('📬 Notification Center: Mark as read error:', error);
    }
  }

  /**
   * Mark all notifications as read
   */
  async markAllAsRead() {
    try {
      const { error } = await supabase
        .from('notifications')
        .update({
          read: true,
          read_at: new Date().toISOString()
        })
        .eq('user_id', this.currentUserId)
        .eq('read', false);

      if (error) throw error;

      // Update local state
      this.notifications.forEach(n => {
        n.read = true;
        n.read_at = new Date().toISOString();
      });
      this.unreadCount = 0;
      this.updateBadge();
      this.renderNotifications();

      console.log('📬 Notification Center: All marked as read');

    } catch (error) {
      console.error('📬 Notification Center: Mark all as read error:', error);
    }
  }

  /**
   * Toggle dropdown
   */
  toggleDropdown() {
    if (this.isOpen) {
      this.closeDropdown();
    } else {
      this.openDropdown();
    }
  }

  /**
   * Open dropdown
   */
  openDropdown() {
    const dropdown = document.getElementById('notification-dropdown');
    if (dropdown) {
      dropdown.style.display = 'block';
      this.isOpen = true;
      this.loadNotifications(); // Refresh on open
    }
  }

  /**
   * Close dropdown
   */
  closeDropdown() {
    const dropdown = document.getElementById('notification-dropdown');
    if (dropdown) {
      dropdown.style.display = 'none';
      this.isOpen = false;
    }
  }

  /**
   * Set up real-time subscription for new notifications
   */
  setupRealtimeSubscription() {
    try {
      const channel = supabase
        .channel(`notifications-${this.currentUserId}`)
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'notifications',
            filter: `user_id=eq.${this.currentUserId}`
          },
          (payload) => {
            console.log('📬 Notification Center: New notification received', payload);
            this.loadNotifications();
          }
        )
        .subscribe();

      console.log('📬 Notification Center: Real-time subscription active');
    } catch (error) {
      console.error('📬 Notification Center: Subscription error:', error);
    }
  }

  /**
   * Escape HTML to prevent XSS
   */
  escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }
}

// Create singleton instance
const notificationCenter = new NotificationCenter();

// Export for use in pages
export { notificationCenter };

// Auto-initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => notificationCenter.init());
} else {
  notificationCenter.init();
}
