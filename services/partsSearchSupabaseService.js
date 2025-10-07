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
     * SESSION 11: 3-Tier Waterproof Case ID Lookup
     * Handles multiple cases with same plate, version changes, active/closed cases
     * 
     * @param {string} plate - Plate number
     * @param {object} searchContext - Search context (unused but kept for future)
     * @returns {Promise<string|null>} - Case UUID or null
     */
    async getCaseId(plate, searchContext = {}) {
      console.log('🔍 SESSION 11: Determining case_id for plate:', plate);
      const supabase = this.getSupabase();
      
      // TIER 1: Direct UUID from helper (user is IN a case) - WATERPROOF
      if (window.helper?.case_info?.supabase_case_id) {
        console.log('  ✅ TIER 1: Got case_id from helper.case_info.supabase_case_id:', window.helper.case_info.supabase_case_id);
        return window.helper.case_info.supabase_case_id;
      }
      
      // TIER 2: Lookup by helper_name (most reliable) - WATERPROOF
      if (window.helper?.helper_name) {
        console.log('  🔍 TIER 2: Looking up by helper_name:', window.helper.helper_name);
        try {
          const { data, error } = await supabase
            .from('case_helper')
            .select('case_id')
            .eq('helper_name', window.helper.helper_name)
            .eq('is_current', true)
            .limit(1);
          
          if (!error && data && data.length > 0) {
            console.log('  ✅ TIER 2: Found case_id from helper_name:', data[0].case_id);
            return data[0].case_id;
          } else {
            console.log('  ⚠️ TIER 2: No match found for helper_name');
          }
        } catch (err) {
          console.log('  ⚠️ TIER 2 failed:', err.message);
        }
      }
      
      // TIER 3: Lookup by plate + active status (safe due to DB constraint) - WATERPROOF
      if (plate) {
        console.log('  🔍 TIER 3: Looking up by plate (active cases only)');
        const plateNoDashes = plate.replace(/-/g, ''); // "221-84-003" → "22184003"
        console.log('  - Normalized plate (no dashes):', plateNoDashes);
        
        try {
          const { data, error } = await supabase
            .from('cases')
            .select('id')
            .or(`plate.eq.${plate},plate.eq.${plateNoDashes}`)
            .or(`status.eq.OPEN,status.eq.IN_PROGRESS`) // DB constraint: max 1 active case per plate
            .limit(1);
          
          if (!error && data && data.length > 0) {
            console.log('  ✅ TIER 3: Found case_id from active case:', data[0].id);
            return data[0].id;
          } else {
            console.log('  ⚠️ TIER 3: No active case found for plate');
            if (error) console.log('  ⚠️ Error:', error);
          }
        } catch (err) {
          console.log('  ⚠️ TIER 3 failed:', err.message);
        }
      }
      
      // TIER 4: NULL (orphan search - acceptable)
      console.log('  ⚠️ TIER 4: All lookups failed, case_id will be NULL (orphan search)');
      return null;
    }

    /**
     * SESSION 11: Get Current User ID for Tracking
     * 
     * @returns {Promise<string|null>} - User UUID from auth or null
     */
    async getCurrentUserId() {
      try {
        const supabase = this.getSupabase();
        const { data: { user }, error } = await supabase.auth.getUser();
        
        if (!error && user) {
          console.log('  ✅ Authenticated user:', user.id);
          return user.id;
        } else {
          console.log('  ⚠️ No authenticated user (auth not implemented yet)');
          return null;
        }
      } catch (error) {
        console.log('  ⚠️ Auth check failed:', error.message);
        return null;
      }
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
        console.log('💾 SESSION 11: Creating search session for plate:', plate);
        const supabase = this.getSupabase();
        
        // Extract actual search params from context
        const searchParams = searchContext.searchParams || {};
        console.log('  - Search params:', searchParams);
        
        // SESSION 11: Get case_id using 3-tier waterproof lookup
        const caseId = await this.getCaseId(plate, searchContext);
        
        // SESSION 11: Get current user ID for tracking
        const userId = await this.getCurrentUserId();
        
        const { data, error } = await supabase
          .from('parts_search_sessions')
          .insert({
            case_id: caseId, // SESSION 11: 3-tier waterproof lookup
            plate: plate,
            search_context: searchParams,
            // Individual fields from search params
            make: searchParams.manufacturer || searchParams.make || null,
            model: searchParams.model || null,
            trim: searchParams.trim || null,
            year: searchParams.year || null,
            engine_volume: searchParams.engine_volume || null,
            engine_code: searchParams.engine_code || null,
            engine_type: searchParams.engine_type || null,
            vin: searchParams.vin || null,
            created_by: userId, // SESSION 11: User tracking (null if no auth)
            created_at: new Date().toISOString()
          });

        if (error) {
          console.error('❌ SESSION 11: Error creating search session:', error);
          return null;
        }

        // For older Supabase: data is array, get first item
        const sessionId = data && data[0] ? data[0].id : null;
        console.log('✅ SESSION 11: Search session created:', sessionId, '| case_id:', caseId || 'NULL', '| user:', userId || 'NULL');
        return sessionId;

      } catch (error) {
        console.error('❌ SESSION 11: Exception creating search session:', error);
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

        // ISSUE #2: Don't save if 0 results
        if (!results || results.length === 0) {
          console.log('ℹ️ SESSION 9: No results found, skipping save to parts_search_results');
          return false;
        }

        console.log('💾 SESSION 9 TASK 3: Saving search results with individual fields...');
        console.log('  - Results count:', results.length);
        console.log('  - Query context:', query);
        const supabase = this.getSupabase();
        
        // Extract data from first result to populate individual columns
        const firstResult = results[0] || {};
        const searchParams = query.searchParams || {}; // Actual search parameters
        console.log('  - First result sample:', firstResult);
        console.log('  - Search params:', searchParams);
        
        // ISSUE #4: Determine search type based on what was searched
        let searchType = 'simple_search'; // Default
        if (searchParams.partGroup || searchParams.partName || searchParams.part_group || searchParams.part_name) {
          searchType = 'advanced_search';
        } else if (searchParams.freeQuery || searchParams.free_query || searchParams.query) {
          searchType = 'simple_search'; // Free text only
        } else if (searchParams.manufacturer || searchParams.make || searchParams.model) {
          searchType = 'smart_search'; // Car-based search
        }
        
        // ISSUE #6: Extract all unique sources from results
        const uniqueSources = [...new Set(results.map(r => r.source).filter(Boolean))];
        const sourcesConcat = uniqueSources.join(', ');
        console.log('  - Unique sources found:', sourcesConcat);
        
        // OPTION A: Clean structure - only search params + full results
        const insertData = {
          session_id: sessionId,
          // Search parameters (what user searched for)
          plate: query.plate || searchParams.plate || null,
          make: searchParams.manufacturer || searchParams.make || null,
          model: searchParams.model || null,
          trim: searchParams.trim || null,
          year: searchParams.year || null,
          engine_volume: searchParams.engine_volume || null,
          engine_code: searchParams.engine_code || null,
          engine_type: searchParams.engine_type || null,
          vin: searchParams.vin || null,
          part_family: searchParams.partGroup || searchParams.part_group || null,
          search_type: searchType,
          // REMOVED individual part fields (pcode, cat_num_desc, price, supplier_name, supplier, oem, availability, location)
          // Those can't represent entire search - use results JSONB instead
          // Store complete data only
          search_query: searchParams, // Full search parameters as JSONB
          results: results, // Full results array as JSONB (50 parts with all details)
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

        const resultId = data && data[0] ? data[0].id : null;
        console.log('✅ SESSION 9 TASK 3: Search results saved with populated fields:', resultId);
        return resultId;

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
     * @param {object} context - Additional context (searchSessionId, searchContext)
     * @returns {Promise<string|null>} - Part ID or null if failed
     */
    async saveSelectedPart(plate, partData, context = {}) {
      try {
        if (!plate || !partData) {
          console.warn('⚠️ Missing plate or partData');
          return null;
        }

        console.log('💾 SESSION 11: Saving selected part for plate:', plate);
        const supabase = this.getSupabase();
        
        // SESSION 11: Extract vehicle data from search context
        const searchParams = context.searchContext?.searchParams || {};

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

        // SESSION 11: Insert new selected part with full data
        const { data, error } = await supabase
          .from('selected_parts')
          .insert({
            // Link to search result
            search_result_id: context.searchResultId || null, // SESSION 11: Link to parts_search_results.id
            // Plate
            plate: plate,
            // Part details
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
            comments: partData.comments || null,
            quantity: partData.quantity || 1,
            // SESSION 11: Vehicle data from search context
            make: searchParams.manufacturer || searchParams.make || null,
            model: searchParams.model || null,
            trim: searchParams.trim || null,
            year: searchParams.year || null,
            engine_volume: searchParams.engine_volume || null,
            engine_code: searchParams.engine_code || null,
            engine_type: searchParams.engine_type || null,
            vin: searchParams.vin || null,
            part_group: searchParams.part_group || searchParams.partGroup || null,
            // Metadata
            status: 'selected',
            raw_data: partData, // Store complete original data
            selected_at: new Date().toISOString()
          });

        if (error) {
          console.error('❌ SESSION 11: Error saving selected part:', error);
          return null;
        }

        const partId = data && data[0] ? data[0].id : null;
        console.log('✅ SESSION 11: Selected part saved:', partId, '| search_result_id:', context.searchResultId || 'NULL');
        return partId;

      } catch (error) {
        console.error('❌ SESSION 11: Exception saving selected part:', error);
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
