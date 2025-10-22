// Auto-Save Service for Supabase
// Automatically saves helper to Supabase every 3 hours if changes detected
// Phase 4: Helper Versioning System

import { supabase } from '../lib/supabaseClient.js';

class AutoSaveService {
  constructor() {
    this.interval = 3 * 60 * 60 * 1000; // 3 hours in milliseconds
    this.lastSupabaseSave = null;
    this.lastLocalSave = null;
    this.timerId = null;
  }
  
  start() {
    console.log('🕐 Auto-save service started (checks every 3 hours)');
    
    // Intercept saveHelperToStorage to track local changes
    const originalSave = window.saveHelperToStorage;
    if (originalSave) {
      window.saveHelperToStorage = () => {
        originalSave();
        this.lastLocalSave = Date.now();
        console.log('📝 Local save tracked at', new Date(this.lastLocalSave).toLocaleTimeString());
      };
    }
    
    // Listen for helper events if available
    if (window.helperEvents) {
      window.helperEvents.on('auto_saved', () => {
        this.lastLocalSave = Date.now();
        console.log('📝 Auto-save event tracked');
      });
    }
    
    // Start interval timer
    this.timerId = setInterval(() => this.checkAndSave(), this.interval);
    console.log('⏰ Next auto-save check in 3 hours');
  }
  
  async checkAndSave() {
    console.log('⏰ Auto-save check triggered at', new Date().toLocaleTimeString());
    
    const helper = window.helper;
    const supabaseCaseId = helper?.case_info?.supabase_case_id;
    const plate = helper?.meta?.plate;
    
    // Validation: Need case ID to save
    if (!supabaseCaseId) {
      console.log('⏭️ No supabase_case_id found - skipping auto-save');
      return;
    }
    
    // Validation: Need plate number
    if (!plate) {
      console.log('⏭️ No plate number found - skipping auto-save');
      return;
    }
    
    // Validation: Need local changes
    if (!this.lastLocalSave) {
      console.log('⏭️ No local saves detected - skipping auto-save');
      return;
    }
    
    // Validation: Check if changes occurred since last Supabase save
    if (this.lastSupabaseSave && this.lastLocalSave <= this.lastSupabaseSave) {
      console.log('⏭️ No changes since last Supabase save - skipping');
      return;
    }
    
    try {
      console.log('💾 Changes detected - proceeding with auto-save...');
      
      // Get next version number
      const { data: maxVer, error: versionError } = await supabase
        .from('case_helper')
        .select('version')
        .eq('case_id', supabaseCaseId)
        .order('version', { ascending: false })
        .limit(1)
        .single();
      
      if (versionError && versionError.code !== 'PGRST116') {
        throw versionError;
      }
      
      const version = (maxVer?.version || 0) + 1;
      
      console.log(`💾 Auto-saving version ${version}...`);
      
      // Save to Supabase
      const result = await window.supabaseHelperService.saveHelper({
        plate: plate,
        helperData: helper,
        helperName: `${plate}_helper_v${version}`,
        timestamp: new Date().toISOString()
      });
      
      if (result.success) {
        this.lastSupabaseSave = Date.now();
        console.log(`✅ Auto-saved version ${version} at ${new Date().toLocaleTimeString()}`);
        console.log(`⏰ Next check in 3 hours`);
      } else {
        console.error('❌ Auto-save failed:', result.error);
      }
    } catch (err) {
      console.error('❌ Auto-save error:', err);
    }
  }
  
  stop() {
    if (this.timerId) {
      clearInterval(this.timerId);
      this.timerId = null;
      console.log('⏹️ Auto-save service stopped');
    }
  }
  
  // Manual trigger for testing
  async triggerNow() {
    console.log('🧪 Manual auto-save trigger');
    await this.checkAndSave();
  }
  
  // Get status for debugging
  getStatus() {
    return {
      lastLocalSave: this.lastLocalSave ? new Date(this.lastLocalSave).toLocaleString() : 'Never',
      lastSupabaseSave: this.lastSupabaseSave ? new Date(this.lastSupabaseSave).toLocaleString() : 'Never',
      interval: `${this.interval / 1000 / 60 / 60} hours`,
      isRunning: !!this.timerId
    };
  }
}

// Export for module environments
export const autoSaveService = new AutoSaveService();

// Make available globally
if (typeof window !== 'undefined') {
  window.autoSaveService = autoSaveService;
  
  // Auto-start on page load
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      window.autoSaveService.start();
    });
  } else {
    window.autoSaveService.start();
  }
}
