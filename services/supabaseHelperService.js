// Supabase Helper Service
// Handles saving helper data to Supabase as backup/mirror
// Phase 2: Dual-write implementation

import { supabase } from '../lib/supabaseClient.js';

export const supabaseHelperService = {
  /**
   * Save helper to Supabase (dual-write with Make.com)
   * @param {Object} params
   * @param {string} params.plate - Vehicle plate number
   * @param {Object} params.helperData - Complete helper JSON object
   * @param {string} params.helperName - Format: {plate}_helper_v{version}
   * @param {string} params.timestamp - ISO timestamp
   * @returns {Promise<{success: boolean, error?: any}>}
   */
  async saveHelper({ plate, helperData, helperName, timestamp }) {
    console.log('🔄 Supabase: Starting helper save...');
    
    try {
      // Step 1: Find or create case
      let caseRecord = await this.findOrCreateCase(plate, helperData);
      if (!caseRecord) {
        throw new Error('Failed to find or create case');
      }
      
      // Step 2: Extract version from helper name (e.g., "12345678_helper_v3" → 3)
      const versionMatch = helperName.match(/_v(\d+)$/);
      const version = versionMatch ? parseInt(versionMatch[1]) : 1;
      
      // Step 3: Mark all previous versions as not current
      if (caseRecord.id) {
        await supabase
          .from('case_helper')
          .update({ is_current: false })
          .eq('case_id', caseRecord.id);
      }
      
      // Step 4: Save new helper version
      const { data: helperRecord, error: helperError } = await supabase
        .from('case_helper')
        .insert({
          case_id: caseRecord.id,
          version: version,
          is_current: true,
          helper_name: helperName,
          helper_json: helperData,
          source: 'system',
          sync_status: 'synced',
          updated_at: timestamp || new Date().toISOString()
        })
        .select()
        .single();
        
      if (helperError) {
        console.error('❌ Supabase: Error saving helper:', helperError);
        throw helperError;
      }
      
      console.log(`✅ Supabase: Helper saved successfully - ${helperName}`);
      
      // Step 5: Log to webhook sync table for monitoring
      await this.logWebhookSync({
        webhook_name: 'HELPER_EXPORT',
        direction: 'TO_SUPABASE',
        case_id: caseRecord.id,
        status: 'SUCCESS',
        payload: { helper_name: helperName, version: version }
      });
      
      return { 
        success: true, 
        data: {
          case_id: caseRecord.id,
          helper_id: helperRecord.id,
          version: version
        }
      };
      
    } catch (error) {
      console.error('❌ Supabase helper save failed:', error);
      
      // Log failure but don't throw - we don't want to break Make.com flow
      await this.logWebhookSync({
        webhook_name: 'HELPER_EXPORT',
        direction: 'TO_SUPABASE',
        status: 'FAILED',
        error_message: error.message
      }).catch(e => console.error('Failed to log error:', e));
      
      return { 
        success: false, 
        error: error.message 
      };
    }
  },
  
  /**
   * Find existing case or create new one
   */
  async findOrCreateCase(plate, helperData) {
    // First, try to find existing open case
    const { data: existingCases } = await supabase
      .from('cases')
      .select('id, plate, status')
      .eq('plate', plate)
      .or('status.eq.OPEN,status.eq.IN_PROGRESS');
      
    if (existingCases && existingCases.length > 0) {
      const existingCase = existingCases[0];
      console.log(`📁 Found existing case for plate ${plate}`);
      return existingCase;
    }
    
    // Create new case
    const ownerName = helperData?.case_info?.customer_name || 
                     helperData?.stakeholders?.customer?.name || 
                     'Unknown';
    
    const { data: newCase, error } = await supabase
      .from('cases')
      .insert({
        plate: plate,
        owner_name: ownerName,
        status: 'OPEN',
        created_at: new Date().toISOString()
      })
      .select()
      .single();
      
    if (error) {
      console.error('❌ Error creating case:', error);
      return null;
    }
    
    console.log(`✅ Created new case for plate ${plate}`);
    return newCase;
  },
  
  /**
   * Log webhook sync activity
   */
  async logWebhookSync({ webhook_name, direction, case_id, status, payload, error_message }) {
    try {
      await supabase
        .from('webhook_sync_log')
        .insert({
          webhook_name,
          direction,
          case_id,
          status,
          payload,
          error_message,
          created_at: new Date().toISOString()
        });
    } catch (e) {
      // Silently fail - logging shouldn't break main flow
      console.error('Failed to log webhook sync:', e);
    }
  },
  
  /**
   * Test function to verify Supabase connection
   */
  async testConnection() {
    try {
      const { data, error } = await supabase
        .from('cases')
        .select('count')
        .limit(1);
        
      if (error) throw error;
      
      console.log('✅ Supabase connection test successful');
      return true;
    } catch (error) {
      console.error('❌ Supabase connection test failed:', error);
      return false;
    }
  }
};

// Make it available globally for non-module environments
if (typeof window !== 'undefined') {
  window.supabaseHelperService = supabaseHelperService;
}