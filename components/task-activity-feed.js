// ============================================================================
// Task Activity Feed Component
// ============================================================================
// Description: Displays a real-time feed of all task changes and activities
// Usage: Import and call TaskActivityFeed.init() in your page
// ============================================================================

import { supabase } from '../lib/supabaseClient.js';

class TaskActivityFeed {
  constructor() {
    this.activities = [];
    this.limit = 50;
    this.container = null;
  }

  /**
   * Initialize activity feed
   */
  async init(containerId = 'activity-feed') {
    try {
      this.container = document.getElementById(containerId);
      if (!this.container) {
        console.warn('Activity feed container not found:', containerId);
        return;
      }

      // Load initial activities
      await this.loadActivities();

      // Set up real-time subscription
      this.setupRealtimeSubscription();

      // Auto-refresh every 30 seconds
      setInterval(() => this.loadActivities(), 30000);

      console.log('📋 Task Activity Feed: Initialized');
    } catch (error) {
      console.error('📋 Task Activity Feed: Init error:', error);
    }
  }

  /**
   * Load activities from database
   */
  async loadActivities() {
    try {
      const { data, error } = await supabase
        .from('task_progress_history')
        .select(`
          *,
          tasks (
            title,
            task_type,
            status
          ),
          profiles!task_progress_history_changed_by_fkey (
            name,
            role
          )
        `)
        .order('changed_at', { ascending: false })
        .limit(this.limit);

      if (error) throw error;

      this.activities = data || [];
      this.render();

    } catch (error) {
      console.error('📋 Task Activity Feed: Load error:', error);
    }
  }

  /**
   * Render activity feed
   */
  render() {
    if (!this.container) return;

    if (this.activities.length === 0) {
      this.container.innerHTML = `
        <div style="text-align: center; padding: 40px 20px; color: #999;">
          <div style="font-size: 48px; margin-bottom: 12px;">📋</div>
          <div>אין פעילות להצגה</div>
        </div>
      `;
      return;
    }

    this.container.innerHTML = this.activities.map(activity => this.renderActivity(activity)).join('');
  }

  /**
   * Render single activity item
   */
  renderActivity(activity) {
    const icon = this.getActivityIcon(activity.change_type);
    const description = this.getActivityDescription(activity);
    const timeAgo = this.getTimeAgo(activity.changed_at);
    const userName = activity.profiles?.name || 'מערכת';
    const taskTitle = activity.tasks?.title || 'משימה נמחקה';

    return `
      <div class="activity-item" style="
        padding: 12px;
        border-bottom: 1px solid #2a2a2a;
        display: flex;
        gap: 12px;
        align-items: start;
        transition: background 0.2s;
      " onmouseover="this.style.background='#1a1a1a'"
         onmouseout="this.style.background='transparent'">
        <div style="font-size: 24px; flex-shrink: 0;">${icon}</div>
        <div style="flex: 1; min-width: 0;">
          <div style="
            font-weight: 500;
            color: #e0e0e0;
            font-size: 14px;
            margin-bottom: 4px;
          ">${description}</div>
          <div style="
            color: #999;
            font-size: 13px;
            margin-bottom: 4px;
          ">
            <span style="color: #10B981;">${this.escapeHtml(userName)}</span>
            •
            <span style="color: #3B82F6;">${this.escapeHtml(taskTitle)}</span>
          </div>
          <div style="color: #666; font-size: 12px;">${timeAgo}</div>
        </div>
      </div>
    `;
  }

  /**
   * Get icon for activity type
   */
  getActivityIcon(changeType) {
    const icons = {
      created: '✨',
      assigned: '👤',
      reassigned: '🔄',
      status_changed: '📊',
      progress_updated: '📈',
      priority_changed: '⚡',
      completed: '✅',
      verified: '✔️',
      cancelled: '❌',
      reopened: '🔓'
    };
    return icons[changeType] || '📝';
  }

  /**
   * Get human-readable description
   */
  getActivityDescription(activity) {
    const type = activity.change_type;
    const oldVal = activity.old_value;
    const newVal = activity.new_value;

    switch (type) {
      case 'created':
        return 'יצר משימה חדשה';

      case 'status_changed':
        const oldStatus = this.getStatusLabel(oldVal?.status);
        const newStatus = this.getStatusLabel(newVal?.status);
        return `שינה סטטוס: ${oldStatus} → ${newStatus}`;

      case 'priority_changed':
        const oldPriority = this.getPriorityLabel(oldVal?.priority);
        const newPriority = this.getPriorityLabel(newVal?.priority);
        return `שינה עדיפות: ${oldPriority} → ${newPriority}`;

      case 'progress_updated':
        const oldProgress = oldVal?.completion_percentage || 0;
        const newProgress = newVal?.completion_percentage || 0;
        return `עדכן התקדמות: ${oldProgress}% → ${newProgress}%`;

      case 'reassigned':
        return 'הקצה מחדש למשתמש אחר';

      case 'completed':
        return 'השלים משימה';

      case 'verified':
        return 'אימת משימה';

      case 'cancelled':
        return 'ביטל משימה';

      case 'reopened':
        return 'פתח מחדש משימה';

      default:
        return activity.change_description || 'ביצע שינוי';
    }
  }

  /**
   * Get status label in Hebrew
   */
  getStatusLabel(status) {
    const labels = {
      pending: 'ממתינה',
      in_progress: 'בביצוע',
      awaiting_response: 'ממתינה לתשובה',
      completed: 'הושלמה',
      verified: 'אושרה',
      cancelled: 'בוטלה'
    };
    return labels[status] || status;
  }

  /**
   * Get priority label in Hebrew
   */
  getPriorityLabel(priority) {
    const labels = {
      low: 'נמוכה',
      medium: 'בינונית',
      high: 'גבוהה',
      urgent: 'דחופה'
    };
    return labels[priority] || priority;
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
   * Set up real-time subscription for new activities
   */
  setupRealtimeSubscription() {
    try {
      const channel = supabase
        .channel('task-activity-feed')
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'task_progress_history'
          },
          (payload) => {
            console.log('📋 New activity:', payload);
            this.loadActivities(); // Reload to get joined data
          }
        )
        .subscribe();

      console.log('📋 Task Activity Feed: Real-time subscription active');
    } catch (error) {
      console.error('📋 Task Activity Feed: Subscription error:', error);
    }
  }

  /**
   * Escape HTML to prevent XSS
   */
  escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }
}

// Create singleton instance
const taskActivityFeed = new TaskActivityFeed();

// Export for use in pages
export { taskActivityFeed };
