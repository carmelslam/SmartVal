// services/damage-center-mapper.js
// Phase 5a Invoice Integration - Damage Center Mapping Service
// Session 74 - Created 2025-10-23
// Purpose: Handle mapping of invoice items to damage center fields

class DamageCenterMapper {
  constructor() {
    this.invoiceService = window.invoiceService;
    this.invoiceHelperSync = window.invoiceHelperSync;
    this.currentCaseId = null;
    this.currentInvoiceId = null;
    this.activeMapping = null; // Currently selected field for mapping
  }

  // ============================================================================
  // INITIALIZATION
  // ============================================================================

  async initialize(caseId, invoiceId = null) {
    try {
      this.currentCaseId = caseId;
      this.currentInvoiceId = invoiceId;
      
      console.log('🗺️ DamageCenterMapper initialized:', { caseId, invoiceId });
      return true;
    } catch (error) {
      console.error('❌ DamageCenterMapper initialization failed:', error);
      return false;
    }
  }

  // ============================================================================
  // DROPDOWN ITEMS - LOAD & COMBINE SOURCES
  // ============================================================================

  /**
   * Get dropdown items based on field type
   * For PARTS: Combines 3 sources (invoice + selected + bank)
   * For WORKS/REPAIRS: Shows invoice items only
   * 
   * @param {string} fieldType - 'part', 'work', or 'repair'
   * @param {string} caseId - Case UUID
   * @param {string} invoiceId - Invoice UUID (optional)
   * @returns {Array} Dropdown items with source indicators
   */
  async getDropdownItems(fieldType, caseId, invoiceId = null) {
    try {
      console.log(`📋 Loading dropdown items for ${fieldType}...`);

      if (fieldType === 'part') {
        // PARTS: Combine 3 sources
        return await this.getCombinedPartsDropdown(caseId, invoiceId);
      } else {
        // WORKS/REPAIRS: Invoice items only
        return await this.getInvoiceItemsDropdown(fieldType, invoiceId);
      }
    } catch (error) {
      console.error('❌ Error loading dropdown items:', error);
      return [];
    }
  }

  /**
   * Get combined parts dropdown (3 sources)
   * Source 1: Invoice parts (if invoiceId provided)
   * Source 2: Selected parts (from parts_required)
   * Source 3: General parts bank (from parts_catalog if exists)
   */
  async getCombinedPartsDropdown(caseId, invoiceId = null) {
    try {
      const allParts = [];

      // SOURCE 1: Invoice parts
      if (invoiceId) {
        const invoiceParts = await this.invoiceService.getInvoicePartsForDropdown(invoiceId);
        invoiceParts.forEach(part => {
          allParts.push({
            id: part.id,
            source: 'invoice',
            sourceLabel: '📄 חשבונית',
            name: part.description,
            description: part.description,
            quantity: part.quantity,
            price: part.unit_price,
            total: part.line_total,
            category: part.item_category,
            confidence: part.category_confidence,
            invoice_line_id: part.id,
            invoice_id: invoiceId
          });
        });
      }

      // SOURCE 2: Selected parts (from parts search)
      // Note: This requires integration with parts_required table
      // For now, we'll load from helper if available
      if (window.helper && window.helper.parts_required) {
        window.helper.parts_required.forEach(part => {
          allParts.push({
            id: part.id || `selected_${Date.now()}_${Math.random()}`,
            source: 'selected',
            sourceLabel: '✓ נבחר',
            name: part.name || part.part_name,
            description: part.description,
            price: part.price || 0,
            manufacturer: part.manufacturer,
            part_number: part.part_number,
            selected: true
          });
        });
      }

      // SOURCE 3: General parts bank
      // Note: This would come from a parts_catalog table if it exists
      // For now, we'll leave this empty - can be added later
      // const bankParts = await this.loadPartsBank();
      // allParts.push(...bankParts);

      console.log(`✅ Loaded ${allParts.length} parts from ${invoiceId ? 2 : 1} sources`);
      return allParts;
    } catch (error) {
      console.error('❌ Error loading combined parts:', error);
      return [];
    }
  }

  /**
   * Get invoice items dropdown (works/repairs)
   * Shows only items from the invoice filtered by category
   */
  async getInvoiceItemsDropdown(fieldType, invoiceId) {
    try {
      if (!invoiceId) {
        console.warn('⚠️ No invoice ID provided for works/repairs dropdown');
        return [];
      }

      // Map field type to category
      const categoryMap = {
        'work': 'work',
        'repair': 'repair'
      };

      const category = categoryMap[fieldType];
      if (!category) {
        console.error('❌ Unknown field type:', fieldType);
        return [];
      }

      const items = await this.invoiceService.getLinesByCategory(invoiceId, category);

      return items.map(item => ({
        id: item.id,
        source: 'invoice',
        sourceLabel: '📄 חשבונית',
        name: item.description,
        description: item.description,
        quantity: item.quantity,
        price: item.unit_price,
        total: item.line_total,
        category: item.category,
        confidence: item.category_confidence,
        invoice_line_id: item.id,
        invoice_id: invoiceId
      }));
    } catch (error) {
      console.error('❌ Error loading invoice items:', error);
      return [];
    }
  }

  // ============================================================================
  // MAPPING OPERATIONS
  // ============================================================================

  /**
   * Map invoice item to damage center field
   * Creates mapping in database and applies to helper.centers
   * 
   * @param {Object} mappingData - Mapping configuration
   * @returns {string} Mapping ID
   */
  async mapItemToField(mappingData) {
    try {
      console.log('🔗 Creating mapping:', mappingData);

      const {
        invoiceId,
        invoiceLineId,
        caseId,
        damageCenterId,
        fieldType,
        fieldIndex,
        itemData
      } = mappingData;

      // Prepare mapped data
      const mappedData = {
        name: itemData.name || itemData.description,
        description: itemData.description,
        costWithoutVat: itemData.price || itemData.total || 0,
        quantity: itemData.quantity || 1,
        serialNumber: itemData.serialNumber || itemData.part_number || null
      };

      // Create mapping in database
      const mappingId = await this.invoiceService.createMapping({
        invoice_id: invoiceId,
        invoice_line_id: invoiceLineId,
        case_id: caseId,
        damage_center_id: damageCenterId,
        field_type: fieldType,
        field_index: fieldIndex,
        mapped_data: mappedData
      });

      console.log('✅ Mapping created:', mappingId);

      // Apply mapping to helper.centers immediately
      await this.applyMappingToHelper(damageCenterId, fieldType, fieldIndex, mappedData);

      return mappingId;
    } catch (error) {
      console.error('❌ Error creating mapping:', error);
      throw error;
    }
  }

  /**
   * Apply mapping to helper.centers
   * Updates the specific field in the damage center
   */
  async applyMappingToHelper(damageCenterId, fieldType, fieldIndex, mappedData) {
    try {
      if (!window.helper || !window.helper.centers) {
        console.warn('⚠️ No damage centers in helper');
        return;
      }

      // Find the damage center
      const centerIndex = window.helper.centers.findIndex(c => 
        (c.id || `center_${window.helper.centers.indexOf(c) + 1}`) === damageCenterId
      );

      if (centerIndex === -1) {
        console.error('❌ Damage center not found:', damageCenterId);
        return;
      }

      const center = window.helper.centers[centerIndex];

      // Apply mapping based on field type
      if (fieldType === 'work') {
        center.works = center.works || [];
        center.works[fieldIndex] = {
          ...(center.works[fieldIndex] || {}),
          name: mappedData.name,
          costWithoutVat: mappedData.costWithoutVat,
          _invoiceMapped: true,
          _mappedAt: new Date().toISOString()
        };
      } else if (fieldType === 'part') {
        center.parts = center.parts || [];
        center.parts[fieldIndex] = {
          ...(center.parts[fieldIndex] || {}),
          name: mappedData.name,
          description: mappedData.description,
          costWithoutVat: mappedData.costWithoutVat,
          serialNumber: mappedData.serialNumber,
          _invoiceMapped: true,
          _mappedAt: new Date().toISOString()
        };
      } else if (fieldType === 'repair') {
        center.repairs = center.repairs || [];
        center.repairs[fieldIndex] = {
          ...(center.repairs[fieldIndex] || {}),
          name: mappedData.name,
          costWithoutVat: mappedData.costWithoutVat,
          _invoiceMapped: true,
          _mappedAt: new Date().toISOString()
        };
      }

      // Update helper in sessionStorage
      sessionStorage.setItem('helper', JSON.stringify(window.helper));

      console.log(`✅ Applied mapping to helper.centers[${centerIndex}].${fieldType}[${fieldIndex}]`);
    } catch (error) {
      console.error('❌ Error applying mapping to helper:', error);
      throw error;
    }
  }

  /**
   * Remove mapping from field
   * Marks mapping as 'removed' in database and clears from helper
   */
  async removeMappingFromField(mappingId) {
    try {
      console.log('🗑️ Removing mapping:', mappingId);

      // Remove from database (marks as 'removed')
      await this.invoiceService.removeMapping(mappingId);

      console.log('✅ Mapping removed');
      return true;
    } catch (error) {
      console.error('❌ Error removing mapping:', error);
      throw error;
    }
  }

  /**
   * Update mapping after user modification
   * Tracks that user manually edited the auto-filled value
   */
  async updateMappingAfterUserEdit(mappingId, modifications) {
    try {
      console.log('✏️ Updating mapping after user edit:', mappingId);

      await this.invoiceService.updateMapping(mappingId, modifications);

      console.log('✅ Mapping updated with user modifications');
      return true;
    } catch (error) {
      console.error('❌ Error updating mapping:', error);
      throw error;
    }
  }

  // ============================================================================
  // BULK OPERATIONS
  // ============================================================================

  /**
   * Apply all active mappings to helper.centers
   * Loads all mappings from database and applies them
   */
  async applyAllMappings(caseId) {
    try {
      console.log('🔄 Applying all mappings for case:', caseId);

      const mappingCount = await this.invoiceHelperSync.applyMappingsToCenters(caseId);

      console.log(`✅ Applied ${mappingCount} mappings to damage centers`);
      return mappingCount;
    } catch (error) {
      console.error('❌ Error applying all mappings:', error);
      throw error;
    }
  }

  /**
   * Clear all invoice mappings from helper.centers
   */
  async clearAllMappings(caseId) {
    try {
      console.log('🧹 Clearing all mappings for case:', caseId);

      const clearedCount = await this.invoiceHelperSync.clearMappingsFromCenters(caseId);

      console.log(`✅ Cleared ${clearedCount} mappings from damage centers`);
      return clearedCount;
    } catch (error) {
      console.error('❌ Error clearing all mappings:', error);
      throw error;
    }
  }

  /**
   * Get all mappings for a damage center
   */
  async getMappingsForCenter(caseId, damageCenterId) {
    try {
      const mappings = await this.invoiceService.getMappingsForCenter(caseId, damageCenterId);
      return mappings || [];
    } catch (error) {
      console.error('❌ Error getting mappings:', error);
      return [];
    }
  }

  /**
   * Get unmapped invoice items (available for mapping)
   */
  async getUnmappedItems(invoiceId) {
    try {
      const items = await this.invoiceService.getUnmappedItems(invoiceId);
      return items || [];
    } catch (error) {
      console.error('❌ Error getting unmapped items:', error);
      return [];
    }
  }

  // ============================================================================
  // IFRAME COMMUNICATION
  // ============================================================================

  /**
   * Notify iframe of mapping change
   * Sends postMessage to damage center iframe to update field
   */
  notifyIframeOfMappingChange(centerId, fieldType, fieldIndex, value) {
    try {
      const iframe = document.querySelector('#damage-centers-iframe');
      if (!iframe || !iframe.contentWindow) {
        console.warn('⚠️ Damage centers iframe not found');
        return;
      }

      const message = {
        type: 'APPLY_MAPPING',
        data: {
          centerId,
          fieldType,
          fieldIndex,
          value
        }
      };

      iframe.contentWindow.postMessage(message, '*');
      console.log('📤 Sent mapping to iframe:', message);
    } catch (error) {
      console.error('❌ Error notifying iframe:', error);
    }
  }

  /**
   * Listen for field click events from iframe
   * Returns a promise that resolves when user clicks a field
   */
  listenForFieldClick() {
    return new Promise((resolve) => {
      const handler = (event) => {
        // Verify origin for security
        // TODO: Add proper origin check
        
        if (event.data && event.data.type === 'FIELD_CLICKED') {
          window.removeEventListener('message', handler);
          resolve(event.data.data);
        }
      };

      window.addEventListener('message', handler);
    });
  }

  /**
   * Set active mapping (field being mapped)
   */
  setActiveMapping(mappingConfig) {
    this.activeMapping = mappingConfig;
    console.log('🎯 Active mapping set:', mappingConfig);
  }

  /**
   * Get active mapping
   */
  getActiveMapping() {
    return this.activeMapping;
  }

  /**
   * Clear active mapping
   */
  clearActiveMapping() {
    this.activeMapping = null;
    console.log('🎯 Active mapping cleared');
  }
}

// Export singleton instance
window.damageCenterMapper = window.damageCenterMapper || new DamageCenterMapper();
