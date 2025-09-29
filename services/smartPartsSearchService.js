// smartPartsSearchService.js - New Simplified Search Architecture
// Single API call with flexible parameter handling

class SmartPartsSearchService {
  constructor() {
    this.supabase = null;
    this.sessionId = null;
    this.isSearching = false;
    this.initializeSupabase();
  }

  /**
   * Initialize Supabase client with retry logic
   */
  initializeSupabase() {
    // Try to get supabase from window
    if (window.supabase) {
      this.supabase = window.supabase;
      console.log('✅ Supabase client initialized from window.supabase');
      return;
    }

    // If not available, wait a bit and try again
    setTimeout(() => {
      if (window.supabase) {
        this.supabase = window.supabase;
        console.log('✅ Supabase client initialized after delay');
      } else {
        console.error('❌ Supabase client not available after delay');
      }
    }, 100);
  }

  /**
   * Initialize search session with simple UUID handling
   */
  async initializeSession() {
    try {
      // Generate simple session ID
      this.sessionId = 'search_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
      console.log('🔄 Search session initialized:', this.sessionId);
      return this.sessionId;
    } catch (error) {
      console.warn('⚠️ Session initialization warning:', error.message);
      // Continue without session if there's an issue
      this.sessionId = 'temp_' + Date.now();
      return this.sessionId;
    }
  }

  /**
   * Main search function using single database call
   */
  async searchParts(searchParams = {}) {
    if (this.isSearching) {
      console.log('🔄 Search already in progress, skipping...');
      return { data: [], error: null };
    }

    this.isSearching = true;
    const startTime = Date.now();

    try {
      // Check if Supabase client is available
      if (!this.supabase) {
        console.error('❌ Supabase client not initialized');
        return { data: [], error: new Error('Supabase client not available') };
      }

      console.log('🔍 Starting smart search with params:', searchParams);

      // Clean and prepare search parameters
      const cleanParams = this.prepareSearchParams(searchParams);
      
      // Single database call using RPC
      let data, error;
      
      try {
        // Try the new simple_parts_search function first
        const result = await this.supabase
          .rpc('simple_parts_search', { search_params: cleanParams });
        data = result.data;
        error = result.error;
      } catch (rpcError) {
        console.warn('⚠️ simple_parts_search function not found, trying direct smart_parts_search...');
        
        // Fallback to direct function call
        const result = await this.supabase
          .rpc('smart_parts_search', {
            free_query_param: cleanParams.free_query || null,
            make_param: cleanParams.make || null,
            model_param: cleanParams.model || null,
            year_param: cleanParams.year || null,
            oem_param: cleanParams.oem || null,
            limit_results: cleanParams.limit || 50
          });
        data = result.data;
        error = result.error;
      }

      const searchTime = Date.now() - startTime;
      console.log(`✅ Search completed in ${searchTime}ms, found ${data?.length || 0} results`);

      if (error) {
        console.error('❌ Search error:', error);
        return { data: [], error };
      }

      // Sort results by relevance
      const sortedResults = this.sortResultsByRelevance(data || [], searchParams);

      // Save search results to session (non-blocking)
      this.saveSearchResults(sortedResults, cleanParams).catch(err => {
        console.warn('⚠️ Session save failed (non-blocking):', err.message);
      });

      return { 
        data: sortedResults, 
        error: null,
        searchTime,
        totalResults: sortedResults.length
      };

    } catch (error) {
      console.error('❌ Search service error:', error);
      return { data: [], error };
    } finally {
      this.isSearching = false;
    }
  }

  /**
   * Prepare and clean search parameters
   */
  prepareSearchParams(params) {
    const cleanParams = {};

    // Map all possible parameters from the form
    const paramMapping = {
      'car_plate': params.carPlate || params.car_plate || params.plateNumber,
      'make': params.make || params.carMake,
      'model': params.model || params.carModel,
      'model_code': params.modelCode || params.model_code,
      'trim': params.trim || params.actualTrim || params.actual_trim,
      'year': params.year || params.carYear,
      'engine_volume': params.engineVolume || params.engine_volume,
      'engine_code': params.engineCode || params.engine_code,
      'engine_type': params.engineType || params.engine_type,
      'vin_number': params.vinNumber || params.vin_number || params.vin,
      'oem': params.oem || params.oemNumber,
      'free_query': params.freeQuery || params.free_query || params.searchQuery || params.query,
      'family': params.family || params.partFamily || params.part_family,
      'part': params.part || params.partType,
      'source': params.source || params.supplier,
      'quantity': params.quantity || 1,
      'limit': params.limit || 50
    };

    // Only include non-empty parameters
    Object.keys(paramMapping).forEach(key => {
      const value = paramMapping[key];
      if (value !== null && value !== undefined && value !== '') {
        cleanParams[key] = String(value).trim();
      }
    });

    console.log('🧹 Cleaned search params:', cleanParams);
    return cleanParams;
  }

  /**
   * Sort results by relevance for better user experience
   */
  sortResultsByRelevance(results, searchParams) {
    return results.sort((a, b) => {
      let scoreA = 0;
      let scoreB = 0;

      // Boost items with OEM numbers
      if (a.oem && a.oem.length > 8) scoreA += 10;
      if (b.oem && b.oem.length > 8) scoreB += 10;

      // Boost items with prices
      if (a.price && parseFloat(a.price) > 0) scoreA += 5;
      if (b.price && parseFloat(b.price) > 0) scoreB += 5;

      // Boost exact make matches
      if (searchParams.make && a.make && 
          a.make.toLowerCase().includes(searchParams.make.toLowerCase())) {
        scoreA += 8;
      }
      if (searchParams.make && b.make && 
          b.make.toLowerCase().includes(searchParams.make.toLowerCase())) {
        scoreB += 8;
      }

      // Boost items with part family
      if (a.part_family) scoreA += 3;
      if (b.part_family) scoreB += 3;

      return scoreB - scoreA;
    });
  }

  /**
   * Save search results to session (robust with table structure check)
   */
  async saveSearchResults(results, searchParams) {
    try {
      if (!this.sessionId) {
        await this.initializeSession();
      }

      console.log('💾 Attempting to save search session...');
      
      // First, check what table structure exists
      try {
        // Try to get table structure by querying with limit 0
        const { error: structureError } = await this.supabase
          .from('parts_search_results')
          .select('*')
          .limit(0);

        if (structureError) {
          console.warn('⚠️ parts_search_results table not available:', structureError.message);
          return false;
        }

        // Create minimal session data that should be compatible
        const sessionData = {
          id: this.sessionId,
          search_params: JSON.stringify(searchParams),
          results_count: results.length,
          created_at: new Date().toISOString()
        };

        // Try insert first, then update if exists
        const { error: insertError } = await this.supabase
          .from('parts_search_results')
          .insert(sessionData);

        if (insertError) {
          // If insert fails, try update
          const { error: updateError } = await this.supabase
            .from('parts_search_results')
            .update({
              search_params: sessionData.search_params,
              results_count: sessionData.results_count,
              updated_at: sessionData.created_at
            })
            .eq('id', this.sessionId);

          if (updateError) {
            console.warn('⚠️ Could not save/update session:', updateError.message);
            return false;
          }
        }

        console.log('✅ Session saved successfully');
        return true;

      } catch (saveError) {
        console.warn('⚠️ Session save error:', saveError.message);
        return false;
      }

    } catch (error) {
      console.warn('⚠️ Session save warning:', error.message);
      return false;
    }
  }

  /**
   * Quick search for free text queries (main use case)
   */
  async quickSearch(query) {
    return this.searchParts({ 
      free_query: query,
      limit: 30
    });
  }

  /**
   * Advanced search with multiple parameters
   */
  async advancedSearch(formData) {
    return this.searchParts(formData);
  }

  /**
   * Get current session ID
   */
  getSessionId() {
    return this.sessionId;
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
  window.SmartPartsSearchService = SmartPartsSearchService;
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = SmartPartsSearchService;
}