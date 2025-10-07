// partsSearchSupabaseService.js
// Session 9 - Parts Search Supabase Integration Service
// Date: 2025-10-06
// Purpose: Handle all Supabase operations for parts search (sessions, results, selected parts)
// Strategy: OPTION 1 - Save every search session
// NOTE: Browser-compatible version - no ES6 imports, uses global window.supabase

(function() {
  'use strict';

  class PartsSearchSupabaseService {
    constructor() {
      console.log('🔧 PartsSearchSupabaseService initialized');
    }

    /**
     * Get supabase client
     */
    getSupabase() {
      if (!window.supabase) {
        throw new Error('Supabase client not available on window.supabase');
      }
      return window.supabase;
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
        const supabase = this.getSupabase();
        
        const { data, error } = await supabase
          .from('parts_search_sessions')
          .insert({
            plate: plate,
            search_context: searchContext,
            created_at: new Date().toISOString()
          });

        if (error) {
          console.error('❌ Error creating search session:', error);
          return null;
        }

        // For older Supabase: data is array, get first item
        const sessionId = data && data[0] ? data[0].id : null;
        console.log('✅ Search session created:', sessionId);
        return sessionId;

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

        console.log('💾 SESSION 9 TASK 3: Saving search results with individual fields...');
        console.log('  - Results count:', results.length);
        console.log('  - Query context:', query);
        const supabase = this.getSupabase();
        
        // Extract data from first result to populate individual columns
        const firstResult = results[0] || {};
        console.log('  - First result sample:', firstResult);
        
        // Build the insert object with individual fields populated
        const insertData = {
          session_id: sessionId,
          // From results (if available)
          plate: query.plate || firstResult.plate || null,
          make: firstResult.make || null,
          model: firstResult.model || null,
          trim: firstResult.trim || firstResult.actual_trim || null,
          year: firstResult.year_from || firstResult.extracted_year || null,
          engine_volume: firstResult.engine_volume || null,
          engine_code: firstResult.engine_code || null,
          engine_type: firstResult.engine_type || null,
          vin: firstResult.vin || null,
          part_family: firstResult.part_family || null,
          supplier_name: firstResult.supplier_name || null,
          supplier: firstResult.supplier_name || 'Unknown',
          pcode: firstResult.pcode || null,
          cat_num_desc: firstResult.cat_num_desc || null,
          price: firstResult.price || null,
          source: firstResult.source || null,
          oem: firstResult.oem || null,
          availability: firstResult.availability || null,
          location: firstResult.location || null,
          search_type: query.searchType || 'smart_search',
          // Store complete data
          search_query: query, // PiP context for reference
          results: results, // Full results array as JSONB
          response_time_ms: query.searchTime || null,
          created_at: new Date().toISOString()
        };
        
        console.log('  - Insert data prepared:', Object.keys(insertData));
        
        const { data, error } = await supabase
          .from('parts_search_results')
          .insert(insertData);

        if (error) {
          console.error('❌ SESSION 9 TASK 3: Error saving search results:', error);
          return false;
        }

        const resultId = data && data[0] ? data[0].id : 'unknown';
        console.log('✅ SESSION 9 TASK 3: Search results saved with populated fields:', resultId);
        return true;

      } catch (error) {
        console.error('❌ SESSION 9 TASK 3: Exception saving search results:', error);
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
        const supabase = this.getSupabase();

        // Check for duplicates (same plate + pcode)
        const { data: existingParts, error: checkError } = await supabase
          .from('selected_parts')
          .select('id')
          .eq('plate', plate)
          .eq('pcode', partData.pcode || partData.catalog_number)
          .limit(1);

        if (!checkError && existingParts && existingParts.length > 0) {
          console.log('ℹ️ Part already selected, skipping duplicate:', existingParts[0].id);
          return existingParts[0].id;
        }

        // Insert new selected part
        const { data, error } = await supabase
          .from('selected_parts')
          .insert({
            plate: plate,
            part_name: partData.name || partData.part_name || partData.cat_num_desc,
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
            raw_data: partData, // Store complete original data
            selected_at: new Date().toISOString()
          });

        if (error) {
          console.error('❌ Error saving selected part:', error);
          return null;
        }

        const partId = data && data[0] ? data[0].id : null;
        console.log('✅ Selected part saved:', partId);
        return partId;

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
        const supabase = this.getSupabase();

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
        const supabase = this.getSupabase();

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
  }

  // Create singleton instance and expose globally
  window.partsSearchSupabaseService = new PartsSearchSupabaseService();
  console.log('✅ partsSearchSupabaseService loaded globally');

})();
