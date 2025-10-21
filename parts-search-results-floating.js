(function () {
  if (document.getElementById("partsSearchResultsModal")) return;

  // SESSION 50: Dynamically load Supabase client if not available
  function loadSupabaseClient() {
    return new Promise((resolve, reject) => {
      // Check if already loaded
      if (window.supabase) {
        console.log('✅ Supabase client already available');
        resolve(true);
        return;
      }
      
      // Check if script already exists
      if (document.querySelector('script[src*="supabaseClient.js"]')) {
        console.log('⏳ Supabase client script loading...');
        // Wait for it to load
        const checkInterval = setInterval(() => {
          if (window.supabase) {
            clearInterval(checkInterval);
            console.log('✅ Supabase client loaded');
            resolve(true);
          }
        }, 100);
        
        // Timeout after 5 seconds
        setTimeout(() => {
          clearInterval(checkInterval);
          if (!window.supabase) {
            console.warn('⚠️ Supabase client timeout');
            resolve(false);
          }
        }, 5000);
        return;
      }
      
      // Load the script dynamically
      console.log('📥 Loading Supabase client dynamically...');
      const script = document.createElement('script');
      script.src = './services/supabaseClient.js';
      script.onload = () => {
        console.log('✅ Supabase client script loaded');
        // Wait a bit for initialization
        setTimeout(() => {
          if (window.supabase) {
            console.log('✅ Supabase client initialized');
            resolve(true);
          } else {
            console.warn('⚠️ Supabase client script loaded but window.supabase not available');
            resolve(false);
          }
        }, 100);
      };
      script.onerror = (error) => {
        console.error('❌ Failed to load Supabase client:', error);
        resolve(false);
      };
      document.head.appendChild(script);
    });
  }
  
  // Initialize Supabase client on module load
  loadSupabaseClient();

  const style = document.createElement("style");
  style.innerHTML = `
    #partsSearchResultsModal {
      position: fixed;
      top: 50px;
      left: 50%;
      transform: translateX(-50%);
      max-width: 95vw;
      width: 90vw;
      max-height: 85vh;
      background: white;
      border: 1px solid #0066cc;
      padding: 15px;
      z-index: 9999;
      box-shadow: 0 0 25px rgba(0,0,0,0.3);
      direction: rtl;
      font-family: sans-serif;
      border-radius: 12px;
      display: none;
      overflow-y: auto;
      overflow-x: auto;
    }
    
    @media (max-width: 768px) {
      #partsSearchResultsModal {
        top: 10px;
        left: 5px;
        right: 5px;
        transform: none;
        width: calc(100% - 10px);
        max-width: none;
        padding: 10px;
        max-height: 90vh;
      }
      
      .damage-center-parts-table {
        font-size: 11px !important;
      }
      
      .damage-center-parts-table th,
      .damage-center-parts-table td {
        padding: 6px 4px !important;
      }
      
      .damage-center-header {
        font-size: 13px !important;
        padding: 10px !important;
      }
      
      .tabs-header {
        flex-wrap: wrap;
      }
      
      .tab-btn {
        font-size: 12px !important;
        padding: 8px 12px !important;
      }
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
  
  // SESSION 50: Refresh current tab data
  window.refreshPartsResults = function() {
    console.log('🔄 SESSION 50: Refreshing current tab:', currentTab);
    
    // Show loading indicator
    const container = currentTab === 'required' ? document.getElementById('requiredPartsContainer') :
                     currentTab === 'selected' ? document.getElementById('selectedPartsContainer') :
                     document.getElementById('searchResultsContainer');
    
    if (container) {
      container.innerHTML = `
        <div class="no-results">
          <div class="no-results-icon">🔄</div>
          <div>מרענן נתונים...</div>
        </div>
      `;
    }
    
    // Reload tab data
    tabsLoaded[currentTab] = false;
    setTimeout(() => {
      loadTabData(currentTab);
    }, 100);
  };

  // SESSION 50: Remove unused export function (kept for compatibility but does nothing)
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
      
      // Wait for Supabase to load if needed
      if (!window.supabase) {
        console.log('⏳ SESSION 50: Waiting for Supabase client for Tab 1...');
        await loadSupabaseClient();
      }
      
      // Get parts_required from Supabase (with fallback if Supabase not available)
      let requiredParts = [];
      
      if (window.supabase) {
        const { data, error } = await window.supabase
          .from('parts_required')
          .select('*')
          .eq('plate', plate.replace(/-/g, ''));
        
        if (error) {
          console.error('❌ SESSION 49: Error loading required parts:', error);
          throw error;
        }
        
        requiredParts = data || [];
        console.log(`✅ SESSION 49: Loaded ${requiredParts.length} required parts from Supabase`);
      } else {
        console.warn('⚠️ SESSION 50: Supabase client not available, using helper data only');
      }
      
      // SESSION 61: ALWAYS get helper.centers for metadata (description)
      const helperCenters = window.helper?.centers || [];
      
      // Group parts by damage center
      const groupedParts = {};
      let totalParts = 0;
      let totalCostAfterReductions = 0;
      
      // SESSION 61: Build metadata map from helper.centers first (for descriptions)
      const centerMetadata = {};
      helperCenters.forEach((center, index) => {
        const centerId = center.Id || center.id || center.code || `center_${index}`;
        centerMetadata[centerId] = {
          number: center["Damage center Number"] || center.number || (index + 1),
          description: center.Description || center.description || center.Location || 'ללא תיאור'
        };
      });
      
      // Process Supabase parts
      if (requiredParts && requiredParts.length > 0) {
        requiredParts.forEach(part => {
          // ✅ SESSION 55 FIX: Use damage_center_code (the actual column in Supabase)
          const centerId = part.damage_center_code || 'unknown';
          // SESSION 61: Get description from helper metadata, fallback to 'ללא תיאור'
          const metadata = centerMetadata[centerId] || {};
          const centerNumber = metadata.number || part.damage_center_code?.match(/\d+$/)?.[0] || '?';
          const centerDesc = metadata.description || 'ללא תיאור';
          
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
          
          // Calculate cost AFTER reductions (reduction % and wear %)
          const pricePerUnit = parseFloat(part.price_per_unit || part.price || part.cost || part.expected_cost || 0);
          const reduction = parseFloat(part.reduction_percentage || part.reduction || 0);
          const wear = parseFloat(part.wear_percentage || part.wear || 0);
          const qty = parseInt(part.quantity || part.qty || 1);
          const priceAfterReduction = pricePerUnit * (1 - reduction / 100);
          const updatedPrice = priceAfterReduction * (1 - wear / 100);
          totalCostAfterReductions += (updatedPrice * qty);
        });
      }
      
      // SESSION 61: Also process helper.centers for parts not in Supabase
      helperCenters.forEach((center, index) => {
        const centerParts = center.Parts?.parts_required || center.Parts?.parts || [];
        if (centerParts.length > 0) {
          // ✅ SESSION 55 FIX: Use same ID as Supabase (center.Id should match damage_center_code)
          const centerId = center.Id || center.id || center.code || `center_${index}`;
          const centerNumber = center["Damage center Number"] || center.number || (index + 1);
          const centerDesc = center.Description || center.description || center.Location || 'ללא תיאור';
          
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
              
              // Calculate cost AFTER reductions (reduction % and wear %)
              const pricePerUnit = parseFloat(part.price_per_unit || part.price || part.cost || part.expected_cost || 0);
              const reduction = parseFloat(part.reduction_percentage || part.reduction || 0);
              const wear = parseFloat(part.wear_percentage || part.wear || 0);
              const qty = parseInt(part.quantity || part.qty || 1);
              const priceAfterReduction = pricePerUnit * (1 - reduction / 100);
              const updatedPrice = priceAfterReduction * (1 - wear / 100);
              totalCostAfterReductions += (updatedPrice * qty);
            }
          });
        }
      });
      
      // Update statistics
      const damageCentersCount = Object.keys(groupedParts).length;
      document.getElementById('totalDamageCenters').textContent = damageCentersCount;
      document.getElementById('totalRequiredParts').textContent = totalParts;
      document.getElementById('totalRequiredCost').textContent = `₪${Math.round(totalCostAfterReductions).toLocaleString('he-IL')}`;
      
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
      // SESSION 61: Sort by center number to ensure correct order (1, 2, 3...)
      const groupsHTML = Object.values(groupedParts)
        .sort((a, b) => parseInt(a.number) - parseInt(b.number))
        .map(group => {
        const subtotalBefore = group.parts.reduce((sum, part) => {
          const price = parseFloat(part.price_per_unit || part.price || part.cost || part.expected_cost || 0);
          const qty = parseInt(part.quantity || part.qty || 1);
          return sum + (price * qty);
        }, 0);
        
        const subtotalAfter = group.parts.reduce((sum, part) => {
          const pricePerUnit = parseFloat(part.price_per_unit || part.price || part.cost || part.expected_cost || 0);
          const reduction = parseFloat(part.reduction_percentage || part.reduction || 0);
          const wear = parseFloat(part.wear_percentage || part.wear || 0);
          const qty = parseInt(part.quantity || part.qty || 1);
          const priceAfterReduction = pricePerUnit * (1 - reduction / 100);
          const updatedPrice = priceAfterReduction * (1 - wear / 100);
          return sum + (updatedPrice * qty);
        }, 0);
        
        const partsRows = group.parts.map((part, partIndex) => {
          const pricePerUnit = parseFloat(part.price_per_unit || part.price || part.cost || part.expected_cost || 0);
          const reduction = parseFloat(part.reduction_percentage || part.reduction || 0);
          const wear = parseFloat(part.wear_percentage || part.wear || 0);
          const qty = parseInt(part.quantity || part.qty || 1);
          
          const priceAfterReduction = pricePerUnit * (1 - reduction / 100);
          const updatedPrice = priceAfterReduction * (1 - wear / 100);
          const totalAfterReductions = updatedPrice * qty;
          
          return `
            <tr style="border-bottom: 1px solid #e5e7eb;">
              <td rowspan="2" style="text-align: center; padding: 12px; vertical-align: middle; font-weight: bold;">${partIndex + 1}</td>
              <td style="padding: 8px 12px;">${part.catalog_code || part.pcode || part.oem || 'N/A'}</td>
              <td colspan="2" style="text-align: right; padding: 8px 12px; font-weight: 600;">${part.part_name || part.name || 'N/A'}</td>
              <td style="text-align: center; padding: 8px 12px;">₪${pricePerUnit.toFixed(2)}</td>
              <td style="text-align: center; padding: 8px 12px;">${reduction}%</td>
              <td style="text-align: center; padding: 8px 12px;">${wear}%</td>
              <td rowspan="2" style="text-align: center; padding: 12px; vertical-align: middle; font-weight: bold; background: #d1fae5; color: #059669; font-size: 15px;">₪${Math.round(totalAfterReductions).toLocaleString('he-IL')}</td>
              <td rowspan="2" style="text-align: center; padding: 12px; vertical-align: middle; white-space: nowrap;">
                <button onclick="editRequiredPart('${group.id}', ${partIndex})" 
                        style="background: #f59e0b; color: white; border: none; padding: 6px 10px; border-radius: 4px; cursor: pointer; margin-bottom: 4px; display: block; width: 100%;">
                  ✏️ ערוך
                </button>
                <button onclick="deleteRequiredPart('${group.id}', ${partIndex})" 
                        style="background: #ef4444; color: white; border: none; padding: 6px 10px; border-radius: 4px; cursor: pointer; display: block; width: 100%;">
                  🗑️ מחק
                </button>
              </td>
            </tr>
            <tr style="border-bottom: 2px solid #28a745; background: #f8f9fa;">
              <td style="padding: 8px 12px; font-size: 12px; color: #6c757d;">
                <strong>מקור:</strong> ${part.source || '-'}
              </td>
              <td style="padding: 8px 12px; font-size: 12px; color: #6c757d;">
                <strong>ספק:</strong> ${part.supplier || part.supplier_name || '-'}
              </td>
              <td style="padding: 8px 12px; font-size: 12px; color: #6c757d;">
                <strong>כמות:</strong> ${qty}
              </td>
              <td style="padding: 8px 12px; font-size: 12px; background: #fff3cd;">
                <strong>מחיר לפני:</strong> ₪${pricePerUnit.toFixed(2)}
              </td>
              <td colspan="2" style="padding: 8px 12px; font-size: 12px; background: #d1fae5;">
                <strong>מחיר אחרי הפחתות:</strong> ₪${updatedPrice.toFixed(2)}
              </td>
            </tr>
          `;
        }).join('');
        
        return `
          <div class="damage-center-group">
            <div class="damage-center-header" onclick="toggleDamageCenterGroup('${group.id}')">
              <span>מרכז נזק #${group.number}: ${group.description}</span>
              <span>${group.parts.length} חלקים • לפני: ₪${Math.round(subtotalBefore).toLocaleString('he-IL')} • אחרי: ₪${Math.round(subtotalAfter).toLocaleString('he-IL')}</span>
            </div>
            <div id="group-${group.id}" style="display: block;">
              <div style="overflow-x: auto; -webkit-overflow-scrolling: touch;">
                <table class="damage-center-parts-table" style="width: 100%; min-width: 800px; border-collapse: collapse; font-size: 14px;">
                  <thead>
                    <tr style="background: transparent;">
                      <th style="padding: 12px; text-align: center; width: 50px; color: #28a745; font-weight: bold; font-size: 15px;">#</th>
                      <th style="padding: 12px; text-align: center; width: 120px; color: #28a745; font-weight: bold; font-size: 15px;">קוד קטלוגי</th>
                      <th colspan="2" style="padding: 12px; text-align: center; min-width: 200px; color: #28a745; font-weight: bold; font-size: 15px;">שם החלק</th>
                      <th style="padding: 12px; text-align: center; width: 100px; color: #28a745; font-weight: bold; font-size: 15px;">מחיר לפני</th>
                      <th style="padding: 12px; text-align: center; width: 80px; color: #28a745; font-weight: bold; font-size: 15px;">הנחה %</th>
                      <th style="padding: 12px; text-align: center; width: 80px; color: #28a745; font-weight: bold; font-size: 15px;">בלאי %</th>
                      <th style="padding: 12px; text-align: center; width: 120px; color: #28a745; font-weight: bold; font-size: 15px;">סה״כ</th>
                      <th style="padding: 12px; text-align: center; width: 120px; color: #28a745; font-weight: bold; font-size: 15px;">פעולות</th>
                    </tr>
                  </thead>
                  <tbody>
                    ${partsRows}
                  </tbody>
                </table>
              </div>
              <div class="damage-center-subtotal" style="display: flex; justify-content: space-between; padding: 15px; font-size: 16px;">
                <div style="background: #fef3c7; padding: 8px 15px; border-radius: 5px;">סה"כ מרכז נזק לפני הפחתות: <strong>₪${Math.round(subtotalBefore).toLocaleString('he-IL')}</strong></div>
                <div style="background: #d1fae5; padding: 8px 15px; border-radius: 5px; font-weight: bold;">סה"כ מרכז נזק אחרי הפחתות: <strong style="color: #059669;">₪${Math.round(subtotalAfter).toLocaleString('he-IL')}</strong></div>
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
  
  // SESSION 50: TAB 1 - Save individual field (inline editing)
  window.savePartField = async function(centerId, partIndex, fieldName, newValue) {
    console.log(`💾 SESSION 50: Saving field - Center: ${centerId}, Part: ${partIndex}, Field: ${fieldName}, Value: ${newValue}`);
    
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
      
      // Parse value based on field type
      let parsedValue = newValue;
      if (fieldName === 'quantity') {
        parsedValue = parseInt(newValue) || 1;
      } else if (fieldName === 'price' || fieldName === 'reduction_percentage' || fieldName === 'wear_percentage') {
        parsedValue = parseFloat(newValue) || 0;
      } else {
        parsedValue = newValue.trim();
      }
      
      // Update Supabase if available
      if (window.supabase) {
        const updateData = {};
        updateData[fieldName] = parsedValue;
        
        const { error } = await window.supabase
          .from('parts_required')
          .update(updateData)
          .eq('plate', plate.replace(/-/g, ''))
          .eq('damage_center_id', centerId)
          .eq('part_name', part.part_name || part.name);
        
        if (error) {
          console.error('❌ SESSION 50: Supabase update error:', error);
          throw error;
        }
      }
      
      // Update helper data
      part[fieldName] = parsedValue;
      
      // Also update common field aliases
      if (fieldName === 'catalog_code') {
        part.pcode = parsedValue;
        part.oem = parsedValue;
      } else if (fieldName === 'part_name') {
        part.name = parsedValue;
      } else if (fieldName === 'quantity') {
        part.qty = parsedValue;
      } else if (fieldName === 'price') {
        part.cost = parsedValue;
        part.expected_cost = parsedValue;
        part.price_per_unit = parsedValue;
      }
      
      console.log('✅ SESSION 50: Field saved successfully');
      
      // Refresh to update calculations
      tabsLoaded.required = false;
      loadRequiredParts();
      
    } catch (error) {
      console.error('❌ SESSION 50: Save error:', error);
      alert('שגיאה בשמירה: ' + error.message);
    }
  };
  
  // SESSION 50: TAB 1 HELPER - Edit required part with inline form
  window.editRequiredPart = async function(centerId, partIndex) {
    console.log(`✏️ SESSION 50: Edit part - Center: ${centerId}, Part: ${partIndex}`);
    
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
      
      // Create editable form modal
      const editModal = document.createElement('div');
      editModal.style.cssText = `
        position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%);
        background: white; padding: 25px; border-radius: 12px; z-index: 20000;
        box-shadow: 0 10px 40px rgba(0,0,0,0.3); min-width: 400px;
      `;
      
      editModal.innerHTML = `
        <h3 style="margin: 0 0 20px 0; color: #28a745; text-align: right;">✏️ עריכת חלק</h3>
        <div style="display: flex; flex-direction: column; gap: 12px; direction: rtl;">
          <div>
            <label style="display: block; margin-bottom: 5px; font-weight: bold;">קוד קטלוגי:</label>
            <input type="text" id="edit-code" value="${part.catalog_code || part.pcode || part.oem || ''}" 
                   style="width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 4px;">
          </div>
          <div>
            <label style="display: block; margin-bottom: 5px; font-weight: bold;">שם החלק:</label>
            <input type="text" id="edit-name" value="${part.part_name || part.name || ''}" 
                   style="width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 4px;">
          </div>
          <div style="display: flex; gap: 10px;">
            <div style="flex: 1;">
              <label style="display: block; margin-bottom: 5px; font-weight: bold;">כמות:</label>
              <input type="number" id="edit-qty" value="${part.quantity || part.qty || 1}" min="1"
                     style="width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 4px;">
            </div>
            <div style="flex: 1;">
              <label style="display: block; margin-bottom: 5px; font-weight: bold;">מחיר יחידה:</label>
              <input type="number" id="edit-price" value="${part.price_per_unit || part.price || part.cost || 0}" step="0.01"
                     style="width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 4px;">
            </div>
          </div>
          <div style="display: flex; gap: 10px;">
            <div style="flex: 1;">
              <label style="display: block; margin-bottom: 5px; font-weight: bold;">הנחה %:</label>
              <input type="number" id="edit-reduction" value="${part.reduction_percentage || part.reduction || 0}" min="0" max="100"
                     style="width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 4px;">
            </div>
            <div style="flex: 1;">
              <label style="display: block; margin-bottom: 5px; font-weight: bold;">בלאי %:</label>
              <input type="number" id="edit-wear" value="${part.wear_percentage || part.wear || 0}" min="0" max="100"
                     style="width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 4px;">
            </div>
          </div>
        </div>
        <div style="display: flex; gap: 10px; margin-top: 20px;">
          <button id="save-edit-btn" style="flex: 1; background: #28a745; color: white; border: none; padding: 10px; 
                                            border-radius: 6px; cursor: pointer; font-weight: bold;">💾 שמור</button>
          <button id="cancel-edit-btn" style="flex: 1; background: #6c757d; color: white; border: none; padding: 10px; 
                                              border-radius: 6px; cursor: pointer; font-weight: bold;">✖ ביטול</button>
        </div>
      `;
      
      const backdrop = document.createElement('div');
      backdrop.style.cssText = 'position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,0.5); z-index: 19999;';
      
      document.body.appendChild(backdrop);
      document.body.appendChild(editModal);
      
      // Close modal function
      const closeModal = () => {
        backdrop.remove();
        editModal.remove();
      };
      
      // Cancel button
      document.getElementById('cancel-edit-btn').onclick = closeModal;
      backdrop.onclick = closeModal;
      
      // Save button
      document.getElementById('save-edit-btn').onclick = async () => {
        try {
          const newCatalogCode = document.getElementById('edit-code').value.trim();
          const newPartName = document.getElementById('edit-name').value.trim();
          const newQuantity = parseInt(document.getElementById('edit-qty').value) || 1;
          const newPrice = parseFloat(document.getElementById('edit-price').value) || 0;
          const newReduction = parseFloat(document.getElementById('edit-reduction').value) || 0;
          const newWear = parseFloat(document.getElementById('edit-wear').value) || 0;
        
          // Calculate total_cost with reductions (like wizard does)
          const priceAfterReduction = newPrice * (1 - newReduction / 100);
          const updatedPrice = priceAfterReduction * (1 - newWear / 100);
          const totalCost = updatedPrice * newQuantity;
          
          // Update Supabase if available (using correct column names from schema)
          if (window.supabase) {
            const supabaseData = {
              pcode: newCatalogCode,
              oem: newCatalogCode,
              part_name: newPartName,
              quantity: newQuantity,
              price_per_unit: newPrice,
              price: newPrice,
              reduction_percentage: newReduction,
              wear_percentage: newWear,
              updated_price: updatedPrice,  // price after reductions
              total_cost: totalCost  // final total cost
            };
            
            const { error } = await window.supabase
              .from('parts_required')
              .update(supabaseData)
              .eq('plate', plate.replace(/-/g, ''))
              .eq('damage_center_code', centerId)
              .eq('part_name', part.part_name || part.name);
            
            if (error) {
              console.error('❌ SESSION 50: Supabase update error:', error);
              throw error;
            }
          }
          
          // Update helper data with ALL calculated fields
          parts[partIndex] = {
            ...part,
            catalog_code: newCatalogCode,
            pcode: newCatalogCode,
            oem: newCatalogCode,
            part_name: newPartName,
            name: newPartName,
            quantity: newQuantity,
            qty: newQuantity,
            price: newPrice,
            cost: newPrice,
            expected_cost: newPrice,
            price_per_unit: newPrice,
            reduction_percentage: newReduction,
            reduction: newReduction,
            wear_percentage: newWear,
            wear: newWear,
            updated_price: updatedPrice,
            total_cost: totalCost  // THIS IS KEY - updates helper total_cost
          };
          
          console.log('✅ SESSION 50: Part edited successfully, total_cost:', totalCost);
          
          closeModal();
          
          // Trigger UI updates in final report if the function exists
          if (typeof window.updatePartsRequiredUI === 'function') {
            window.updatePartsRequiredUI();
          }
          if (typeof window.refreshFinalReportSections === 'function') {
            window.refreshFinalReportSections();
          }
          if (typeof window.recalculateAllTotals === 'function') {
            window.recalculateAllTotals();
          }
          
          tabsLoaded.required = false;
          loadRequiredParts();
          
        } catch (error) {
          console.error('❌ SESSION 50: Edit error:', error);
          alert('שגיאה בעריכת החלק: ' + error.message);
        }
      };
      
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
          
          // Delete from Supabase first (if available)
          if (window.supabase) {
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
          } else {
            console.warn('⚠️ SESSION 50: Supabase not available, deleting from helper only');
          }
          
          // Delete from helper
          parts.splice(partIndex, 1);
          
          // Update sessionStorage
          sessionStorage.setItem('helper', JSON.stringify(window.helper));
          
          // Reload tab
          tabsLoaded.required = false;
          loadRequiredParts();
          
          console.log('✅ SESSION 50: Part deleted successfully');
        }
      }
    } catch (error) {
      console.error('❌ SESSION 49: Delete error:', error);
      alert('שגיאה במחיקת החלק: ' + error.message);
    }
  };
  
  // SESSION 50: TAB 2 - Load Selected Parts (EXACT COPY from PiP getSelectedParts)
  async function loadSelectedParts() {
    console.log('✅ SESSION 50: Loading selected parts (using PiP logic)...');
    const container = document.getElementById('selectedPartsContainer');
    
    try {
      const plate = window.helper?.meta?.plate || window.helper?.vehicle?.plate;
      if (!plate) {
        container.innerHTML = '<div class="no-results">לא נמצא מספר רישוי</div>';
        return;
      }
      
      // Wait for Supabase to load if not available yet
      if (!window.supabase) {
        container.innerHTML = `
          <div class="no-results">
            <div class="no-results-icon">🔄</div>
            <div>טוען חיבור Supabase...</div>
          </div>
        `;
        console.log('⏳ SESSION 50: Waiting for Supabase client...');
        await loadSupabaseClient();
      }
      
      if (!window.supabase) {
        container.innerHTML = '<div class="no-results">⚠️ Supabase לא זמין</div>';
        return;
      }
      
      // EXACT COPY from getSelectedParts() - parts search.html:1441-1464
      console.log('🔍 SESSION 50: Querying Supabase for plate:', plate);
      
      const { data, error } = await window.supabase
        .from('selected_parts')
        .select('*')
        .eq('plate', plate)
        .order('selected_at', { ascending: false });
      
      if (error) {
        console.error('❌ SESSION 50: Supabase error:', error);
        throw error;
      }
      
      const selectedParts = data || [];
      console.log(`📊 SESSION 50: Found ${selectedParts.length} selected parts for plate "${plate}"`);
      
      // Debug: If no results, check what plates exist
      if (selectedParts.length === 0) {
        try {
          const { data: allPlates } = await window.supabase
            .from('selected_parts')
            .select('plate')
            .limit(20);
          const uniquePlates = [...new Set(allPlates?.map(p => p.plate) || [])];
          console.log('🔍 SESSION 50: Available plates in selected_parts:', uniquePlates);
          console.log('💡 Your query plate:', plate);
        } catch (e) {
          console.warn('Could not fetch debug plates:', e);
        }
      }
      
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
      
      // Calculate statistics (from PiP reference)
      const totalParts = selectedParts.length;
      const subtotal = selectedParts.reduce((sum, part) => {
        const price = parseFloat(part.price || part.cost || part.expected_cost || 0);
        const qty = parseInt(part.quantity || part.qty || 1);
        return sum + (price * qty);
      }, 0);
      const avgPrice = totalParts > 0 ? subtotal / totalParts : 0;
      
      document.getElementById('totalSelectedParts').textContent = totalParts;
      document.getElementById('avgSelectedPrice').textContent = `₪${Math.round(avgPrice).toLocaleString('he-IL')}`;
      document.getElementById('totalSelectedCost').textContent = `₪${Math.round(subtotal).toLocaleString('he-IL')}`;
      
      // Build table rows (exact format from PiP - lines 4727-4784)
      const tableRows = selectedParts.map((part, index) => {
        const price = parseFloat(part.price || part.cost || part.expected_cost || 0);
        const qty = parseInt(part.quantity || part.qty || 1);
        const calculatedPrice = price * qty;
        
        return `
        <tr style="background: ${index % 2 === 0 ? '#f9fafb' : 'white'}; border-bottom: 1px solid #e5e7eb;">
          <td style="padding: 10px; text-align: center; width: 40px;">
            <input type="checkbox" class="part-checkbox" data-part-id="${part.id}" data-part-index="${index}" 
                   style="width: 14px; height: 14px; cursor: pointer;">
          </td>
          <td style="padding: 8px; text-align: center; font-size: 11px; color: #6b7280;">
            ${index + 1}
          </td>
          <td style="padding: 8px; text-align: center; font-size: 11px; color: #6b7280;">
            ${part.pcode || part.oem || 'N/A'}
          </td>
          <td style="padding: 8px 10px; text-align: right; font-size: 11px; color: #1f2937;">
            ${part.part_family || part.group || 'N/A'} - ${part.part_name || part.name || 'N/A'}
          </td>
          <td style="padding: 8px; text-align: center; font-size: 11px; color: #4b5563;">
            ${part.source || 'N/A'}
          </td>
          <td style="padding: 8px; text-align: center; font-size: 11px; color: #059669; font-weight: 600;">
            ${price ? '₪' + price.toLocaleString('he-IL', {minimumFractionDigits: 2}) : '-'}
          </td>
          <td style="padding: 8px; text-align: center; font-size: 11px; color: #1f2937;">
            ${qty}
          </td>
          <td style="padding: 8px; text-align: center; font-size: 11px; color: #059669; font-weight: 700;">
            ${calculatedPrice ? '₪' + calculatedPrice.toLocaleString('he-IL', {minimumFractionDigits: 2}) : '-'}
          </td>
          <td style="padding: 8px; text-align: center; font-size: 11px; color: #4b5563;">
            ${part.supplier || part.supplier_name || '-'}
          </td>
          <td style="padding: 8px; text-align: center; font-size: 11px; color: #6b7280;">
            ${part.selected_at ? new Date(part.selected_at).toLocaleDateString('he-IL', { 
              year: '2-digit', month: '2-digit', day: '2-digit'
            }) : 'N/A'}
          </td>
          <td style="padding: 8px; text-align: center; white-space: nowrap;">
            <button onclick="editSelectedPartTab2(${index})" 
                    style="background: #f59e0b; color: white; border: none; padding: 4px 8px; 
                           border-radius: 4px; cursor: pointer; font-size: 11px; font-weight: 600; margin-left: 3px;"
                    onmouseover="this.style.background='#d97706'" 
                    onmouseout="this.style.background='#f59e0b'">
              ✏️
            </button>
            <button onclick="deleteSelectedPartTab2('${part.id}', '${part.plate}')" 
                    style="background: #ef4444; color: white; border: none; padding: 4px 8px; 
                           border-radius: 4px; cursor: pointer; font-size: 11px; font-weight: 600;"
                    onmouseover="this.style.background='#dc2626'" 
                    onmouseout="this.style.background='#ef4444'">
              🗑️
            </button>
          </td>
        </tr>
      `}).join('');
      
      // Build full table with PiP styling (lines 4837-4860)
      container.innerHTML = `
        <div style="max-height: 500px; overflow-y: auto; overflow-x: auto;">
          <table style="width: 100%; border-collapse: collapse; border: 1px solid #e5e7eb; direction: rtl;">
            <thead style="background: #10b981; color: white; position: sticky; top: 0; z-index: 1;">
              <tr>
                <th style="padding: 8px; text-align: center; border: 1px solid #059669; width: 35px; font-size: 11px;">
                  <input type="checkbox" id="selectAllParts" 
                         style="width: 12px; height: 12px; cursor: pointer;"
                         onchange="window.toggleSelectAllTab2(this.checked)">
                </th>
                <th style="padding: 8px; text-align: center; border: 1px solid #059669; width: 40px; font-size: 11px;">#</th>
                <th style="padding: 8px; text-align: center; border: 1px solid #059669; width: 100px; font-size: 11px;">קוד</th>
                <th style="padding: 8px 10px; text-align: right; border: 1px solid #059669; min-width: 200px; font-size: 11px;">שם החלק</th>
                <th style="padding: 8px; text-align: center; border: 1px solid #059669; width: 80px; font-size: 11px;">מקור</th>
                <th style="padding: 8px; text-align: center; border: 1px solid #059669; width: 80px; font-size: 11px;">מחיר</th>
                <th style="padding: 8px; text-align: center; border: 1px solid #059669; width: 50px; font-size: 11px;">כמות</th>
                <th style="padding: 8px; text-align: center; border: 1px solid #059669; width: 90px; font-size: 11px;">סכום</th>
                <th style="padding: 8px; text-align: center; border: 1px solid #059669; width: 120px; font-size: 11px;">ספק</th>
                <th style="padding: 8px; text-align: center; border: 1px solid #059669; width: 110px; font-size: 11px;">תאריך</th>
                <th style="padding: 8px; text-align: center; border: 1px solid #059669; width: 140px; font-size: 11px;">פעולות</th>
              </tr>
            </thead>
            <tbody>
              ${tableRows}
            </tbody>
          </table>
        </div>
        
        <!-- Subtotal Section (lines 4863-4878) -->
        <div style="background: #f0fdf4; padding: 15px; margin-top: 10px; border: 2px solid #10b981; border-radius: 8px; text-align: right; direction: rtl;">
          <div style="display: flex; justify-content: space-between; align-items: center;">
            <div style="font-size: 16px; font-weight: 600; color: #1f2937;">
              סה"כ עלות משוערת:
            </div>
            <div style="text-align: left;">
              <div style="font-size: 18px; font-weight: 700; color: #059669;">
                ₪${subtotal.toLocaleString('he-IL', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </div>
              <div style="font-size: 12px; color: #6b7280; margin-top: 5px;">
                ${totalParts} חלקים • המחירים הינם משוערים בלבד
              </div>
            </div>
          </div>
        </div>
      `;
    } catch (error) {
      console.error('❌ SESSION 50: Error loading selected parts:', error);
      container.innerHTML = `<div class="no-results">שגיאה: ${error.message}</div>`;
    }
  }
  
  // SESSION 50: Tab 2 Helper Functions
  window.editSelectedPartTab2 = async function(partIndex) {
    alert('עריכת חלק נבחר - תתווסף בהמשך');
  };
  
  window.deleteSelectedPartTab2 = async function(partId, plate) {
    if (!confirm('האם למחוק חלק נבחר זה?')) return;
    
    try {
      if (!window.supabase) {
        alert('Supabase לא זמין - לא ניתן למחוק');
        return;
      }
      
      const { error } = await window.supabase
        .from('selected_parts')
        .delete()
        .eq('id', partId);
      
      if (error) throw error;
      
      // Reload Tab 2
      tabsLoaded.selected = false;
      loadSelectedParts();
    } catch (error) {
      alert('שגיאה במחיקה: ' + error.message);
    }
  };
  
  window.toggleSelectAllTab2 = function(checked) {
    document.querySelectorAll('.part-checkbox').forEach(cb => cb.checked = checked);
  };
  
  // SESSION 50: TAB 3 - EXACT COPY from showAllSearchResults (parts search.html:4979-5125)
  async function loadSearchResults() {
    console.log('📊 SESSION 50: Loading search results (using PiP logic)...');
    const container = document.getElementById('searchResultsContainer');
    
    try {
      const plate = window.helper?.meta?.plate || window.helper?.vehicle?.plate;
      if (!plate) {
        container.innerHTML = '<div class="no-results">❌ לא נמצא מספר רישוי</div>';
        return;
      }
      
      // Wait for Supabase
      if (!window.supabase) {
        console.log('⏳ SESSION 50: Waiting for Supabase client for Tab 3...');
        await loadSupabaseClient();
      }
      
      if (!window.supabase) {
        container.innerHTML = '<div class="no-results">⚠️ Supabase לא זמין</div>';
        return;
      }
      
      // EXACT COPY from showAllSearchResults - Normalize plate (remove dashes)
      const normalizedPlate = plate.replace(/-/g, '');
      console.log('📋 SESSION 50: Normalized plate:', plate, '→', normalizedPlate);
      
      // Step 1: Get case_id from cases table (EXACT COPY from PiP)
      const { data: casesData, error: caseError } = await window.supabase
        .from('cases')
        .select('id, filing_case_id')
        .eq('plate', normalizedPlate)
        .order('created_at', { ascending: false });
      
      if (caseError) {
        console.error('❌ SESSION 50: Failed to query cases:', caseError);
        throw new Error(`Failed to query cases: ${caseError.message}`);
      }
      
      const activeCase = casesData?.find(c => c.status === 'OPEN' || c.status === 'IN_PROGRESS') || casesData?.[0];
      
      if (!activeCase) {
        console.error('❌ SESSION 50: No case found for plate:', plate);
        container.innerHTML = `
          <div class="no-results">
            <div class="no-results-icon">📦</div>
            <div>לא נמצא תיק עבור רכב זה</div>
          </div>
        `;
        return;
      }
      
      const caseUuid = activeCase.id;
      console.log('✅ SESSION 50: Found case UUID:', caseUuid);
      
      // Step 2: Get ALL sessions for this case (EXACT COPY from PiP)
      const { data: allSessions, error: sessionsError } = await window.supabase
        .from('parts_search_sessions')
        .select('id, plate, created_at')
        .eq('case_id', caseUuid);
      
      console.log(`📋 SESSION 50: Found ${allSessions?.length || 0} total sessions for case`);
      
      // Filter sessions by plate (normalize both sides for comparison)
      const sessions = allSessions?.filter(session => {
        const sessionPlate = session.plate?.replace(/-/g, '') || '';
        const queryPlate = normalizedPlate;
        return sessionPlate === queryPlate;
      }) || [];
      
      console.log(`✅ SESSION 50: Filtered to ${sessions.length} sessions matching plate`);
      
      if (sessionsError) {
        console.error('❌ SESSION 50: Error loading sessions:', sessionsError);
        throw new Error('שגיאה בטעינת היסטוריית חיפושים: ' + sessionsError.message);
      }
      
      if (!sessions || sessions.length === 0) {
        console.log('⚠️ SESSION 50: No search sessions found');
        container.innerHTML = `
          <div class="no-results">
            <div class="no-results-icon">📦</div>
            <div>לא נמצאו חיפושים עבור רכב זה</div>
          </div>
        `;
        return;
      }
      
      // Step 3: Get results for all sessions using OR filter (EXACT COPY from PiP)
      const sessionIds = sessions.map(s => s.id);
      console.log('📋 SESSION 50: Querying results for session IDs:', sessionIds);
      
      let query = window.supabase
        .from('parts_search_results')
        .select('*');
      
      // Use or() filter with multiple session_id matches
      if (sessionIds.length > 0) {
        const orFilters = sessionIds.map(id => `session_id.eq.${id}`).join(',');
        query = query.or(orFilters);
      }
      
      const { data: searchResults, error: resultsError } = await query.order('created_at', { ascending: false });
      
      if (resultsError) {
        console.error('❌ SESSION 50: Error loading search results:', resultsError);
        throw new Error('שגיאה בטעינת תוצאות חיפוש: ' + resultsError.message);
      }
      
      console.log(`✅ SESSION 50: Loaded ${searchResults?.length || 0} search result records`);
      
      // Flatten all results from all searches (EXACT COPY from PiP lines 5078-5103)
      let allResults = [];
      let totalSearches = 0;
      
      if (searchResults && searchResults.length > 0) {
        searchResults.forEach(record => {
          totalSearches++;
          console.log(`📦 SESSION 50: Processing record ${totalSearches}`);
          
          // The results are stored in the 'results' JSONB field
          const results = record.results || [];
          console.log(`  └─ Results array length: ${results.length}`);
          
          // Add metadata to each result
          if (Array.isArray(results)) {
            results.forEach(result => {
              allResults.push({
                ...result,
                search_date: record.created_at,
                search_session_id: record.session_id,
                data_source: record.search_query?.data_source || record.data_source || 'catalog'
              });
            });
          }
        });
      }
      
      console.log(`📊 SESSION 50: Total searches: ${totalSearches}, Total results: ${allResults.length}`);
      
      displaySearchResults(allResults, container);
      
    } catch (error) {
      console.error('❌ SESSION 50: Error in loadSearchResults:', error);
      container.innerHTML = `<div class="no-results">שגיאה: ${error.message}</div>`;
    }
  }
  
  // SESSION 50: Display search results in Tab 3 (based on PiP createSearchResultsModal - lines 5128-5320)
  function displaySearchResults(results, container) {
    if (!results || results.length === 0) {
      container.innerHTML = `
        <div class="no-results">
          <div class="no-results-icon">📦</div>
          <div>לא נמצאו תוצאות חיפוש</div>
        </div>
      `;
      return;
    }
    
    // Build table rows (exact format from PiP lines 5161-5184)
    const tableRows = results.map((result, index) => {
      const price = parseFloat(result.price || result.cost || 0);
      const formattedPrice = price ? `₪${price.toLocaleString('he-IL')}` : 'לא זמין';
      const searchDate = result.search_date ? new Date(result.search_date).toLocaleDateString('he-IL', {
        year: '2-digit', month: '2-digit', day: '2-digit'
      }) : 'לא זמין';
      const dataSource = result.data_source === 'catalog' ? 'קטלוגי' : 
                        result.data_source === 'web' ? 'אינטרנט' : 
                        result.data_source === 'ocr' ? 'OCR' : result.data_source || 'לא זמין';
      
      return `
        <tr style="background: ${index % 2 === 0 ? '#f9fafb' : 'white'}; border-bottom: 1px solid #e5e7eb;">
          <td style="padding: 10px; text-align: center; font-size: 11px; color: #6b7280;">${searchDate}</td>
          <td style="padding: 10px; text-align: center; font-size: 11px;">
            <span style="background: #dbeafe; color: #1e40af; padding: 4px 8px; border-radius: 6px; font-weight: 600; font-size: 10px;">
              ${dataSource}
            </span>
          </td>
          <td style="padding: 10px; text-align: center; font-size: 11px; font-weight: 600; color: #1f2937;">${result.supplier_name || result.supplier || 'לא זמין'}</td>
          <td style="padding: 10px; text-align: center; font-size: 11px; font-family: monospace; color: #1e40af;">${result.pcode || result.oem || 'לא זמין'}</td>
          <td style="padding: 10px; text-align: right; font-size: 11px; color: #1f2937;">${result.cat_num_desc || result.part_name || result.description || 'לא זמין'}</td>
          <td style="padding: 10px; text-align: center; font-size: 11px; color: #6b7280;">${result.part_family || result.group || 'לא מוגדר'}</td>
          <td style="padding: 10px; text-align: center; font-size: 11px; font-weight: 600; color: #059669;">${formattedPrice}</td>
        </tr>
      `;
    }).join('');
    
    // Build full table (blue theme like PiP)
    container.innerHTML = `
      <div style="max-height: 500px; overflow-y: auto; overflow-x: auto;">
        <table style="width: 100%; border-collapse: collapse; border: 1px solid #e5e7eb; direction: rtl;">
          <thead style="background: #3b82f6; color: white; position: sticky; top: 0; z-index: 1;">
            <tr>
              <th style="padding: 10px; text-align: center; border: 1px solid #2563eb; width: 90px; font-size: 11px;">תאריך חיפוש</th>
              <th style="padding: 10px; text-align: center; border: 1px solid #2563eb; width: 100px; font-size: 11px;">מקור נתונים</th>
              <th style="padding: 10px; text-align: center; border: 1px solid #2563eb; width: 120px; font-size: 11px;">ספק</th>
              <th style="padding: 10px; text-align: center; border: 1px solid #2563eb; width: 110px; font-size: 11px;">מק"ט</th>
              <th style="padding: 10px; text-align: right; border: 1px solid #2563eb; min-width: 200px; font-size: 11px;">תיאור</th>
              <th style="padding: 10px; text-align: center; border: 1px solid #2563eb; width: 120px; font-size: 11px;">משפחת חלק</th>
              <th style="padding: 10px; text-align: center; border: 1px solid #2563eb; width: 100px; font-size: 11px;">מחיר</th>
            </tr>
          </thead>
          <tbody>
            ${tableRows}
          </tbody>
        </table>
      </div>
      
      <!-- Summary section -->
      <div style="background: #eff6ff; padding: 12px 15px; margin-top: 10px; border: 2px solid #3b82f6; border-radius: 8px; display: flex; justify-content: space-between; align-items: center;">
        <div style="font-size: 14px; font-weight: 600; color: #1e40af;">
          📊 סה"כ תוצאות: <span style="color: #2563eb; font-size: 16px;">${results.length}</span>
        </div>
      </div>
    `;
  }
  
  // SESSION 50: Fallback to helper data if Supabase unavailable
  function loadSearchResultsFromHelper() {
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
      
      // SESSION 50: Tab 3 has NO statistics elements (user requested removal)
      return;
    }

    // SESSION 50: Tab 3 - NO statistics or recommendations (per user request)

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