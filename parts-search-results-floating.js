(function () {
  if (document.getElementById("partsSearchResultsModal")) return;

  const style = document.createElement("style");
  style.innerHTML = `
    #partsSearchResultsModal {
      position: fixed;
      top: 50px;
      left: 50%;
      transform: translateX(-50%);
      max-width: 750px;
      width: 80vw;
      max-height: 85vh;
      background: white;
      border: 1px solid #0066cc;
      padding: 25px;
      z-index: 9999;
      box-shadow: 0 0 25px rgba(0,0,0,0.3);
      direction: rtl;
      font-family: sans-serif;
      border-radius: 12px;
      display: none;
      overflow-y: auto;
    }
    .results-modal-title {
      font-size: 24px;
      font-weight: bold;
      margin-bottom: 20px;
      color: #0066cc;
      text-align: center;
      border-bottom: 2px solid #0066cc;
      padding-bottom: 10px;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 10px;
    }
    .results-summary {
      background: #f0f8ff;
      border-radius: 8px;
      padding: 15px;
      margin-bottom: 20px;
      border: 1px solid #0066cc;
    }
    .summary-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 15px;
      margin-bottom: 10px;
    }
    .summary-item {
      text-align: center;
    }
    .summary-label {
      font-weight: bold;
      color: #0066cc;
      font-size: 14px;
      margin-bottom: 5px;
    }
    .summary-value {
      font-size: 18px;
      color: #333;
      font-weight: bold;
    }
    .search-results-container {
      max-height: 500px;
      overflow-y: auto;
      border: 1px solid #e9ecef;
      border-radius: 8px;
      margin-bottom: 20px;
    }
    .search-result-item {
      padding: 15px;
      border-bottom: 1px solid #e9ecef;
      transition: background 0.2s;
    }
    .search-result-item:hover {
      background: #f8f9fa;
    }
    .search-result-item:last-child {
      border-bottom: none;
    }
    .result-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 10px;
    }
    .result-name {
      font-weight: bold;
      color: #0066cc;
      font-size: 16px;
    }
    .result-price {
      font-weight: bold;
      color: #28a745;
      font-size: 16px;
    }
    .result-details {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
      gap: 10px;
      margin-bottom: 8px;
    }
    .result-detail {
      font-size: 14px;
      color: #6c757d;
    }
    .result-detail strong {
      color: #333;
    }
    .result-description {
      font-size: 13px;
      color: #666;
      font-style: italic;
      margin-top: 8px;
      padding: 8px;
      background: #f8f9fa;
      border-radius: 4px;
    }
    .results-buttons {
      display: flex;
      gap: 10px;
      margin-top: 20px;
    }
    .results-btn {
      flex: 1;
      padding: 12px;
      border: none;
      border-radius: 8px;
      cursor: pointer;
      font-weight: bold;
      font-size: 14px;
      transition: background 0.2s;
    }
    .results-btn.close {
      background: #6c757d;
      color: white;
    }
    .results-btn.close:hover {
      background: #5a6268;
    }
    .results-btn.export {
      background: #28a745;
      color: white;
    }
    .results-btn.export:hover {
      background: #218838;
    }
    .results-btn.refresh {
      background: #0066cc;
      color: white;
    }
    .results-btn.refresh:hover {
      background: #0052a3;
    }
    .no-results {
      text-align: center;
      padding: 40px;
      color: #6c757d;
      font-size: 16px;
    }
    .no-results-icon {
      font-size: 48px;
      margin-bottom: 15px;
      opacity: 0.5;
    }
    .recommended-section {
      background: #fff3cd;
      border: 1px solid #ffeaa7;
      border-radius: 8px;
      padding: 15px;
      margin-bottom: 20px;
    }
    .recommended-title {
      font-weight: bold;
      color: #856404;
      margin-bottom: 10px;
      display: flex;
      align-items: center;
      gap: 8px;
    }
    .recommended-text {
      font-size: 14px;
      color: #856404;
    }
    .stats-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
      gap: 10px;
      margin-top: 15px;
    }
    .stat-item {
      background: white;
      padding: 10px;
      border-radius: 6px;
      text-align: center;
      border: 1px solid #0066cc;
    }
    .stat-value {
      font-size: 18px;
      font-weight: bold;
      color: #0066cc;
    }
    .stat-label {
      font-size: 12px;
      color: #666;
      margin-top: 3px;
    }
    /* SESSION 49: Tab Navigation Styles */
    .tabs-header {
      display: flex;
      gap: 0;
      margin-bottom: 20px;
      border-bottom: 2px solid #e9ecef;
    }
    .tab-btn {
      flex: 1;
      padding: 12px 20px;
      border: none;
      background: #f8f9fa;
      color: #6c757d;
      font-weight: bold;
      font-size: 14px;
      cursor: pointer;
      border-bottom: 3px solid transparent;
      transition: all 0.3s;
    }
    .tab-btn:hover {
      background: #e9ecef;
    }
    .tab-btn.active {
      background: #fff;
      color: #0066cc;
      border-bottom-color: #0066cc;
    }
    .tab-content {
      display: none;
    }
    .tab-content.active {
      display: block;
    }
    /* SESSION 49: Damage Center Group Styles */
    .damage-center-group {
      border: 2px solid #28a745;
      border-radius: 8px;
      margin-bottom: 15px;
      overflow: hidden;
    }
    .damage-center-header {
      background: #28a745;
      color: white;
      padding: 12px 15px;
      font-weight: bold;
      display: flex;
      justify-content: space-between;
      align-items: center;
      cursor: pointer;
    }
    .damage-center-header:hover {
      background: #218838;
    }
    .damage-center-parts-table {
      width: 100%;
      border-collapse: collapse;
    }
    .damage-center-parts-table th {
      background: #e8f5e9;
      padding: 10px;
      text-align: center;
      font-size: 12px;
      border-bottom: 2px solid #28a745;
    }
    .damage-center-parts-table td {
      padding: 10px;
      text-align: center;
      font-size: 13px;
      border-bottom: 1px solid #e9ecef;
    }
    .damage-center-parts-table tr:hover {
      background: #f8f9fa;
    }
    .damage-center-subtotal {
      background: #f0f9ff;
      padding: 10px 15px;
      font-weight: bold;
      text-align: left;
      border-top: 2px solid #28a745;
    }
  `;
  document.head.appendChild(style);

  const modal = document.createElement("div");
  modal.id = "partsSearchResultsModal";
  // SESSION 49: Restructured to 3-tab interface
  modal.innerHTML = `
    <div class="results-modal-title">
      🔍 מערכת ניהול חלקים
    </div>
    
    <!-- SESSION 49: Tab Navigation -->
    <div class="tabs-header">
      <button class="tab-btn active" data-tab="required" onclick="switchPartsTab('required')">
        📋 חלקים נדרשים
      </button>
      <button class="tab-btn" data-tab="selected" onclick="switchPartsTab('selected')">
        ✅ חלקים נבחרים
      </button>
      <button class="tab-btn" data-tab="results" onclick="switchPartsTab('results')">
        🔍 תוצאות חיפוש
      </button>
    </div>

    <!-- SESSION 49: Tab 1 - Parts Required -->
    <div class="tab-content active" id="tab-required">
      <div class="results-summary" id="requiredSummary">
        <div class="summary-grid">
          <div class="summary-item">
            <div class="summary-label">מרכזי נזק</div>
            <div class="summary-value" id="totalDamageCenters">0</div>
          </div>
          <div class="summary-item">
            <div class="summary-label">סה"כ חלקים</div>
            <div class="summary-value" id="totalRequiredParts">0</div>
          </div>
          <div class="summary-item">
            <div class="summary-label">עלות משוערת</div>
            <div class="summary-value" id="totalRequiredCost">₪0</div>
          </div>
        </div>
      </div>
      <div class="search-results-container" id="requiredPartsContainer">
        <div class="no-results">
          <div class="no-results-icon">📋</div>
          <div>אין חלקים נדרשים</div>
        </div>
      </div>
    </div>

    <!-- SESSION 49: Tab 2 - Selected Parts -->
    <div class="tab-content" id="tab-selected" style="display: none;">
      <div class="results-summary" id="selectedSummary">
        <div class="summary-grid">
          <div class="summary-item">
            <div class="summary-label">סה"כ נבחרו</div>
            <div class="summary-value" id="totalSelectedParts">0</div>
          </div>
          <div class="summary-item">
            <div class="summary-label">מחיר ממוצע</div>
            <div class="summary-value" id="avgSelectedPrice">₪0</div>
          </div>
          <div class="summary-item">
            <div class="summary-label">עלות כוללת</div>
            <div class="summary-value" id="totalSelectedCost">₪0</div>
          </div>
        </div>
      </div>
      <div class="search-results-container" id="selectedPartsContainer">
        <div class="no-results">
          <div class="no-results-icon">✅</div>
          <div>אין חלקים נבחרים</div>
        </div>
      </div>
    </div>

    <!-- SESSION 49: Tab 3 - Search Results (NO STATISTICS) -->
    <div class="tab-content" id="tab-results" style="display: none;">
      <div class="search-results-container" id="searchResultsContainer">
        <div class="no-results">
          <div class="no-results-icon">🔍</div>
          <div>אין תוצאות חיפוש זמינות</div>
        </div>
      </div>
    </div>

    <div class="results-buttons">
      <button class="results-btn close" onclick="togglePartsSearchResults()">סגור</button>
      <button class="results-btn refresh" onclick="refreshPartsResults()">רענן נתונים</button>
      <button class="results-btn export" onclick="exportPartsResults()">יצא לקובץ</button>
    </div>
  `;
  document.body.appendChild(modal);

  // SESSION 49: Tab state persistence
  let currentTab = 'required';
  let tabsLoaded = {
    required: false,
    selected: false,
    results: false
  };

  // Global functions
  window.togglePartsSearchResults = function () {
    const modal = document.getElementById("partsSearchResultsModal");
    if (modal.style.display === "none" || !modal.style.display) {
      modal.style.display = "block";
      // SESSION 49: Load current tab if not already loaded
      if (!tabsLoaded[currentTab]) {
        loadTabData(currentTab);
      }
    } else {
      modal.style.display = "none";
    }
  };

  // SESSION 49: Tab switching function with persistence
  window.switchPartsTab = function(tabName) {
    console.log(`📑 SESSION 49: Switching to tab: ${tabName}`);
    
    // Update tab buttons
    document.querySelectorAll('.tab-btn').forEach(btn => {
      if (btn.dataset.tab === tabName) {
        btn.classList.add('active');
      } else {
        btn.classList.remove('active');
      }
    });
    
    // Update tab content
    document.querySelectorAll('.tab-content').forEach(content => {
      content.style.display = 'none';
      content.classList.remove('active');
    });
    
    const activeTab = document.getElementById(`tab-${tabName}`);
    if (activeTab) {
      activeTab.style.display = 'block';
      activeTab.classList.add('active');
    }
    
    // Update current tab
    currentTab = tabName;
    
    // Load data if not already loaded (tab persistence)
    if (!tabsLoaded[tabName]) {
      loadTabData(tabName);
    }
  };

  // SESSION 49: Load data for specific tab
  function loadTabData(tabName) {
    console.log(`🔄 SESSION 49: Loading data for tab: ${tabName}`);
    
    switch(tabName) {
      case 'required':
        loadRequiredParts();
        break;
      case 'selected':
        loadSelectedParts();
        break;
      case 'results':
        loadSearchResults();
        break;
    }
    
    tabsLoaded[tabName] = true;
  }

  window.refreshPartsResults = function () {
    // SESSION 49: Refresh current tab and mark as not loaded
    tabsLoaded[currentTab] = false;
    loadTabData(currentTab);
  };

  window.exportPartsResults = function () {
    try {
      const results = getPartsSearchResults();
      if (!results || results.length === 0) {
        alert('אין תוצאות לייצוא');
        return;
      }

      // Create CSV content
      const headers = ['שם החלק', 'מחיר', 'ספק', 'מיקום', 'מצב', 'קטגוריה', 'תיאור'];
      const csvContent = [
        headers.join(','),
        ...results.map(result => [
          `"${result.name || ''}"`,
          result.price || '0',
          `"${result.supplier || ''}"`,
          `"${result.location || ''}"`,
          `"${result.condition || ''}"`,
          `"${result.category || ''}"`,
          `"${result.description || ''}"`
        ].join(','))
      ].join('\n');

      // Download CSV
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', `parts_search_results_${new Date().toISOString().slice(0,10)}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      alert('תוצאות החיפוש יוצאו בהצלחה');
    } catch (error) {
      console.error('Export error:', error);
      alert('שגיאה בייצוא התוצאות');
    }
  };

  // Helper functions
  function getPartsSearchResults() {
    try {
      // Try to get from helper.js first
      if (typeof helper !== 'undefined' && helper.parts_search && helper.parts_search.results) {
        return helper.parts_search.results;
      }
      
      // Fallback to sessionStorage
      const sessionHelper = sessionStorage.getItem('helper');
      if (sessionHelper) {
        const helperData = JSON.parse(sessionHelper);
        if (helperData.parts_search && helperData.parts_search.results) {
          return helperData.parts_search.results;
        }
      }
      
      return [];
    } catch (error) {
      console.error('Error getting parts search results:', error);
      return [];
    }
  }

  function getSummaryData() {
    try {
      // Try to get from helper.js first
      if (typeof helper !== 'undefined' && helper.parts_search && helper.parts_search.summary) {
        return helper.parts_search.summary;
      }
      
      // Fallback to sessionStorage
      const sessionHelper = sessionStorage.getItem('helper');
      if (sessionHelper) {
        const helperData = JSON.parse(sessionHelper);
        if (helperData.parts_search && helperData.parts_search.summary) {
          return helperData.parts_search.summary;
        }
      }
      
      return { total_results: '', recommended: '' };
    } catch (error) {
      console.error('Error getting summary data:', error);
      return { total_results: '', recommended: '' };
    }
  }

  // SESSION 49: TAB 1 - Load Required Parts grouped by damage center
  async function loadRequiredParts() {
    console.log('📋 SESSION 49: Loading required parts...');
    const container = document.getElementById('requiredPartsContainer');
    
    try {
      // Get plate number
      const plate = window.helper?.meta?.plate || window.helper?.vehicle?.plate;
      
      if (!plate) {
        container.innerHTML = `
          <div class="no-results">
            <div class="no-results-icon">⚠️</div>
            <div>לא נמצא מספר רישוי</div>
          </div>
        `;
        return;
      }
      
      // Get parts_required from Supabase
      const { data: requiredParts, error } = await window.supabase
        .from('parts_required')
        .select('*')
        .eq('plate', plate.replace(/-/g, ''));
      
      if (error) {
        console.error('❌ SESSION 49: Error loading required parts:', error);
        throw error;
      }
      
      console.log(`✅ SESSION 49: Loaded ${requiredParts?.length || 0} required parts from Supabase`);
      
      // Also check helper.centers for additional data
      const helperCenters = window.helper?.centers || [];
      
      // Group parts by damage center
      const groupedParts = {};
      let totalParts = 0;
      let totalCost = 0;
      
      // Process Supabase parts
      if (requiredParts && requiredParts.length > 0) {
        requiredParts.forEach(part => {
          const centerId = part.damage_center_id || 'unknown';
          const centerNumber = part.damage_center_number || '?';
          const centerDesc = part.damage_center_description || 'ללא תיאור';
          
          if (!groupedParts[centerId]) {
            groupedParts[centerId] = {
              id: centerId,
              number: centerNumber,
              description: centerDesc,
              parts: []
            };
          }
          
          groupedParts[centerId].parts.push(part);
          totalParts++;
          
          const partCost = (parseFloat(part.price || part.cost || part.expected_cost || 0)) * (parseInt(part.quantity || part.qty || 1));
          totalCost += partCost;
        });
      }
      
      // Also process helper.centers if available
      helperCenters.forEach((center, index) => {
        const centerParts = center.Parts?.parts_required || center.Parts?.parts || [];
        if (centerParts.length > 0) {
          const centerId = center.Id || center.id || `center_${index}`;
          const centerNumber = center["Damage center Number"] || center.number || (index + 1);
          const centerDesc = center.Description || center.description || 'ללא תיאור';
          
          // Merge with existing or create new
          if (!groupedParts[centerId]) {
            groupedParts[centerId] = {
              id: centerId,
              number: centerNumber,
              description: centerDesc,
              parts: []
            };
          }
          
          // Add parts that aren't already there (avoid duplicates)
          centerParts.forEach(part => {
            const exists = groupedParts[centerId].parts.some(p => 
              (p.pcode === part.pcode || p.oem === part.oem) && p.part_name === part.part_name
            );
            
            if (!exists) {
              groupedParts[centerId].parts.push(part);
              totalParts++;
              const partCost = (parseFloat(part.price || part.cost || part.expected_cost || 0)) * (parseInt(part.quantity || part.qty || 1));
              totalCost += partCost;
            }
          });
        }
      });
      
      // Update statistics
      const damageCentersCount = Object.keys(groupedParts).length;
      document.getElementById('totalDamageCenters').textContent = damageCentersCount;
      document.getElementById('totalRequiredParts').textContent = totalParts;
      document.getElementById('totalRequiredCost').textContent = `₪${Math.round(totalCost).toLocaleString('he-IL')}`;
      
      // Display grouped parts
      if (damageCentersCount === 0) {
        container.innerHTML = `
          <div class="no-results">
            <div class="no-results-icon">📋</div>
            <div>אין חלקים נדרשים</div>
            <div style="font-size: 14px; margin-top: 10px; color: #999;">
              הוסף חלקים למרכזי נזק דרך מודול החלקים הנדרשים
            </div>
          </div>
        `;
        return;
      }
      
      // Create HTML for each damage center
      const groupsHTML = Object.values(groupedParts).map(group => {
        const subtotal = group.parts.reduce((sum, part) => {
          const price = parseFloat(part.price || part.cost || part.expected_cost || 0);
          const qty = parseInt(part.quantity || part.qty || 1);
          return sum + (price * qty);
        }, 0);
        
        const partsRows = group.parts.map((part, partIndex) => {
          const price = parseFloat(part.price || part.cost || part.expected_cost || 0);
          const qty = parseInt(part.quantity || part.qty || 1);
          const total = price * qty;
          
          return `
            <tr>
              <td>${partIndex + 1}</td>
              <td>${part.catalog_code || part.pcode || part.oem || 'N/A'}</td>
              <td style="text-align: right;">${part.part_name || part.name || 'N/A'}</td>
              <td>${qty}</td>
              <td>₪${price.toLocaleString('he-IL')}</td>
              <td style="font-weight: bold;">₪${total.toLocaleString('he-IL')}</td>
              <td>
                <button onclick="editRequiredPart('${group.id}', ${partIndex})" 
                        style="background: #f59e0b; color: white; border: none; padding: 4px 8px; border-radius: 4px; cursor: pointer;">
                  ✏️
                </button>
                <button onclick="deleteRequiredPart('${group.id}', ${partIndex})" 
                        style="background: #ef4444; color: white; border: none; padding: 4px 8px; border-radius: 4px; cursor: pointer; margin-right: 4px;">
                  🗑️
                </button>
              </td>
            </tr>
          `;
        }).join('');
        
        return `
          <div class="damage-center-group">
            <div class="damage-center-header" onclick="toggleDamageCenterGroup('${group.id}')">
              <span>מרכז נזק #${group.number}: ${group.description}</span>
              <span>${group.parts.length} חלקים • ₪${Math.round(subtotal).toLocaleString('he-IL')}</span>
            </div>
            <div id="group-${group.id}" style="display: block;">
              <table class="damage-center-parts-table">
                <thead>
                  <tr>
                    <th style="width: 40px;">#</th>
                    <th style="width: 120px;">קוד קטלוגי</th>
                    <th style="min-width: 200px;">שם החלק</th>
                    <th style="width: 60px;">כמות</th>
                    <th style="width: 100px;">מחיר יחידה</th>
                    <th style="width: 100px;">סכום</th>
                    <th style="width: 100px;">פעולות</th>
                  </tr>
                </thead>
                <tbody>
                  ${partsRows}
                </tbody>
              </table>
              <div class="damage-center-subtotal">
                סה"כ מרכז נזק: ₪${Math.round(subtotal).toLocaleString('he-IL')}
              </div>
            </div>
          </div>
        `;
      }).join('');
      
      container.innerHTML = groupsHTML;
      console.log('✅ SESSION 49: Required parts loaded successfully');
      
    } catch (error) {
      console.error('❌ SESSION 49: Error in loadRequiredParts:', error);
      container.innerHTML = `
        <div class="no-results">
          <div class="no-results-icon">❌</div>
          <div>שגיאה בטעינת חלקים נדרשים</div>
          <div style="font-size: 14px; margin-top: 10px; color: #999;">
            ${error.message}
          </div>
        </div>
      `;
    }
  }
  
  // SESSION 49: TAB 1 HELPER - Toggle damage center group collapse
  window.toggleDamageCenterGroup = function(groupId) {
    const groupContent = document.getElementById(`group-${groupId}`);
    if (groupContent) {
      groupContent.style.display = groupContent.style.display === 'none' ? 'block' : 'none';
    }
  };
  
  // SESSION 49: TAB 1 HELPER - Edit required part
  window.editRequiredPart = async function(centerId, partIndex) {
    console.log(`✏️ SESSION 49: Edit part - Center: ${centerId}, Part: ${partIndex}`);
    
    try {
      const plate = window.helper?.meta?.plate || window.helper?.vehicle?.plate;
      if (!plate) {
        alert('לא נמצא מספר רישוי');
        return;
      }
      
      const centerIndex = window.helper?.centers?.findIndex(c => (c.Id || c.id) === centerId);
      if (centerIndex === -1) {
        alert('מרכז נזק לא נמצא');
        return;
      }
      
      const center = window.helper.centers[centerIndex];
      const parts = center.Parts?.parts_required || center.Parts?.parts || [];
      
      if (partIndex >= parts.length) {
        alert('חלק לא נמצא');
        return;
      }
      
      const part = parts[partIndex];
      
      const newCatalogCode = prompt('קוד קטלוגי:', part.catalog_code || part.pcode || part.oem || '');
      if (newCatalogCode === null) return;
      
      const newPartName = prompt('שם החלק:', part.part_name || part.name || '');
      if (newPartName === null) return;
      
      const newQuantity = prompt('כמות:', part.quantity || part.qty || '1');
      if (newQuantity === null) return;
      
      const newPrice = prompt('מחיר יחידה:', part.price || part.cost || part.expected_cost || '0');
      if (newPrice === null) return;
      
      const updatedData = {
        catalog_code: newCatalogCode.trim(),
        part_name: newPartName.trim(),
        quantity: parseInt(newQuantity) || 1,
        price: parseFloat(newPrice) || 0
      };
      
      const { error } = await window.supabase
        .from('parts_required')
        .update(updatedData)
        .eq('plate', plate.replace(/-/g, ''))
        .eq('damage_center_id', centerId)
        .eq('part_name', part.part_name || part.name);
      
      if (error) {
        console.error('❌ SESSION 50: Supabase update error:', error);
        throw error;
      }
      
      parts[partIndex] = {
        ...part,
        catalog_code: updatedData.catalog_code,
        pcode: updatedData.catalog_code,
        oem: updatedData.catalog_code,
        part_name: updatedData.part_name,
        name: updatedData.part_name,
        quantity: updatedData.quantity,
        qty: updatedData.quantity,
        price: updatedData.price,
        cost: updatedData.price,
        expected_cost: updatedData.price
      };
      
      sessionStorage.setItem('helper', JSON.stringify(window.helper));
      
      tabsLoaded.required = false;
      loadRequiredParts();
      
      console.log('✅ SESSION 50: Part edited successfully');
    } catch (error) {
      console.error('❌ SESSION 50: Edit error:', error);
      alert('שגיאה בעריכת החלק: ' + error.message);
    }
  };
  
  // SESSION 49: TAB 1 HELPER - Delete required part
  window.deleteRequiredPart = async function(centerId, partIndex) {
    console.log(`🗑️ SESSION 49: Delete part - Center: ${centerId}, Part: ${partIndex}`);
    
    if (!confirm('האם למחוק חלק זה?')) {
      return;
    }
    
    try {
      // Get plate
      const plate = window.helper?.meta?.plate || window.helper?.vehicle?.plate;
      if (!plate) {
        alert('לא נמצא מספר רישוי');
        return;
      }
      
      // Find center in helper
      const centerIndex = window.helper?.centers?.findIndex(c => 
        (c.Id || c.id) === centerId
      );
      
      if (centerIndex !== -1 && window.helper.centers[centerIndex]) {
        const center = window.helper.centers[centerIndex];
        const parts = center.Parts?.parts_required || center.Parts?.parts || [];
        
        if (partIndex < parts.length) {
          const partToDelete = parts[partIndex];
          
          // Delete from Supabase first
          const { error } = await window.supabase
            .from('parts_required')
            .delete()
            .eq('plate', plate.replace(/-/g, ''))
            .eq('damage_center_id', centerId)
            .eq('part_name', partToDelete.part_name || partToDelete.name);
          
          if (error) {
            console.error('❌ SESSION 49: Supabase delete error:', error);
            throw error;
          }
          
          // Delete from helper
          parts.splice(partIndex, 1);
          
          // Update sessionStorage
          sessionStorage.setItem('helper', JSON.stringify(window.helper));
          
          // Reload tab
          tabsLoaded.required = false;
          loadRequiredParts();
          
          console.log('✅ SESSION 49: Part deleted successfully');
        }
      }
    } catch (error) {
      console.error('❌ SESSION 49: Delete error:', error);
      alert('שגיאה במחיקת החלק: ' + error.message);
    }
  };
  
  // SESSION 50: TAB 2 - Load Selected Parts from Supabase
  async function loadSelectedParts() {
    console.log('✅ SESSION 50: Loading selected parts...');
    const container = document.getElementById('selectedPartsContainer');
    
    try {
      const plate = window.helper?.meta?.plate || window.helper?.vehicle?.plate;
      if (!plate) {
        container.innerHTML = '<div class="no-results">לא נמצא מספר רישוי</div>';
        return;
      }
      
      const { data: selectedParts, error } = await window.supabase
        .from('selected_parts')
        .select('*')
        .eq('plate', plate.replace(/-/g, ''))
        .order('selected_at', { ascending: false });
      
      if (error) throw error;
      
      if (!selectedParts || selectedParts.length === 0) {
        container.innerHTML = `
          <div class="no-results">
            <div class="no-results-icon">📭</div>
            <div>לא נמצאו חלקים נבחרים</div>
          </div>
        `;
        document.getElementById('totalSelectedParts').textContent = '0';
        document.getElementById('avgSelectedPrice').textContent = '₪0';
        document.getElementById('totalSelectedCost').textContent = '₪0';
        return;
      }
      
      const totalParts = selectedParts.length;
      const totalCost = selectedParts.reduce((sum, part) => {
        const price = parseFloat(part.price || part.cost || part.expected_cost || 0);
        const qty = parseInt(part.quantity || part.qty || 1);
        return sum + (price * qty);
      }, 0);
      const avgPrice = totalCost / totalParts;
      
      document.getElementById('totalSelectedParts').textContent = totalParts;
      document.getElementById('avgSelectedPrice').textContent = `₪${Math.round(avgPrice).toLocaleString('he-IL')}`;
      document.getElementById('totalSelectedCost').textContent = `₪${Math.round(totalCost).toLocaleString('he-IL')}`;
      
      const tableRows = selectedParts.map((part, index) => {
        const price = parseFloat(part.price || part.cost || part.expected_cost || 0);
        const qty = parseInt(part.quantity || part.qty || 1);
        const total = price * qty;
        const selectedDate = part.selected_at ? new Date(part.selected_at).toLocaleDateString('he-IL') : 'N/A';
        
        return `
          <tr>
            <td><input type="checkbox" class="selected-part-checkbox" data-part-id="${part.id}"></td>
            <td>${index + 1}</td>
            <td>${part.pcode || part.oem || 'N/A'}</td>
            <td style="text-align: right;">${part.part_family || ''} ${part.part_name || part.name || 'N/A'}</td>
            <td>${part.source || 'N/A'}</td>
            <td>₪${price.toLocaleString('he-IL')}</td>
            <td>${qty}</td>
            <td style="font-weight: bold;">₪${total.toLocaleString('he-IL')}</td>
            <td>${part.supplier || part.supplier_name || '-'}</td>
            <td>${selectedDate}</td>
            <td>
              <button onclick="editSelectedPart('${part.id}')">✏️</button>
              <button onclick="deleteSelectedPart('${part.id}')">🗑️</button>
            </td>
          </tr>
        `;
      }).join('');
      
      container.innerHTML = `
        <table class="parts-table">
          <thead>
            <tr>
              <th><input type="checkbox" id="selectAllSelected" onclick="toggleSelectAllSelected(this.checked)"></th>
              <th>#</th>
              <th>קוד</th>
              <th>שם החלק</th>
              <th>מקור</th>
              <th>מחיר</th>
              <th>כמות</th>
              <th>סכום</th>
              <th>ספק</th>
              <th>תאריך</th>
              <th>פעולות</th>
            </tr>
          </thead>
          <tbody>${tableRows}</tbody>
        </table>
      `;
    } catch (error) {
      console.error('❌ SESSION 50: Error loading selected parts:', error);
      container.innerHTML = `<div class="no-results">שגיאה: ${error.message}</div>`;
    }
  }
  
  window.editSelectedPart = async function(partId) {
    alert('עריכת חלק נבחר - תתווסף בהמשך');
  };
  
  window.deleteSelectedPart = async function(partId) {
    if (!confirm('האם למחוק חלק נבחר זה?')) return;
    
    try {
      const { error } = await window.supabase
        .from('selected_parts')
        .delete()
        .eq('id', partId);
      
      if (error) throw error;
      
      tabsLoaded.selected = false;
      loadSelectedParts();
    } catch (error) {
      alert('שגיאה במחיקה: ' + error.message);
    }
  };
  
  window.toggleSelectAllSelected = function(checked) {
    document.querySelectorAll('.selected-part-checkbox').forEach(cb => cb.checked = checked);
  };
  
  // SESSION 49: TAB 3 - Load Search Results (rename old function)
  function loadSearchResults() {
    const results = getPartsSearchResults();
    const summary = getSummaryData();
    const container = document.getElementById('searchResultsContainer');
    
    console.log('📦 Loading parts search results:', { results, summary });

    if (!results || results.length === 0) {
      container.innerHTML = `
        <div class="no-results">
          <div class="no-results-icon">📦</div>
          <div>אין תוצאות חיפוש זמינות</div>
          <div style="font-size: 14px; margin-top: 10px; color: #999;">
            בצע חיפוש חלקים כדי לראות תוצאות כאן
          </div>
        </div>
      `;
      
      // Reset summary
      document.getElementById('totalResults').textContent = '0';
      document.getElementById('avgPrice').textContent = '₪0';
      document.getElementById('minPrice').textContent = '₪0';
      document.getElementById('maxPrice').textContent = '₪0';
      document.getElementById('recommendedSection').style.display = 'none';
      return;
    }

    // Calculate statistics
    const prices = results.map(r => parseFloat(r.price || 0)).filter(p => p > 0);
    const avgPrice = prices.length > 0 ? Math.round(prices.reduce((a, b) => a + b, 0) / prices.length) : 0;
    const minPrice = prices.length > 0 ? Math.min(...prices) : 0;
    const maxPrice = prices.length > 0 ? Math.max(...prices) : 0;

    // Update summary
    document.getElementById('totalResults').textContent = results.length;
    document.getElementById('avgPrice').textContent = `₪${avgPrice.toLocaleString('he-IL')}`;
    document.getElementById('minPrice').textContent = `₪${minPrice.toLocaleString('he-IL')}`;
    document.getElementById('maxPrice').textContent = `₪${maxPrice.toLocaleString('he-IL')}`;

    // Show recommendation if available
    if (summary.recommended) {
      document.getElementById('recommendedSection').style.display = 'block';
      document.getElementById('recommendedText').textContent = summary.recommended;
    } else {
      document.getElementById('recommendedSection').style.display = 'none';
    }

    // Generate additional stats
    const suppliers = [...new Set(results.map(r => r.supplier).filter(Boolean))];
    const conditions = [...new Set(results.map(r => r.condition).filter(Boolean))];
    const categories = [...new Set(results.map(r => r.category).filter(Boolean))];

    document.getElementById('statsGrid').innerHTML = `
      <div class="stat-item">
        <div class="stat-value">${suppliers.length}</div>
        <div class="stat-label">ספקים</div>
      </div>
      <div class="stat-item">
        <div class="stat-value">${conditions.length}</div>
        <div class="stat-label">מצבי חלקים</div>
      </div>
      <div class="stat-item">
        <div class="stat-value">${categories.length}</div>
        <div class="stat-label">קטגוריות</div>
      </div>
    `;

    // Display results
    container.innerHTML = results.map((result, index) => `
      <div class="search-result-item unselected-part" data-part-index="${index}">
        <div class="result-header">
          <div class="result-name">${result.name || 'חלק ללא שם'}</div>
          <div class="result-price">₪${parseFloat(result.price || 0).toLocaleString('he-IL')}</div>
        </div>
        <div class="result-selection">
          <input type="checkbox" id="part-${index}" onchange="togglePartSelection(${index})">
          <label for="part-${index}">בחר חלק זה</label>
        </div>
        <div class="result-details">
          <div class="result-detail">
            <strong>ספק:</strong> ${result.supplier || 'לא צוין'}
          </div>
          <div class="result-detail">
            <strong>מיקום:</strong> ${result.location || 'לא צוין'}
          </div>
          <div class="result-detail">
            <strong>מצב:</strong> ${result.condition || 'לא צוין'}
          </div>
          <div class="result-detail">
            <strong>קטגוריה:</strong> ${result.category || 'לא צוינה'}
          </div>
          ${result.part_number ? `
          <div class="result-detail">
            <strong>מק"ט:</strong> ${result.part_number}
          </div>
          ` : ''}
          ${result.compatibility ? `
          <div class="result-detail">
            <strong>תאימות:</strong> ${result.compatibility}
          </div>
          ` : ''}
        </div>
        ${result.description ? `
        <div class="result-description">
          ${result.description}
        </div>
        ` : ''}
      </div>
    `).join('');

    console.log('✅ Parts search results loaded successfully');
  }
  
  // Parts selection functionality - INTEGRATION WITH HELPER.PARTS_SEARCH
  let selectedParts = new Set();
  let allParts = [];
  
  function updateSelectionSummary() {
    const selectedCount = selectedParts.size;
    const unselectedCount = allParts.length - selectedCount;
    
    const selectedCountEl = document.getElementById('selectedCount');
    const unselectedCountEl = document.getElementById('unselectedCount');
    const summaryEl = document.getElementById('selectionSummary');
    
    if (selectedCountEl) selectedCountEl.textContent = selectedCount;
    if (unselectedCountEl) unselectedCountEl.textContent = unselectedCount;
    
    if (summaryEl && allParts.length > 0) {
      summaryEl.style.display = 'block';
    } else if (summaryEl) {
      summaryEl.style.display = 'none';
    }
  }
  
  // Make togglePartSelection globally available
  window.togglePartSelection = function(partIndex) {
    if (selectedParts.has(partIndex)) {
      selectedParts.delete(partIndex);
    } else {
      selectedParts.add(partIndex);
    }
    
    // Update UI
    const partElement = document.querySelector(`[data-part-index="${partIndex}"]`);
    if (partElement) {
      if (selectedParts.has(partIndex)) {
        partElement.classList.add('selected-part');
        partElement.classList.remove('unselected-part');
      } else {
        partElement.classList.remove('selected-part');
        partElement.classList.add('unselected-part');
      }
    }
    
    updateSelectionSummary();
  };
  
  // Global functions for parts selection
  window.toggleSelectAllParts = function() {
    const selectAllBtn = document.querySelector('.results-btn.select-all');
    if (!selectAllBtn) return;
    
    if (selectedParts.size === allParts.length) {
      // Unselect all
      selectedParts.clear();
      selectAllBtn.textContent = 'בחר הכל';
      
      // Update UI
      document.querySelectorAll('.search-result-item').forEach(item => {
        item.classList.remove('selected-part');
        item.classList.add('unselected-part');
        const checkbox = item.querySelector('input[type="checkbox"]');
        if (checkbox) checkbox.checked = false;
      });
    } else {
      // Select all
      selectedParts.clear();
      allParts.forEach((_, index) => selectedParts.add(index));
      selectAllBtn.textContent = 'בטל הכל';
      
      // Update UI
      document.querySelectorAll('.search-result-item').forEach(item => {
        item.classList.add('selected-part');
        item.classList.remove('unselected-part');
        const checkbox = item.querySelector('input[type="checkbox"]');
        if (checkbox) checkbox.checked = true;
      });
    }
    
    updateSelectionSummary();
  };
  
  window.savePartsSelection = function() {
    if (!window.helper) {
      console.error('❌ Helper not available for saving parts selection');
      alert('שגיאה: לא ניתן לשמור את הבחירה');
      return;
    }
    
    // Get current search results
    const results = getPartsSearchResults();
    if (!results || results.length === 0) {
      alert('אין תוצאות חיפוש לשמירה');
      return;
    }
    
    // Prepare selected and unselected parts arrays
    const selectedPartsArray = [];
    const unselectedPartsArray = [];
    
    results.forEach((part, index) => {
      const partData = {
        ...part,
        selection_date: new Date().toISOString(),
        search_session: window.helper.parts_search?.summary?.last_search || new Date().toISOString()
      };
      
      if (selectedParts.has(index)) {
        selectedPartsArray.push(partData);
      } else {
        unselectedPartsArray.push(partData);
      }
    });
    
    // Initialize helper.parts_search if needed
    if (!window.helper.parts_search) {
      window.helper.parts_search = {
        search_history: [],
        all_results: [],
        results: [],
        summary: {
          total_searches: 0,
          total_results: 0,
          selected_count: 0,
          last_search: ''
        }
      };
    }
    
    // Store the selection according to helper structure
    window.helper.parts_search.selected_parts = selectedPartsArray;
    window.helper.parts_search.unselected_parts = unselectedPartsArray;
    window.helper.parts_search.summary.selected_count = selectedPartsArray.length;
    window.helper.parts_search.last_selection_date = new Date().toISOString();
    
    // Also store all results for reference
    window.helper.parts_search.all_results = results;
    
    // Save to storage
    try {
      const helperString = JSON.stringify(window.helper);
      sessionStorage.setItem('helper', helperString);
      localStorage.setItem('helper_data', helperString);
      
      console.log('✅ Parts selection saved to helper:');
      console.log('Selected parts:', selectedPartsArray.length);
      console.log('Unselected parts:', unselectedPartsArray.length);
      
      // Trigger helper update event
      document.dispatchEvent(new CustomEvent('helperUpdate', {
        detail: 'parts_selection_updated'
      }));
      
      alert(`נשמר בהצלחה!\nנבחרו: ${selectedPartsArray.length} חלקים\nלא נבחרו: ${unselectedPartsArray.length} חלקים`);
      
    } catch (error) {
      console.error('❌ Error saving parts selection:', error);
      alert('שגיאה בשמירת הבחירה');
    }
  };
  
  // SESSION 49: Initialize allParts when Tab 3 results are loaded
  const originalLoadSearchResults = loadSearchResults;
  loadSearchResults = function() {
    originalLoadSearchResults();
    
    // Update allParts array for selection functionality (Tab 3)
    allParts = getPartsSearchResults() || [];
    selectedParts.clear();
    updateSelectionSummary();
  };
  
})();