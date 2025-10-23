// services/invoice-helper-sync.js
// Phase 5a Invoice Integration - Bidirectional Supabase ↔ Helper sync
// Session 74 - Created 2025-10-23

class InvoiceHelperSync {
  constructor() {
    this.invoiceService = window.invoiceService;
  }

  // ============================================================================
  // SUPABASE → HELPER (Load from database)
  // ============================================================================
  
  /**
   * Load invoices from Supabase and populate helper
   * @param {string} caseId - Case UUID
   * @returns {number} Number of invoices loaded
   */
  async loadInvoicesToHelper(caseId) {
    try {
      console.log('📥 Loading invoices from Supabase to helper for case:', caseId);
      
      if (!this.invoiceService) {
        throw new Error('InvoiceService not initialized');
      }

      // Get invoices from Supabase
      const invoices = await this.invoiceService.getInvoicesByCase(caseId);
      
      if (!invoices || invoices.length === 0) {
        console.log('ℹ️ No invoices found for this case');
        window.helper.invoices = [];
        window.helper.financials = window.helper.financials || {};
        window.helper.financials.invoices = [];
        return 0;
      }

      // Update helper.invoices[] (simple array - backward compatible)
      window.helper.invoices = this.convertToSimpleFormat(invoices);
      
      // Update helper.financials.invoices (comprehensive format)
      window.helper.financials = window.helper.financials || {};
      window.helper.financials.invoices = this.convertToComprehensiveFormat(invoices);
      
      console.log(`✅ Loaded ${invoices.length} invoices to helper`);
      return invoices.length;
    } catch (error) {
      console.error('❌ Error loading invoices to helper:', error);
      throw error;
    }
  }
  
  /**
   * Convert Supabase format to helper simple format
   * @param {Array} invoices - Supabase invoices
   * @returns {Array} Simple format for helper.invoices[]
   */
  convertToSimpleFormat(invoices) {
    return invoices.map(inv => ({
      id: inv.id,
      plate: inv.plate,
      owner: '', // Will be populated from case data
      garage_name: inv.supplier_name,
      date: inv.issue_date,
      invoice_number: inv.invoice_number,
      invoice_type: inv.invoice_type?.toLowerCase() || 'mixed',
      items: (inv.lines || []).map(line => ({
        description: line.description,
        quantity: line.quantity,
        price: line.unit_price,
        total: line.line_total,
        category: line.item_category
      })),
      total: inv.total_amount,
      vat: inv.vat_amount,
      currency: inv.currency || 'ILS',
      status: inv.approval_status || 'pending',
      processed_at: inv.created_at
    }));
  }
  
  /**
   * Convert Supabase format to helper comprehensive format
   * @param {Array} invoices - Supabase invoices
   * @returns {Array} Comprehensive format for helper.financials.invoices
   */
  convertToComprehensiveFormat(invoices) {
    return invoices.map(inv => ({
      // Invoice header
      id: inv.id,
      invoice_number: inv.invoice_number,
      plate: inv.plate,
      case_id: inv.case_id,
      
      // Supplier info
      supplier: {
        name: inv.supplier_name,
        tax_id: inv.supplier_tax_id,
        business_number: inv.business_number
      },
      
      // Dates
      issue_date: inv.issue_date,
      due_date: inv.due_date,
      
      // Amounts
      amounts: {
        subtotal: inv.subtotal_amount,
        vat: inv.vat_amount,
        total: inv.total_amount,
        currency: inv.currency || 'ILS'
      },
      
      // Line items with full details
      lines: (inv.lines || []).map(line => ({
        id: line.id,
        line_number: line.line_number,
        description: line.description,
        quantity: line.quantity,
        unit: line.unit,
        unit_price: line.unit_price,
        line_total: line.line_total,
        discount_percent: line.discount_percent,
        vat_rate: line.vat_rate,
        
        // Categorization
        category: line.item_category,
        category_confidence: line.category_confidence,
        category_method: line.category_method,
        
        // Part reference
        part_id: line.part_id,
        
        // Metadata
        metadata: line.metadata
      })),
      
      // Status
      payment_status: inv.payment_status,
      approval_status: inv.approval_status,
      
      // OCR data (if exists)
      ocr_data: inv.documents && inv.documents.length > 0 ? 
        inv.documents[0].ocr_structured_data : null,
      
      // Validation
      validation: inv.validation ? {
        status: inv.validation.validation_status,
        score: inv.validation.validation_score,
        issues: inv.validation.validation_issues,
        approved_by: inv.validation.reviewed_by,
        approved_at: inv.validation.reviewed_at
      } : null,
      
      // Metadata
      metadata: inv.metadata,
      notes: inv.notes,
      
      // Tracking
      created_at: inv.created_at,
      updated_at: inv.updated_at,
      created_by: inv.created_by
    }));
  }
  
  // ============================================================================
  // HELPER → SUPABASE (Save to database)
  // ============================================================================
  
  /**
   * Sync helper invoices to Supabase
   * @param {string} caseId - Case UUID
   * @param {string} plate - License plate
   * @returns {number} Number of invoices synced
   */
  async syncHelperToSupabase(caseId, plate) {
    try {
      console.log('📤 Syncing helper invoices to Supabase...');
      
      const helperInvoices = window.helper.invoices || [];
      
      if (helperInvoices.length === 0) {
        console.log('ℹ️ No invoices in helper to sync');
        return 0;
      }

      let syncedCount = 0;

      for (const helperInvoice of helperInvoices) {
        try {
          // Check if invoice already exists in Supabase
          const existingInvoices = await this.invoiceService.searchInvoices({
            case_id: caseId,
            plate: plate,
            invoice_number: helperInvoice.invoice_number
          });

          if (existingInvoices && existingInvoices.length > 0) {
            console.log(`ℹ️ Invoice ${helperInvoice.invoice_number} already exists, skipping`);
            continue;
          }

          // Convert helper format to Supabase format
          const invoiceData = {
            case_id: caseId,
            plate: plate,
            invoice_number: helperInvoice.invoice_number || `INV-${Date.now()}`,
            supplier_name: helperInvoice.garage_name || 'Unknown',
            issue_date: helperInvoice.date || new Date().toISOString().split('T')[0],
            total_amount: helperInvoice.total || 0,
            vat_amount: helperInvoice.vat || null,
            currency: helperInvoice.currency || 'ILS',
            invoice_type: helperInvoice.invoice_type || 'mixed',
            approval_status: helperInvoice.status || 'pending'
          };

          // Convert line items
          const lines = (helperInvoice.items || []).map((item, index) => ({
            line_number: index + 1,
            description: item.description || item.name || '',
            quantity: item.quantity || 1,
            unit_price: item.price || 0,
            line_total: item.total || (item.quantity * item.price) || 0,
            item_category: item.category || null
          }));

          // Create invoice in Supabase
          await this.invoiceService.createInvoice(invoiceData, lines, caseId);
          
          syncedCount++;
          console.log(`✅ Synced invoice: ${helperInvoice.invoice_number}`);
        } catch (error) {
          console.error(`❌ Error syncing invoice ${helperInvoice.invoice_number}:`, error);
        }
      }
      
      console.log(`✅ Synced ${syncedCount} of ${helperInvoices.length} invoices to Supabase`);
      return syncedCount;
    } catch (error) {
      console.error('❌ Error syncing helper to Supabase:', error);
      throw error;
    }
  }
  
  // ============================================================================
  // DAMAGE CENTER MAPPING SYNC
  // ============================================================================
  
  /**
   * Apply invoice mappings to helper.centers
   * Updates damage center fields with invoice costs
   * @param {string} caseId - Case UUID
   */
  async applyMappingsToCenters(caseId) {
    try {
      console.log('🔗 Applying invoice mappings to damage centers...');
      
      if (!window.helper.centers || window.helper.centers.length === 0) {
        console.warn('⚠️ No damage centers in helper');
        return;
      }

      // Get all unique damage center IDs
      const centerIds = window.helper.centers.map((center, index) => 
        center.id || `center_${index + 1}`
      );

      let totalMappingsApplied = 0;

      // Process each damage center
      for (const centerId of centerIds) {
        const center = window.helper.centers.find(c => 
          (c.id || `center_${window.helper.centers.indexOf(c) + 1}`) === centerId
        );

        if (!center) continue;

        // Get mappings for this center
        const mappings = await this.invoiceService.getMappingsForCenter(caseId, centerId);

        if (!mappings || mappings.length === 0) {
          continue;
        }

        // Group mappings by field type
        const worksMappings = mappings.filter(m => m.field_type === 'work' && m.mapping_status === 'active');
        const partsMappings = mappings.filter(m => m.field_type === 'part' && m.mapping_status === 'active');
        const repairsMappings = mappings.filter(m => m.field_type === 'repair' && m.mapping_status === 'active');

        // Apply works mappings
        if (worksMappings.length > 0) {
          center.works = center.works || [];
          worksMappings.forEach(mapping => {
            const fieldIndex = mapping.field_index;
            const mappedData = mapping.mapped_data;
            
            // Update or add work
            if (center.works[fieldIndex]) {
              center.works[fieldIndex] = {
                ...center.works[fieldIndex],
                name: mappedData.name || center.works[fieldIndex].name,
                costWithoutVat: mappedData.costWithoutVat || center.works[fieldIndex].costWithoutVat,
                _invoiceMapped: true,
                _mappingId: mapping.id
              };
            } else {
              center.works[fieldIndex] = {
                name: mappedData.name,
                costWithoutVat: mappedData.costWithoutVat,
                _invoiceMapped: true,
                _mappingId: mapping.id
              };
            }
            
            totalMappingsApplied++;
          });
        }

        // Apply parts mappings
        if (partsMappings.length > 0) {
          center.parts = center.parts || [];
          partsMappings.forEach(mapping => {
            const fieldIndex = mapping.field_index;
            const mappedData = mapping.mapped_data;
            
            if (center.parts[fieldIndex]) {
              center.parts[fieldIndex] = {
                ...center.parts[fieldIndex],
                name: mappedData.name || center.parts[fieldIndex].name,
                costWithoutVat: mappedData.costWithoutVat || center.parts[fieldIndex].costWithoutVat,
                description: mappedData.description || center.parts[fieldIndex].description,
                serialNumber: mappedData.serialNumber || center.parts[fieldIndex].serialNumber,
                _invoiceMapped: true,
                _mappingId: mapping.id
              };
            } else {
              center.parts[fieldIndex] = {
                name: mappedData.name,
                costWithoutVat: mappedData.costWithoutVat,
                description: mappedData.description,
                serialNumber: mappedData.serialNumber,
                _invoiceMapped: true,
                _mappingId: mapping.id
              };
            }
            
            totalMappingsApplied++;
          });
        }

        // Apply repairs mappings
        if (repairsMappings.length > 0) {
          center.repairs = center.repairs || [];
          repairsMappings.forEach(mapping => {
            const fieldIndex = mapping.field_index;
            const mappedData = mapping.mapped_data;
            
            if (center.repairs[fieldIndex]) {
              center.repairs[fieldIndex] = {
                ...center.repairs[fieldIndex],
                name: mappedData.name || center.repairs[fieldIndex].name,
                costWithoutVat: mappedData.costWithoutVat || center.repairs[fieldIndex].costWithoutVat,
                _invoiceMapped: true,
                _mappingId: mapping.id
              };
            } else {
              center.repairs[fieldIndex] = {
                name: mappedData.name,
                costWithoutVat: mappedData.costWithoutVat,
                _invoiceMapped: true,
                _mappingId: mapping.id
              };
            }
            
            totalMappingsApplied++;
          });
        }
      }

      console.log(`✅ Applied ${totalMappingsApplied} invoice mappings to damage centers`);
      return totalMappingsApplied;
    } catch (error) {
      console.error('❌ Error applying mappings to centers:', error);
      throw error;
    }
  }

  /**
   * Remove invoice mappings from helper.centers
   * Clears fields that were populated from invoices
   * @param {string} caseId - Case UUID
   */
  async clearMappingsFromCenters(caseId) {
    try {
      console.log('🧹 Clearing invoice mappings from damage centers...');
      
      if (!window.helper.centers || window.helper.centers.length === 0) {
        return;
      }

      let clearedCount = 0;

      // Process each damage center
      for (const center of window.helper.centers) {
        // Clear invoice-mapped works
        if (center.works) {
          center.works = center.works.map(work => {
            if (work._invoiceMapped) {
              clearedCount++;
              return {
                ...work,
                _invoiceMapped: false,
                _mappingId: null
              };
            }
            return work;
          });
        }

        // Clear invoice-mapped parts
        if (center.parts) {
          center.parts = center.parts.map(part => {
            if (part._invoiceMapped) {
              clearedCount++;
              return {
                ...part,
                _invoiceMapped: false,
                _mappingId: null
              };
            }
            return part;
          });
        }

        // Clear invoice-mapped repairs
        if (center.repairs) {
          center.repairs = center.repairs.map(repair => {
            if (repair._invoiceMapped) {
              clearedCount++;
              return {
                ...repair,
                _invoiceMapped: false,
                _mappingId: null
              };
            }
            return repair;
          });
        }
      }

      console.log(`✅ Cleared ${clearedCount} invoice mappings from damage centers`);
      return clearedCount;
    } catch (error) {
      console.error('❌ Error clearing mappings from centers:', error);
      throw error;
    }
  }

  // ============================================================================
  // FULL SYNC OPERATIONS
  // ============================================================================

  /**
   * Complete sync: Load invoices from Supabase and apply to damage centers
   * @param {string} caseId - Case UUID
   */
  async fullSyncToHelper(caseId) {
    try {
      console.log('🔄 Starting full sync to helper...');
      
      // 1. Load invoices to helper
      const invoiceCount = await this.loadInvoicesToHelper(caseId);
      
      // 2. Apply mappings to damage centers
      const mappingCount = await this.applyMappingsToCenters(caseId);
      
      console.log(`✅ Full sync complete: ${invoiceCount} invoices, ${mappingCount} mappings`);
      return { invoiceCount, mappingCount };
    } catch (error) {
      console.error('❌ Error in full sync:', error);
      throw error;
    }
  }

  /**
   * Save all helper data to Supabase
   * @param {string} caseId - Case UUID
   * @param {string} plate - License plate
   */
  async fullSyncToSupabase(caseId, plate) {
    try {
      console.log('💾 Starting full sync to Supabase...');
      
      // Sync invoices from helper to Supabase
      const invoiceCount = await this.syncHelperToSupabase(caseId, plate);
      
      console.log(`✅ Full sync to Supabase complete: ${invoiceCount} invoices saved`);
      return { invoiceCount };
    } catch (error) {
      console.error('❌ Error in full sync to Supabase:', error);
      throw error;
    }
  }
}

// Export singleton instance
window.invoiceHelperSync = window.invoiceHelperSync || new InvoiceHelperSync();
