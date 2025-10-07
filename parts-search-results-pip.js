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
    
    // SESSION 9 TASK 1: Enhanced plate number extraction with debugging
    console.log('🔍 SESSION 9 TASK 1: Plate number extraction...');
    console.log('  - searchContext:', JSON.stringify(searchContext, null, 2));
    console.log('  - searchContext.plate:', searchContext.plate);
    console.log('  - window.helper exists:', !!window.helper);
    console.log('  - window.helper?.plate:', window.helper?.plate);
    
    this.searchResults = searchResults || [];
    
    // Try multiple sources for plate number
    this.currentPlateNumber = searchContext.plate 
      || searchContext.car_plate 
      || searchContext.plateNumber 
      || window.helper?.plate 
      || window.helper?.vehicle?.plate 
      || null;
    
    console.log('  - RESOLVED plate number:', this.currentPlateNumber);
    console.log('  - Extraction strategy used:', this.currentPlateNumber ? 'SUCCESS' : 'FAILED');
    
    this.currentSessionId = searchContext.sessionId || null;
    this.searchSuccess = searchContext.searchSuccess !== false; // Default to true unless explicitly false
    this.errorMessage = searchContext.errorMessage || null;
    this.currentSearchContext = searchContext; // SESSION 11: Store for selected parts save
    this.currentSupabaseSessionId = null; // SESSION 11: Will be populated after search session save
    
    // SESSION 9: Save search session to Supabase (OPTION 1 - every search)
    console.log('🔍 SESSION 9 DEBUG: Check conditions:', {
      hasPlateNumber: !!this.currentPlateNumber,
      plateNumber: this.currentPlateNumber,
      hasSessionId: !!this.currentSessionId,
      resultsCount: this.searchResults.length,
      serviceAvailable: !!window.partsSearchSupabaseService
    });
    
    // SESSION 9 FIX: Always save session to Supabase (ignore temp sessionId from search service)
    if (this.currentPlateNumber) {
      console.log('✅ SESSION 9: Conditions met, starting Supabase save...');
      console.log('  - Plate number:', this.currentPlateNumber);
      console.log('  - Temp sessionId (ignored):', this.currentSessionId);
      
      try {
        console.log('📦 SESSION 9: Getting global service...');
        const partsSearchService = window.partsSearchSupabaseService;
        if (!partsSearchService) {
          throw new Error('partsSearchSupabaseService not available on window');
        }
        console.log('✅ SESSION 9: Service available');
        
        // Create search session in Supabase (ALWAYS - even if temp sessionId exists)
        console.log('💾 SESSION 9: Creating search session in Supabase...');
        const supabaseSessionId = await partsSearchService.createSearchSession(
          this.currentPlateNumber,
          searchContext
        );
        console.log('✅ SESSION 9: Search session saved to Supabase:', supabaseSessionId);
        this.currentSupabaseSessionId = supabaseSessionId; // SESSION 11: Store for selected parts save
        
        // Save search results
        if (supabaseSessionId) {
          console.log('💾 SESSION 9: Saving search results...');
          const searchResultId = await partsSearchService.saveSearchResults(
            supabaseSessionId,
            this.searchResults,
            searchContext
          );
          console.log('✅ SESSION 9: Search results saved to Supabase');
          this.currentSearchResultId = searchResultId; // SESSION 11: Store parts_search_results.id for selected parts
        } else {
          console.warn('⚠️ SESSION 9: No session ID returned from Supabase, skipping results save');
        }
      } catch (error) {
        console.error('❌ SESSION 9: Error saving to Supabase:', error);
        console.error('❌ SESSION 9: Error stack:', error.stack);
        // Non-blocking - continue with UI display
      }
    } else {
      console.warn('⚠️ SESSION 9: No plate number available, skipping Supabase save');
      console.log('  - Check searchContext.plate or window.helper.plate');
    }
    
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
              <div class="user-info-box">
                <div class="user-title">בעל הרשומה</div>
                <div class="user-name">${userName}</div>
              </div>
            </div>
            
            <div class="header-middle">
              <img src="https://carmelcayouf.com/wp-content/uploads/2025/06/g.webp" alt="SmartVal Logo" class="pip-logo" />
            </div>
            
            <div class="header-right">
              <span class="date-label">תאריך: </span>
              <span class="date-value">${new Date().toLocaleDateString('he-IL')}</span>
            </div>
            
            <button class="pip-close-btn" onclick="window.partsResultsPiP?.hidePiP()">×</button>
          </div>

          <!-- Action Buttons -->
          <div class="pip-actions">
            <button class="action-btn print-btn" onclick="window.partsResultsPiP?.printResults()">
              <span class="btn-icon">🖨️</span>
              הדפסה
            </button>
            <button class="action-btn review-btn" onclick="window.partsResultsPiP?.openReviewWindow()">
              <span class="btn-icon">🔍</span>
              סקירה
            </button>
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
          <th class="col-model">דגם</th>
          <th class="col-year">שנה</th>
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
      
      // Extract new fields for better identification
      const modelDisplay = item.model_display || item.model || 'לא מוגדר';
      const extractedYear = item.extracted_year || 'לא מוגדר';
      const partFamily = item.part_family || 'לא מוגדר';
      
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
          <td class="col-family" title="${partFamily}">${partFamily}</td>
          <td class="col-model" title="${modelDisplay}">${modelDisplay}</td>
          <td class="col-year" title="${extractedYear}">${extractedYear}</td>
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
    // SESSION 11: 1. Save to Supabase selected_parts table with full context
    if (this.currentPlateNumber) {
      try {
        const partsSearchService = window.partsSearchSupabaseService;
        if (!partsSearchService) {
          throw new Error('partsSearchSupabaseService not available');
        }
        
        // SESSION 11: Pass search context with vehicle data and session ID
        const partId = await partsSearchService.saveSelectedPart(
          this.currentPlateNumber,
          item,
          {
            searchSessionId: this.currentSupabaseSessionId,
            searchContext: this.currentSearchContext
          }
        );
        
        if (partId) {
          console.log('✅ SESSION 11: Part saved to Supabase selected_parts:', partId);
        }
      } catch (error) {
        console.error('❌ SESSION 11: Error saving part to Supabase:', error);
        // Non-blocking - continue with helper save
      }
    }

    // 2. Add to helper.parts_search.selected_parts
    this.addToHelper(item);
  }

  /**
   * Remove selected part from both Supabase and helper
   */
  async removeSelectedPart(item) {
    // SESSION 9: 1. Remove from Supabase
    if (this.currentPlateNumber) {
      try {
        const partsSearchService = window.partsSearchSupabaseService;
        if (!partsSearchService) {
          throw new Error('partsSearchSupabaseService not available');
        }
        
        const success = await partsSearchService.deleteSelectedPart(
          item.pcode || item.id,
          this.currentPlateNumber
        );
        
        if (success) {
          console.log('✅ SESSION 9: Part removed from Supabase selected_parts');
        }
      } catch (error) {
        console.error('❌ SESSION 9: Error removing part from Supabase:', error);
        // Non-blocking - continue with helper removal
      }
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

    // SESSION 9: Count both session selections and total for plate
    const sessionCount = this.selectedItems.size;
    const totalForPlate = window.helper?.parts_search?.selected_parts?.length || 0;
    
    console.log('💾 Saving all selections - Session:', sessionCount, 'Total for plate:', totalForPlate);
    alert(`נשמרו ${sessionCount} חלקים בחיפוש זה\nסה"כ ${totalForPlate} חלקים נבחרו למספר רכב ${this.currentPlateNumber || ''}`);
    
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
   * Print the current PiP content
   */
  printResults() {
    // Create a new window for printing
    const printWindow = window.open('', '_blank');
    
    // Get the current PiP content
    const pipContent = this.pipWindow.innerHTML;
    
    // Create a styled print version
    printWindow.document.write(`
      <!DOCTYPE html>
      <html dir="rtl">
        <head>
          <title>תוצאות חיפוש חלקים</title>
          <style>
            ${this.getStyles()}
            @media print {
              .pip-close-btn, .pip-actions { display: none !important; }
              .pip-window { 
                box-shadow: none !important;
                position: static !important;
                transform: none !important;
                width: 100% !important;
                height: auto !important;
              }
            }
          </style>
        </head>
        <body>
          ${pipContent}
        </body>
      </html>
    `);
    
    printWindow.document.close();
    
    // Wait for images to load before printing
    setTimeout(() => {
      printWindow.print();
    }, 500);
  }

  /**
   * Open a new window with a detailed view of the results
   */
  openReviewWindow() {
    // Create a new window for detailed review
    const reviewWindow = window.open('', '_blank', 'width=1200,height=800');
    
    // Create a more detailed view of the results
    reviewWindow.document.write(`
      <!DOCTYPE html>
      <html dir="rtl">
        <head>
          <title>סקירת תוצאות חיפוש חלקים</title>
          <style>
            ${this.getStyles()}
            body { 
              margin: 0;
              padding: 20px;
              background: #f3f4f6;
            }
            .review-container {
              max-width: 1400px;
              margin: 0 auto;
              background: white;
              padding: 20px;
              border-radius: 8px;
              box-shadow: 0 1px 3px rgba(0,0,0,0.1);
            }
            .pip-window {
              position: static;
              transform: none;
              width: 100%;
              height: auto;
              box-shadow: none;
            }
            /* Hide original PiP buttons and elements not needed in review */
            .pip-close-btn,
            .pip-actions,
            .pip-footer { 
              display: none !important; 
            }
            
            /* Ensure price alignment in review window */
            .results-table td.price-cell,
            .results-table td.col-price {
              text-align: center !important;
              direction: ltr !important;
              display: table-cell !important;
            }
            
            /* Override any RTL text alignment for price cells */
            .results-table td.price-cell *,
            .results-table td.col-price * {
              text-align: center !important;
            }

            /* Footer styles for review window */
            .review-footer {
              position: sticky;
              bottom: 0;
              background: white;
              padding: 15px;
              border-top: 1px solid #e5e7eb;
              display: flex;
              justify-content: space-between;
              align-items: center;
              margin-top: 20px;
            }

            .footer-buttons {
              display: flex;
              gap: 10px;
            }

            .btn-primary, .btn-secondary, .btn-close {
              padding: 8px 16px;
              border-radius: 6px;
              border: none;
              cursor: pointer;
              font-size: 14px;
              transition: background-color 0.2s;
            }

            .btn-primary {
              background: #4f46e5;
              color: white;
            }

            .btn-primary:hover {
              background: #4338ca;
            }

            .btn-secondary {
              background: #9ca3af;
              color: white;
            }

            .btn-secondary:hover {
              background: #6b7280;
            }

            .btn-close {
              background: #ef4444;
              color: white;
            }

            .btn-close:hover {
              background: #dc2626;
            }

            .btn-print {
              background: #6366f1;
              color: white;
            }

            .btn-print:hover {
              background: #4f46e5;
            }

            @media print {
              .review-footer, #notification {
                display: none !important;
              }
              .review-container {
                padding: 0;
                margin: 0;
              }
              .pip-window {
                box-shadow: none;
              }
            }
          </style>
          <script>
            // Create a bridge to the parent window's functions
            const parentPiP = window.opener.partsResultsPiP;

            // Create and style notification element
            const notificationDiv = document.createElement('div');
            Object.assign(notificationDiv.style, {
              position: 'fixed',
              top: '20px',
              left: '50%',
              transform: 'translateX(-50%)',
              background: '#10b981',
              color: 'white',
              padding: '12px 24px',
              borderRadius: '6px',
              fontSize: '14px',
              zIndex: '1000',
              display: 'none',
              boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
              direction: 'rtl'
            });
            document.body.appendChild(notificationDiv);

            function showNotification(message, type = 'success') {
              notificationDiv.style.background = type === 'success' ? '#10b981' : '#ef4444';
              notificationDiv.textContent = message;
              notificationDiv.style.display = 'block';
              setTimeout(() => {
                notificationDiv.style.display = 'none';
              }, 3000);
            }
            
            async function clearSelections() {
              await parentPiP.clearSelections();
              showNotification('הבחירות נוקו בהצלחה');
              updateUI();
              // Also update the parent window's UI
              parentPiP.updateResults();
            }
            
            async function saveAllSelections() {
              const selectedCount = parentPiP.selectedItems.size;
              if (selectedCount === 0) {
                showNotification('לא נבחרו חלקים לשמירה', 'error');
                return;
              }

              await parentPiP.saveAllSelections();
              showNotification(selectedCount + ' חלקים נשמרו בהצלחה');
              // Update both windows
              updateUI();
              parentPiP.updateResults();
            }
            
            function closeWindow() {
              window.close();
            }

            function syncWithParentSelections() {
              // Sync the selected items from parent
              const checkboxes = document.querySelectorAll('.part-checkbox');
              checkboxes.forEach(cb => {
                const partId = cb.getAttribute('data-part-id');
                cb.checked = parentPiP.selectedItems.has(partId);
              });
            }

            function updateUI() {
              syncWithParentSelections();
              
              // Update selection count
              const countElement = document.querySelector('.selected-count');
              if (countElement) {
                countElement.textContent = parentPiP.selectedItems.size;
              }
            }

            // Add click handlers to checkboxes
            document.querySelectorAll('.part-checkbox').forEach(cb => {
              cb.onclick = async function(e) {
                const partId = this.getAttribute('data-part-id');
                const catalogItem = parentPiP.searchResults.find(item => item.id === partId);
                
                if (this.checked) {
                  parentPiP.selectedItems.add(partId);
                  if (catalogItem) {
                    await parentPiP.saveSelectedPart(catalogItem);
                  }
                } else {
                  parentPiP.selectedItems.delete(partId);
                }
                
                // Update both windows
                updateUI();
                parentPiP.updateResults();
              };
            });

            // Poll for changes in parent window selections
            setInterval(() => {
              syncWithParentSelections();
            }, 500);

            // Initial state setup
            document.addEventListener('DOMContentLoaded', () => {
              updateUI();
              // Ensure initial selections are reflected
              syncWithParentSelections();
            });

            // Initial UI update
            updateUI();
          </script>
        </head>
        <body>
          <div class="review-container">
            <div class="pip-window" dir="rtl">
              <!-- Header -->
              <div class="pip-header">
                <div class="header-left">
                  <div class="user-info-box">
                    <div class="user-title">בעל הרשומה</div>
                    <div class="user-name">${this.userName}</div>
                  </div>
                </div>
                
                <div class="header-middle">
                  <img src="https://carmelcayouf.com/wp-content/uploads/2025/06/g.webp" alt="SmartVal Logo" class="pip-logo" />
                </div>
                
                <div class="header-right">
                  <span class="date-label">תאריך: </span>
                  <span class="date-value">${new Date().toLocaleDateString('he-IL')}</span>
                </div>
              </div>

              <!-- Title -->
              <h2 class="pip-title">תוצאות חיפוש חלקים</h2>
              
              <!-- Results Table -->
              <div class="results-container">
                <div class="table-wrapper">
                  <table class="results-table">
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
                    <tbody>
                      ${this.searchResults.map((item, index) => {
                        const isSelected = this.selectedItems.has(item.id);
                        const price = item.price ? parseFloat(item.price) : null;
                        const formattedPrice = price ? `₪${price.toLocaleString('he-IL')}` : 'לא זמין';
                        const versionDate = item.version_date ? new Date(item.version_date).toLocaleDateString('he-IL') : '';
                        
                        return `
                          <tr class="result-row ${isSelected ? 'selected' : ''}" data-part-id="${item.id}">
                            <td class="col-select">
                              <input 
                                type="checkbox" 
                                class="part-checkbox" 
                                data-part-id="${item.id}"
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
                      }).join('')}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            <div class="review-footer">
              <div class="selection-summary">
                נבחרו: <span class="selected-count">0</span> חלקים
              </div>
              <div class="footer-buttons">
                <button class="btn-secondary" onclick="window.reviewFunctions.clearSelections()">
                  נקה בחירה
                </button>
                <button class="btn-primary" onclick="window.reviewFunctions.saveAllSelections()">
                  שמור נבחרים
                </button>
                <button class="btn-print" onclick="window.reviewFunctions.printWindow()">
                  הדפסה
                </button>
                <button class="btn-close" onclick="window.reviewFunctions.closeWindow()">
                  סגור
                </button>
              </div>
            </div>
          </div>

          <script>
            window.reviewFunctions = {
              parentPiP: window.opener.partsResultsPiP,

              clearSelections: async function() {
                await this.parentPiP.clearSelections();
                this.showNotification('הבחירות נוקו בהצלחה');
                this.updateUI();
              },

              saveAllSelections: async function() {
                const selectedCount = this.parentPiP.selectedItems.size;
                if (selectedCount === 0) {
                  this.showNotification('לא נבחרו חלקים לשמירה', 'error');
                  return;
                }

                await this.parentPiP.saveAllSelections();
                this.showNotification(selectedCount + ' חלקים נשמרו בהצלחה');
                this.updateUI();
              },

              printWindow: function() {
                window.print();
              },

              closeWindow: function() {
                try {
                  // First try to remove any event listeners
                  document.querySelectorAll('.part-checkbox').forEach(cb => {
                    cb.onclick = null;
                    const clone = cb.cloneNode(true);
                    cb.parentNode.replaceChild(clone, cb);
                  });
                  
                  // Remove polling interval
                  if (this.pollInterval) {
                    clearInterval(this.pollInterval);
                  }
                  
                  // Close the window
                  window.close();
                } catch (e) {
                  console.error('Error closing window:', e);
                  // Fallback close attempt
                  window.open('', '_self').close();
                }
              },

              showNotification: function(message, type = 'success') {
                const notificationDiv = document.getElementById('notification') || this.createNotificationElement();
                notificationDiv.style.background = type === 'success' ? '#10b981' : '#ef4444';
                notificationDiv.textContent = message;
                notificationDiv.style.display = 'block';
                setTimeout(() => {
                  notificationDiv.style.display = 'none';
                }, 3000);
              },

              createNotificationElement: function() {
                const div = document.createElement('div');
                div.id = 'notification';
                Object.assign(div.style, {
                  position: 'fixed',
                  top: '20px',
                  left: '50%',
                  transform: 'translateX(-50%)',
                  background: '#10b981',
                  color: 'white',
                  padding: '12px 24px',
                  borderRadius: '6px',
                  fontSize: '14px',
                  zIndex: '1000',
                  display: 'none',
                  boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                  direction: 'rtl'
                });
                document.body.appendChild(div);
                return div;
              },

              updateUI: function() {
                // Update checkboxes
                const checkboxes = document.querySelectorAll('.part-checkbox');
                checkboxes.forEach(cb => {
                  const partId = cb.getAttribute('data-part-id');
                  cb.checked = this.parentPiP.selectedItems.has(partId);
                });

                // Update count
                const countElement = document.querySelector('.selected-count');
                if (countElement) {
                  countElement.textContent = this.parentPiP.selectedItems.size;
                }

                // Update parent window
                this.parentPiP.updateResults();
              },

              setupCheckboxHandlers: function() {
                const self = this;
                document.querySelectorAll('.part-checkbox').forEach(cb => {
                  cb.onclick = async function(e) {
                    e.stopPropagation(); // Prevent event bubbling
                    const partId = this.getAttribute('data-part-id');
                    const row = this.closest('tr');
                    const catalogItem = self.parentPiP.searchResults.find(item => item.id === partId);
                    
                    if (this.checked) {
                      self.parentPiP.selectedItems.add(partId);
                      row.classList.add('selected');
                      if (catalogItem) {
                        await self.parentPiP.saveSelectedPart(catalogItem);
                      }
                    } else {
                      self.parentPiP.selectedItems.delete(partId);
                      row.classList.remove('selected');
                    }
                    
                    self.updateUI();
                  };

                  // Prevent checkbox from triggering row click
                  cb.addEventListener('click', (e) => {
                    e.stopPropagation();
                  });
                });
              },

              init: function() {
                this.setupCheckboxHandlers();
                this.updateUI();
                
                // Store the polling interval reference
                this.pollInterval = setInterval(() => this.updateUI(), 500);

                // Add window unload handler
                window.addEventListener('unload', () => {
                  if (this.pollInterval) {
                    clearInterval(this.pollInterval);
                  }
                });

                // Ensure close button works by adding direct event listener
                const closeBtn = document.querySelector('.btn-close');
                if (closeBtn) {
                  closeBtn.addEventListener('click', (e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    this.closeWindow();
                  });
                }

                // Add row click handler that won't interfere with close button
                document.querySelectorAll('.result-row').forEach(row => {
                  row.addEventListener('click', (e) => {
                    if (e.target.closest('.btn-close')) {
                      return; // Don't handle row click if clicking close button
                    }
                    const checkbox = row.querySelector('.part-checkbox');
                    if (checkbox && e.target !== checkbox) {
                      checkbox.click();
                    }
                  });
                });
              }
            };

            // Initialize the review window functionality
            window.reviewFunctions.init();
          </script>
        </body>
      </html>
    `);
    
    reviewWindow.document.close();
  }

  /**
   * Get all relevant styles for the PiP window
   */
  getStyles() {
    // Get all stylesheet rules that apply to the PiP
    const styles = [];
    for (const sheet of document.styleSheets) {
      try {
        const rules = sheet.cssRules || sheet.rules;
        for (const rule of rules) {
          if (rule.selectorText && 
              (rule.selectorText.includes('pip-') || 
               rule.selectorText.includes('results-') ||
               rule.selectorText.includes('action-'))) {
            styles.push(rule.cssText);
          }
        }
      } catch (e) {
        console.warn('Could not read styles from sheet', e);
      }
    }
    return styles.join('\n');
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
        height: 60px;
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
        overflow: auto;
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
      .col-description { width: 180px; }
      .col-family { width: 120px; }
      .col-model { width: 120px; }
      .col-year { width: 80px; }
      .col-oem { width: 120px; }
      .col-type { width: 80px; }
      .col-price { width: 100px; }
      .col-date { width: 100px; }

      .catalog-number {
        font-family: monospace;
        font-weight: bold;
        color: #1e40af;
      }

      .results-table td.price-cell {
        font-weight: bold;
        color: #059669;
        text-align: center !important;
        direction: ltr !important;
        display: table-cell !important;
      }

      .pip-actions {
        display: flex;
        gap: 10px;
        padding: 0 20px;
        margin-bottom: 15px;
      }

      .action-btn {
        display: flex;
        align-items: center;
        gap: 6px;
        padding: 8px 16px;
        border: none;
        border-radius: 6px;
        font-size: 14px;
        cursor: pointer;
        transition: background-color 0.2s;
      }

      .print-btn {
        background-color: #4f46e5;
        color: white;
      }

      .print-btn:hover {
        background-color: #4338ca;
      }

      .review-btn {
        background-color: #10b981;
        color: white;
      }

      .review-btn:hover {
        background-color: #059669;
      }

      .btn-icon {
        font-size: 16px;
      }
      
      /* Additional fix for price alignment */
      .col-price {
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