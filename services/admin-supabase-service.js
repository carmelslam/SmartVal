/**
 * Admin Supabase Service
 * Handles all admin hub queries to Supabase database
 * Phase 9: Admin Hub Enhancement - Supabase Integration
 */

// Import supabase client - using lib/supabaseClient.js which is already loaded in HTML
// The supabase object is available globally from the HTML script tag
// No import needed - we'll access window.supabase

class AdminSupabaseService {
  constructor() {
    this.cache = new Map();
    this.cacheTimeout = 2 * 60 * 1000; // 2 minutes cache
    // Get supabase from window (loaded via script tag in HTML)
    this.supabase = null;
  }

  _getSupabase() {
    // Lazy load supabase reference from window.supabaseClient
    if (!this.supabase && typeof window !== 'undefined') {
      this.supabase = window.supabaseClient || window.supabase;
    }
    if (!this.supabase) {
      throw new Error('Supabase client not initialized. Make sure lib/supabaseClient.js is loaded.');
    }
    return this.supabase;
  }

  /**
   * Get case status by plate number
   * Uses tracking_general table for comprehensive case info
   */
  async getCaseStatus(plate) {
    try {
      const supabase = this._getSupabase();
      console.log(`📊 Fetching case status for plate: ${plate}`);

      // Query tracking_general for complete case overview
      const { data: generalData, error: generalError } = await supabase
        .from('tracking_general')
        .select('*')
        .eq('plate', plate)
        .single();

      if (generalError && generalError.code !== 'PGRST116') { // PGRST116 = no rows
        throw generalError;
      }

      // Query tracking_expertise for damage assessment
      const { data: expertiseData, error: expertiseError } = await supabase
        .from('tracking_expertise')
        .select('*')
        .eq('plate', plate);

      if (expertiseError && expertiseError.code !== 'PGRST116') {
        throw expertiseError;
      }

      // Query tracking_final_report for estimate/opinion
      const { data: reportData, error: reportError } = await supabase
        .from('tracking_final_report')
        .select('*')
        .eq('plate', plate)
        .order('record_timestamp', { ascending: false })
        .limit(2);

      if (reportError && reportError.code !== 'PGRST116') {
        throw reportError;
      }

      // Format response to match expected structure
      return this._formatCaseStatusResponse(generalData, expertiseData, reportData);
    } catch (error) {
      console.error('Error fetching case status:', error);
      throw error;
    }
  }

  /**
   * Format case status response to match UI expectations
   */
  _formatCaseStatusResponse(general, expertise, reports) {
    if (!general) {
      return null;
    }

    // Build response object matching the UI structure
    const response = {
      'תמ"צ כללי': {
        'מספר תיק': general.case_number || 'לא זמין',
        'תאריך הבדיקה': this._formatDate(general.inspection_date),
        'תאריך חוו"ד': this._formatDate(general.opinion_date),
        'מס.רכב': general.plate || 'לא זמין',
        'שם היצרן': general.manufacturer || 'לא זמין',
        'שנת ייצור': general.year_of_manufacture || 'לא זמין',
        'ערך הרכב': general.vehicle_value ? `${general.vehicle_value.toLocaleString('he-IL')} ₪` : 'לא זמין',
        'שם בעל הרכב': general.owner_name || 'לא זמין',
        'טלפון': general.phone || 'לא זמין',
        'מוסך': general.garage_name || 'לא זמין',
        'טלפון מוסך': general.garage_phone || 'לא זמין',
        'E-mail': general.email || 'לא זמין',
        'דירקטיבה': general.directive || 'לא זמין',
        'תמונות': general.photos_link || 'לא זמין',
        'מס\' תמונות': general.photo_count || 0,
        'התקבלה חשבונית': general.invoice_received ? 'כן' : 'לא',
        'התקבל תשלום': general.payment_received ? 'כן' : 'לא',
        'תיק בתביעה': general.case_in_claim || 'לא',
        'סטטוס כללי': general.general_status || 'בעבודה',
        'הערות כלליות': general.general_notes || 'אין הערות',
        'לינק לתיק': general.case_link || 'לא זמין',
        'TimeStamp': this._formatDateTime(general.record_timestamp)
      },
      'אקספירטיזה': {},
      'חוו"ד': {}
    };

    // Add expertise data if available
    if (expertise && expertise.length > 0) {
      const exp = expertise[0]; // Take first damage center for summary
      response['אקספירטיזה'] = {
        'מספר תיק': general.case_number || 'לא זמין',
        'מספר רכב': general.plate || 'לא זמין',
        'מס מוקדי נזק': general.damage_centers_count || expertise.length,
        'מוקד נזק': exp.damage_center || 'לא זמין',
        'תיאור': exp.description || 'לא זמין',
        'תיקונים מתוכננים': exp.planned_repairs || 'לא זמין',
        'חלקים מתוכננים': exp.planned_parts || 'לא זמין',
        'עבודות מתוכננות': exp.planned_labor || 'לא זמין',
        'הנחייה': exp.guidance || 'לא זמין',
        'הערות': exp.notes || 'אין הערות'
      };
    }

    // Add report data if available (take estimate and opinion separately)
    if (reports && reports.length > 0) {
      const estimate = reports.find(r => r.report_type === 'estimate');
      const opinion = reports.find(r => r.report_type === 'opinion');

      if (estimate || opinion) {
        const report = estimate || opinion;
        response['חוו"ד'] = {
          'מספר רכב': general.plate || 'לא זמין',
          'מס מוקדי נזק': report.damage_centers_count || 'לא זמין',
          'מוקד נזק': report.damage_center || 'לא זמין',
          'תיקונים בפועל': report.actual_repairs || 'טרם בוצעו',
          'סה"כ חלקים בפועל': report.total_parts ? `${report.total_parts.toLocaleString('he-IL')} ₪` : 'לא זמין',
          'סה"כ עבודות בפועל': report.total_labor ? `${report.total_labor.toLocaleString('he-IL')} ₪` : 'לא זמין',
          'סכום לתביעה': report.claim_amount ? `${report.claim_amount.toLocaleString('he-IL')} ₪` : 'לא זמין',
          'ירידת ערך': report.depreciation ? `${report.depreciation.toLocaleString('he-IL')} ₪` : 'לא זמין',
          'פיצוי סופי': report.final_compensation ? `${report.final_compensation.toLocaleString('he-IL')} ₪` : 'לא זמין',
          'הערות': report.notes || 'אין הערות'
        };
      }
    }

    return response;
  }

  /**
   * Query tracking table with filters (סקירה לפי שדות)
   */
  async queryTrackingTable(filters = {}) {
    try {
      const supabase = this._getSupabase();
      console.log('📋 Querying tracking table with filters:', filters);

      let query = supabase.from('tracking_general').select('*');

      // Apply filters
      if (filters.dateFrom) {
        query = query.gte('inspection_date', filters.dateFrom);
      }
      if (filters.dateTo) {
        query = query.lte('inspection_date', filters.dateTo);
      }
      if (filters.manufacturer) {
        query = query.ilike('manufacturer', `%${filters.manufacturer}%`);
      }
      if (filters.owner) {
        query = query.ilike('owner_name', `%${filters.owner}%`);
      }
      if (filters.garage) {
        query = query.ilike('garage_name', `%${filters.garage}%`);
      }
      if (filters.directive) {
        query = query.eq('directive', filters.directive);
      }
      if (filters.caseInClaim) {
        query = query.eq('case_in_claim', filters.caseInClaim);
      }
      if (filters.invoiceReceived !== undefined) {
        query = query.eq('invoice_received', filters.invoiceReceived);
      }
      if (filters.paymentReceived !== undefined) {
        query = query.eq('payment_received', filters.paymentReceived);
      }

      // Order by most recent first
      query = query.order('inspection_date', { ascending: false });

      const { data, error } = await query;

      if (error) throw error;

      return data || [];
    } catch (error) {
      console.error('Error querying tracking table:', error);
      throw error;
    }
  }

  /**
   * Get all reminders with optional filters
   */
  async getReminders(filters = {}) {
    try {
      const supabase = this._getSupabase();
      console.log('🔔 Fetching reminders with filters:', filters);

      let query = supabase.from('reminders').select('*');

      // Apply filters
      if (filters.status) {
        query = query.eq('status', filters.status);
      }
      if (filters.category) {
        query = query.eq('category', filters.category);
      }
      if (filters.priority) {
        query = query.eq('priority', filters.priority);
      }
      if (filters.plate) {
        query = query.eq('plate', filters.plate);
      }
      if (filters.dateFrom) {
        query = query.gte('due_date', filters.dateFrom);
      }
      if (filters.dateTo) {
        query = query.lte('due_date', filters.dateTo);
      }

      // Order by due date (soonest first)
      query = query.order('due_date', { ascending: true });

      const { data, error } = await query;

      if (error) throw error;

      return data || [];
    } catch (error) {
      console.error('Error fetching reminders:', error);
      throw error;
    }
  }

  /**
   * Create new reminder
   */
  async createReminder(reminderData) {
    try {
      const supabase = this._getSupabase();
      console.log('➕ Creating new reminder:', reminderData);

      const { data, error } = await supabase
        .from('reminders')
        .insert([reminderData])
        .select()
        .single();

      if (error) throw error;

      return data;
    } catch (error) {
      console.error('Error creating reminder:', error);
      throw error;
    }
  }

  /**
   * Update reminder
   */
  async updateReminder(id, updates) {
    try {
      const supabase = this._getSupabase();
      console.log(`📝 Updating reminder ${id}:`, updates);

      const { data, error } = await supabase
        .from('reminders')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      return data;
    } catch (error) {
      console.error('Error updating reminder:', error);
      throw error;
    }
  }

  /**
   * Delete reminder
   */
  async deleteReminder(id) {
    try {
      const supabase = this._getSupabase();
      console.log(`🗑️ Deleting reminder ${id}`);

      const { error } = await supabase
        .from('reminders')
        .delete()
        .eq('id', id);

      if (error) throw error;

      return true;
    } catch (error) {
      console.error('Error deleting reminder:', error);
      throw error;
    }
  }

  /**
   * Get all payment tracking records
   */
  async getPaymentTracking(filters = {}) {
    try {
      const supabase = this._getSupabase();
      console.log('💰 Fetching payment tracking with filters:', filters);

      let query = supabase.from('payment_tracking').select('*');

      // Apply filters
      if (filters.status) {
        query = query.eq('payment_status', filters.status);
      }
      if (filters.plate) {
        query = query.eq('plate', filters.plate);
      }
      if (filters.owner) {
        query = query.ilike('owner_name', `%${filters.owner}%`);
      }

      // Order by expected payment date
      query = query.order('expected_payment_date', { ascending: true });

      const { data, error } = await query;

      if (error) throw error;

      return data || [];
    } catch (error) {
      console.error('Error fetching payment tracking:', error);
      throw error;
    }
  }

  /**
   * Create payment tracking record
   */
  async createPaymentRecord(paymentData) {
    try {
      const supabase = this._getSupabase();
      console.log('➕ Creating payment record:', paymentData);

      const { data, error } = await supabase
        .from('payment_tracking')
        .insert([paymentData])
        .select()
        .single();

      if (error) throw error;

      return data;
    } catch (error) {
      console.error('Error creating payment record:', error);
      throw error;
    }
  }

  /**
   * Update payment record
   */
  async updatePaymentRecord(id, updates) {
    try {
      const supabase = this._getSupabase();
      console.log(`📝 Updating payment record ${id}:`, updates);

      const { data, error } = await supabase
        .from('payment_tracking')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      return data;
    } catch (error) {
      console.error('Error updating payment record:', error);
      throw error;
    }
  }

  /**
   * Get productivity statistics using Nicole dashboard function
   */
  async getProductivityStats() {
    try {
      const supabase = this._getSupabase();
      console.log('📊 Fetching productivity statistics');

      const { data, error } = await supabase.rpc('nicole_get_dashboard_statistics');

      if (error) throw error;

      return data;
    } catch (error) {
      console.error('Error fetching productivity stats:', error);
      throw error;
    }
  }

  /**
   * Get case statistics
   */
  async getCaseStatistics() {
    try {
      const supabase = this._getSupabase();
      console.log('📈 Fetching case statistics');

      const { data, error } = await supabase.rpc('nicole_get_case_status_statistics');

      if (error) throw error;

      return data;
    } catch (error) {
      console.error('Error fetching case statistics:', error);
      throw error;
    }
  }

  /**
   * Get payment statistics
   */
  async getPaymentStatistics() {
    try {
      const supabase = this._getSupabase();
      console.log('💵 Fetching payment statistics');

      const { data, error } = await supabase.rpc('nicole_get_payment_statistics');

      if (error) throw error;

      return data;
    } catch (error) {
      console.error('Error fetching payment statistics:', error);
      throw error;
    }
  }

  /**
   * Get reminder statistics
   */
  async getReminderStatistics() {
    try {
      const supabase = this._getSupabase();
      console.log('🔔 Fetching reminder statistics');

      const { data, error } = await supabase.rpc('nicole_get_reminder_statistics');

      if (error) throw error;

      return data;
    } catch (error) {
      console.error('Error fetching reminder statistics:', error);
      throw error;
    }
  }

  /**
   * Delete case from Supabase (soft delete - mark as deleted)
   */
  async deleteCase(caseId) {
    try {
      const supabase = this._getSupabase();
      console.log(`🗑️ Deleting case ${caseId} from Supabase`);

      // Get case details first
      const { data: caseData, error: caseError } = await supabase
        .from('cases')
        .select('*')
        .eq('id', caseId)
        .single();

      if (caseError) throw caseError;

      // Soft delete - update status to deleted
      const { error: updateError } = await supabase
        .from('cases')
        .update({
          status: 'deleted',
          deleted_at: new Date().toISOString()
        })
        .eq('id', caseId);

      if (updateError) throw updateError;

      return caseData;
    } catch (error) {
      console.error('Error deleting case from Supabase:', error);
      throw error;
    }
  }

  /**
   * Helper: Format date for Hebrew display
   */
  _formatDate(dateString) {
    if (!dateString) return 'לא זמין';

    try {
      return new Date(dateString).toLocaleDateString('he-IL', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit'
      });
    } catch (e) {
      return 'לא זמין';
    }
  }

  /**
   * Helper: Format datetime for Hebrew display
   */
  _formatDateTime(dateString) {
    if (!dateString) return 'לא זמין';

    try {
      return new Date(dateString).toLocaleString('he-IL', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (e) {
      return 'לא זמין';
    }
  }

  /**
   * Helper: Format currency for Hebrew display
   */
  _formatCurrency(amount) {
    if (!amount) return '0 ₪';
    return `${Number(amount).toLocaleString('he-IL')} ₪`;
  }
}

// Export singleton instance
export const adminSupabaseService = new AdminSupabaseService();
