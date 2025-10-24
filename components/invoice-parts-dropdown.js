// components/invoice-parts-dropdown.js
// Phase 5a Invoice Integration - Multi-Source Parts Dropdown Component
// Session 74 - Created 2025-10-23
// Purpose: 3-source dropdown for damage center parts mapping

class InvoicePartsDropdown {
  constructor() {
    this.mapper = window.damageCenterMapper;
    this.items = [];
    this.filteredItems = [];
    this.selectedItem = null;
    this.onSelectCallback = null;
    this.container = null;
    this.searchTerm = '';
  }

  // ============================================================================
  // INITIALIZATION
  // ============================================================================

  /**
   * Initialize dropdown with data sources
   * @param {Object} config - Configuration object
   */
  async init(config) {
    try {
      const {
        fieldType,
        caseId,
        invoiceId,
        containerId,
        onSelect
      } = config;

      this.container = document.getElementById(containerId);
      if (!this.container) {
        throw new Error(`Container ${containerId} not found`);
      }

      this.onSelectCallback = onSelect;

      // Load items based on field type
      console.log(`🔽 Initializing dropdown for ${fieldType}...`);
      
      this.items = await this.mapper.getDropdownItems(fieldType, caseId, invoiceId);
      this.filteredItems = [...this.items];

      console.log(`✅ Loaded ${this.items.length} items for dropdown`);

      // Render dropdown
      this.render();

      return true;
    } catch (error) {
      console.error('❌ Dropdown initialization failed:', error);
      return false;
    }
  }

  // ============================================================================
  // RENDERING
  // ============================================================================

  /**
   * Render the dropdown UI
   */
  render() {
    if (!this.container) {
      console.error('❌ No container for dropdown');
      return;
    }

    // Clear container
    this.container.innerHTML = '';

    // Create dropdown structure
    const dropdownHTML = `
      <div class="invoice-dropdown" dir="rtl">
        <!-- Search Box -->
        <div class="dropdown-search">
          <input 
            type="text" 
            id="dropdown-search-input" 
            placeholder="חיפוש פריט..."
            class="search-input"
          />
          <span class="search-icon">🔍</span>
        </div>

        <!-- Source Filter Buttons -->
        <div class="dropdown-filters">
          <button class="filter-btn active" data-source="all">
            הכל (${this.items.length})
          </button>
          <button class="filter-btn" data-source="invoice">
            📄 חשבונית (${this.countBySource('invoice')})
          </button>
          <button class="filter-btn" data-source="selected">
            ✓ נבחר (${this.countBySource('selected')})
          </button>
          <button class="filter-btn" data-source="bank">
            🏦 בנק (${this.countBySource('bank')})
          </button>
        </div>

        <!-- Items List -->
        <div class="dropdown-items" id="dropdown-items-list">
          ${this.renderItems()}
        </div>

        <!-- Empty State -->
        ${this.filteredItems.length === 0 ? this.renderEmptyState() : ''}
      </div>
    `;

    this.container.innerHTML = dropdownHTML;

    // Attach event listeners
    this.attachEventListeners();
  }

  /**
   * Render individual items
   */
  renderItems() {
    if (this.filteredItems.length === 0) {
      return '';
    }

    return this.filteredItems.map(item => `
      <div class="dropdown-item" data-item-id="${item.id}">
        <div class="item-header">
          <span class="item-source-badge ${item.source}">${item.sourceLabel}</span>
          <span class="item-name">${this.escapeHtml(item.name)}</span>
        </div>
        <div class="item-details">
          ${item.description ? `<div class="item-description">${this.escapeHtml(item.description)}</div>` : ''}
          ${item.quantity ? `<span class="item-quantity">כמות: ${item.quantity}</span>` : ''}
          ${item.price ? `<span class="item-price">מחיר: ₪${this.formatNumber(item.price)}</span>` : ''}
          ${item.total ? `<span class="item-total">סה"כ: ₪${this.formatNumber(item.total)}</span>` : ''}
        </div>
        ${item.category ? `<div class="item-category">קטגוריה: ${this.getCategoryLabel(item.category)}</div>` : ''}
        ${item.confidence ? `<div class="item-confidence">דיוק: ${Math.round(item.confidence * 100)}%</div>` : ''}
      </div>
    `).join('');
  }

  /**
   * Render empty state when no items match filter
   */
  renderEmptyState() {
    return `
      <div class="dropdown-empty">
        <div class="empty-icon">📭</div>
        <div class="empty-text">לא נמצאו פריטים</div>
        <div class="empty-hint">נסה לשנות את החיפוש או הסינון</div>
      </div>
    `;
  }

  // ============================================================================
  // EVENT HANDLERS
  // ============================================================================

  /**
   * Attach all event listeners
   */
  attachEventListeners() {
    // Search input
    const searchInput = document.getElementById('dropdown-search-input');
    if (searchInput) {
      searchInput.addEventListener('input', (e) => {
        this.handleSearch(e.target.value);
      });
    }

    // Filter buttons
    const filterButtons = this.container.querySelectorAll('.filter-btn');
    filterButtons.forEach(btn => {
      btn.addEventListener('click', (e) => {
        this.handleFilterChange(e.target.dataset.source);
      });
    });

    // Item clicks
    const items = this.container.querySelectorAll('.dropdown-item');
    items.forEach(itemEl => {
      itemEl.addEventListener('click', (e) => {
        const itemId = itemEl.dataset.itemId;
        this.handleItemSelect(itemId);
      });
    });
  }

  /**
   * Handle search input
   */
  handleSearch(searchTerm) {
    this.searchTerm = searchTerm.toLowerCase();
    this.applyFilters();
  }

  /**
   * Handle source filter change
   */
  handleFilterChange(source) {
    // Update active filter button
    const filterButtons = this.container.querySelectorAll('.filter-btn');
    filterButtons.forEach(btn => {
      if (btn.dataset.source === source) {
        btn.classList.add('active');
      } else {
        btn.classList.remove('active');
      }
    });

    // Apply filter
    if (source === 'all') {
      this.filteredItems = [...this.items];
    } else {
      this.filteredItems = this.items.filter(item => item.source === source);
    }

    // Apply search if exists
    if (this.searchTerm) {
      this.applyFilters();
    } else {
      this.updateItemsList();
    }
  }

  /**
   * Apply all active filters
   */
  applyFilters() {
    let filtered = [...this.items];

    // Get active source filter
    const activeFilter = this.container.querySelector('.filter-btn.active');
    const activeSource = activeFilter ? activeFilter.dataset.source : 'all';

    // Apply source filter
    if (activeSource !== 'all') {
      filtered = filtered.filter(item => item.source === activeSource);
    }

    // Apply search filter
    if (this.searchTerm) {
      filtered = filtered.filter(item => {
        const searchableText = [
          item.name,
          item.description,
          item.part_number,
          item.manufacturer
        ].filter(Boolean).join(' ').toLowerCase();

        return searchableText.includes(this.searchTerm);
      });
    }

    this.filteredItems = filtered;
    this.updateItemsList();
  }

  /**
   * Update items list without full re-render
   */
  updateItemsList() {
    const itemsList = document.getElementById('dropdown-items-list');
    if (!itemsList) return;

    itemsList.innerHTML = this.renderItems();

    // Re-attach item click listeners
    const items = itemsList.querySelectorAll('.dropdown-item');
    items.forEach(itemEl => {
      itemEl.addEventListener('click', (e) => {
        const itemId = itemEl.dataset.itemId;
        this.handleItemSelect(itemId);
      });
    });

    // Show/hide empty state
    if (this.filteredItems.length === 0) {
      itemsList.innerHTML = this.renderEmptyState();
    }
  }

  /**
   * Handle item selection
   */
  handleItemSelect(itemId) {
    // Find selected item
    const item = this.items.find(i => i.id === itemId);
    
    if (!item) {
      console.error('❌ Item not found:', itemId);
      return;
    }

    this.selectedItem = item;
    console.log('✅ Item selected:', item);

    // Highlight selected item
    const itemElements = this.container.querySelectorAll('.dropdown-item');
    itemElements.forEach(el => {
      if (el.dataset.itemId === itemId) {
        el.classList.add('selected');
      } else {
        el.classList.remove('selected');
      }
    });

    // Call callback if provided
    if (this.onSelectCallback) {
      this.onSelectCallback(item);
    }
  }

  // ============================================================================
  // UTILITY METHODS
  // ============================================================================

  /**
   * Count items by source
   */
  countBySource(source) {
    return this.items.filter(item => item.source === source).length;
  }

  /**
   * Get category label in Hebrew
   */
  getCategoryLabel(category) {
    const labels = {
      'part': 'חלק',
      'work': 'עבודה',
      'repair': 'תיקון',
      'material': 'חומר',
      'other': 'אחר',
      'uncategorized': 'לא מסווג'
    };
    return labels[category] || category;
  }

  /**
   * Format number with thousands separator
   */
  formatNumber(num) {
    return Number(num).toLocaleString('he-IL', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });
  }

  /**
   * Escape HTML to prevent XSS
   */
  escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  /**
   * Get selected item
   */
  getSelectedItem() {
    return this.selectedItem;
  }

  /**
   * Clear selection
   */
  clearSelection() {
    this.selectedItem = null;
    const items = this.container.querySelectorAll('.dropdown-item');
    items.forEach(el => el.classList.remove('selected'));
  }

  /**
   * Destroy dropdown and cleanup
   */
  destroy() {
    if (this.container) {
      this.container.innerHTML = '';
    }
    this.items = [];
    this.filteredItems = [];
    this.selectedItem = null;
    this.onSelectCallback = null;
  }
}

// ============================================================================
// DROPDOWN STYLES
// ============================================================================

// Inject styles if not already present
if (!document.getElementById('invoice-dropdown-styles')) {
  const styles = document.createElement('style');
  styles.id = 'invoice-dropdown-styles';
  styles.textContent = `
    .invoice-dropdown {
      background: white;
      border: 1px solid #ddd;
      border-radius: 8px;
      padding: 16px;
      max-height: 500px;
      overflow: hidden;
      display: flex;
      flex-direction: column;
      direction: rtl;
    }

    .dropdown-search {
      position: relative;
      margin-bottom: 12px;
    }

    .search-input {
      width: 100%;
      padding: 10px 40px 10px 10px;
      border: 1px solid #ddd;
      border-radius: 6px;
      font-size: 14px;
      direction: rtl;
    }

    .search-icon {
      position: absolute;
      right: 12px;
      top: 50%;
      transform: translateY(-50%);
      font-size: 18px;
    }

    .dropdown-filters {
      display: flex;
      gap: 8px;
      margin-bottom: 12px;
      flex-wrap: wrap;
    }

    .filter-btn {
      padding: 6px 12px;
      border: 1px solid #ddd;
      background: white;
      border-radius: 6px;
      cursor: pointer;
      font-size: 13px;
      transition: all 0.2s;
    }

    .filter-btn:hover {
      background: #f5f5f5;
    }

    .filter-btn.active {
      background: #3498db;
      color: white;
      border-color: #3498db;
    }

    .dropdown-items {
      flex: 1;
      overflow-y: auto;
      max-height: 350px;
    }

    .dropdown-item {
      padding: 12px;
      border: 1px solid #e0e0e0;
      border-radius: 6px;
      margin-bottom: 8px;
      cursor: pointer;
      transition: all 0.2s;
      background: white;
    }

    .dropdown-item:hover {
      background: #f8f9fa;
      border-color: #3498db;
      transform: translateX(-2px);
    }

    .dropdown-item.selected {
      background: #e3f2fd;
      border-color: #2196f3;
      border-width: 2px;
    }

    .item-header {
      display: flex;
      align-items: center;
      gap: 8px;
      margin-bottom: 8px;
    }

    .item-source-badge {
      padding: 2px 8px;
      border-radius: 4px;
      font-size: 11px;
      font-weight: 600;
      white-space: nowrap;
    }

    .item-source-badge.invoice {
      background: #fff3cd;
      color: #856404;
    }

    .item-source-badge.selected {
      background: #d4edda;
      color: #155724;
    }

    .item-source-badge.bank {
      background: #d1ecf1;
      color: #0c5460;
    }

    .item-name {
      font-weight: 600;
      font-size: 14px;
      flex: 1;
    }

    .item-details {
      display: flex;
      gap: 12px;
      flex-wrap: wrap;
      font-size: 13px;
      color: #666;
      margin-bottom: 6px;
    }

    .item-description {
      flex: 100%;
      color: #555;
      margin-bottom: 4px;
    }

    .item-quantity,
    .item-price,
    .item-total {
      padding: 2px 6px;
      background: #f5f5f5;
      border-radius: 3px;
    }

    .item-category,
    .item-confidence {
      font-size: 12px;
      color: #888;
    }

    .dropdown-empty {
      text-align: center;
      padding: 40px 20px;
      color: #999;
    }

    .empty-icon {
      font-size: 48px;
      margin-bottom: 16px;
    }

    .empty-text {
      font-size: 18px;
      font-weight: 600;
      margin-bottom: 8px;
      color: #666;
    }

    .empty-hint {
      font-size: 14px;
      color: #999;
    }
  `;
  document.head.appendChild(styles);
}

// Export for use
window.InvoicePartsDropdown = InvoicePartsDropdown;
