(function () {
  if (document.getElementById("partsSearchResultsModal")) return;

  const style = document.createElement("style");
  style.innerHTML = `
    #partsSearchResultsModal {
      position: fixed;
      top: 50px;
      left: 50%;
      transform: translateX(-50%);
      max-width: 900px;
      width: 95vw;
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
  `;
  document.head.appendChild(style);

  const modal = document.createElement("div");
  modal.id = "partsSearchResultsModal";
  modal.innerHTML = `
    <div class="results-modal-title">
      🔍 תוצאות חיפוש חלקים
    </div>
    
    <div class="results-summary" id="resultsSummary">
      <div class="summary-grid">
        <div class="summary-item">
          <div class="summary-label">סה"כ תוצאות</div>
          <div class="summary-value" id="totalResults">0</div>
        </div>
        <div class="summary-item">
          <div class="summary-label">מחיר ממוצע</div>
          <div class="summary-value" id="avgPrice">₪0</div>
        </div>
        <div class="summary-item">
          <div class="summary-label">מחיר מינימלי</div>
          <div class="summary-value" id="minPrice">₪0</div>
        </div>
        <div class="summary-item">
          <div class="summary-label">מחיר מקסימלי</div>
          <div class="summary-value" id="maxPrice">₪0</div>
        </div>
      </div>
      
      <div class="stats-grid" id="statsGrid">
        <!-- Dynamic stats will be inserted here -->
      </div>
    </div>

    <div class="recommended-section" id="recommendedSection" style="display: none;">
      <div class="recommended-title">
        💡 המלצה מהמערכת
      </div>
      <div class="recommended-text" id="recommendedText">
        <!-- Recommended text will be inserted here -->
      </div>
    </div>

    <div class="search-results-container" id="searchResultsContainer">
      <div class="no-results">
        <div class="no-results-icon">📦</div>
        <div>אין תוצאות חיפוש זמינות</div>
        <div style="font-size: 14px; margin-top: 10px; color: #999;">
          בצע חיפוש חלקים כדי לראות תוצאות כאן
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

  // Global functions
  window.togglePartsSearchResults = function () {
    const modal = document.getElementById("partsSearchResultsModal");
    if (modal.style.display === "none" || !modal.style.display) {
      modal.style.display = "block";
      loadPartsSearchResults();
    } else {
      modal.style.display = "none";
    }
  };

  window.refreshPartsResults = function () {
    loadPartsSearchResults();
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

  function loadPartsSearchResults() {
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
  
  // Initialize allParts when results are loaded
  const originalLoadPartsSearchResults = loadPartsSearchResults;
  loadPartsSearchResults = function() {
    originalLoadPartsSearchResults();
    
    // Update allParts array for selection functionality
    allParts = getPartsSearchResults() || [];
    selectedParts.clear();
    updateSelectionSummary();
  };
  
})();