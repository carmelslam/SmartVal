// services/invoice-service.js
// Phase 5a Invoice Integration - Supabase CRUD operations
// Session 74 - Created 2025-10-23

class InvoiceService {
  constructor() {
    this.currentUser = null;
    this.supabase = window.supabase;
  }

  // ============================================================================
  // INITIALIZATION
  // ============================================================================
  
  async initialize() {
    try {
      if (!this.supabase) {
        throw new Error('Supabase client not initialized');
      }
      
      const user = await this.supabase.from('profiles')
        .select('user_id, email, full_name, role')
        .eq('user_id', this.supabase.auth.user()?.id)
        .single();
      
      this.currentUser = user.data;
      console.log('📄 InvoiceService initialized for user:', this.currentUser?.email);
      return true;
    } catch (error) {
      console.error('❌ InvoiceService initialization failed:', error);
      return false;
    }
  }

  // ============================================================================
  // INVOICE CRUD OPERATIONS
  // ============================================================================

  /**
   * Create invoice with lines
   * @param {Object} invoiceData - Invoice header data
   * @param {Array} lines - Array of invoice line items
   * @param {string} caseId - Case UUID
   * @returns {Object} Created invoice with ID
   */
  async createInvoice(invoiceData, lines = [], caseId = null) {
    try {
      console.log('📝 Creating invoice:', invoiceData.invoice_number);
      
      const userId = this.currentUser?.user_id;
      if (!userId) {
        throw new Error('User not authenticated');
      }

      // 1. Insert invoice record
      const invoiceInsert = {
        case_id: caseId,
        plate: invoiceData.plate,
        invoice_number: invoiceData.invoice_number,
        supplier_name: invoiceData.supplier_name,
        supplier_tax_id: invoiceData.supplier_tax_id || null,
        issue_date: invoiceData.issue_date,
        due_date: invoiceData.due_date || null,
        total_amount: invoiceData.total_amount,
        vat_amount: invoiceData.vat_amount || null,
        currency: invoiceData.currency || 'ILS',
        payment_status: invoiceData.payment_status || 'pending',
        approval_status: invoiceData.approval_status || 'pending',
        metadata: invoiceData.metadata || null,
        notes: invoiceData.notes || null,
        created_by: userId,
        updated_by: userId
      };

      const { data: invoice, error: invoiceError } = await this.supabase
        .from('invoices')
        .insert(invoiceInsert)
        .select()
        .single();

      if (invoiceError) throw invoiceError;

      console.log('✅ Invoice created:', invoice.id);

      // 2. Insert invoice_lines
      if (lines && lines.length > 0) {
        const linesInsert = lines.map((line, index) => ({
          invoice_id: invoice.id,
          line_number: line.line_number || (index + 1),
          description: line.description,
          quantity: line.quantity || 1,
          unit_price: line.unit_price,
          line_total: line.line_total || (line.quantity * line.unit_price),
          unit: line.unit || 'יחידה',
          discount_percent: line.discount_percent || 0,
          vat_rate: line.vat_rate || 17,
          part_id: line.part_id || null,
          item_category: line.item_category || null, // Auto-categorized by trigger if null
          category_confidence: line.category_confidence || null,
          category_method: line.category_method || null,
          metadata: line.metadata || null,
          created_by: userId,
          updated_by: userId
        }));

        const { data: createdLines, error: linesError } = await this.supabase
          .from('invoice_lines')
          .insert(linesInsert)
          .select();

        if (linesError) throw linesError;

        console.log(`✅ Created ${createdLines.length} invoice lines`);
        invoice.lines = createdLines;
      }

      return { success: true, invoice };
    } catch (error) {
      console.error('❌ Error creating invoice:', error);
      throw error;
    }
  }

  /**
   * Get invoices by case
   * @param {string} caseId - Case UUID
   * @returns {Array} Invoices with lines
   */
  async getInvoicesByCase(caseId) {
    try {
      const { data: invoices, error } = await this.supabase
        .from('invoices')
        .select(`
          *,
          lines:invoice_lines(*)
        `)
        .eq('case_id', caseId)
        .order('created_at', { ascending: false });

      if (error) throw error;

      return invoices || [];
    } catch (error) {
      console.error('❌ Error getting invoices:', error);
      throw error;
    }
  }

  /**
   * Get invoice with lines
   * @param {string} invoiceId - Invoice UUID
   * @returns {Object} Invoice with lines
   */
  async getInvoiceWithLines(invoiceId) {
    try {
      const { data: invoice, error } = await this.supabase
        .from('invoices')
        .select(`
          *,
          lines:invoice_lines(*),
          documents:invoice_documents(*),
          validation:invoice_validations(*)
        `)
        .eq('id', invoiceId)
        .single();

      if (error) throw error;

      return invoice;
    } catch (error) {
      console.error('❌ Error getting invoice:', error);
      throw error;
    }
  }

  /**
   * Update invoice
   * @param {string} invoiceId - Invoice UUID
   * @param {Object} updates - Fields to update
   */
  async updateInvoice(invoiceId, updates) {
    try {
      const userId = this.currentUser?.user_id;
      
      const { data, error } = await this.supabase
        .from('invoices')
        .update({
          ...updates,
          updated_by: userId
        })
        .eq('id', invoiceId)
        .select()
        .single();

      if (error) throw error;

      console.log('✅ Invoice updated:', invoiceId);
      return data;
    } catch (error) {
      console.error('❌ Error updating invoice:', error);
      throw error;
    }
  }

  /**
   * Delete invoice (admin only)
   * @param {string} invoiceId - Invoice UUID
   */
  async deleteInvoice(invoiceId) {
    try {
      const { error } = await this.supabase
        .from('invoices')
        .delete()
        .eq('id', invoiceId);

      if (error) throw error;

      console.log('✅ Invoice deleted:', invoiceId);
      return { success: true };
    } catch (error) {
      console.error('❌ Error deleting invoice:', error);
      throw error;
    }
  }

  // ============================================================================
  // INVOICE DOCUMENT OPERATIONS (OCR)
  // ============================================================================

  /**
   * Upload invoice document to storage
   * @param {File} file - File to upload
   * @param {string} caseId - Case UUID
   * @param {string} plate - License plate
   * @param {string} invoiceId - Optional invoice UUID
   * @returns {Object} Document record with ID
   */
  async uploadInvoiceDocument(file, caseId, plate, invoiceId = null) {
    try {
      console.log('📤 Uploading invoice document:', file.name);
      
      const userId = this.currentUser?.user_id;
      const timestamp = Date.now();
      const filePath = `${caseId}/invoices/${timestamp}_${file.name}`;

      // 1. Upload to Supabase Storage 'docs' bucket
      const { data: uploadData, error: uploadError } = await this.supabase.storage
        .from('docs')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      console.log('✅ File uploaded to storage:', filePath);

      // 2. Create invoice_documents record
      const documentInsert = {
        invoice_id: invoiceId,
        case_id: caseId,
        plate: plate,
        filename: file.name,
        file_size: file.size,
        mime_type: file.type,
        storage_path: uploadData.path,
        storage_bucket: 'docs',
        ocr_status: 'pending',
        processing_method: 'make_ocr',
        uploaded_by: userId
      };

      const { data: document, error: docError } = await this.supabase
        .from('invoice_documents')
        .insert(documentInsert)
        .select()
        .single();

      if (docError) throw docError;

      console.log('✅ Document record created:', document.id);

      return { success: true, document };
    } catch (error) {
      console.error('❌ Error uploading document:', error);
      throw error;
    }
  }

  /**
   * Update OCR results from webhook
   * @param {string} documentId - Document UUID
   * @param {Object} ocrData - OCR webhook response
   */
  async updateOCRResults(documentId, ocrData) {
    try {
      console.log('🔄 Updating OCR results for document:', documentId);

      const { data, error } = await this.supabase
        .from('invoice_documents')
        .update({
          ocr_status: 'completed',
          ocr_raw_text: ocrData.raw_text || null,
          ocr_structured_data: ocrData, // Complete JSON stored here
          ocr_confidence: ocrData.confidence || null,
          language_detected: ocrData.language || 'he',
          processing_completed_at: new Date().toISOString()
        })
        .eq('id', documentId)
        .select()
        .single();

      if (error) throw error;

      console.log('✅ OCR results updated');
      return data;
    } catch (error) {
      console.error('❌ Error updating OCR results:', error);
      throw error;
    }
  }

  /**
   * Get OCR data by invoice
   * @param {string} invoiceId - Invoice UUID
   * @returns {Object} OCR structured data
   */
  async getOCRData(invoiceId) {
    try {
      const { data, error } = await this.supabase
        .rpc('get_invoice_ocr_data', { p_invoice_id: invoiceId });

      if (error) throw error;

      return data;
    } catch (error) {
      console.error('❌ Error getting OCR data:', error);
      throw error;
    }
  }

  // ============================================================================
  // INVOICE LINES OPERATIONS
  // ============================================================================

  /**
   * Get invoice lines by category
   * @param {string} invoiceId - Invoice UUID
   * @param {string} category - part/work/repair/material/other
   * @returns {Array} Filtered invoice lines
   */
  async getLinesByCategory(invoiceId, category) {
    try {
      const { data, error } = await this.supabase
        .rpc('get_invoice_items_by_category', {
          p_invoice_id: invoiceId,
          p_category: category
        });

      if (error) throw error;

      return data || [];
    } catch (error) {
      console.error('❌ Error getting lines by category:', error);
      throw error;
    }
  }

  /**
   * Get parts for dropdown (invoice parts only)
   * @param {string} invoiceId - Invoice UUID
   * @returns {Array} Parts from invoice
   */
  async getInvoicePartsForDropdown(invoiceId) {
    try {
      const { data, error } = await this.supabase
        .from('invoice_lines')
        .select('*')
        .eq('invoice_id', invoiceId)
        .eq('item_category', 'part')
        .order('line_number');

      if (error) throw error;

      return data || [];
    } catch (error) {
      console.error('❌ Error getting invoice parts:', error);
      throw error;
    }
  }

  /**
   * Manual categorization override
   * @param {string} lineId - Line UUID
   * @param {string} category - New category
   * @param {string} method - Categorization method
   */
  async updateLineCategory(lineId, category, method = 'manual') {
    try {
      const userId = this.currentUser?.user_id;

      const { data, error } = await this.supabase
        .from('invoice_lines')
        .update({
          item_category: category,
          category_method: method,
          category_confidence: 1.0, // Manual override = 100% confidence
          updated_by: userId
        })
        .eq('id', lineId)
        .select()
        .single();

      if (error) throw error;

      console.log('✅ Line category updated:', lineId);
      return data;
    } catch (error) {
      console.error('❌ Error updating line category:', error);
      throw error;
    }
  }

  /**
   * Batch categorize invoice
   * @param {string} invoiceId - Invoice UUID
   * @returns {Array} Categorization results
   */
  async batchCategorize(invoiceId) {
    try {
      const { data, error } = await this.supabase
        .rpc('batch_categorize_invoice_lines', { p_invoice_id: invoiceId });

      if (error) throw error;

      console.log('✅ Batch categorization complete');
      return data || [];
    } catch (error) {
      console.error('❌ Error batch categorizing:', error);
      throw error;
    }
  }

  // ============================================================================
  // DAMAGE CENTER MAPPING OPERATIONS
  // ============================================================================

  /**
   * Create mapping from invoice item to damage center field
   * @param {Object} mappingData - Mapping data
   * @returns {string} Mapping UUID
   */
  async createMapping(mappingData) {
    try {
      const userId = this.currentUser?.user_id;

      const { data, error } = await this.supabase
        .rpc('map_invoice_to_damage_center', {
          p_invoice_id: mappingData.invoice_id,
          p_invoice_line_id: mappingData.invoice_line_id,
          p_case_id: mappingData.case_id,
          p_damage_center_id: mappingData.damage_center_id,
          p_field_type: mappingData.field_type,
          p_field_index: mappingData.field_index,
          p_mapped_data: mappingData.mapped_data,
          p_mapped_by: userId
        });

      if (error) throw error;

      console.log('✅ Mapping created:', data);
      return data;
    } catch (error) {
      console.error('❌ Error creating mapping:', error);
      throw error;
    }
  }

  /**
   * Get mappings for damage center
   * @param {string} caseId - Case UUID
   * @param {string} damageCenterId - Damage center ID
   * @returns {Array} Mappings
   */
  async getMappingsForCenter(caseId, damageCenterId) {
    try {
      const { data, error } = await this.supabase
        .rpc('get_damage_center_mappings', {
          p_case_id: caseId,
          p_damage_center_id: damageCenterId
        });

      if (error) throw error;

      return data || [];
    } catch (error) {
      console.error('❌ Error getting mappings:', error);
      throw error;
    }
  }

  /**
   * Get unmapped invoice items
   * @param {string} invoiceId - Invoice UUID
   * @returns {Array} Unmapped items
   */
  async getUnmappedItems(invoiceId) {
    try {
      const { data, error } = await this.supabase
        .rpc('get_unmapped_invoice_items', { p_invoice_id: invoiceId });

      if (error) throw error;

      return data || [];
    } catch (error) {
      console.error('❌ Error getting unmapped items:', error);
      throw error;
    }
  }

  /**
   * Remove mapping
   * @param {string} mappingId - Mapping UUID
   */
  async removeMapping(mappingId) {
    try {
      const userId = this.currentUser?.user_id;

      const { data, error } = await this.supabase
        .from('invoice_damage_center_mappings')
        .update({
          mapping_status: 'removed',
          updated_by: userId
        })
        .eq('id', mappingId)
        .select()
        .single();

      if (error) throw error;

      console.log('✅ Mapping removed:', mappingId);
      return data;
    } catch (error) {
      console.error('❌ Error removing mapping:', error);
      throw error;
    }
  }

  /**
   * Update mapping (user edited after auto-fill)
   * @param {string} mappingId - Mapping UUID
   * @param {Object} modifications - Modified data
   */
  async updateMapping(mappingId, modifications) {
    try {
      const userId = this.currentUser?.user_id;

      const { data, error } = await this.supabase
        .from('invoice_damage_center_mappings')
        .update({
          mapped_data: modifications,
          is_user_modified: true,
          updated_by: userId
        })
        .eq('id', mappingId)
        .select()
        .single();

      if (error) throw error;

      console.log('✅ Mapping updated:', mappingId);
      return data;
    } catch (error) {
      console.error('❌ Error updating mapping:', error);
      throw error;
    }
  }

  // ============================================================================
  // SEARCH & STATISTICS
  // ============================================================================

  /**
   * Search invoices by filters
   * @param {Object} filters - Search filters
   * @returns {Array} Filtered invoices
   */
  async searchInvoices(filters) {
    try {
      let query = this.supabase
        .from('invoices')
        .select('*');

      if (filters.case_id) {
        query = query.eq('case_id', filters.case_id);
      }

      if (filters.plate) {
        query = query.eq('plate', filters.plate);
      }

      if (filters.supplier_name) {
        query = query.ilike('supplier_name', `%${filters.supplier_name}%`);
      }

      if (filters.from_date) {
        query = query.gte('issue_date', filters.from_date);
      }

      if (filters.to_date) {
        query = query.lte('issue_date', filters.to_date);
      }

      if (filters.approval_status) {
        query = query.eq('approval_status', filters.approval_status);
      }

      const { data, error } = await query.order('created_at', { ascending: false });

      if (error) throw error;

      return data || [];
    } catch (error) {
      console.error('❌ Error searching invoices:', error);
      throw error;
    }
  }
}

// Export singleton instance
window.invoiceService = window.invoiceService || new InvoiceService();
