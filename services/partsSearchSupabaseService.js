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
        console.log('💾 SESSION 10: Creating search session for plate:', plate);
        const supabase = this.getSupabase();
        
        // Extract actual search params from context
        const searchParams = searchContext.searchParams || {};
        console.log('  - Search params:', searchParams);
        
        // SESSION 10: Get case_id from helper or look up by plate
        let caseId = null;
        
        // Strategy 1: Try to get from window.helper (if working on active case)
        if (window.helper?.case_info?.supabase_case_id) {
          caseId = window.helper.case_info.supabase_case_id;
          console.log('  ✅ Got case_id from helper:', caseId);
        }
        // Strategy 2: Look up in cases table by plate (for OPEN cases)
        else if (plate) {
          console.log('  - Helper not available, looking up case_id for plate:', plate);
          
          // Normalize plate: try both with dashes and without
          const plateNoDashes = plate.replace(/-/g, ''); // "221-84-003" → "22184003"
          console.log('  - Normalized plate (no dashes):', plateNoDashes);
          
          const { data: caseData, error: caseError } = await supabase
            .from('cases')
            .select('id')
            .or(`plate.eq.${plate},plate.eq.${plateNoDashes}`) // Try both formats
            .eq('status', 'OPEN')
            .limit(1);
          
          if (!caseError && caseData && caseData.length > 0) {
            caseId = caseData[0].id;
            console.log('  ✅ Found case_id from cases table:', caseId);
          } else {
            console.log('  ⚠️ No open case found for plates:', plate, 'or', plateNoDashes);
            console.log('  ⚠️ Error:', caseError);
          }
        }
        
        const { data, error } = await supabase
          .from('parts_search_sessions')
          .insert({
            case_id: caseId, // SESSION 10: Link to case
            plate: plate,
            search_context: searchParams, // Store actual search params, not PiP metadata
            // Individual fields from search params
            make: searchParams.manufacturer || searchParams.make || null,
            model: searchParams.model || null,
            trim: searchParams.trim || null,
            year: searchParams.year || null,
            engine_volume: searchParams.engine_volume || null,
            engine_code: searchParams.engine_code || null,
            engine_type: searchParams.engine_type || null,
            vin: searchParams.vin || null,
            created_by: null, // TODO: Add user when auth is implemented
            created_at: new Date().toISOString()
          });

        if (error) {
          console.error('❌ SESSION 10: Error creating search session:', error);
          return null;
        }

        // For older Supabase: data is array, get first item
        const sessionId = data && data[0] ? data[0].id : null;
        console.log('✅ SESSION 10: Search session created:', sessionId);
        return sessionId;

      } catch (error) {
        console.error('❌ SESSION 10: Exception creating search session:', error);
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
