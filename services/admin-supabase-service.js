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
        .order('timestamp', { ascending: false })
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
   * Get all payment tracking records with last contact info and invoice counts
   */
  async getPaymentTracking(filters = {}) {
    try {
      const supabase = this._getSupabase();
      console.log('💰 Fetching payment tracking with filters:', filters);

      // First, get payment tracking records with last contact user name
      let query = supabase
        .from('payment_tracking')
        .select(`
          *,
          last_contacted_by_name:profiles!payment_tracking_last_contacted_by_fkey(name)
        `);

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

      const { data: payments, error } = await query;

      if (error) throw error;

      if (!payments || payments.length === 0) {
        return [];
      }

      // Get invoice counts for all payments
      const { data: invoiceCounts, error: countError } = await supabase
        .from('fee_invoices')
        .select('payment_tracking_id, id.count()');

      if (countError) {
        console.warn('⚠️ Error fetching invoice counts:', countError);
      }

      // Create a map of payment_id -> invoice_count
      const countMap = {};
      if (invoiceCounts) {
        invoiceCounts.forEach(row => {
          countMap[row.payment_tracking_id] = row.count || 0;
        });
      }

      // Enhance payments with invoice count and format last_contacted_by_name
      const enhancedPayments = payments.map(payment => ({
        ...payment,
        last_contacted_by_name: payment.last_contacted_by_name?.name || null,
        invoice_count: countMap[payment.id] || 0
      }));

      return enhancedPayments;
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
   * ========================================
   * FEE INVOICE MANAGEMENT METHODS
   * Phase 9: Admin Hub Enhancement
   * ========================================
   */

  /**
   * Upload fee invoice to Supabase Storage and create database record
   * @param {string} plate - Vehicle plate number
   * @param {File} file - File object from input
   * @param {object} metadata - Invoice metadata (type, amount, date, etc.)
   * @returns {object} Created invoice record
   */
  async uploadFeeInvoice(plate, file, metadata) {
    try {
      const supabase = this._getSupabase();
      console.log(`📄 Uploading fee invoice for plate: ${plate}`);

      // Generate unique filename with timestamp
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
      const extension = file.name.split('.').pop();
      const fileName = `${metadata.invoice_type}-${timestamp}.${extension}`;
      const filePath = `fee-invoices/${plate}/${fileName}`;

      // Upload file to Supabase Storage
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('fee-invoices')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false
        });

      if (uploadError) throw uploadError;

      // Create database record
      const invoiceRecord = {
        case_id: metadata.case_id,
        payment_tracking_id: metadata.payment_tracking_id,
        plate: plate,
        invoice_type: metadata.invoice_type,
        invoice_number: metadata.invoice_number || null,
        invoice_date: metadata.invoice_date || null,
        invoice_amount: metadata.invoice_amount || null,
        file_path: filePath,
        file_name: file.name,
        file_size: file.size,
        file_type: file.type,
        date_extracted_from_ocr: metadata.date_extracted_from_ocr || false,
        ocr_confidence: metadata.ocr_confidence || null,
        extraction_metadata: metadata.extraction_metadata || null,
        uploaded_by: metadata.uploaded_by,
        notes: metadata.notes || null
      };

      const { data: invoiceData, error: insertError } = await supabase
        .from('fee_invoices')
        .insert([invoiceRecord])
        .select()
        .single();

      if (insertError) throw insertError;

      console.log('✅ Fee invoice uploaded successfully:', invoiceData.id);
      return invoiceData;
    } catch (error) {
      console.error('Error uploading fee invoice:', error);
      throw error;
    }
  }

  /**
   * Get all fee invoices for a plate
   * Uses database function get_fee_invoices() which includes uploader details
   * @param {string} plate - Vehicle plate number
   * @returns {array} Array of invoice records with uploader info
   */
  async getFeeInvoices(plate) {
    try {
      const supabase = this._getSupabase();
      console.log(`📋 Fetching fee invoices for plate: ${plate}`);

      const { data, error } = await supabase.rpc('get_fee_invoices', {
        p_plate: plate
      });

      if (error) throw error;

      return data || [];
    } catch (error) {
      console.error('Error fetching fee invoices:', error);
      throw error;
    }
  }

  /**
   * Get invoice counts by type for a plate
   * @param {string} plate - Vehicle plate number
   * @returns {object} Invoice counts by type
   */
  async getInvoiceCounts(plate) {
    try {
      const supabase = this._getSupabase();
      console.log(`🔢 Fetching invoice counts for plate: ${plate}`);

      const { data, error } = await supabase.rpc('get_invoice_counts', {
        p_plate: plate
      });

      if (error) throw error;

      return data || { total: 0, by_type: {} };
    } catch (error) {
      console.error('Error fetching invoice counts:', error);
      throw error;
    }
  }

  /**
   * Delete fee invoice (record + storage file)
   * Uses database function delete_fee_invoice() which returns file path for cleanup
   * @param {string} invoiceId - Invoice UUID
   * @returns {object} Result with file_path for storage cleanup
   */
  async deleteFeeInvoice(invoiceId) {
    try {
      const supabase = this._getSupabase();
      console.log(`🗑️ Deleting fee invoice: ${invoiceId}`);

      // Call database function to delete record and get file path
      const { data: result, error: dbError } = await supabase.rpc('delete_fee_invoice', {
        p_invoice_id: invoiceId
      });

      if (dbError) throw dbError;

      if (!result.success) {
        throw new Error(result.error || 'Failed to delete invoice record');
      }

      // Delete file from storage
      const filePath = result.file_path.replace('fee-invoices/', '');
      const { error: storageError } = await supabase.storage
        .from('fee-invoices')
        .remove([filePath]);

      if (storageError) {
        console.warn('⚠️ Storage file deletion failed:', storageError);
        // Don't throw - record is already deleted
      }

      console.log('✅ Fee invoice deleted successfully');
      return result;
    } catch (error) {
      console.error('Error deleting fee invoice:', error);
      throw error;
    }
  }

  /**
   * Download/get public URL for fee invoice file
   * @param {string} filePath - Full file path in storage (e.g., "fee-invoices/22184003/invoice.pdf")
   * @returns {string} Public URL for download
   */
  async getFeeInvoiceUrl(filePath) {
    try {
      const supabase = this._getSupabase();
      console.log(`🔗 Getting URL for invoice: ${filePath}`);

      // Extract path without bucket name
      const path = filePath.replace('fee-invoices/', '');

      const { data, error } = await supabase.storage
        .from('fee-invoices')
        .createSignedUrl(path, 3600); // 1 hour expiry

      if (error) throw error;

      return data.signedUrl;
    } catch (error) {
      console.error('Error getting invoice URL:', error);
      throw error;
    }
  }

  /**
   * Update last contact info for payment tracking
   * Uses database function update_payment_last_contact()
   * @param {string} paymentId - Payment tracking UUID
   * @param {string} userId - User ID who made the contact
   * @param {string} notes - Optional contact notes
   * @returns {object} Updated payment record
   */
  async updateLastContact(paymentId, userId, notes = null) {
    try {
      const supabase = this._getSupabase();
      console.log(`📞 Updating last contact for payment: ${paymentId}`);

      const { data, error } = await supabase.rpc('update_payment_last_contact', {
        p_payment_id: paymentId,
        p_user_id: userId,
        p_notes: notes
      });

      if (error) throw error;

      console.log('✅ Last contact updated successfully');
      return data;
    } catch (error) {
      console.error('Error updating last contact:', error);
      throw error;
    }
  }

  /**
   * Update fee invoice date for payment tracking
   * Note: This is usually auto-updated by trigger when invoice is uploaded
   * This method is for manual override if needed
   * @param {string} paymentId - Payment tracking UUID
   * @param {string} date - Invoice date (YYYY-MM-DD)
   * @returns {object} Updated payment record
   */
  async updateFeeInvoiceDate(paymentId, date) {
    try {
      const supabase = this._getSupabase();
      console.log(`📅 Updating fee invoice date for payment: ${paymentId}`);

      const { data, error } = await supabase.rpc('set_fee_invoice_date', {
        p_payment_id: paymentId,
        p_invoice_date: date
      });

      if (error) throw error;

      console.log('✅ Fee invoice date updated successfully');
      return data;
    } catch (error) {
      console.error('Error updating fee invoice date:', error);
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
