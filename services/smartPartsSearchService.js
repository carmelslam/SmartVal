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
        // Multiple search queries to find matches with different variations
        const allResults = [];
        let searchPerformed = false;
        
        // Search by free query with enhanced Hebrew RPC support
        if (cleanParams.free_query) {
          const isHebrewQuery = this.isHebrewText(cleanParams.free_query);
          
          try {
            let result;
            
            if (isHebrewQuery) {
              // For Hebrew text, use the new RPC function
              console.log(`🔍 Hebrew RPC search for: "${cleanParams.free_query}"`);
              result = await this.performHebrewSearch(
                cleanParams.free_query, 
                cleanParams.make, 
                cleanParams.model, 
                30
              );
            } else {
              // For English text, use standard search with multiple variations
              const variations = this.generateSearchVariations(cleanParams.free_query);
              result = { data: [], error: null };
              
              for (const variation of variations.slice(0, 3)) {
                try {
                  const varResult = await this.supabase
                    .from('catalog_items')
                    .select('*')
                    .ilike('cat_num_desc', `%${variation}%`)
                    .limit(15);
                  
                  if (varResult.data && varResult.data.length > 0) {
                    result.data.push(...varResult.data);
                    console.log(`✅ Found ${varResult.data.length} results for: "${variation}"`);
                  }
                } catch (err) {
                  console.warn(`⚠️ Search failed for variation "${variation}":`, err.message);
                }
              }
            }
            
            if (result.data && result.data.length > 0) {
              allResults.push(...result.data);
              console.log(`✅ Free query search found ${result.data.length} total results`);
            }
          } catch (err) {
            console.warn(`⚠️ Free query search failed:`, err.message);
          }
          searchPerformed = true;
        }
        
        // Search by make with enhanced Hebrew RPC support
        if (cleanParams.make && !cleanParams.free_query) {
          // Only search by make if we haven't already done a comprehensive free query search
          const isHebrewMake = this.isHebrewText(cleanParams.make);
          
          try {
            let result;
            
            if (isHebrewMake) {
              // For Hebrew manufacturers, use RPC search
              console.log(`🔍 Hebrew make RPC search for: "${cleanParams.make}"`);
              result = await this.performHebrewSearch(
                cleanParams.make, 
                null, // Don't filter by make since we're searching for make
                cleanParams.model, 
                25
              );
            } else {
              // For English manufacturers, use standard ILIKE with variations
              const makeVariations = this.generateSearchVariations(cleanParams.make);
              result = { data: [], error: null };
              
              for (const variation of makeVariations.slice(0, 3)) {
                try {
                  const varResult = await this.supabase
                    .from('catalog_items')
                    .select('*')
                    .ilike('make', `%${variation}%`)
                    .limit(15);
                  
                  if (varResult.data && varResult.data.length > 0) {
                    result.data.push(...varResult.data);
                    console.log(`✅ Found ${varResult.data.length} results for make: "${variation}"`);
                  }
                } catch (err) {
                  console.warn(`⚠️ Make search failed for "${variation}":`, err.message);
                }
              }
            }
            
            if (result.data && result.data.length > 0) {
              allResults.push(...result.data);
              console.log(`✅ Make search found ${result.data.length} total results`);
            }
          } catch (err) {
            console.warn(`⚠️ Make search failed:`, err.message);
          }
          searchPerformed = true;
        }
        
        // Search by PCODE (exact)
        if (cleanParams.oem) {
          try {
            const result = await this.supabase
              .from('catalog_items')
              .select('*')
              .ilike('pcode', `%${cleanParams.oem}%`)
              .limit(30);
            
            if (result.data && result.data.length > 0) {
              allResults.push(...result.data);
              console.log(`✅ Found ${result.data.length} results for PCODE: "${cleanParams.oem}"`);
            }
          } catch (err) {
            console.warn(`⚠️ PCODE search failed:`, err.message);
          }
          searchPerformed = true;
        }
        
        // If no specific search was performed, get recent items
        if (!searchPerformed) {
          try {
            const result = await this.supabase
              .from('catalog_items')
              .select('*')
              .order('created_at', { ascending: false })
              .limit(20);
            
            if (result.data) {
              allResults.push(...result.data);
              console.log(`✅ Retrieved ${result.data.length} recent items`);
            }
          } catch (err) {
            console.warn(`⚠️ Default search failed:`, err.message);
          }
        }
        
        // Remove duplicates and limit results
        const uniqueResults = allResults.filter((item, index, self) => 
          index === self.findIndex(t => t.id === item.id)
        );
        
        data = uniqueResults.slice(0, cleanParams.limit || 50);
        error = null;
        
        console.log('✅ Multi-variation search completed - compatible with all Supabase clients');
        
      } catch (queryError) {
        console.error('❌ Multi-search failed:', queryError);
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
   * Process Hebrew search terms with automatic corrections and variations
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
   * Check if text contains Hebrew characters
   */
  isHebrewText(text) {
    if (!text) return false;
    return /[\u0590-\u05FF]/.test(text);
  }

  /**
   * Enhanced Hebrew search using Supabase RPC function
   */
  async performHebrewSearch(searchTerm, make = null, model = null, limit = 50) {
    try {
      console.log(`🔍 Using Hebrew RPC search for: "${searchTerm}"`);
      
      // Strategy 1: Use the comprehensive Hebrew RPC function
      const result = await this.supabase.rpc('search_catalog_hebrew_filtered', {
        search_term: searchTerm,
        filter_make: make,
        filter_model: model,
        max_results: limit
      });
      
      if (result.data && result.data.length > 0) {
        console.log(`✅ Hebrew RPC search found: ${result.data.length} results`);
        return result;
      }
      
      // Strategy 2: Fallback to basic RPC if filtered search returns nothing
      if (make || model) {
        console.log(`🔄 Trying Hebrew RPC without filters...`);
        const fallbackResult = await this.supabase.rpc('search_catalog_hebrew', {
          search_term: searchTerm
        });
        
        if (fallbackResult.data && fallbackResult.data.length > 0) {
          console.log(`✅ Hebrew RPC fallback found: ${fallbackResult.data.length} results`);
          return fallbackResult;
        }
      }

      // Strategy 2.5: Try the simple Hebrew search function
      console.log(`🔄 Trying simple Hebrew RPC search...`);
      const simpleResult = await this.supabase.rpc('search_catalog_hebrew_simple', {
        search_term: searchTerm,
        max_results: limit
      });
      
      if (simpleResult.data && simpleResult.data.length > 0) {
        console.log(`✅ Simple Hebrew RPC found: ${simpleResult.data.length} results`);
        return simpleResult;
      }

      // Strategy 3: Client-side Hebrew search as final fallback
      console.log(`🔄 Using client-side Hebrew search fallback for "${searchTerm}"`);
      return await this.performClientSideHebrewSearch(searchTerm, limit);
      
    } catch (error) {
      console.error('❌ Hebrew RPC search error:', error);
      // Fallback to client-side search
      console.log('🔄 Falling back to client-side Hebrew search...');
      return await this.performClientSideHebrewSearch(searchTerm, limit);
    }
  }

  /**
   * Client-side Hebrew search fallback
   */
  async performClientSideHebrewSearch(searchTerm, limit = 20) {
    try {
      console.log(`🔍 Client-side Hebrew search for: "${searchTerm}"`);
      
      const allDataResult = await this.supabase
        .from('catalog_items')
        .select('*')
        .limit(1000); // Limit to prevent huge downloads
        
      if (!allDataResult.data) {
        return { data: [], error: allDataResult.error };
      }
      
      // Filter results client-side with Hebrew-aware matching
      const normalizedSearch = this.normalizeHebrewText(searchTerm.toLowerCase());
      const filteredResults = allDataResult.data.filter(item => {
        // Check multiple fields for Hebrew text
        const fields = [
          item.cat_num_desc, item.part_family, item.make, 
          item.model, item.supplier_name, item.oem, item.pcode
        ];
        
        return fields.some(fieldValue => {
          if (!fieldValue) return false;
          
          const normalizedField = this.normalizeHebrewText(fieldValue.toLowerCase());
          
          // Multiple matching strategies
          return normalizedField.includes(normalizedSearch) || 
                 normalizedField.includes(searchTerm.toLowerCase()) ||
                 fieldValue.toLowerCase().includes(searchTerm.toLowerCase()) ||
                 fieldValue === searchTerm; // Exact match
        });
      }).slice(0, limit);
      
      console.log(`✅ Client-side Hebrew search found: ${filteredResults.length} results`);
      return { data: filteredResults, error: null };
      
    } catch (error) {
      console.error('❌ Client-side Hebrew search error:', error);
      return { data: [], error };
    }
  }

  /**
   * Enhanced Hebrew text normalization for better matching
   */
  normalizeHebrewText(text) {
    if (!text) return text;
    
    // Convert to string if needed and trim
    let normalized = String(text).trim();
    
    // Remove Hebrew vowels (nikud) and special characters
    normalized = normalized
      .replace(/[\u0591-\u05C7]/g, '') // Remove all Hebrew vowel points (niqqud)
      .replace(/[\u200E\u200F\u202A-\u202E]/g, '') // Remove RTL/LTR marks
      .replace(/[\u05BE\u05C0\u05C3]/g, '') // Remove Hebrew punctuation
      .trim();
    
    // Handle common Hebrew character variations (final forms to regular)
    const characterVariations = {
      'ך': 'כ', 'ם': 'מ', 'ן': 'נ', 'ף': 'פ', 'ץ': 'צ'
    };
    
    for (const [final, regular] of Object.entries(characterVariations)) {
      normalized = normalized.replace(new RegExp(final, 'g'), regular);
    }
    
    // Normalize Unicode (NFC normalization)
    try {
      normalized = normalized.normalize('NFC');
    } catch (error) {
      console.warn('Unicode normalization failed:', error);
    }
    
    return normalized;
  }

  /**
   * Create multiple search variations for Hebrew text
   */
  createHebrewSearchVariations(searchTerm) {
    if (!searchTerm) return [searchTerm];
    
    const variations = new Set([searchTerm]);
    
    // Add normalized version
    const normalized = this.normalizeHebrewText(searchTerm);
    if (normalized !== searchTerm) {
      variations.add(normalized);
    }
    
    // Add lowercase version
    variations.add(searchTerm.toLowerCase());
    variations.add(normalized.toLowerCase());
    
    // Add variations without spaces
    if (searchTerm.includes(' ')) {
      variations.add(searchTerm.replace(/\s+/g, ''));
      variations.add(normalized.replace(/\s+/g, ''));
    }
    
    // Add variations with different spacing
    if (searchTerm.length > 3) {
      variations.add(searchTerm.replace(/\s+/g, ' ')); // Normalize spaces
    }
    
    return Array.from(variations).filter(v => v && v.length > 0);
  }

  /**
   * Generate multiple search variations for better matching
   */
  generateSearchVariations(searchTerm) {
    if (!searchTerm) return [searchTerm];
    
    const variations = [searchTerm];
    const isHebrew = this.isHebrewText(searchTerm);
    
    // If Hebrew, add normalized version
    if (isHebrew) {
      const normalized = this.normalizeHebrewText(searchTerm);
      if (normalized !== searchTerm) {
        variations.push(normalized);
      }
    }
    
    // Hebrew/English make variations
    const makeVariations = {
      'טויוטה': ['toyota', 'TOYOTA', 'Toyota', 'TOYOT'],
      'יוליק': ['ULIK', 'ulik', 'Ulik'],
      'פולקסווגן': ['volkswagen', 'vw', 'VW', 'Volkswagen', 'VAG'],
      'פורד': ['ford', 'FORD', 'Ford'],
      'רנו': ['renault', 'RENAULT', 'Renault'],
      'ב.מ.וו': ['bmw', 'BMW'],
      'מרצדס': ['mercedes', 'MERCEDES', 'Mercedes'],
      // Reverse mappings for English to Hebrew
      'toyota': ['טויוטה', 'TOYOT'],
      'vag': ['פולקסווגן', 'VAG'],
      'ford': ['פורד', 'FORD'],
      'bmw': ['ב.מ.וו', 'BMW'],
      'mercedes': ['מרצדס', 'MERCEDES']
    };
    
    // Part name variations  
    const partVariations = {
      'פנס': ['light', 'headlight', 'lamp', 'פנסים'],
      'כנף': ['wing', 'panel', 'fender'],
      'מראה': ['mirror', 'מראות'],
      'דלת': ['door', 'דלתות'],
      'פגוש': ['bumper', 'פגושים']
    };
    
    // Add variations based on search term
    const searchKey = searchTerm.toLowerCase();
    if (makeVariations[searchKey]) {
      variations.push(...makeVariations[searchKey]);
    }
    if (makeVariations[searchTerm]) {
      variations.push(...makeVariations[searchTerm]);
    }
    
    if (partVariations[searchKey]) {
      variations.push(...partVariations[searchKey]);
    }
    if (partVariations[searchTerm]) {
      variations.push(...partVariations[searchTerm]);
    }
    
    console.log(`🔍 Search variations for "${searchTerm}":`, variations);
    return variations;
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