// Task Management Push Notifications
// Integrates with OneSignal to send notifications for task events

(function() {
  'use strict';

  const WEBHOOK_URL = 'https://hook.eu2.make.com/e41e2zm9f26ju5m815yfgn1ou41wwwhd';

  class TaskNotificationManager {
    constructor() {
      this.enabled = true;
      this.pendingNotifications = []; // Track tasks waiting for notification
    }

    /**
     * Add task to pending notifications queue
     */
    addToPendingNotifications(task, assignedToProfile) {
      this.pendingNotifications.push({
        task,
        assignedToProfile,
        timestamp: new Date()
      });
      console.log('📬 Task Notifications: Added to pending queue. Total pending:', this.pendingNotifications.length);
    }

    /**
     * Clear pending notifications queue
     */
    clearPendingNotifications() {
      this.pendingNotifications = [];
      console.log('📬 Task Notifications: Cleared pending queue');
    }

    /**
     * Get count of pending notifications
     */
    getPendingCount() {
      return this.pendingNotifications.length;
    }

    /**
     * Send batch notifications - one per user with all their tasks
     */
    async sendBatchNotifications() {
      if (this.pendingNotifications.length === 0) {
        console.log('📬 Task Notifications: No pending notifications to send');
        return { success: true, count: 0 };
      }

      try {
        console.log('📬 Task Notifications: Sending batch notifications for', this.pendingNotifications.length, 'tasks');

        // Group tasks by assigned user
        const tasksByUser = {};
        this.pendingNotifications.forEach(({ task, assignedToProfile }) => {
          const userId = task.assigned_to;
          if (!userId) return;

          if (!tasksByUser[userId]) {
            tasksByUser[userId] = {
              profile: assignedToProfile,
              tasks: []
            };
          }
          tasksByUser[userId].tasks.push(task);
        });

        // Send one notification per user
        let successCount = 0;
        for (const [userId, { profile, tasks }] of Object.entries(tasksByUser)) {
          const taskCount = tasks.length;

          // Determine priority emoji (use highest priority)
          const priorities = { urgent: 4, high: 3, medium: 2, low: 1 };
          const highestPriority = tasks.reduce((max, task) => {
            const taskPriority = priorities[task.priority] || 0;
            return taskPriority > priorities[max] ? task.priority : max;
          }, 'low');

          const priorityEmojis = {
            urgent: '🔴',
            high: '🟠',
            medium: '🟡',
            low: '⚪'
          };

          const emoji = priorityEmojis[highestPriority] || '📋';

          // Build message
          let message;
          if (taskCount === 1) {
            message = tasks[0].title;
          } else {
            const taskList = tasks.slice(0, 3).map(t => `• ${t.title}`).join('\n');
            message = `קיבלת ${taskCount} משימות חדשות:\n${taskList}${taskCount > 3 ? `\n... ועוד ${taskCount - 3}` : ''}`;
          }

          const success = await this.sendNotification({
            type: 'tasks_batch_assigned',
            user_id: userId,
            task_count: taskCount,
            task_ids: tasks.map(t => t.id),
            title: `${emoji} ${taskCount === 1 ? 'משימה חדשה' : `${taskCount} משימות חדשות`}`,
            message: message,
            url: `${window.location.origin}/user-tasks.html`,
            data: {
              task_ids: tasks.map(t => t.id),
              task_count: taskCount,
              highest_priority: highestPriority
            }
          });

          if (success) successCount++;
        }

        const userCount = Object.keys(tasksByUser).length;
        console.log(`📬 Task Notifications: Sent ${successCount}/${userCount} batch notifications`);

        // Clear the pending queue
        this.clearPendingNotifications();

        return {
          success: true,
          count: successCount,
          totalTasks: this.pendingNotifications.length,
          usersNotified: userCount
        };

      } catch (error) {
        console.error('📬 Task Notifications: Error sending batch notifications:', error);
        return { success: false, error: error.message };
      }
    }

    /**
     * Get user's OneSignal ID from session storage or OneSignal API
     */
    async getUserOnesignalId(userId) {
      try {
        // Try to get from session storage first
        const storedId = sessionStorage.getItem('onesignalId');
        if (storedId && userId === this.getCurrentUserId()) {
          return storedId;
        }

        // If not available and OneSignal is initialized, try to get it
        if (window.OneSignal && window.OneSignal.User) {
          const onesignalId = await OneSignal.User.getOnesignalId();
          if (onesignalId) {
            sessionStorage.setItem('onesignalId', onesignalId);
            return onesignalId;
          }
        }

        return null;
      } catch (error) {
        console.error('📬 Task Notifications: Error getting OneSignal ID:', error);
        return null;
      }
    }

    /**
     * Get current user ID from session storage
     */
    getCurrentUserId() {
      try {
        const auth = sessionStorage.getItem('auth');
        if (auth) {
          const authData = JSON.parse(auth);
          return authData.profile?.user_id || authData.user?.id;
        }
      } catch (error) {
        console.error('📬 Task Notifications: Error getting current user ID:', error);
      }
      return null;
    }

    /**
     * Send notification via webhook
     */
    async sendNotification(data) {
      if (!this.enabled) {
        console.log('📬 Task Notifications: Disabled, skipping notification');
        return false;
      }

      try {
        console.log('📬 Task Notifications: Sending notification:', data);

        const response = await fetch(WEBHOOK_URL, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(data)
        });

        if (response.ok) {
          console.log('📬 Task Notifications: Notification sent successfully');
          return true;
        } else {
          console.error('📬 Task Notifications: Failed to send notification, status:', response.status);
          return false;
        }
      } catch (error) {
        console.error('📬 Task Notifications: Error sending notification:', error);
        return false;
      }
    }

    /**
     * Notify user when a new task is assigned to them
     */
    async notifyTaskAssigned(task, assignedToProfile) {
      try {
        // Don't notify if the assigner and assignee are the same person
        if (task.assigned_by === task.assigned_to) {
          console.log('📬 Task Notifications: Skipping self-assignment notification');
          return;
        }

        // Get the assigned user's OneSignal ID (we'll need to look this up from a user mapping)
        // For now, we'll send the user_id and let the webhook/backend handle the lookup

        const priorityEmojis = {
          urgent: '🔴',
          high: '🟠',
          medium: '🟡',
          low: '⚪'
        };

        const priorityLabels = {
          urgent: 'דחוף',
          high: 'גבוה',
          medium: 'בינוני',
          low: 'נמוך'
        };

        const emoji = priorityEmojis[task.priority] || '📋';
        const priorityLabel = priorityLabels[task.priority] || task.priority;

        await this.sendNotification({
          type: 'task_assigned',
          user_id: task.assigned_to,
          task_id: task.id,
          title: `${emoji} משימה חדשה - ${priorityLabel}`,
          message: `${task.title}`,
          url: `${window.location.origin}/task-detail.html?id=${task.id}`,
          data: {
            task_id: task.id,
            priority: task.priority,
            task_type: task.task_type,
            due_date: task.due_date
          }
        });
      } catch (error) {
        console.error('📬 Task Notifications: Error in notifyTaskAssigned:', error);
      }
    }

    /**
     * Notify user when task status changes
     */
    async notifyTaskStatusChanged(task, oldStatus, newStatus, changedByProfile) {
      try {
        const statusLabels = {
          pending: 'ממתינה',
          in_progress: 'בביצוע',
          awaiting_response: 'ממתינה לתשובה',
          completed: 'הושלמה',
          verified: 'אושרה',
          cancelled: 'בוטלה'
        };

        const statusEmojis = {
          pending: '⏳',
          in_progress: '⚙️',
          awaiting_response: '💬',
          completed: '✅',
          verified: '✔️',
          cancelled: '❌'
        };

        // Notify the assigned user if someone else changed the status
        const currentUserId = this.getCurrentUserId();
        if (task.assigned_to && task.assigned_to !== currentUserId) {
          await this.sendNotification({
            type: 'task_status_changed',
            user_id: task.assigned_to,
            task_id: task.id,
            title: `${statusEmojis[newStatus]} משימה עודכנה`,
            message: `"${task.title}" - ${statusLabels[newStatus]}`,
            url: `${window.location.origin}/task-detail.html?id=${task.id}`,
            data: {
              task_id: task.id,
              old_status: oldStatus,
              new_status: newStatus,
              changed_by: changedByProfile?.name || 'לא ידוע'
            }
          });
        }

        // Also notify the task creator if they're different from assignee
        if (task.assigned_by && task.assigned_by !== task.assigned_to && task.assigned_by !== currentUserId) {
          await this.sendNotification({
            type: 'task_status_changed',
            user_id: task.assigned_by,
            task_id: task.id,
            title: `${statusEmojis[newStatus]} משימה עודכנה`,
            message: `"${task.title}" - ${statusLabels[newStatus]}`,
            url: `${window.location.origin}/task-detail.html?id=${task.id}`,
            data: {
              task_id: task.id,
              old_status: oldStatus,
              new_status: newStatus,
              changed_by: changedByProfile?.name || 'לא ידוע'
            }
          });
        }
      } catch (error) {
        console.error('📬 Task Notifications: Error in notifyTaskStatusChanged:', error);
      }
    }

    /**
     * Notify user when a new message is added to their task
     */
    async notifyNewTaskMessage(task, message, senderProfile) {
      try {
        const currentUserId = this.getCurrentUserId();

        // Notify assigned user if they're not the sender
        if (task.assigned_to && task.assigned_to !== currentUserId) {
          await this.sendNotification({
            type: 'task_message',
            user_id: task.assigned_to,
            task_id: task.id,
            title: `💬 הודעה חדשה במשימה`,
            message: `${senderProfile?.name || 'משתמש'}: ${message.substring(0, 100)}${message.length > 100 ? '...' : ''}`,
            url: `${window.location.origin}/task-detail.html?id=${task.id}`,
            data: {
              task_id: task.id,
              sender_name: senderProfile?.name || 'לא ידוע',
              task_title: task.title
            }
          });
        }

        // Notify task creator if they're different from assignee and not the sender
        if (task.assigned_by && task.assigned_by !== task.assigned_to && task.assigned_by !== currentUserId) {
          await this.sendNotification({
            type: 'task_message',
            user_id: task.assigned_by,
            task_id: task.id,
            title: `💬 הודעה חדשה במשימה`,
            message: `${senderProfile?.name || 'משתמש'}: ${message.substring(0, 100)}${message.length > 100 ? '...' : ''}`,
            url: `${window.location.origin}/task-detail.html?id=${task.id}`,
            data: {
              task_id: task.id,
              sender_name: senderProfile?.name || 'לא ידוע',
              task_title: task.title
            }
          });
        }
      } catch (error) {
        console.error('📬 Task Notifications: Error in notifyNewTaskMessage:', error);
      }
    }

    /**
     * Notify user when task is approaching due date
     */
    async notifyTaskDueSoon(task) {
      try {
        if (!task.due_date || !task.assigned_to) return;

        const dueDate = new Date(task.due_date);
        const now = new Date();
        const hoursUntilDue = (dueDate - now) / (1000 * 60 * 60);

        // Only notify if due within 24 hours and not already completed
        if (hoursUntilDue > 0 && hoursUntilDue <= 24 &&
            task.status !== 'completed' && task.status !== 'verified') {

          await this.sendNotification({
            type: 'task_due_soon',
            user_id: task.assigned_to,
            task_id: task.id,
            title: '⏰ משימה מתקרבת למועד היעד',
            message: `"${task.title}" - יעד: ${dueDate.toLocaleDateString('he-IL')}`,
            url: `${window.location.origin}/task-detail.html?id=${task.id}`,
            data: {
              task_id: task.id,
              due_date: task.due_date,
              hours_until_due: Math.round(hoursUntilDue)
            }
          });
        }
      } catch (error) {
        console.error('📬 Task Notifications: Error in notifyTaskDueSoon:', error);
      }
    }

    /**
     * Notify user when task is overdue
     */
    async notifyTaskOverdue(task) {
      try {
        if (!task.due_date || !task.assigned_to) return;

        const dueDate = new Date(task.due_date);
        const now = new Date();

        // Only notify if overdue and not completed
        if (dueDate < now && task.status !== 'completed' && task.status !== 'verified') {
          const daysOverdue = Math.floor((now - dueDate) / (1000 * 60 * 60 * 24));

          await this.sendNotification({
            type: 'task_overdue',
            user_id: task.assigned_to,
            task_id: task.id,
            title: '🚨 משימה באיחור',
            message: `"${task.title}" - באיחור של ${daysOverdue} ${daysOverdue === 1 ? 'יום' : 'ימים'}`,
            url: `${window.location.origin}/task-detail.html?id=${task.id}`,
            data: {
              task_id: task.id,
              due_date: task.due_date,
              days_overdue: daysOverdue
            }
          });
        }
      } catch (error) {
        console.error('📬 Task Notifications: Error in notifyTaskOverdue:', error);
      }
    }

    /**
     * Notify when task is edited/updated
     */
    async notifyTaskUpdated(task, updatedByProfile) {
      try {
        const currentUserId = this.getCurrentUserId();

        // Notify assigned user if someone else updated the task
        if (task.assigned_to && task.assigned_to !== currentUserId) {
          await this.sendNotification({
            type: 'task_updated',
            user_id: task.assigned_to,
            task_id: task.id,
            title: '✏️ משימה עודכנה',
            message: `"${task.title}" עודכנה על ידי ${updatedByProfile?.name || 'משתמש'}`,
            url: `${window.location.origin}/task-detail.html?id=${task.id}`,
            data: {
              task_id: task.id,
              updated_by: updatedByProfile?.name || 'לא ידוע'
            }
          });
        }
      } catch (error) {
        console.error('📬 Task Notifications: Error in notifyTaskUpdated:', error);
      }
    }
  }

  // Create global instance
  window.taskNotifications = new TaskNotificationManager();

  console.log('📬 Task Notifications: Module loaded and ready');

})();
