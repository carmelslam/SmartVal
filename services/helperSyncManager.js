// Helper Sync Manager
// Phase 3: Manages real-time synchronization between local helper and Supabase
// Handles conflict resolution and live updates

import { realtimeService } from './realtimeService.js';
import { supabaseHelperService } from './supabaseHelperService.js';

export const helperSyncManager = {
  // Current state
  currentCaseId: null,
  currentPlate: null,
  lastSyncTimestamp: null,
  syncMode: 'dual-write', // 'dual-write', 'supabase-first', 'make-first'
  
  // Conflict resolution
  conflictResolutionMode: 'timestamp', // 'timestamp', 'version', 'manual'
  
  // Status tracking
  syncStatus: 'idle', // 'idle', 'syncing', 'conflict', 'error'
  
  /**
   * Initialize sync manager for a specific case
   * @param {string} plate - Vehicle plate number
   * @param {string} caseId - Case ID (optional, will be found if not provided)
   */
  async initializeForCase(plate, caseId = null) {
    console.log(`🔄 HelperSync: Initializing for plate ${plate}`);
    
    this.currentPlate = plate;
    this.currentCaseId = caseId;
    this.lastSyncTimestamp = new Date().toISOString();
    
    // Find case ID if not provided
    if (!caseId) {
      this.currentCaseId = await this.findCaseId(plate);
    }
    
    if (this.currentCaseId) {
      // Subscribe to real-time changes for this case
      this.subscribeToChanges();
      console.log(`✅ HelperSync: Initialized for case ${this.currentCaseId}`);
    } else {
      console.log(`⚠️ HelperSync: No case found for plate ${plate} - will create on first save`);
    }
    
    return this.currentCaseId;
  },
  
  /**
   * Find case ID for a plate number
   */
  async findCaseId(plate) {
    try {
      const { data: cases, error } = await supabase
        .from('cases')
        .select('id')
        .eq('plate', plate)
        .in('status', ['OPEN', 'IN_PROGRESS'])
        .single();
      
      if (error) {
        console.log(`No existing case found for plate ${plate}`);
        return null;
      }
      
      return cases.id;
    } catch (error) {
      console.warn('Error finding case ID:', error);
      return null;
    }
  },
  
  /**
   * Subscribe to real-time changes
   */
  subscribeToChanges() {
    if (!this.currentCaseId) return;
    
    realtimeService.subscribeToHelperChanges(
      this.currentCaseId,
      (changeData) => this.handleRemoteChange(changeData)
    );
  },
  
  /**
   * Handle remote changes from other sessions
   */
  handleRemoteChange(changeData) {
    console.log('📡 HelperSync: Remote change received', changeData);
    
    // Skip if this might be our own change
    if (this.isRecentLocalChange(changeData)) {
      console.log('🔄 HelperSync: Skipping own change');
      return;
    }
    
    // Handle based on event type
    switch (changeData.event) {
      case 'INSERT':
      case 'UPDATE':
        if (changeData.isCurrent) {
          this.handleRemoteHelperUpdate(changeData);
        }
        break;
      case 'DELETE':
        this.handleRemoteHelperDelete(changeData);
        break;
    }
  },
  
  /**
   * Handle remote helper updates
   */
  handleRemoteHelperUpdate(changeData) {
    const remoteHelper = changeData.helperJson;
    const remoteVersion = changeData.version;
    const remoteTimestamp = changeData.timestamp;
    
    // Get current local helper
    const localHelperData = sessionStorage.getItem('helper');
    if (!localHelperData) {
      // No local helper, just load the remote one
      this.loadRemoteHelper(remoteHelper);
      return;
    }
    
    const localHelper = JSON.parse(localHelperData);
    const localVersion = localHelper.version || 1;
    
    // Check for conflicts
    if (this.hasConflict(localHelper, remoteHelper, localVersion, remoteVersion)) {
      this.handleConflict(localHelper, remoteHelper, {
        localVersion,
        remoteVersion,
        remoteTimestamp
      });
    } else {
      // No conflict, load remote helper
      this.loadRemoteHelper(remoteHelper);
    }
  },
  
  /**
   * Check if there's a conflict between local and remote helpers
   */
  hasConflict(localHelper, remoteHelper, localVersion, remoteVersion) {
    // Simple conflict detection - if local helper was modified since last sync
    const localModified = this.isLocalHelperModified();
    const versionConflict = localVersion !== remoteVersion;
    
    return localModified && versionConflict;
  },
  
  /**
   * Check if local helper was modified since last sync
   */
  isLocalHelperModified() {
    // This is a simplified check - in practice you might track modification timestamps
    const lastActivity = sessionStorage.getItem('lastHelperActivity');
    if (!lastActivity || !this.lastSyncTimestamp) return false;
    
    return new Date(lastActivity) > new Date(this.lastSyncTimestamp);
  },
  
  /**
   * Handle conflicts between local and remote versions
   */
  handleConflict(localHelper, remoteHelper, conflictInfo) {
    console.warn('⚠️ HelperSync: Conflict detected', conflictInfo);
    
    this.syncStatus = 'conflict';
    
    switch (this.conflictResolutionMode) {
      case 'timestamp':
        this.resolveByTimestamp(localHelper, remoteHelper, conflictInfo);
        break;
      case 'version':
        this.resolveByVersion(localHelper, remoteHelper, conflictInfo);
        break;
      case 'manual':
        this.requestManualResolution(localHelper, remoteHelper, conflictInfo);
        break;
      default:
        this.resolveByTimestamp(localHelper, remoteHelper, conflictInfo);
    }
  },
  
  /**
   * Resolve conflict by timestamp (most recent wins)
   */
  resolveByTimestamp(localHelper, remoteHelper, conflictInfo) {
    const localTime = new Date(localHelper.last_modified || localHelper.created_at || 0);
    const remoteTime = new Date(conflictInfo.remoteTimestamp);
    
    if (remoteTime > localTime) {
      console.log('🔄 HelperSync: Remote version is newer, loading it');
      this.loadRemoteHelper(remoteHelper);
    } else {
      console.log('🔄 HelperSync: Local version is newer, keeping it');
      this.showConflictNotification('Local version kept (more recent)');
    }
    
    this.syncStatus = 'idle';
  },
  
  /**
   * Resolve conflict by version (higher version wins)
   */
  resolveByVersion(localHelper, remoteHelper, conflictInfo) {
    if (conflictInfo.remoteVersion > conflictInfo.localVersion) {
      console.log('🔄 HelperSync: Remote version is higher, loading it');
      this.loadRemoteHelper(remoteHelper);
    } else {
      console.log('🔄 HelperSync: Local version is higher, keeping it');
      this.showConflictNotification('Local version kept (higher version)');
    }
    
    this.syncStatus = 'idle';
  },
  
  /**
   * Request manual conflict resolution from user
   */
  requestManualResolution(localHelper, remoteHelper, conflictInfo) {
    // This would show a UI for manual conflict resolution
    console.log('👤 HelperSync: Manual resolution required');
    
    // For now, create a simple choice
    const useRemote = confirm(
      `Conflict detected!\n\n` +
      `Local version: v${conflictInfo.localVersion}\n` +
      `Remote version: v${conflictInfo.remoteVersion}\n\n` +
      `Click OK to use remote version, Cancel to keep local version.`
    );
    
    if (useRemote) {
      this.loadRemoteHelper(remoteHelper);
    } else {
      this.showConflictNotification('Local version kept (manual choice)');
    }
    
    this.syncStatus = 'idle';
  },
  
  /**
   * Load remote helper into local session
   */
  loadRemoteHelper(remoteHelper) {
    console.log('📥 HelperSync: Loading remote helper');
    
    try {
      // Update local storage
      sessionStorage.setItem('helper', JSON.stringify(remoteHelper));
      
      // Update global helper object if it exists
      if (typeof window !== 'undefined' && window.helper) {
        window.helper = remoteHelper;
      }
      
      // Trigger helper update event
      this.triggerHelperUpdateEvent(remoteHelper);
      
      // Show notification
      this.showSyncNotification('Helper updated from remote session');
      
      this.lastSyncTimestamp = new Date().toISOString();
      
    } catch (error) {
      console.error('❌ HelperSync: Error loading remote helper:', error);
      this.syncStatus = 'error';
    }
  },
  
  /**
   * Trigger helper update event for UI components
   */
  triggerHelperUpdateEvent(helper) {
    if (typeof window !== 'undefined') {
      // Create and dispatch custom event
      const event = new CustomEvent('helperUpdated', {
        detail: {
          helper: helper,
          source: 'remote',
          timestamp: new Date().toISOString()
        }
      });
      
      window.dispatchEvent(event);
    }
  },
  
  /**
   * Check if a change might be from this session (recent)
   */
  isRecentLocalChange(changeData) {
    const changeTime = new Date(changeData.timestamp).getTime();
    const now = Date.now();
    
    // If change happened within last 10 seconds, might be ours
    return (now - changeTime) < 10000;
  },
  
  /**
   * Show sync notification to user
   */
  showSyncNotification(message, type = 'info') {
    console.log(`📢 HelperSync: ${message}`);
    
    // You could integrate with your existing notification system here
    // For now, we'll just log and potentially show a browser notification
    if (typeof window !== 'undefined' && 'Notification' in window) {
      if (Notification.permission === 'granted') {
        new Notification('SmartVal Sync', {
          body: message,
          icon: '/favicon.ico',
          tag: 'helper-sync'
        });
      }
    }
    
    // Dispatch custom event for UI components
    this.triggerSyncEvent(message, type);
  },
  
  /**
   * Show conflict notification
   */
  showConflictNotification(message) {
    this.showSyncNotification(message, 'warning');
  },
  
  /**
   * Trigger sync event
   */
  triggerSyncEvent(message, type) {
    if (typeof window !== 'undefined') {
      const event = new CustomEvent('helperSyncEvent', {
        detail: {
          message: message,
          type: type,
          timestamp: new Date().toISOString(),
          status: this.syncStatus
        }
      });
      
      window.dispatchEvent(event);
    }
  },
  
  /**
   * Manually sync current helper to Supabase
   */
  async syncToSupabase() {
    const helperData = sessionStorage.getItem('helper');
    if (!helperData) {
      console.warn('❌ HelperSync: No helper data to sync');
      return;
    }
    
    this.syncStatus = 'syncing';
    
    try {
      const helper = JSON.parse(helperData);
      const plate = helper.meta?.plate || this.currentPlate;
      const version = helper.version || 1;
      const helperName = `${plate}_helper_v${version}`;
      
      const result = await supabaseHelperService.saveHelper({
        plate: plate,
        helperData: helper,
        helperName: helperName,
        timestamp: new Date().toISOString()
      });
      
      if (result.success) {
        console.log('✅ HelperSync: Manual sync successful');
        this.lastSyncTimestamp = new Date().toISOString();
        this.syncStatus = 'idle';
        return true;
      } else {
        throw new Error(result.error);
      }
    } catch (error) {
      console.error('❌ HelperSync: Manual sync failed:', error);
      this.syncStatus = 'error';
      return false;
    }
  },
  
  /**
   * Get sync status
   */
  getSyncStatus() {
    return {
      caseId: this.currentCaseId,
      plate: this.currentPlate,
      status: this.syncStatus,
      lastSync: this.lastSyncTimestamp,
      mode: this.syncMode,
      conflictMode: this.conflictResolutionMode
    };
  },
  
  /**
   * Cleanup when switching cases or leaving page
   */
  cleanup() {
    console.log('🧹 HelperSync: Cleaning up...');
    
    if (this.currentCaseId) {
      realtimeService.unsubscribe(`helper_${this.currentCaseId}`);
    }
    
    this.currentCaseId = null;
    this.currentPlate = null;
    this.lastSyncTimestamp = null;
    this.syncStatus = 'idle';
  }
};

// Make it available globally
if (typeof window !== 'undefined') {
  window.helperSyncManager = helperSyncManager;
}

export default helperSyncManager;