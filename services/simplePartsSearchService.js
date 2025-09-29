// simplePartsSearchService.js - WORKING search using real Supabase RPC
// This replaces the broken smartPartsSearchService.js

class SimplePartsSearchService {
  constructor() {
    this.supabase = null;
    this.sessionId = null;
    this.isSearching = false;
    this.initializeSupabase();
  }

  /**
   * Initialize Supabase client
   */
  initializeSupabase() {
    if (window.supabase) {
      this.supabase = window.supabase;
      console.log('✅ Supabase client initialized');
      return;
    }

    setTimeout(() => {
      if (window.supabase) {
        this.supabase = window.supabase;
        console.log('✅ Supabase client initialized after delay');
      } else {
        console.error('❌ Supabase client not available');
      }
    }, 100);
  }

  /**
   * MAIN SEARCH FUNCTION - Uses working smart_parts_search RPC
   */
  async searchParts(searchParams = {}) {
    if (this.isSearching) {
      console.log('🔄 Search already in progress, skipping...');
      return { data: [], error: null };
    }

    this.isSearching = true;
    const startTime = Date.now();

    try {
      if (!this.supabase) {
        console.error('❌ Supabase client not initialized');
        return { data: [], error: new Error('Supabase client not available') };
      }

      console.log('🔍 Starting REAL search with params:', searchParams);

      // Map UI parameters to RPC parameters
      const rpcParams = {
        car_plate: searchParams.plate || searchParams.car_plate || null,
        make_param: searchParams.make || searchParams.manufacturer || null,
        model_param: searchParams.model || null,
        model_code_param: searchParams.model_code || null,
        trim_param: searchParams.trim || null,
        year_param: searchParams.year || null,
        engine_volume_param: searchParams.engine_volume || null,
        engine_code_param: searchParams.engine_code || null,
        engine_type_param: searchParams.engine_type || null,
        vin_number_param: searchParams.vin || searchParams.vin_number || null,
        oem_param: searchParams.oem || searchParams.oemNumber || null,
        free_query_param: searchParams.free_query || searchParams.freeQuery || searchParams.query || null,
        family_param: searchParams.part_group || searchParams.partGroup || searchParams.family || null,
        part_param: searchParams.part_name || searchParams.partName || searchParams.part || null,
        source_param: searchParams.source || searchParams.supplier || null,
        quantity_param: parseInt(searchParams.quantity) || 1,
        limit_results: parseInt(searchParams.limit) || 50
      };

      console.log('📤 Sending to RPC:', rpcParams);

      // Call the WORKING smart_parts_search RPC function from DEPLOY_FUNCTIONS.sql
      const result = await this.supabase.rpc('smart_parts_search', rpcParams);

      const searchTime = Date.now() - startTime;
      
      if (result.error) {
        console.error('❌ RPC search error:', result.error);
        return { data: [], error: result.error };
      }

      const resultData = result.data || [];
      console.log(`✅ REAL search completed in ${searchTime}ms, found ${resultData.length} results`);
      
      // Log what we actually found
      if (resultData.length > 0) {
        console.log('📋 Sample results:', resultData.slice(0, 2));
        console.log('🔍 Makes found:', [...new Set(resultData.map(item => item.make))]);
      }

      return { 
        data: resultData, 
        error: null,
        searchTime,
        totalResults: resultData.length
      };

    } catch (error) {
      console.error('❌ Simple search service error:', error);
      return { data: [], error };
    } finally {
      this.isSearching = false;
    }
  }

  /**
   * Get session ID (simplified)
   */
  getSessionId() {
    if (!this.sessionId) {
      this.sessionId = 'simple_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    }
    return this.sessionId;
  }

  /**
   * Quick search for free text
   */
  async quickSearch(query) {
    return this.searchParts({ 
      free_query: query,
      limit: 30
    });
  }

  /**
   * Advanced search with form data
   */
  async advancedSearch(formData) {
    return this.searchParts(formData);
  }

  /**
   * Reset search state
   */
  reset() {
    this.isSearching = false;
    this.sessionId = null;
  }
}

// Export for use in other modules
if (typeof window !== 'undefined') {
  window.SimplePartsSearchService = SimplePartsSearchService;
  window.SmartPartsSearchService = SimplePartsSearchService; // Replace the broken one
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = SimplePartsSearchService;
}