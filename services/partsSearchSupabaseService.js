// partsSearchSupabaseService.js
// Session 9 - Parts Search Supabase Integration Service
// Date: 2025-10-06
// Purpose: Handle all Supabase operations for parts search (sessions, results, selected parts)
// Strategy: OPTION 1 - Save every search session

import { supabase } from '../lib/supabaseClient.js';

class PartsSearchSupabaseService {
  constructor() {
    console.log('🔧 PartsSearchSupabaseService initialized');
  }

  /**
   * Create a new search session
   * Called: Every time user clicks search (even if 0 results)
   * 
   * @param {string} plate - Plate number (main identifier)
   * @param {object} searchContext - Full search parameters from UI
   * @returns {Promise<string|null>} - Session ID or null if failed
   */
  async createSearchSession(plate, searchContext = {}) {
    try {
      console.log('💾 Creating search session for plate:', plate);
      
      const { data, error } = await supabase
        .from('parts_search_sessions')
        .insert({
          plate: plate,
          search_context: searchContext,
          created_at: new Date().toISOString()
        })
        .select('id')
        .single();

      if (error) {
        console.error('❌ Error creating search session:', error);
        return null;
      }

      console.log('✅ Search session created:', data.id);
      return data.id;

    } catch (error) {
      console.error('❌ Exception creating search session:', error);
      return null;
    }
  }

  /**
   * Save search results to Supabase
   * Called: After search completes, linked to session
   * 
   * @param {string} sessionId - Session ID from createSearchSession
   * @param {array} results - Array of search results
   * @param {object} query - Original search query parameters
   * @returns {Promise<boolean>} - Success status
   */
  async saveSearchResults(sessionId, results = [], query = {}) {
    try {
      if (!sessionId) {
        console.warn('⚠️ No session ID provided, skipping search results save');
        return false;
      }

      console.log('💾 Saving search results:', results.length, 'items for session:', sessionId);
      
      const { data, error } = await supabase
        .from('parts_search_results')
        .insert({
          session_id: sessionId,
          supplier: results[0]?.supplier_name || 'Unknown',
          search_query: query,
          results: results, // Store entire results array as JSONB
          response_time_ms: query.response_time_ms || null,
          created_at: new Date().toISOString()
        })
        .select('id')
        .single();

      if (error) {
        console.error('❌ Error saving search results:', error);
        return false;
      }

      console.log('✅ Search results saved:', data.id);
      return true;

    } catch (error) {
      console.error('❌ Exception saving search results:', error);
      return false;
    }
  }

  /**
   * Save a selected part (when user checks checkbox)
   * Called: When checkbox state changes to checked
   * 
   * @param {string} plate - Plate number
   * @param {object} partData - Part data from search results
   * @returns {Promise<string|null>} - Part ID or null if failed
   */
  async saveSelectedPart(plate, partData) {
    try {
      if (!plate || !partData) {
        console.warn('⚠️ Missing plate or partData');
        return null;
      }

      console.log('💾 Saving selected part for plate:', plate);

      // Check for duplicates (same plate + pcode)
      const { data: existing } = await supabase
        .from('selected_parts')
        .select('id')
        .eq('plate', plate)
        .eq('pcode', partData.pcode || partData.catalog_number)
        .maybeSingle();

      if (existing) {
        console.log('ℹ️ Part already selected, skipping duplicate:', existing.id);
        return existing.id;
      }

      // Insert new selected part
      const { data, error } = await supabase
        .from('selected_parts')
        .insert({
          plate: plate,
          name: partData.name || partData.part_name || partData.cat_num_desc,
          pcode: partData.pcode || partData.catalog_number,
          cat_num_desc: partData.cat_num_desc || partData.description,
          oem: partData.oem,
          supplier: partData.supplier,
          supplier_name: partData.supplier_name,
          price: partData.price,
          source: partData.source,
          part_family: partData.part_family,
          availability: partData.availability,
          location: partData.location,
          quantity: partData.quantity || 1,
          entry_method: partData.entry_method || 'search_selected',
          entry_type: partData.entry_type || 'search_result',
          from_suggestion: partData.fromSuggestion || false,
          selection_mode: 'direct_select',
          selected_in_module: 'parts_search',
          raw_data: partData, // Store complete original data
          selected_at: new Date().toISOString(),
          created_at: new Date().toISOString()
        })
        .select('id')
        .single();

      if (error) {
        console.error('❌ Error saving selected part:', error);
        return null;
      }

      console.log('✅ Selected part saved:', data.id);
      return data.id;

    } catch (error) {
      console.error('❌ Exception saving selected part:', error);
      return null;
    }
  }

  /**
   * Get all selected parts for a plate
   * Called: On page load, to restore selections
   * 
   * @param {string} plate - Plate number
   * @returns {Promise<array>} - Array of selected parts
   */
  async getSelectedParts(plate) {
    try {
      if (!plate) {
        console.warn('⚠️ No plate provided');
        return [];
      }

      console.log('📥 Loading selected parts for plate:', plate);

      const { data, error } = await supabase
        .from('selected_parts')
        .select('*')
        .eq('plate', plate)
        .order('selected_at', { ascending: false });

      if (error) {
        console.error('❌ Error loading selected parts:', error);
        return [];
      }

      console.log('✅ Loaded selected parts:', data.length);
      return data || [];

    } catch (error) {
      console.error('❌ Exception loading selected parts:', error);
      return [];
    }
  }

  /**
   * Delete a selected part
   * Called: When user unchecks checkbox or removes part
   * 
   * @param {string} partId - Part ID (UUID) or pcode
   * @param {string} plate - Plate number (if using pcode)
   * @returns {Promise<boolean>} - Success status
   */
  async deleteSelectedPart(partId, plate = null) {
    try {
      if (!partId) {
        console.warn('⚠️ No part ID provided');
        return false;
      }

      console.log('🗑️ Deleting selected part:', partId);

      // Try delete by UUID first
      let query = supabase.from('selected_parts').delete();
      
      if (partId.includes('-')) {
        // UUID format
        query = query.eq('id', partId);
      } else if (plate) {
        // pcode format
        query = query.eq('plate', plate).eq('pcode', partId);
      } else {
        console.warn('⚠️ Cannot determine delete criteria');
        return false;
      }

      const { error } = await query;

      if (error) {
        console.error('❌ Error deleting selected part:', error);
        return false;
      }

      console.log('✅ Selected part deleted');
      return true;

    } catch (error) {
      console.error('❌ Exception deleting selected part:', error);
      return false;
    }
  }

  /**
   * Sync selected parts array with Supabase
   * Called: When helper.parts_search.selected_parts is updated
   * 
   * @param {string} plate - Plate number
   * @param {array} selectedParts - Array from helper.parts_search.selected_parts
   * @returns {Promise<boolean>} - Success status
   */
  async syncSelectedParts(plate, selectedParts = []) {
    try {
      if (!plate) {
        console.warn('⚠️ No plate provided for sync');
        return false;
      }

      console.log('🔄 Syncing selected parts for plate:', plate, '- Count:', selectedParts.length);

      // Get current parts in Supabase
      const existingParts = await this.getSelectedParts(plate);
      const existingPcodes = new Set(existingParts.map(p => p.pcode));

      // Add parts that are in helper but not in Supabase
      for (const part of selectedParts) {
        const pcode = part.pcode || part.catalog_number;
        if (!existingPcodes.has(pcode)) {
          await this.saveSelectedPart(plate, part);
        }
      }

      console.log('✅ Selected parts synced');
      return true;

    } catch (error) {
      console.error('❌ Exception syncing selected parts:', error);
      return false;
    }
  }
}

// Create singleton instance
const partsSearchSupabaseService = new PartsSearchSupabaseService();

// Export as default and named
export default partsSearchSupabaseService;
export { partsSearchSupabaseService, PartsSearchSupabaseService };
