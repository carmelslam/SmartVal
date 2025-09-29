// parts-search-results-pip.js - PiP Search Results Window Component
// Phase 5: Parts Search Module - Supabase Integration

// SmartPartsSearchService is loaded as a global script via parts search.html
// No imports needed - service is available as window.SmartPartsSearchService

class PartsSearchResultsPiP {
  constructor() {
    this.isVisible = false;
    this.searchResults = [];
    this.selectedItems = new Set();
    this.currentPlateNumber = null;
    this.currentSessionId = null;
    this.pipWindow = null;
    
    this.init();
  }

  init() {
    this.createPiPStyles();
    console.log('🔍 PiP Search Results Window initialized');
  }

  /**
   * Show PiP window with search results
   */
  async showResults(searchResults, searchContext = {}) {
    console.log('📋 Showing PiP results:', searchResults.length, 'items');
    
    this.searchResults = searchResults || [];
    this.currentPlateNumber = searchContext.plate || window.helper?.plate || null;
    this.currentSessionId = searchContext.sessionId || null;
    this.searchSuccess = searchContext.searchSuccess !== false; // Default to true unless explicitly false
    this.errorMessage = searchContext.errorMessage || null;
    
    if (this.isVisible) {
      this.updateResults();
    } else {
      this.createPiPWindow(searchContext);
    }
    
    // Load existing selections
    await this.loadExistingSelections();
  }

  /**
   * Create the main PiP window
   */
  createPiPWindow(searchContext = {}) {
    // Remove existing window
    this.hidePiP();
    
    const pipHTML = this.generatePiPHTML(searchContext);
    
    // Create window element
    this.pipWindow = document.createElement('div');
    this.pipWindow.innerHTML = pipHTML;
    this.pipWindow.className = 'pip-overlay';
    
    document.body.appendChild(this.pipWindow);
    
    console.log('🪟 PiP DOM element created and appended:', {
      element: this.pipWindow,
      className: this.pipWindow.className,
      innerHTML_length: this.pipWindow.innerHTML.length,
      isConnected: this.pipWindow.isConnected,
      parentNode: this.pipWindow.parentNode
    });
    
    // Add event listeners
    this.attachEventListeners();
    
    this.isVisible = true;
    
    // Animate in
    setTimeout(() => {
      this.pipWindow.classList.add('pip-visible');
      console.log('🎬 PiP animation class added:', {
        hasVisibleClass: this.pipWindow.classList.contains('pip-visible'),
        computedStyle: window.getComputedStyle(this.pipWindow).opacity,
        display: window.getComputedStyle(this.pipWindow).display
      });
    }, 10);
  }

  /**
   * Generate PiP HTML structure
   */
  generatePiPHTML(searchContext = {}) {
    const firstResult = this.searchResults[0] || {};
    const userName = 'ירון כיוף - שמאות וייעוץ';
    
    return `
        <div class="pip-window" dir="rtl">
          <!-- Header -->
          <div class="pip-header">
            <div class="header-left">
              <img src="https://carmelcayouf.com/wp-content/uploads/2025/06/g.webp" alt="SmartVal Logo" class="pip-logo" />
            </div>
            
            <div class="header-middle">
              <div class="user-info-box">
                <div class="user-title">בעל הרשומה</div>
                <div class="user-name">${userName}</div>
              </div>
            </div>
            
            <div class="header-right">
              <span class="date-label">تاريخ: </span>
              <span class="date-value">${new Date().toLocaleDateString('he-IL')}</span>
            </div>
            
            <button class="pip-close-btn" onclick="window.partsResultsPiP?.hidePiP()">×</button>
          </div>

          <!-- Title -->
          <h2 class="pip-title">תוצאות חיפוש חלקים</h2>
          
          <!-- Search Info Bar -->
          <div class="search-info-bar">
            <div class="search-stats">
              נמצאו <strong>${this.searchResults.length}</strong> תוצאות
              ${this.currentPlateNumber ? `• רכב: <strong>${this.currentPlateNumber}</strong>` : ''}
            </div>
            ${firstResult.make || firstResult.model ? `
              <div class="vehicle-info">
                ${firstResult.make ? `יצרן: ${firstResult.make}` : ''}
                ${firstResult.model ? ` • דגם: ${firstResult.model}` : ''}
                ${firstResult.year_from && firstResult.year_to ? ` • שנים: ${firstResult.year_from}-${firstResult.year_to}` : ''}
                ${firstResult.part_family ? ` • חלק: ${firstResult.part_family}` : ''}
              </div>
            ` : ''}
          </div>

          <!-- Results Container -->
          <div class="results-container">
            ${this.generateResultsTableHTML()}
          </div>
          
          <!-- Footer -->
          <div class="pip-footer">
            <div class="selection-summary">
              נבחרו: <span class="selected-count">0</span> חלקים
            </div>
            <div class="footer-buttons">
              <button class="btn-secondary" onclick="window.partsResultsPiP?.clearSelections()">
                נקה בחירה
              </button>
              <button class="btn-primary" onclick="window.partsResultsPiP?.saveAllSelections()">
                שמור נבחרים
              </button>
              <button class="btn-close" onclick="window.partsResultsPiP?.hidePiP()">
                סגור
              </button>
            </div>
          </div>
        </div>
    `;
  }

  /**
   * Generate results table HTML
   */
  generateResultsTableHTML() {
    // Show error message if search failed
    if (!this.searchSuccess && this.errorMessage) {
      return `
        <div class="no-results error-state">
          <div class="no-results-icon">❌</div>
          <div class="no-results-text">שגיאה בחיפוש</div>
          <div class="no-results-subtitle">${this.errorMessage}</div>
          <div class="retry-hint">נסה לחפש שוב או בדוק את החיבור</div>
        </div>
      `;
    }
    
    // Show empty results message if no results found
    if (!this.searchResults.length) {
      return `
        <div class="no-results">
          <div class="no-results-icon">🔍</div>
          <div class="no-results-text">לא נמצאו תוצאות</div>
          <div class="no-results-subtitle">נסה לשנות את פרמטרי החיפוש</div>
          <div class="retry-hint">בדוק את היצרן, דגם או מילות חיפוש אחרות</div>
        </div>
      `;
    }

    const tableHeaders = `
      <thead>
        <tr>
          <th class="col-select">בחר</th>
          <th class="col-supplier">ספק</th>
          <th class="col-catalog">מספר קטלוגי</th>
          <th class="col-description">תיאור</th>
          <th class="col-family">משפחת חלק</th>
          <th class="col-type">סוג</th>
          <th class="col-price">מחיר</th>
          <th class="col-date">תאריך</th>
        </tr>
      </thead>
    `;

    const tableRows = this.searchResults.map((item, index) => {
      const isSelected = this.selectedItems.has(item.id);
      const price = item.price ? parseFloat(item.price) : null;
      const formattedPrice = price ? `₪${price.toLocaleString('he-IL')}` : 'לא זמין';
      const versionDate = item.version_date ? new Date(item.version_date).toLocaleDateString('he-IL') : '';
      
      return `
        <tr class="result-row ${isSelected ? 'selected' : ''}" data-item-id="${item.id}">
          <td class="col-select">
            <input 
              type="checkbox" 
              class="part-checkbox" 
              data-item-id="${item.id}"
              data-index="${index}"
              ${isSelected ? 'checked' : ''}
            />
          </td>
          <td class="col-supplier" title="${item.supplier_name || ''}">${item.supplier_name || 'לא זמין'}</td>
          <td class="col-catalog catalog-number" title="${item.pcode || ''}">${item.pcode || 'לא זמין'}</td>
          <td class="col-description part-description" title="${item.cat_num_desc || ''}">${item.cat_num_desc || 'לא זמין'}</td>
          <td class="col-family" title="${item.part_family || ''}">${item.part_family || 'לא זמין'}</td>
          <td class="col-type">${item.availability || 'מקורי'}</td>
          <td class="col-price price-cell" title="${formattedPrice}">${formattedPrice}</td>
          <td class="col-date">${versionDate}</td>
        </tr>
      `;
    }).join('');

    return `
      <div class="table-wrapper">
        <table class="results-table">
          ${tableHeaders}
          <tbody>
            ${tableRows}
          </tbody>
        </table>
      </div>
    `;
  }

  /**
   * Attach event listeners
   */
  attachEventListeners() {
    if (!this.pipWindow) return;

    // Checkbox change events
    this.pipWindow.addEventListener('change', (e) => {
      if (e.target.classList.contains('part-checkbox')) {
        this.handlePartSelection(e.target);
      }
    });

    // Close on overlay click
    this.pipWindow.addEventListener('click', (e) => {
      if (e.target.classList.contains('pip-overlay')) {
        this.hidePiP();
      }
    });

    // Escape key to close
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && this.isVisible) {
        this.hidePiP();
      }
    });
  }

  /**
   * Handle part selection/deselection
   */
  async handlePartSelection(checkbox) {
    const itemId = checkbox.dataset.itemId;
    const itemIndex = parseInt(checkbox.dataset.index);
    const isChecked = checkbox.checked;
    const item = this.searchResults[itemIndex];

    if (!item) {
      console.error('❌ Item not found for selection:', itemId);
      return;
    }

    try {
      if (isChecked) {
        // Add to selected items
        this.selectedItems.add(itemId);
        await this.saveSelectedPart(item);
        console.log('✅ Part selected:', item.pcode || item.id);
      } else {
        // Remove from selected items
        this.selectedItems.delete(itemId);
        await this.removeSelectedPart(item);
        console.log('🗑️ Part deselected:', item.pcode || item.id);
      }

      // Update UI
      this.updateSelectionUI(itemId, isChecked);
      this.updateSelectionCount();

    } catch (error) {
      console.error('❌ Selection error:', error);
      // Revert checkbox state
      checkbox.checked = !isChecked;
    }
  }

  /**
   * Save selected part to both Supabase and helper
   */
  async saveSelectedPart(item) {
    // 1. Save to Supabase selected_parts table (temporarily disabled)
    if (this.currentPlateNumber) {
      console.log('ℹ️ Supabase saving temporarily disabled - table structure unknown');
      // TODO: Re-enable once we know the correct table structure
    }

    // 2. Add to helper.parts_search.selected_parts
    this.addToHelper(item);
  }

  /**
   * Remove selected part from both Supabase and helper
   */
  async removeSelectedPart(item) {
    // 1. Remove from Supabase (temporarily disabled until table structure is known)
    if (this.currentPlateNumber) {
      console.log('ℹ️ Supabase deletion temporarily disabled - table structure unknown');
      // TODO: Re-enable once we know the correct table structure
    }

    // 2. Remove from helper
    this.removeFromHelper(item);
  }

  /**
   * Add part to helper structure with correct format
   */
  addToHelper(item) {
    if (!window.helper) window.helper = {};
    if (!window.helper.parts_search) window.helper.parts_search = {};
    if (!window.helper.parts_search.selected_parts) {
      window.helper.parts_search.selected_parts = [];
    }

    // Convert catalog item to helper format
    const selectedPartEntry = this.convertCatalogToHelperFormat(item);

    // Check for duplicates (prevent double registration)
    const existingIndex = window.helper.parts_search.selected_parts.findIndex(
      part => part.catalog_item_id === item.id || 
             (part.pcode && part.pcode === item.pcode)
    );

    if (existingIndex >= 0) {
      // Update existing entry
      window.helper.parts_search.selected_parts[existingIndex] = selectedPartEntry;
      console.log('🔄 Updated existing part in helper');
    } else {
      // Add new entry
      window.helper.parts_search.selected_parts.push(selectedPartEntry);
      console.log('✅ Added new part to helper');
    }

    console.log('📋 Helper updated, total parts:', window.helper.parts_search.selected_parts.length);
  }

  /**
   * Remove part from helper structure
   */
  removeFromHelper(item) {
    if (!window.helper?.parts_search?.selected_parts) return;

    const originalLength = window.helper.parts_search.selected_parts.length;
    
    window.helper.parts_search.selected_parts = 
      window.helper.parts_search.selected_parts.filter(
        part => part.catalog_item_id !== item.id && 
               part.pcode !== item.pcode
      );

    const newLength = window.helper.parts_search.selected_parts.length;
    
    if (originalLength !== newLength) {
      console.log('🗑️ Removed part from helper, remaining:', newLength);
    }
  }

  /**
   * Convert catalog item to helper format
   */
  convertCatalogToHelperFormat(catalogItem) {
    const price = parseFloat(catalogItem.price) || 0;
    
    return {
      // Core fields matching existing structure
      "name": catalogItem.cat_num_desc || catalogItem.part_family || "",
      "תיאור": catalogItem.cat_num_desc || "",
      "כמות": 1,
      "מחיר": `₪${price.toLocaleString('he-IL')}`,
      "סוג חלק": catalogItem.availability || "מקורי",
      "ספק": catalogItem.supplier_name || "",
      "fromSuggestion": false,
      "entry_method": "catalog_search",
      "מיקום": catalogItem.location || "ישראל",
      "זמינות": catalogItem.availability || "זמין",
      "מספר OEM": catalogItem.oem || "",
      "הערות": catalogItem.comments || "",
      "price": price,
      "quantity": 1,
      "source": catalogItem.availability || "מקורי",
      
      // NEW REQUIRED FIELDS
      "מספר קטלוגי": catalogItem.pcode || "",
      "pcode": catalogItem.pcode || "",
      "משפחת חלק": catalogItem.part_family || "",
      "part_family": catalogItem.part_family || "",
      
      // Additional metadata
      "make": catalogItem.make || "",
      "model": catalogItem.model || "",
      "year_from": catalogItem.year_from || null,
      "year_to": catalogItem.year_to || null,
      "catalog_item_id": catalogItem.id || "",
      
      // Tracking fields
      "selected_at": new Date().toISOString(),
      "plate_number": this.currentPlateNumber
    };
  }

  /**
   * Update selection UI state
   */
  updateSelectionUI(itemId, isSelected) {
    const row = this.pipWindow?.querySelector(`tr[data-item-id="${itemId}"]`);
    if (row) {
      if (isSelected) {
        row.classList.add('selected');
      } else {
        row.classList.remove('selected');
      }
    }
  }

  /**
   * Update selection count display
   */
  updateSelectionCount() {
    const countElement = this.pipWindow?.querySelector('.selected-count');
    if (countElement) {
      countElement.textContent = this.selectedItems.size;
    }
  }

  /**
   * Load existing selections from Supabase
   */
  async loadExistingSelections() {
    if (!this.currentPlateNumber) return;

    try {
      const { supabase } = await import('./lib/supabaseClient.js');
      
      // First, let's check what the table structure actually is
      console.log('🔍 Attempting to discover selected_parts table structure...');
      
      // Try to get any row from the table to see what columns exist
      const { data, error } = await supabase
        .from('selected_parts')
        .select('*')
        .limit(1);

      if (error) {
        console.warn('⚠️ Selected parts table query failed:', error);
        console.log('ℹ️ Skipping selection loading - table may not exist or have different structure');
        return;
      }

      if (data && data.length > 0) {
        console.log('📋 Selected parts table columns:', Object.keys(data[0]));
        
        // Try to find a plate/vehicle identifier column
        const plateColumn = Object.keys(data[0]).find(col => 
          col.includes('plate') || col.includes('vehicle') || col.includes('license')
        );
        
        if (plateColumn) {
          console.log(`🚗 Found vehicle identifier column: ${plateColumn}`);
          
          // Try to load selections using the discovered column
          const { data: selections, error: selectError } = await supabase
            .from('selected_parts')
            .select('*')
            .eq(plateColumn, this.currentPlateNumber);

          if (!selectError && selections) {
            this.selectedItems.clear();
            selections.forEach(item => {
              const itemId = item.pcode || item.id || item.oem;
              if (itemId) {
                this.selectedItems.add(itemId);
              }
            });
            console.log('📋 Loaded existing selections:', this.selectedItems.size);
          }
        } else {
          console.log('ℹ️ No vehicle identifier column found, skipping selection loading');
        }
      } else {
        console.log('ℹ️ Selected parts table is empty');
      }

      // Update UI regardless
      this.updateAllCheckboxes();
      this.updateSelectionCount();

    } catch (error) {
      console.warn('⚠️ Error loading selections (non-critical):', error.message);
      // Don't fail the PiP loading if selections can't be loaded
    }
  }

  /**
   * Update all checkboxes based on selected items
   */
  updateAllCheckboxes() {
    const checkboxes = this.pipWindow?.querySelectorAll('.part-checkbox');
    if (checkboxes) {
      checkboxes.forEach(checkbox => {
        const itemId = checkbox.dataset.itemId;
        const isSelected = this.selectedItems.has(itemId);
        checkbox.checked = isSelected;
        this.updateSelectionUI(itemId, isSelected);
      });
    }
  }

  /**
   * Clear all selections
   */
  async clearSelections() {
    if (this.selectedItems.size === 0) return;

    if (confirm('האם אתה בטוח שברצונך לנקות את כל הבחירות?')) {
      // Clear from Supabase
      if (this.currentPlateNumber) {
        try {
          const { supabase } = await import('./lib/supabaseClient.js');
          await supabase
            .from('selected_parts')
            .delete()
            .eq('plate_number', this.currentPlateNumber);
        } catch (error) {
          console.error('❌ Error clearing selections:', error);
        }
      }

      // Clear from helper
      if (window.helper?.parts_search?.selected_parts) {
        window.helper.parts_search.selected_parts = [];
      }

      // Clear local state
      this.selectedItems.clear();

      // Update UI
      this.updateAllCheckboxes();
      this.updateSelectionCount();

      console.log('🧹 All selections cleared');
    }
  }

  /**
   * Save all selected parts (placeholder for future enhancement)
   */
  async saveAllSelections() {
    if (this.selectedItems.size === 0) {
      alert('לא נבחרו חלקים');
      return;
    }

    console.log('💾 Saving all selections, count:', this.selectedItems.size);
    alert(`נשמרו ${this.selectedItems.size} חלקים`);
    
    // Future: Add integration with parts required or other modules
  }

  /**
   * Update results (for dynamic updates)
   */
  updateResults() {
    const container = this.pipWindow?.querySelector('.results-container');
    if (container) {
      container.innerHTML = this.generateResultsTableHTML();
      this.updateSelectionCount();
    }
  }

  /**
   * Hide PiP window
   */
  hidePiP() {
    if (this.pipWindow) {
      this.pipWindow.classList.remove('pip-visible');
      setTimeout(() => {
        if (this.pipWindow && this.pipWindow.parentNode) {
          this.pipWindow.parentNode.removeChild(this.pipWindow);
        }
        this.pipWindow = null;
        this.isVisible = false;
      }, 300);
    }
  }

  /**
   * Create CSS styles for PiP window
   */
  createPiPStyles() {
    if (document.getElementById('pip-styles')) return;

    const styles = document.createElement('style');
    styles.id = 'pip-styles';
    styles.textContent = `
      .pip-overlay {
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0, 0, 0, 0.7);
        z-index: 10000;
        display: flex;
        justify-content: center;
        align-items: center;
        opacity: 0;
        transition: opacity 0.3s ease;
      }

      .pip-overlay.pip-visible {
        opacity: 1;
      }

      .pip-window {
        direction: rtl;
        font-family: 'Arial Hebrew', Arial, sans-serif;
        background: white;
        border-radius: 12px;
        box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
        max-width: 95vw;
        max-height: 90vh;
        width: 1200px;
        display: flex;
        flex-direction: column;
        overflow: hidden;
        transform: scale(0.9);
        transition: transform 0.3s ease;
      }

      .pip-overlay.pip-visible .pip-window {
        transform: scale(1);
      }

      .pip-header {
        background: linear-gradient(135deg, #1e3a8a 0%, #3b82f6 100%);
        color: white;
        padding: 15px 20px;
        display: flex;
        justify-content: space-between;
        align-items: center;
        position: relative;
      }

      .header-left {
        display: flex;
        align-items: center;
        gap: 8px;
        font-size: 14px;
      }

      .header-middle {
        position: absolute;
        left: 50%;
        transform: translateX(-50%);
      }

      .pip-logo {
        height: 40px;
        width: auto;
      }

      .header-right {
        display: flex;
        align-items: center;
      }

      .user-info-box {
        text-align: center;
        font-size: 13px;
      }

      .user-title {
        opacity: 0.9;
        margin-bottom: 2px;
      }

      .user-name {
        font-weight: bold;
      }

      .pip-close-btn {
        position: absolute;
        top: 15px;
        left: 20px;
        background: rgba(255, 255, 255, 0.2);
        border: none;
        color: white;
        width: 30px;
        height: 30px;
        border-radius: 50%;
        cursor: pointer;
        font-size: 18px;
        line-height: 1;
        transition: background 0.2s ease;
      }

      .pip-close-btn:hover {
        background: rgba(255, 255, 255, 0.3);
      }

      .pip-title {
        text-align: center;
        margin: 20px 0 15px 0;
        color: #1e3a8a;
        font-size: 24px;
        font-weight: bold;
      }

      .search-info-bar {
        background: #f8fafc;
        border: 1px solid #e2e8f0;
        border-radius: 8px;
        padding: 12px 20px;
        margin: 0 20px 20px 20px;
        font-size: 14px;
      }

      .search-stats {
        color: #374151;
        margin-bottom: 4px;
      }

      .vehicle-info {
        color: #6b7280;
        font-size: 13px;
      }

      .results-container {
        flex: 1;
        overflow: hidden;
        padding: 0 20px;
      }

      .table-wrapper {
        height: 100%;
        overflow: auto;
        border: 1px solid #e5e7eb;
        border-radius: 8px;
      }

      .results-table {
        width: 100%;
        border-collapse: collapse;
        font-size: 13px;
        background: white;
      }

      .results-table th {
        background: #f9fafb;
        padding: 12px 8px;
        text-align: right;
        border-bottom: 2px solid #e5e7eb;
        font-weight: bold;
        color: #374151;
        position: sticky;
        top: 0;
        z-index: 1;
      }

      .results-table td {
        padding: 10px 8px;
        border-bottom: 1px solid #f3f4f6;
        text-align: right;
        vertical-align: middle;
      }

      .result-row:hover {
        background: #f8fafc;
      }

      .result-row.selected {
        background: #eff6ff;
      }

      .result-row.selected:hover {
        background: #dbeafe;
      }

      .col-select {
        width: 50px;
        text-align: center !important;
      }

      .col-supplier { width: 120px; }
      .col-catalog { width: 120px; }
      .col-description { width: 200px; }
      .col-family { width: 100px; }
      .col-oem { width: 120px; }
      .col-type { width: 80px; }
      .col-price { width: 100px; }
      .col-date { width: 100px; }

      .catalog-number {
        font-family: monospace;
        font-weight: bold;
        color: #1e40af;
      }

      .price-cell {
        font-weight: bold;
        color: #059669;
        text-align: center !important;
      }

      .part-checkbox {
        transform: scale(1.2);
        cursor: pointer;
      }

      .no-results {
        text-align: center;
        padding: 60px 20px;
        color: #6b7280;
      }

      .no-results-icon {
        font-size: 48px;
        margin-bottom: 16px;
      }

      .no-results-text {
        font-size: 18px;
        font-weight: bold;
        margin-bottom: 8px;
      }

      .no-results-subtitle {
        font-size: 14px;
        margin-bottom: 12px;
      }

      .retry-hint {
        font-size: 12px;
        color: #9ca3af;
        font-style: italic;
      }

      .no-results.error-state {
        color: #dc2626;
      }

      .error-state .retry-hint {
        color: #f87171;
      }

      .pip-footer {
        background: #f9fafb;
        border-top: 1px solid #e5e7eb;
        padding: 15px 20px;
        display: flex;
        justify-content: space-between;
        align-items: center;
      }

      .selection-summary {
        font-size: 14px;
        color: #374151;
        font-weight: bold;
      }

      .footer-buttons {
        display: flex;
        gap: 10px;
      }

      .footer-buttons button {
        padding: 8px 16px;
        border: none;
        border-radius: 6px;
        cursor: pointer;
        font-size: 14px;
        font-weight: bold;
        transition: all 0.2s ease;
      }

      .btn-primary {
        background: #3b82f6;
        color: white;
      }

      .btn-primary:hover {
        background: #2563eb;
      }

      .btn-secondary {
        background: #6b7280;
        color: white;
      }

      .btn-secondary:hover {
        background: #4b5563;
      }

      .btn-close {
        background: #dc2626;
        color: white;
      }

      .btn-close:hover {
        background: #b91c1c;
      }

      /* Mobile responsive */
      @media (max-width: 768px) {
        .pip-window {
          width: 95vw;
          height: 90vh;
        }
        
        .pip-header {
          padding: 10px 15px;
        }
        
        .results-table {
          font-size: 11px;
        }
        
        .results-table th,
        .results-table td {
          padding: 8px 4px;
        }
        
        .footer-buttons {
          flex-direction: column;
          gap: 8px;
        }
        
        .footer-buttons button {
          width: 100%;
        }
      }
    `;
    
    document.head.appendChild(styles);
  }
}

// Create global instance
window.partsResultsPiP = new PartsSearchResultsPiP();

// Debug function to test PiP visibility
window.testPiPWindow = function() {
  console.log('🧪 Testing PiP window visibility...');
  const sampleResults = [
    {
      id: 'test-1',
      pcode: 'TEST123',
      cat_num_desc: 'Test Part Description',
      part_family: 'Test Family',
      make: 'Test Make',
      model: 'Test Model',
      price: 100,
      oem: 'TEST-OEM-123',
      supplier_name: 'Test Supplier',
      availability: 'Available'
    }
  ];
  
  window.partsResultsPiP.showResults(sampleResults, {
    plate: 'TEST-123',
    sessionId: 'test-session',
    searchType: 'test',
    searchSuccess: true,
    errorMessage: null,
    searchTime: 100
  });
};

// Export for module usage (commented out for global script usage)
// export { PartsSearchResultsPiP };
// export default PartsSearchResultsPiP;