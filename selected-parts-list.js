// selected-parts-list.js - Real-time Selected Parts List Component
// Phase 5: Parts Search Module - Companion to PiP

class SelectedPartsList {
  constructor(containerId = 'selected-parts-display') {
    this.containerId = containerId;
    this.selectedParts = [];
    this.plateNumber = null;
    this.supabaseChannel = null;
    
    this.init();
  }

  async init() {
    this.plateNumber = window.helper?.plate || null;
    console.log('📋 Selected Parts List initialized for plate:', this.plateNumber);
    
    if (this.plateNumber) {
      await this.loadSelectedParts();
      this.setupRealtimeSubscription();
    }
  }

  /**
   * Load selected parts from Supabase
   */
  async loadSelectedParts() {
    if (!this.plateNumber) return;

    try {
      const { supabase } = await import('./lib/supabaseClient.js');
      const { data, error } = await supabase
        .from('selected_parts')
        .select('*')
        .eq('plate_number', this.plateNumber)
        .order('selected_at', { ascending: false });

      if (error) {
        console.error('❌ Error loading selected parts:', error);
        return;
      }

      this.selectedParts = data || [];
      this.render();
      console.log('✅ Loaded selected parts:', this.selectedParts.length);

    } catch (error) {
      console.error('❌ Error loading selected parts:', error);
    }
  }

  /**
   * Setup real-time subscription for selected parts changes
   */
  async setupRealtimeSubscription() {
    if (!this.plateNumber) return;

    try {
      const { supabase } = await import('./lib/supabaseClient.js');
      
      this.supabaseChannel = supabase
        .channel('selected-parts-changes')
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'selected_parts',
            filter: `plate_number=eq.${this.plateNumber}`
          },
          (payload) => {
            console.log('🔄 Real-time update:', payload);
            this.handleRealtimeUpdate(payload);
          }
        )
        .subscribe();

      console.log('✅ Real-time subscription active for plate:', this.plateNumber);

    } catch (error) {
      console.error('❌ Error setting up real-time subscription:', error);
    }
  }

  /**
   * Handle real-time updates from Supabase
   */
  handleRealtimeUpdate(payload) {
    switch (payload.eventType) {
      case 'INSERT':
        this.selectedParts.unshift(payload.new);
        console.log('➕ Part added via real-time');
        break;
        
      case 'DELETE':
        this.selectedParts = this.selectedParts.filter(
          part => part.id !== payload.old.id
        );
        console.log('➖ Part removed via real-time');
        break;
        
      case 'UPDATE':
        const index = this.selectedParts.findIndex(
          part => part.id === payload.new.id
        );
        if (index >= 0) {
          this.selectedParts[index] = payload.new;
          console.log('🔄 Part updated via real-time');
        }
        break;
    }
    
    this.render();
    this.updateHelperStructure();
  }

  /**
   * Update helper structure with current selections
   */
  updateHelperStructure() {
    if (!window.helper) return;

    if (!window.helper.parts_search) {
      window.helper.parts_search = {};
    }

    // Convert Supabase selected parts to helper format
    const helperParts = this.selectedParts.map(part => ({
      // Core fields matching existing structure
      "name": part.cat_num_desc || part.part_family || "",
      "תיאור": part.cat_num_desc || "",
      "כמות": part.quantity || 1,
      "מחיר": `₪${(part.price || 0).toLocaleString('he-IL')}`,
      "סוג חלק": part.source || "חלופי",
      "ספק": part.supplier_name || "",
      "fromSuggestion": false,
      "entry_method": "catalog_search",
      "מיקום": part.location || "ישראל",
      "זמינות": part.availability || "זמין",
      "מספר OEM": part.oem || "",
      "הערות": part.comments || "",
      "price": parseFloat(part.price) || 0,
      "quantity": part.quantity || 1,
      "source": part.source || "חלופי",
      
      // NEW REQUIRED FIELDS
      "מספר קטלוגי": part.pcode || "",
      "pcode": part.pcode || "",
      "משפחת חלק": part.part_family || "",
      "part_family": part.part_family || "",
      
      // Additional metadata
      "make": part.make || "",
      "model": part.model || "",
      "year_from": part.year_from || null,
      "year_to": part.year_to || null,
      "catalog_item_id": part.catalog_item_id || part.id,
      
      // Tracking fields
      "selected_at": part.selected_at,
      "plate_number": part.plate_number
    }));

    window.helper.parts_search.selected_parts = helperParts;
    console.log('🔄 Helper updated with selected parts:', helperParts.length);
  }

  /**
   * Render the selected parts list
   */
  render() {
    const container = document.getElementById(this.containerId);
    if (!container) {
      console.warn('⚠️ Selected parts container not found:', this.containerId);
      return;
    }

    if (this.selectedParts.length === 0) {
      container.innerHTML = `
        <div class="no-selections">
          <div class="no-selections-icon">📋</div>
          <div class="no-selections-text">אין חלקים נבחרים</div>
          <div class="no-selections-subtitle">השתמש בחיפוש כדי למצוא ולבחור חלקים</div>
        </div>
      `;
      return;
    }

    const html = `
      <div class="selected-parts-header">
        <h3>חלקים נבחרים (${this.selectedParts.length})</h3>
        <button class="clear-all-btn" onclick="selectedPartsList.clearAll()">נקה הכל</button>
      </div>
      <div class="selected-parts-items">
        ${this.selectedParts.map(part => this.renderPartItem(part)).join('')}
      </div>
    `;

    container.innerHTML = html;
  }

  /**
   * Render individual part item
   */
  renderPartItem(part) {
    const price = part.price ? parseFloat(part.price) : null;
    const formattedPrice = price ? `₪${price.toLocaleString('he-IL')}` : 'לא זמין';
    const selectedDate = part.selected_at ? 
      new Date(part.selected_at).toLocaleDateString('he-IL') : '';

    return `
      <div class="selected-part-item" data-part-id="${part.id}">
        <div class="part-main-info">
          <div class="part-name">${part.cat_num_desc || 'לא זמין'}</div>
          <div class="part-details">
            <span class="part-supplier">${part.supplier_name || 'לא זמין'}</span>
            <span class="part-code">${part.pcode || 'לא זמין'}</span>
            <span class="part-price">${formattedPrice}</span>
          </div>
        </div>
        <div class="part-actions">
          <button class="remove-part-btn" onclick="selectedPartsList.removePart('${part.id}')">
            🗑️
          </button>
        </div>
      </div>
    `;
  }

  /**
   * Remove a specific part
   */
  async removePart(partId) {
    if (!confirm('האם אתה בטוח שברצונך להסיר חלק זה?')) {
      return;
    }

    try {
      const { supabase } = await import('./lib/supabaseClient.js');
      const { error } = await supabase
        .from('selected_parts')
        .delete()
        .eq('id', partId);

      if (error) {
        console.error('❌ Error removing part:', error);
        alert('שגיאה בהסרת החלק');
        return;
      }

      console.log('✅ Part removed:', partId);
      // Real-time subscription will handle UI update

    } catch (error) {
      console.error('❌ Error removing part:', error);
      alert('שגיאה בהסרת החלק');
    }
  }

  /**
   * Clear all selected parts
   */
  async clearAll() {
    if (this.selectedParts.length === 0) return;

    if (!confirm(`האם אתה בטוח שברצונך להסיר את כל ${this.selectedParts.length} החלקים?`)) {
      return;
    }

    try {
      const { supabase } = await import('./lib/supabaseClient.js');
      const { error } = await supabase
        .from('selected_parts')
        .delete()
        .eq('plate_number', this.plateNumber);

      if (error) {
        console.error('❌ Error clearing parts:', error);
        alert('שגיאה בניקוי הרשימה');
        return;
      }

      console.log('🧹 All parts cleared');
      // Real-time subscription will handle UI update

    } catch (error) {
      console.error('❌ Error clearing parts:', error);
      alert('שגיאה בניקוי הרשימה');
    }
  }

  /**
   * Update plate number and reload
   */
  async updatePlateNumber(newPlateNumber) {
    this.plateNumber = newPlateNumber;
    
    // Unsubscribe from old channel
    if (this.supabaseChannel) {
      this.supabaseChannel.unsubscribe();
    }
    
    // Reload with new plate
    if (this.plateNumber) {
      await this.loadSelectedParts();
      this.setupRealtimeSubscription();
    } else {
      this.selectedParts = [];
      this.render();
    }
  }

  /**
   * Get current selected parts (useful for external access)
   */
  getSelectedParts() {
    return [...this.selectedParts];
  }

  /**
   * Get total count
   */
  getCount() {
    return this.selectedParts.length;
  }

  /**
   * Get total value
   */
  getTotalValue() {
    return this.selectedParts.reduce((total, part) => {
      return total + (parseFloat(part.price) || 0);
    }, 0);
  }

  /**
   * Cleanup
   */
  destroy() {
    if (this.supabaseChannel) {
      this.supabaseChannel.unsubscribe();
    }
  }
}

// Auto-create styles
function createSelectedPartsStyles() {
  if (document.getElementById('selected-parts-styles')) return;

  const styles = document.createElement('style');
  styles.id = 'selected-parts-styles';
  styles.textContent = `
    .no-selections {
      text-align: center;
      padding: 40px 20px;
      color: #6b7280;
    }

    .no-selections-icon {
      font-size: 32px;
      margin-bottom: 12px;
    }

    .no-selections-text {
      font-size: 16px;
      font-weight: bold;
      margin-bottom: 6px;
    }

    .no-selections-subtitle {
      font-size: 14px;
    }

    .selected-parts-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 15px;
      padding-bottom: 10px;
      border-bottom: 2px solid #e5e7eb;
    }

    .selected-parts-header h3 {
      margin: 0;
      color: #374151;
      font-size: 18px;
    }

    .clear-all-btn {
      background: #dc2626;
      color: white;
      border: none;
      padding: 6px 12px;
      border-radius: 4px;
      cursor: pointer;
      font-size: 12px;
      font-weight: bold;
    }

    .clear-all-btn:hover {
      background: #b91c1c;
    }

    .selected-parts-items {
      display: flex;
      flex-direction: column;
      gap: 8px;
      max-height: 400px;
      overflow-y: auto;
    }

    .selected-part-item {
      background: #f9fafb;
      border: 1px solid #e5e7eb;
      border-radius: 8px;
      padding: 12px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      transition: all 0.2s ease;
    }

    .selected-part-item:hover {
      background: #f3f4f6;
      border-color: #d1d5db;
    }

    .part-main-info {
      flex: 1;
      direction: rtl;
    }

    .part-name {
      font-weight: bold;
      color: #374151;
      margin-bottom: 4px;
      font-size: 14px;
    }

    .part-details {
      display: flex;
      gap: 12px;
      font-size: 12px;
      color: #6b7280;
    }

    .part-supplier {
      background: #eff6ff;
      color: #1e40af;
      padding: 2px 6px;
      border-radius: 4px;
      font-weight: bold;
    }

    .part-code {
      background: #f0f9ff;
      color: #0369a1;
      padding: 2px 6px;
      border-radius: 4px;
      font-family: monospace;
      font-weight: bold;
    }

    .part-price {
      background: #ecfdf5;
      color: #059669;
      padding: 2px 6px;
      border-radius: 4px;
      font-weight: bold;
    }

    .part-actions {
      display: flex;
      gap: 4px;
    }

    .remove-part-btn {
      background: #fef2f2;
      color: #dc2626;
      border: 1px solid #fecaca;
      padding: 4px 8px;
      border-radius: 4px;
      cursor: pointer;
      font-size: 12px;
      transition: all 0.2s ease;
    }

    .remove-part-btn:hover {
      background: #fee2e2;
      border-color: #fca5a5;
    }
  `;
  
  document.head.appendChild(styles);
}

// Initialize styles
createSelectedPartsStyles();

// Global instance
window.selectedPartsList = null;

// Auto-initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    window.selectedPartsList = new SelectedPartsList();
  });
} else {
  window.selectedPartsList = new SelectedPartsList();
}

export { SelectedPartsList };
export default SelectedPartsList;