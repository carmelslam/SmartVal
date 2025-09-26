// Supabase Real-time Service
// Phase 3: Real-time Updates Implementation
// Handles live synchronization between browser sessions

import { supabase } from '../lib/supabaseClient.js';

export const realtimeService = {
  // Active subscriptions
  subscriptions: new Map(),
  
  // Connection state
  connectionState: 'disconnected',
  reconnectAttempts: 0,
  maxReconnectAttempts: 5,
  reconnectDelay: 1000,
  
  // Event listeners
  listeners: new Map(),
  
  /**
   * Initialize real-time service
   */
  async init() {
    console.log('🔄 Realtime Service: Initializing...');
    
    // Listen for connection state changes
    supabase.realtime.onOpen(() => {
      this.connectionState = 'connected';
      this.reconnectAttempts = 0;
      console.log('✅ Realtime: Connected');
      this.emit('connection', { state: 'connected' });
    });
    
    supabase.realtime.onClose(() => {
      this.connectionState = 'disconnected';
      console.log('❌ Realtime: Disconnected');
      this.emit('connection', { state: 'disconnected' });
      this.handleReconnect();
    });
    
    supabase.realtime.onError((error) => {
      console.error('❌ Realtime Error:', error);
      this.emit('error', { error });
    });
    
    console.log('✅ Realtime Service: Initialized');
  },
  
  /**
   * Subscribe to helper changes for a specific case
   * @param {string} caseId - Case ID to monitor
   * @param {Function} callback - Function to call when changes occur
   */
  subscribeToHelperChanges(caseId, callback) {
    console.log(`🔔 Subscribing to helper changes for case: ${caseId}`);
    
    const subscriptionKey = `helper_${caseId}`;
    
    // Remove existing subscription if any
    this.unsubscribe(subscriptionKey);
    
    const subscription = supabase
      .channel(`helper-changes-${caseId}`)
      .on(
        'postgres_changes',
        {
          event: '*', // Listen to INSERT, UPDATE, DELETE
          schema: 'public',
          table: 'case_helper',
          filter: `case_id=eq.${caseId}`
        },
        (payload) => {
          console.log('📡 Helper change received:', payload);
          this.handleHelperChange(payload, callback);
        }
      )
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          console.log(`✅ Subscribed to helper changes for case: ${caseId}`);
        } else if (status === 'CHANNEL_ERROR') {
          console.error(`❌ Failed to subscribe to case: ${caseId}`);
        }
      });
    
    this.subscriptions.set(subscriptionKey, subscription);
    
    return subscription;
  },
  
  /**
   * Subscribe to case changes (new cases, status updates)
   * @param {Function} callback - Function to call when changes occur
   */
  subscribeToCaseChanges(callback) {
    console.log('🔔 Subscribing to case changes...');
    
    const subscriptionKey = 'cases';
    
    // Remove existing subscription if any
    this.unsubscribe(subscriptionKey);
    
    const subscription = supabase
      .channel('case-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'cases'
        },
        (payload) => {
          console.log('📡 Case change received:', payload);
          this.handleCaseChange(payload, callback);
        }
      )
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          console.log('✅ Subscribed to case changes');
        } else if (status === 'CHANNEL_ERROR') {
          console.error('❌ Failed to subscribe to case changes');
        }
      });
    
    this.subscriptions.set(subscriptionKey, subscription);
    
    return subscription;
  },
  
  /**
   * Handle helper change events
   */
  handleHelperChange(payload, callback) {
    const { eventType, new: newRecord, old: oldRecord } = payload;
    
    const changeData = {
      type: 'helper_change',
      event: eventType,
      newData: newRecord,
      oldData: oldRecord,
      timestamp: new Date().toISOString()
    };
    
    // Check if this is the current version
    if (newRecord && newRecord.is_current) {
      changeData.isCurrent = true;
      changeData.helperName = newRecord.helper_name;
      changeData.version = newRecord.version;
      changeData.helperJson = newRecord.helper_json;
    }
    
    // Call the callback
    if (typeof callback === 'function') {
      callback(changeData);
    }
    
    // Emit global event
    this.emit('helper_change', changeData);
  },
  
  /**
   * Handle case change events
   */
  handleCaseChange(payload, callback) {
    const { eventType, new: newRecord, old: oldRecord } = payload;
    
    const changeData = {
      type: 'case_change',
      event: eventType,
      newData: newRecord,
      oldData: oldRecord,
      timestamp: new Date().toISOString()
    };
    
    // Call the callback
    if (typeof callback === 'function') {
      callback(changeData);
    }
    
    // Emit global event
    this.emit('case_change', changeData);
  },
  
  /**
   * Unsubscribe from a specific subscription
   * @param {string} subscriptionKey - Key of subscription to remove
   */
  unsubscribe(subscriptionKey) {
    const subscription = this.subscriptions.get(subscriptionKey);
    if (subscription) {
      supabase.removeChannel(subscription);
      this.subscriptions.delete(subscriptionKey);
      console.log(`🔕 Unsubscribed from: ${subscriptionKey}`);
    }
  },
  
  /**
   * Unsubscribe from all subscriptions
   */
  unsubscribeAll() {
    console.log('🔕 Unsubscribing from all realtime channels...');
    
    for (const [key, subscription] of this.subscriptions) {
      supabase.removeChannel(subscription);
      console.log(`🔕 Unsubscribed from: ${key}`);
    }
    
    this.subscriptions.clear();
  },
  
  /**
   * Handle reconnection logic
   */
  handleReconnect() {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.error('❌ Max reconnection attempts reached');
      this.emit('connection', { state: 'failed' });
      return;
    }
    
    this.reconnectAttempts++;
    const delay = this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1); // Exponential backoff
    
    console.log(`🔄 Reconnecting in ${delay}ms (attempt ${this.reconnectAttempts}/${this.maxReconnectAttempts})...`);
    
    setTimeout(() => {
      if (this.connectionState === 'disconnected') {
        console.log('🔄 Attempting to reconnect...');
        // Supabase handles reconnection automatically, but we can trigger it
        this.resubscribeAll();
      }
    }, delay);
  },
  
  /**
   * Resubscribe to all active channels (used after reconnection)
   */
  resubscribeAll() {
    console.log('🔄 Resubscribing to all channels...');
    
    // Store current subscriptions info
    const currentSubs = new Map();
    for (const [key, subscription] of this.subscriptions) {
      currentSubs.set(key, subscription);
    }
    
    // Clear all subscriptions
    this.unsubscribeAll();
    
    // Note: In a real implementation, we'd need to store the callback functions
    // and case IDs to properly resubscribe. For now, the UI should handle this.
    console.log('⚠️ UI should resubscribe to needed channels');
    this.emit('reconnection', { message: 'Please resubscribe to needed channels' });
  },
  
  /**
   * Event emitter functionality
   */
  on(eventName, callback) {
    if (!this.listeners.has(eventName)) {
      this.listeners.set(eventName, []);
    }
    this.listeners.get(eventName).push(callback);
  },
  
  off(eventName, callback) {
    const callbacks = this.listeners.get(eventName);
    if (callbacks) {
      const index = callbacks.indexOf(callback);
      if (index > -1) {
        callbacks.splice(index, 1);
      }
    }
  },
  
  emit(eventName, data) {
    const callbacks = this.listeners.get(eventName);
    if (callbacks) {
      callbacks.forEach(callback => {
        try {
          callback(data);
        } catch (error) {
          console.error(`❌ Error in event callback for ${eventName}:`, error);
        }
      });
    }
  },
  
  /**
   * Get connection status
   */
  getConnectionState() {
    return {
      state: this.connectionState,
      reconnectAttempts: this.reconnectAttempts,
      activeSubscriptions: this.subscriptions.size
    };
  },
  
  /**
   * Helper function to detect if current user caused the change
   * (to avoid showing notifications for own changes)
   */
  isOwnChange(changeData) {
    // This would need to be implemented based on your user identification
    // For now, we'll use a simple timestamp-based approach
    const now = Date.now();
    const changeTime = new Date(changeData.timestamp).getTime();
    const timeDiff = now - changeTime;
    
    // If the change happened within the last 5 seconds, assume it might be ours
    return timeDiff < 5000;
  },
  
  /**
   * Cleanup function - call when page unloads
   */
  cleanup() {
    console.log('🧹 Cleaning up realtime service...');
    this.unsubscribeAll();
    this.listeners.clear();
  }
};

// Auto-cleanup on page unload
if (typeof window !== 'undefined') {
  window.addEventListener('beforeunload', () => {
    realtimeService.cleanup();
  });
  
  // Make it available globally for non-module environments
  window.realtimeService = realtimeService;
}

export default realtimeService;