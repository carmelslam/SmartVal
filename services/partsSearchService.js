// services/partsSearchService.js - Supabase Parts Search Integration
// Phase 5: Connecting parts search.html to Supabase with comprehensive filtering

import { supabase } from '../lib/supabaseClient.js';

class PartsSearchService {
  constructor() {
    this.sessionId = null;
    this.currentSearchContext = {};
  }

  /**
   * Main search function that accepts all query parameters from parts search.html
   * Implements filtering levels as per architecture: Level 1 (car filters) → Level 2 (part filters)
   */
  async searchParts(queryParams) {
    console.log('🔍 Parts Search Service: Starting comprehensive search', queryParams);
    
    try {
      // Validate and prepare search parameters
      const searchParams = this.prepareSearchParams(queryParams);
      
      // Create search session first
      if (searchParams.plate || searchParams.make || searchParams.model) {
        this.sessionId = await this.createSearchSession(searchParams);
      }
      
      // Execute multi-level search strategy
      const results = await this.executeMultiLevelSearch(searchParams);
      
      // Save search results to database
      if (results.length > 0 && this.sessionId) {
        await this.saveSearchResults(results, searchParams);
      }
      
      return {
        success: true,
        results,
        sessionId: this.sessionId,
        searchContext: searchParams,
        totalFound: results.length,
        searchType: this.determineSearchType(searchParams)
      };
      
    } catch (error) {
      console.error('❌ Parts search error:', error);
      return {
        success: false,
        error: error.message,
        results: [],
        fallbackToMakecom: true
      };
    }
  }

  /**
   * Prepare and validate search parameters from form
   */
  prepareSearchParams(queryParams) {
    const params = {
      // Vehicle identification (Level 1 filters)
      plate: queryParams.plate?.trim() || null,
      make: queryParams.manufacturer?.trim() || null,
      model: queryParams.model?.trim() || null,
      trim: queryParams.trim?.trim() || null,
      year: queryParams.year?.trim() || null,
      engine_volume: queryParams.engine_volume?.trim() || null,
      engine_code: queryParams.engine_code?.trim() || null,
      engine_type: queryParams.engine_type?.trim() || null,
      vin: queryParams.vin?.trim() || null,
      
      // Part identification (Level 2 filters)
      oem: queryParams.oem?.trim() || null,
      part_family: queryParams.part_group?.trim() || null,
      part_name: queryParams.part_name?.trim() || null,
      free_query: queryParams.free_query?.trim() || null,
      
      // Additional context
      selected_parts: queryParams.selectedParts || [],
      search_type: queryParams.search_type || 'comprehensive',
      timestamp: new Date().toISOString()
    };
    
    this.currentSearchContext = params;
    return params;
  }

  /**
   * Execute multi-level search as per architecture
   * Level 1: Car filters → Level 2: Part filters → Results
   */
  async executeMultiLevelSearch(params) {
    console.log('🎯 Executing multi-level search strategy');
    
    const searchStrategies = [
      () => this.searchByCatalog(params),
      () => this.searchByOEM(params),
      () => this.searchByFreeQuery(params),
      () => this.searchByVehicleOnly(params)
    ];
    
    let allResults = [];
    
    for (const strategy of searchStrategies) {
      try {
        const results = await strategy();
        if (results && results.length > 0) {
          allResults = allResults.concat(results);
          console.log(`✅ Found ${results.length} results from strategy`);
        }
      } catch (error) {
        console.warn('⚠️ Search strategy failed:', error.message);
        continue;
      }
    }
    
    // Remove duplicates based on ID
    const uniqueResults = this.removeDuplicates(allResults);
    
    // Sort by relevance
    return this.sortByRelevance(uniqueResults, params);
  }

  /**
   * Search using the comprehensive PostgreSQL function
   */
  async searchByCatalog(params) {
    console.log('📊 Searching catalog using comprehensive function');
    
    try {
      // Call the PostgreSQL function directly
      const { data, error } = await supabase
        .rpc('search_parts_comprehensive', {
          p_plate: params.plate,
          p_make: params.make,
          p_model: params.model,
          p_trim_level: params.trim,
          p_year: params.year,
          p_engine_volume: params.engine_volume,
          p_engine_code: params.engine_code,
          p_engine_type: params.engine_type,
          p_vin: params.vin,
          p_oem: params.oem,
          p_part_family: params.part_family,
          p_part_name: params.part_name,
          p_free_query: params.free_query
        });

      if (error) {
        console.error('❌ Catalog search function error:', error);
        return [];
      }

      console.log(`✅ Catalog search found ${data?.length || 0} results`);
      return data || [];
      
    } catch (error) {
      console.error('❌ Catalog search error:', error);
      return [];
    }
  }

  /**
   * Direct OEM search if OEM field is provided
   */
  async searchByOEM(params) {
    if (!params.oem) return [];
    
    console.log('🔍 Searching by OEM number:', params.oem);
    
    try {
      const { data, error } = await supabase
        .from('catalog_items')
        .select(`
          id, supplier_name, pcode, cat_num_desc, price, oem,
          availability, location, comments, make, model, trim,
          engine_volume, part_family, source
        `)
        .ilike('oem', `%${params.oem}%`)
        .limit(50);

      if (error) {
        console.error('❌ OEM search error:', error);
        return [];
      }

      console.log(`✅ OEM search found ${data?.length || 0} results`);
      return data || [];
      
    } catch (error) {
      console.error('❌ OEM search error:', error);
      return [];
    }
  }

  /**
   * Free text search across multiple fields
   */
  async searchByFreeQuery(params) {
    if (!params.free_query) return [];
    
    console.log('🔍 Free query search:', params.free_query);
    
    try {
      const query = `%${params.free_query}%`;
      
      const { data, error } = await supabase
        .from('catalog_items')
        .select(`
          id, supplier_name, pcode, cat_num_desc, price, oem,
          availability, location, comments, make, model, trim,
          engine_volume, part_family, source
        `)
        .or(`cat_num_desc.ilike.${query},oem.ilike.${query},make.ilike.${query},model.ilike.${query},part_family.ilike.${query},supplier_name.ilike.${query}`)
        .limit(100);

      if (error) {
        console.error('❌ Free query search error:', error);
        return [];
      }

      console.log(`✅ Free query search found ${data?.length || 0} results`);
      return data || [];
      
    } catch (error) {
      console.error('❌ Free query search error:', error);
      return [];
    }
  }

  /**
   * Vehicle-only search for broad matching
   */
  async searchByVehicleOnly(params) {
    if (!params.make && !params.model) return [];
    
    console.log('🚗 Vehicle-only search');
    
    try {
      let query = supabase
        .from('catalog_items')
        .select(`
          id, supplier_name, pcode, cat_num_desc, price, oem,
          availability, location, comments, make, model, trim,
          engine_volume, part_family, source
        `);

      if (params.make) {
        query = query.ilike('make', `%${params.make}%`);
      }
      
      if (params.model) {
        query = query.ilike('model', `%${params.model}%`);
      }
      
      const { data, error } = await query.limit(200);

      if (error) {
        console.error('❌ Vehicle search error:', error);
        return [];
      }

      console.log(`✅ Vehicle search found ${data?.length || 0} results`);
      return data || [];
      
    } catch (error) {
      console.error('❌ Vehicle search error:', error);
      return [];
    }
  }

  /**
   * Create search session for tracking
   */
  async createSearchSession(params) {
    try {
      const sessionData = {
        plate: params.plate,
        search_context: {
          query: params,
          timestamp: params.timestamp,
          search_type: 'supabase_comprehensive'
        }
      };

      // Add vehicle data if available
      if (params.make || params.model) {
        sessionData.make = params.make;
        sessionData.model = params.model;
        sessionData.trim = params.trim;
        sessionData.year = params.year;
        sessionData.engine_volume = params.engine_volume;
        sessionData.engine_code = params.engine_code;
        sessionData.engine_type = params.engine_type;
        sessionData.vin = params.vin;
      }

      const { data, error } = await supabase
        .from('parts_search_sessions')
        .insert(sessionData)
        .select('id')
        .single();

      if (error) {
        console.error('❌ Failed to create search session:', error);
        return null;
      }

      console.log('✅ Created search session:', data.id);
      return data.id;
      
    } catch (error) {
      console.error('❌ Search session creation error:', error);
      return null;
    }
  }

  /**
   * Save search results for tracking and analysis
   */
  async saveSearchResults(results, params) {
    if (!this.sessionId || !results.length) return;
    
    try {
      const resultData = {
        session_id: this.sessionId,
        supplier: 'supabase_catalog',
        search_query: params,
        results: results,
        plate: params.plate,
        make: params.make,
        model: params.model
      };

      const { error } = await supabase
        .from('parts_search_results')
        .insert(resultData);

      if (error) {
        console.error('❌ Failed to save search results:', error);
      } else {
        console.log(`✅ Saved ${results.length} search results`);
      }
      
    } catch (error) {
      console.error('❌ Save results error:', error);
    }
  }

  /**
   * Save selected part to database
   */
  async saveSelectedPart(partData, plate, damageCenterId = null) {
    try {
      const { data, error } = await supabase
        .rpc('save_selected_part_complete', {
          p_plate: plate,
          p_part_data: partData,
          p_damage_center_id: damageCenterId
        });

      if (error) {
        console.error('❌ Failed to save selected part:', error);
        return { success: false, error: error.message };
      }

      console.log('✅ Saved selected part:', data);
      return { success: true, partId: data };
      
    } catch (error) {
      console.error('❌ Save selected part error:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Utility functions
   */
  removeDuplicates(results) {
    const seen = new Set();
    return results.filter(item => {
      const key = `${item.id}_${item.oem}_${item.pcode}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }

  sortByRelevance(results, params) {
    return results.sort((a, b) => {
      let scoreA = 0;
      let scoreB = 0;
      
      // Exact matches get higher scores
      if (params.make && a.make?.toLowerCase().includes(params.make.toLowerCase())) scoreA += 10;
      if (params.make && b.make?.toLowerCase().includes(params.make.toLowerCase())) scoreB += 10;
      
      if (params.model && a.model?.toLowerCase().includes(params.model.toLowerCase())) scoreA += 10;
      if (params.model && b.model?.toLowerCase().includes(params.model.toLowerCase())) scoreB += 10;
      
      if (params.oem && a.oem?.toLowerCase().includes(params.oem.toLowerCase())) scoreA += 15;
      if (params.oem && b.oem?.toLowerCase().includes(params.oem.toLowerCase())) scoreB += 15;
      
      // Price preference (lower is better)
      const priceA = parseFloat(a.price) || 999999;
      const priceB = parseFloat(b.price) || 999999;
      
      if (scoreA === scoreB) {
        return priceA - priceB;
      }
      
      return scoreB - scoreA;
    });
  }

  determineSearchType(params) {
    if (params.oem) return 'oem_search';
    if (params.part_family && params.part_name) return 'specific_part';
    if (params.free_query) return 'free_text';
    if (params.make && params.model) return 'vehicle_based';
    return 'general';
  }
}

// Export singleton instance
export const partsSearchService = new PartsSearchService();

// Global access for debugging
if (typeof window !== 'undefined') {
  window.partsSearchService = partsSearchService;
}