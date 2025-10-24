// Case Retrieval Service
// Phase 4: Retrieve cases from Supabase for normal operations
// Always loads current version (is_current = true) for active work

import { supabase } from '../lib/supabaseClient.js';

export const caseRetrievalService = {
  
  /**
   * Find and load a case by plate number
   * @param {string} plate - Vehicle plate number
   * @returns {Object} Case data with helper or null if not found
   */
  async loadCaseByPlate(plate) {
    try {
      console.log(`🔍 Searching for case: ${plate}`);
      
      // Step 1: Find case by plate
      const { data: cases, error: caseError } = await supabase
        .from('cases')
        .select(`
          id,
          plate,
          owner_name,
          status,
          assigned_to,
          created_at,
          updated_at
        `)
        .eq('plate', plate)
        .order('created_at', { ascending: false });
      
      if (caseError) {
        console.error('❌ Error finding case:', caseError);
        throw caseError;
      }
      
      if (!cases || cases.length === 0) {
        console.log(`📭 No case found for plate: ${plate}`);
        
        // FALLBACK: Search for orphaned helpers (data integrity issue)
        console.warn(`⚠️ ORPHANED HELPER SEARCH: Searching helper table directly for plate ${plate}`);
        console.warn(`⚠️ DATA INTEGRITY ISSUE: This suggests a helper exists without a corresponding case record`);
        
        const { data: orphanedHelpers, error: orphanError } = await supabase
          .from('case_helper')
          .select(`
            id,
            case_id,
            version,
            helper_name,
            helper_json,
            updated_at,
            source
          `)
          .ilike('helper_name', `%${plate}%`)
          .eq('is_current', true)
          .order('updated_at', { ascending: false });
        
        if (orphanError) {
          console.error('❌ Error searching orphaned helpers:', orphanError);
          return {
            success: false,
            error: 'CASE_NOT_FOUND',
            message: `לא נמצא תיק עבור רכב ${plate}`
          };
        }
        
        if (!orphanedHelpers || orphanedHelpers.length === 0) {
          console.log(`📭 No orphaned helpers found for plate: ${plate}`);
          return {
            success: false,
            error: 'CASE_NOT_FOUND',
            message: `לא נמצא תיק עבור רכב ${plate}`
          };
        }
        
        // Found orphaned helper - use it but warn about data integrity
        const orphanedHelper = orphanedHelpers[0];
        console.warn(`⚠️ USING ORPHANED HELPER: ${orphanedHelper.helper_name}`);
        console.warn(`⚠️ Missing case_id: ${orphanedHelper.case_id} - This should be investigated`);
        
        // Create mock case record for compatibility
        const mockCaseRecord = {
          id: orphanedHelper.case_id,
          plate: plate,
          owner_name: 'לא זמין (נתונים חסרים)',
          status: 'UNKNOWN',
          created_at: orphanedHelper.updated_at,
          updated_at: orphanedHelper.updated_at
        };
        
        // CRITICAL FIX: Unwrap helper_data for orphaned helpers too
        let unwrappedHelper = orphanedHelper.helper_json;
        
        if (unwrappedHelper && unwrappedHelper.helper_data && typeof unwrappedHelper.helper_data === 'object') {
          console.log('🔧 UNWRAPPING orphaned helper_data structure for UI compatibility');
          unwrappedHelper = unwrappedHelper.helper_data;
        }
        
        // Ensure meta exists at root level
        if (unwrappedHelper && !unwrappedHelper.meta && orphanedHelper.helper_json.meta) {
          unwrappedHelper.meta = orphanedHelper.helper_json.meta;
        }

        // Inject case data into helper.meta for UI access (orphaned case)
        if (!unwrappedHelper.meta) {
          unwrappedHelper.meta = {};
        }
        unwrappedHelper.meta.status = mockCaseRecord.status;
        unwrappedHelper.meta.assigned_to = null; // Orphaned helpers don't have assigned_to
        unwrappedHelper.meta.plate = mockCaseRecord.plate;

        return {
          success: true,
          case: mockCaseRecord,
          helper: unwrappedHelper,
          metadata: {
            caseId: mockCaseRecord.id,
            version: orphanedHelper.version,
            helperName: orphanedHelper.helper_name,
            lastUpdated: orphanedHelper.updated_at,
            source: orphanedHelper.source,
            caseStatus: mockCaseRecord.status,
            assignedTo: null,
            dataIntegrityWarning: true,
            warning: 'נמצא helper יתום - יש בעיית שלמות נתונים',
            unwrapped: !!orphanedHelper.helper_json.helper_data
          }
        };
      }
      
      // Use the most recent case if multiple exist
      const caseRecord = cases[0];
      console.log(`✅ Found case: ${caseRecord.id} (${caseRecord.status})`);
      
      // Step 2: Get current helper version
      const { data: helper, error: helperError } = await supabase
        .from('case_helper')
        .select(`
          id,
          version,
          helper_name,
          helper_json,
          updated_at,
          source
        `)
        .eq('case_id', caseRecord.id)
        .eq('is_current', true)
        .single();
      
      if (helperError) {
        console.error('❌ Error loading helper:', helperError);
        
        if (helperError.code === 'PGRST116') {
          // No current helper found
          return {
            success: false,
            error: 'NO_HELPER_DATA',
            message: `נמצא תיק ${plate} אך אין נתוני עבודה זמינים`,
            caseInfo: caseRecord
          };
        }
        
        throw helperError;
      }
      
      console.log(`✅ Loaded helper: ${helper.helper_name} (v${helper.version})`);
      
      // CRITICAL FIX: Unwrap helper_data if it exists
      let unwrappedHelper = helper.helper_json;
      
      // Check if data is wrapped in helper_data structure
      if (unwrappedHelper && unwrappedHelper.helper_data && typeof unwrappedHelper.helper_data === 'object') {
        console.log('🔧 UNWRAPPING helper_data structure for UI compatibility');
        console.log('📦 Original structure had helper_data wrapper - removing it');
        unwrappedHelper = unwrappedHelper.helper_data;
      }
      
      // Ensure meta exists at root level for UI compatibility
      if (unwrappedHelper && !unwrappedHelper.meta && helper.helper_json.meta) {
        unwrappedHelper.meta = helper.helper_json.meta;
      }

      // Inject case data into helper.meta for UI access
      if (!unwrappedHelper.meta) {
        unwrappedHelper.meta = {};
      }
      unwrappedHelper.meta.status = caseRecord.status;
      unwrappedHelper.meta.assigned_to = caseRecord.assigned_to;
      unwrappedHelper.meta.plate = caseRecord.plate;
      console.log(`📋 Injected case data into helper.meta: status=${caseRecord.status}, assigned_to=${caseRecord.assigned_to}`);

      return {
        success: true,
        case: caseRecord,
        helper: unwrappedHelper,
        metadata: {
          caseId: caseRecord.id,
          version: helper.version,
          helperName: helper.helper_name,
          lastUpdated: helper.updated_at,
          source: helper.source,
          caseStatus: caseRecord.status,
          assignedTo: caseRecord.assigned_to,
          unwrapped: !!helper.helper_json.helper_data
        }
      };
      
    } catch (error) {
      console.error('❌ Error in loadCaseByPlate:', error);
      return {
        success: false,
        error: 'SYSTEM_ERROR',
        message: `שגיאה בטעינת תיק: ${error.message}`
      };
    }
  },
  
  /**
   * Search cases by various criteria
   * @param {Object} criteria - Search criteria
   * @returns {Array} Array of matching cases
   */
  async searchCases(criteria = {}) {
    try {
      let query = supabase
        .from('cases')
        .select(`
          id,
          plate,
          owner_name,
          status,
          assigned_to,
          created_at,
          updated_at,
          case_helper!inner(
            version,
            helper_name,
            updated_at,
            is_current
          )
        `)
        .eq('case_helper.is_current', true);
      
      // Apply filters
      if (criteria.plate) {
        query = query.ilike('plate', `%${criteria.plate}%`);
      }
      
      if (criteria.owner) {
        query = query.ilike('owner_name', `%${criteria.owner}%`);
      }
      
      if (criteria.status) {
        query = query.eq('status', criteria.status);
      }
      
      if (criteria.dateFrom) {
        query = query.gte('created_at', criteria.dateFrom);
      }
      
      if (criteria.dateTo) {
        query = query.lte('created_at', criteria.dateTo);
      }
      
      const { data: cases, error } = await query
        .order('updated_at', { ascending: false })
        .limit(50); // Limit results for performance
      
      if (error) throw error;
      
      return cases.map(case_ => ({
        id: case_.id,
        plate: case_.plate,
        ownerName: case_.owner_name,
        status: case_.status,
        createdAt: new Date(case_.created_at).toLocaleDateString('he-IL'),
        updatedAt: new Date(case_.updated_at).toLocaleDateString('he-IL'),
        helperName: case_.case_helper[0]?.helper_name,
        version: case_.case_helper[0]?.version,
        lastHelperUpdate: new Date(case_.case_helper[0]?.updated_at).toLocaleDateString('he-IL')
      }));
      
    } catch (error) {
      console.error('❌ Error searching cases:', error);
      return [];
    }
  },
  
  /**
   * Get recent cases for quick access
   * @param {number} limit - Number of recent cases to fetch
   * @returns {Array} Array of recent cases
   */
  async getRecentCases(limit = 10) {
    try {
      const { data: cases, error } = await supabase
        .from('cases')
        .select(`
          id,
          plate,
          owner_name,
          status,
          assigned_to,
          updated_at,
          case_helper!inner(
            version,
            helper_name,
            updated_at,
            is_current
          )
        `)
        .eq('case_helper.is_current', true)
        .order('updated_at', { ascending: false })
        .limit(limit);
      
      if (error) throw error;
      
      return cases.map(case_ => ({
        plate: case_.plate,
        ownerName: case_.owner_name || 'לא זמין',
        status: this.getStatusDisplay(case_.status),
        lastUpdate: this.getTimeAgo(new Date(case_.updated_at)),
        version: case_.case_helper[0]?.version || 1
      }));
      
    } catch (error) {
      console.error('❌ Error getting recent cases:', error);
      return [];
    }
  },
  
  /**
   * Load case into session storage (for UI compatibility)
   * @param {string} plate - Vehicle plate number
   * @returns {boolean} Success status
   */
  async loadCaseIntoSession(plate) {
    const result = await this.loadCaseByPlate(plate);
    
    if (!result.success) {
      return result;
    }
    
    try {
      // Store in session storage for UI compatibility
      sessionStorage.setItem('helper', JSON.stringify(result.helper));
      sessionStorage.setItem('carData', JSON.stringify(result.helper));
      sessionStorage.setItem('caseLoaded', 'true');
      sessionStorage.setItem('currentPlate', plate);
      
      // Store case metadata
      sessionStorage.setItem('caseMetadata', JSON.stringify(result.metadata));
      
      console.log(`✅ Case ${plate} loaded into session`);
      
      return {
        success: true,
        case: result.case,
        helper: result.helper,
        metadata: result.metadata
      };
      
    } catch (error) {
      console.error('❌ Error storing case in session:', error);
      return {
        success: false,
        error: 'SESSION_ERROR',
        message: 'שגיאה בשמירת התיק בזיכרון המקומי'
      };
    }
  },
  
  /**
   * Get user-friendly status display
   */
  getStatusDisplay(status) {
    const statusMap = {
      'OPEN': 'פתוח',
      'IN_PROGRESS': 'בעבודה',
      'CLOSED': 'סגור',
      'ARCHIVED': 'בארכיון'
    };
    
    return statusMap[status] || status;
  },
  
  /**
   * Get time ago display in Hebrew
   */
  getTimeAgo(date) {
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);
    
    if (diffMins < 1) return 'זה עתה';
    if (diffMins < 60) return `לפני ${diffMins} דקות`;
    if (diffHours < 24) return `לפני ${diffHours} שעות`;
    if (diffDays < 7) return `לפני ${diffDays} ימים`;
    
    return date.toLocaleDateString('he-IL');
  },
  
  /**
   * Validate case data integrity
   */
  validateCaseData(helper) {
    const requiredFields = ['meta', 'vehicle'];
    const missingFields = [];
    
    for (const field of requiredFields) {
      if (!helper[field]) {
        missingFields.push(field);
      }
    }
    
    return {
      valid: missingFields.length === 0,
      missingFields,
      hasVehicleData: !!helper.vehicle?.plate,
      hasCaseInfo: !!helper.case_info,
      hasDamageData: !!helper.damage_assessment?.centers?.length
    };
  }
};

// Make available globally for non-module environments
if (typeof window !== 'undefined') {
  window.caseRetrievalService = caseRetrievalService;
}

export default caseRetrievalService;