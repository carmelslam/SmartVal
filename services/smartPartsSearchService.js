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
      
      // Use existing catalog_items table with standard SQL queries (no custom functions needed)
      let data, error;
      
      try {
        // Simple search using basic Supabase methods
        let query = this.supabase.from('catalog_items').select('*');
        
        // Find the primary search term
        let primarySearchTerm = null;
        if (cleanParams.free_query) {
          primarySearchTerm = this.processHebrewSearch(cleanParams.free_query);
          query = query.ilike('cat_num_desc', `%${primarySearchTerm}%`);
        } else if (cleanParams.oem) {
          query = query.ilike('oem', `%${cleanParams.oem}%`);
        } else if (cleanParams.make) {
          query = query.ilike('make', `%${cleanParams.make}%`);
        } else {
          // Default search - get recent items
          query = query.limit(cleanParams.limit || 20);
        }
        
        // Add ordering and limit
        if (primarySearchTerm || cleanParams.oem || cleanParams.make) {
          query = query.limit(cleanParams.limit || 50);
        }
        query = query.order('id', { ascending: false });
        
        const result = await query;
        data = result.data || [];
        error = result.error;
        
        console.log('✅ Using simple table query (compatible with all Supabase clients)');
        
      } catch (queryError) {
        console.error('❌ Direct query failed:', queryError);
        data = [];
        error = queryError;
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
   * Process Hebrew search terms with automatic corrections
   */
  processHebrewSearch(searchTerm) {
    if (!searchTerm) return searchTerm;
    
    let processed = searchTerm.trim();
    
    // Fix common reversed Hebrew patterns that appear in the database
    const hebrewCorrections = {
      'סנפ': 'פנס',        // headlight
      'ףנכ': 'כנף',        // wing  
      'תותיא': 'איתות',     // signals
      'לאמש': 'שמאל',       // left
      'נימי': 'ימין',       // right
      'הטויוט': 'טויוטה',   // Toyota
    };
    
    // Apply corrections
    for (const [reversed, correct] of Object.entries(hebrewCorrections)) {
      if (processed.includes(reversed)) {
        processed = processed.replace(reversed, correct);
        console.log(`🔄 Hebrew correction: ${reversed} → ${correct}`);
      }
    }
    
    return processed;
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
   * Save search results to session (graceful degradation)
   */
  async saveSearchResults(results, searchParams) {
    // Skip session saving to avoid table structure conflicts
    // Search functionality works fine without session persistence
    console.log('ℹ️ Session saving disabled to avoid table structure conflicts');
    console.log(`📊 Search completed: ${results.length} results for`, Object.keys(searchParams));
    return true;
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