(function () {
  if (document.getElementById("partsModal")) return;

  const style = document.createElement("style");
  style.innerHTML = `
    #partsModal {
      position: fixed;
      top: 50px;
      left: 50%;
      transform: translateX(-50%);
      max-width: 800px;
      width: 90vw;
      max-height: 80vh;
      background: white;
      border: 1px solid #28a745;
      padding: 25px;
      z-index: 9999;
      box-shadow: 0 0 25px rgba(0,0,0,0.3);
      direction: rtl;
      font-family: sans-serif;
      border-radius: 12px;
      display: none;
      overflow-y: auto;
    }
    .parts-modal-title {
      font-size: 22px;
      font-weight: bold;
      margin-bottom: 20px;
      color: #28a745;
      text-align: center;
      border-bottom: 2px solid #28a745;
      padding-bottom: 10px;
    }
    .parts-search-section {
      background: #f8f9fa;
      border-radius: 8px;
      padding: 20px;
      margin-bottom: 20px;
    }
    .parts-search-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 15px;
      margin-bottom: 15px;
    }
    .parts-field {
      display: flex;
      flex-direction: column;
    }
    .parts-field label {
      font-weight: bold;
      margin-bottom: 5px;
      color: #495057;
      font-size: 14px;
    }
    .parts-field select,
    .parts-field input {
      padding: 10px;
      border: 1px solid #ced4da;
      border-radius: 6px;
      font-size: 14px;
      text-align: right;
    }
    .parts-field select:focus,
    .parts-field input:focus {
      outline: none;
      border-color: #28a745;
    }
    .search-modes {
      display: flex;
      gap: 10px;
      margin-bottom: 15px;
      justify-content: center;
    }
    .mode-btn {
      padding: 8px 16px;
      border: 2px solid #28a745;
      background: white;
      color: #28a745;
      border-radius: 6px;
      cursor: pointer;
      font-weight: bold;
    }
    .mode-btn.active {
      background: #28a745;
      color: white;
    }
    .parts-results {
      max-height: 300px;
      overflow-y: auto;
      border: 1px solid #e9ecef;
      border-radius: 8px;
      margin-top: 15px;
    }
    .part-result {
      padding: 12px;
      border-bottom: 1px solid #e9ecef;
      cursor: pointer;
      transition: background 0.2s;
    }
    .part-result:hover {
      background: #f8f9fa;
    }
    .part-result.selected {
      background: #d4edda;
      border-left: 4px solid #28a745;
    }
    .part-result .part-name {
      font-weight: bold;
      color: #212529;
      margin-bottom: 5px;
    }
    .part-result .part-details {
      font-size: 12px;
      color: #6c757d;
      display: grid;
      grid-template-columns: 1fr 1fr 1fr;
      gap: 10px;
    }
    .parts-buttons {
      display: flex;
      gap: 10px;
      margin-top: 20px;
    }
    .parts-btn {
      flex: 1;
      padding: 12px;
      border: none;
      border-radius: 8px;
      cursor: pointer;
      font-weight: bold;
      font-size: 14px;
    }
    .parts-btn.close {
      background: #dc3545;
      color: white;
    }
    .parts-btn.search {
      background: #28a745;
      color: white;
    }
    .parts-btn.select {
      background: #007bff;
      color: white;
    }
    .image-upload {
      border: 2px dashed #28a745;
      padding: 20px;
      text-align: center;
      border-radius: 8px;
      margin-bottom: 15px;
      cursor: pointer;
    }
    .image-upload.dragover {
      background: #d4edda;
    }
    .selected-parts {
      background: #e8f5e8;
      border-radius: 8px;
      padding: 15px;
      margin-top: 15px;
    }
    .selected-parts h4 {
      margin: 0 0 10px 0;
      color: #28a745;
    }
    .selected-part {
      background: white;
      padding: 8px;
      border-radius: 4px;
      margin-bottom: 5px;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    .remove-part {
      background: #dc3545;
      color: white;
      border: none;
      border-radius: 4px;
      padding: 4px 8px;
      cursor: pointer;
      font-size: 12px;
    }
  `;
  document.head.appendChild(style);

  const modal = document.createElement("div");
  modal.id = "partsModal";
  modal.innerHTML = `
    <div class="parts-modal-title">חיפוש חלקים ורכיבים</div>
    
    <div class="search-modes">
      <button class="mode-btn active" onclick="setSearchMode('dropdown')">חיפוש מובנה</button>
      <button class="mode-btn" onclick="setSearchMode('text')">חיפוש טקסט</button>
      <button class="mode-btn" onclick="setSearchMode('image')">חיפוש תמונה</button>
      <button class="mode-btn" onclick="setSearchMode('browser')">דפדפן מובנה</button>
    </div>

    <div class="parts-search-section" id="dropdownSearch">
      <div class="parts-search-grid">
        <div class="parts-field">
          <label>קטגוריית חלק</label>
          <select id="partCategory">
            <option value="">בחר קטגוריה</option>
            <option value="body">מרכב וקישוטים</option>
            <option value="engine">מנוע</option>
            <option value="transmission">תיבת הילוכים</option>
            <option value="electrical">חשמל</option>
            <option value="suspension">מתלים</option>
            <option value="brakes">בלמים</option>
            <option value="interior">פנים הרכב</option>
            <option value="exterior">חוץ הרכב</option>
            <option value="lights">תאורה</option>
            <option value="glass">זכוכיות</option>
          </select>
        </div>
        <div class="parts-field">
          <label>שם החלק</label>
          <select id="partName">
            <option value="">בחר שם חלק</option>
          </select>
        </div>
        <div class="parts-field">
          <label>מצב החלק</label>
          <select id="partCondition">
            <option value="">בחר מצב</option>
            <option value="new">חדש</option>
            <option value="used">משומש</option>
            <option value="oem">OEM</option>
            <option value="refurbished">משופץ</option>
          </select>
        </div>
        <div class="parts-field">
          <label>תיאור נוסף</label>
          <input type="text" id="partDescription" placeholder="תיאור מפורט של החלק">
        </div>
      </div>
      <button class="parts-btn search" onclick="searchParts()">חפש חלקים</button>
    </div>

    <div class="parts-search-section" id="textSearch" style="display: none;">
      <div class="parts-field">
        <label>חיפוש טקסט חופשי</label>
        <input type="text" id="textSearchInput" placeholder="הזן שם חלק או תיאור">
      </div>
      <button class="parts-btn search" onclick="searchPartsText()">חפש</button>
    </div>

    <div class="parts-search-section" id="imageSearch" style="display: none;">
      <div class="image-upload" onclick="document.getElementById('imageInput').click()">
        <div>לחץ או גרור תמונה של החלק לכאן</div>
        <div style="font-size: 12px; color: #6c757d; margin-top: 5px;">
          נתמך: JPG, PNG, GIF עד 5MB
        </div>
      </div>
      <input type="file" id="imageInput" accept="image/*" style="display: none;">
      <button class="parts-btn search" onclick="searchPartsImage()">זהה חלק מתמונה</button>
    </div>

    <div class="parts-search-section" id="browserSearch" style="display: none;">
      <div style="text-align: center; padding: 20px;">
        <div style="margin-bottom: 15px;">גישה לאתרי חלקים מובנית</div>
        <button class="parts-btn search" onclick="openPartsBrowser('car-part.co.il')">
          פתח car-part.co.il
        </button>
      </div>
    </div>

    <div class="parts-results" id="partsResults" style="display: none;">
      <div style="padding: 15px; text-align: center; color: #6c757d;">
        לא נמצאו תוצאות. נסה חיפוש אחר.
      </div>
    </div>

    <div class="selected-parts" id="selectedParts" style="display: none;">
      <h4>חלקים נבחרים (<span id="selectedCount">0</span>)</h4>
      <div id="selectedPartsList"></div>
    </div>

    <div class="parts-buttons">
      <button class="parts-btn close" onclick="togglePartsSearch()">סגור</button>
      <button class="parts-btn select" onclick="addSelectedParts()" style="display: none;" id="addPartsBtn">
        הוסף חלקים נבחרים לדו"ח
      </button>
    </div>
  `;
  document.body.appendChild(modal);

  // Global variables
  let currentSearchMode = 'dropdown';
  let searchResults = [];
  let selectedParts = [];

  // Part categories mapping
  const partCategories = {
    body: ['דלת', 'מכסה מנוע', 'פגוש', 'דפנה', 'גג', 'מרזב', 'סף', 'עמוד'],
    engine: ['מנוע', 'פילטר אוויר', 'פילטר דלק', 'רדיאטור', 'טורבו', 'מפה', 'חיישן'],
    transmission: ['תיבת הילוכים', 'מצמד', 'דיסק מצמד', 'לוח לחץ', 'גל הינע'],
    electrical: ['ממסר', 'נתיך', 'חיווט', 'בקר', 'מתנע', 'אלטרנטור', 'מצבר'],
    suspension: ['מתלה', 'בולם', 'קפיץ', 'מתלה מק סטראט', 'זרוע', 'מיסב גלגל'],
    brakes: ['דיסק בלם', 'רפידות בלם', 'צילינדר בלם', 'נוזל בלמים', 'צינור בלם'],
    interior: ['כסא', 'הגה', 'לוח מחוונים', 'קונסולה', 'חגורת בטיחות', 'שטיח'],
    exterior: ['מראה', 'ידית', 'מגב', 'אנטנה', 'סמל', 'מדבקה'],
    lights: ['פנס קדמי', 'פנס אחורי', 'נורה', 'מחזיר אור', 'פנס ערפל'],
    glass: ['שמשה קדמית', 'שמשה אחורית', 'חלון צדדי', 'מראה צדדית']
  };

  // Global functions
  window.togglePartsSearch = function () {
    const modal = document.getElementById("partsModal");
    if (modal.style.display === "none" || !modal.style.display) {
      modal.style.display = "block";
      initializePartsSearch();
    } else {
      modal.style.display = "none";
    }
  };

  window.setSearchMode = function (mode) {
    currentSearchMode = mode;
    
    // Update button states
    document.querySelectorAll('.mode-btn').forEach(btn => {
      btn.classList.remove('active');
    });
    event.target.classList.add('active');

    // Show/hide search sections
    document.getElementById('dropdownSearch').style.display = mode === 'dropdown' ? 'block' : 'none';
    document.getElementById('textSearch').style.display = mode === 'text' ? 'block' : 'none';
    document.getElementById('imageSearch').style.display = mode === 'image' ? 'block' : 'none';
    document.getElementById('browserSearch').style.display = mode === 'browser' ? 'block' : 'none';
  };

  window.searchParts = async function () {
    const category = document.getElementById('partCategory').value;
    const name = document.getElementById('partName').value;
    const condition = document.getElementById('partCondition').value;
    const description = document.getElementById('partDescription').value;

    if (!category && !name && !description) {
      alert('נא להזין לפחות קטגוריה או שם חלק');
      return;
    }

    try {
      showLoadingResults();
      
      const searchData = {
        search_type: 'dropdown',
        category: category,
        part_name: name,
        condition: condition,
        description: description
      };

      // Simulate API call - replace with actual webhook
      setTimeout(() => {
        const mockResults = generateMockResults(searchData);
        displayResults(mockResults);
      }, 1500);

    } catch (error) {
      console.error('Parts search error:', error);
      alert('שגיאה בחיפוש חלקים: ' + error.message);
    }
  };

  window.searchPartsText = async function () {
    const query = document.getElementById('textSearchInput').value.trim();
    if (!query) {
      alert('נא להזין טקסט לחיפוש');
      return;
    }

    try {
      showLoadingResults();
      
      // Simulate text search
      setTimeout(() => {
        const mockResults = generateMockResults({ search_type: 'text', query: query });
        displayResults(mockResults);
      }, 1500);

    } catch (error) {
      console.error('Text search error:', error);
      alert('שגיאה בחיפוש טקסט: ' + error.message);
    }
  };

  window.searchPartsImage = async function () {
    const fileInput = document.getElementById('imageInput');
    if (!fileInput.files[0]) {
      alert('נא לבחור תמונה');
      return;
    }

    try {
      showLoadingResults();
      
      // Simulate image recognition
      setTimeout(() => {
        const mockResults = generateMockResults({ search_type: 'image', filename: fileInput.files[0].name });
        displayResults(mockResults);
      }, 2000);

    } catch (error) {
      console.error('Image search error:', error);
      alert('שגיאה בזיהוי תמונה: ' + error.message);
    }
  };

  window.openPartsBrowser = function (site) {
    // Close parts search modal
    togglePartsSearch();
    
    // Open site in internal browser
    if (typeof openInternalBrowser === 'function') {
      openInternalBrowser(site, 'parts_search');
    } else {
      console.error('Internal browser not loaded');
      alert('דפדפן מובנה לא זמין - נא לטעון את המודול');
    }
  };

  window.selectPartResult = function (index) {
    const result = searchResults[index];
    if (!result) return;

    const isSelected = selectedParts.find(p => p.id === result.id);
    if (isSelected) {
      selectedParts = selectedParts.filter(p => p.id !== result.id);
    } else {
      selectedParts.push(result);
    }

    updateResultsDisplay();
    updateSelectedPartsDisplay();
  };

  window.removeSelectedPart = function (id) {
    selectedParts = selectedParts.filter(p => p.id !== id);
    updateSelectedPartsDisplay();
    updateResultsDisplay();
  };

  window.addSelectedParts = function () {
    if (selectedParts.length === 0) {
      alert('לא נבחרו חלקים');
      return;
    }

    // Save to helper.js or sessionStorage
    try {
      if (typeof helper !== 'undefined') {
        if (!helper.selectedParts) helper.selectedParts = [];
        helper.selectedParts.push(...selectedParts);
      } else {
        const existing = JSON.parse(sessionStorage.getItem('selectedParts') || '[]');
        existing.push(...selectedParts);
        sessionStorage.setItem('selectedParts', JSON.stringify(existing));
      }

      alert(`${selectedParts.length} חלקים נוספו בהצלחה לדו"ח`);
      selectedParts = [];
      updateSelectedPartsDisplay();
      togglePartsSearch();

    } catch (error) {
      console.error('Error saving parts:', error);
      alert('שגיאה בשמירת החלקים');
    }
  };

  // Helper functions
  function initializePartsSearch() {
    // Update part categories dropdown
    document.getElementById('partCategory').addEventListener('change', function() {
      updatePartNames(this.value);
    });

    // Image drag and drop
    const imageUpload = document.querySelector('.image-upload');
    imageUpload.addEventListener('dragover', (e) => {
      e.preventDefault();
      imageUpload.classList.add('dragover');
    });
    imageUpload.addEventListener('dragleave', () => {
      imageUpload.classList.remove('dragover');
    });
    imageUpload.addEventListener('drop', (e) => {
      e.preventDefault();
      imageUpload.classList.remove('dragover');
      const files = e.dataTransfer.files;
      if (files[0]) {
        document.getElementById('imageInput').files = files;
      }
    });
  }

  function updatePartNames(category) {
    const partNameSelect = document.getElementById('partName');
    partNameSelect.innerHTML = '<option value="">בחר שם חלק</option>';
    
    if (category && partCategories[category]) {
      partCategories[category].forEach(part => {
        const option = document.createElement('option');
        option.value = part;
        option.textContent = part;
        partNameSelect.appendChild(option);
      });
    }
  }

  function showLoadingResults() {
    const resultsDiv = document.getElementById('partsResults');
    resultsDiv.style.display = 'block';
    resultsDiv.innerHTML = `
      <div style="padding: 30px; text-align: center;">
        <div style="font-size: 16px; margin-bottom: 10px;">מחפש חלקים...</div>
        <div style="font-size: 12px; color: #6c757d;">אנא המתן בזמן החיפוש במסדי הנתונים</div>
      </div>
    `;
  }

  function generateMockResults(searchData) {
    // Generate mock search results based on search type
    const results = [];
    const numResults = Math.floor(Math.random() * 8) + 3;
    
    for (let i = 0; i < numResults; i++) {
      results.push({
        id: `part_${Date.now()}_${i}`,
        name: `${searchData.part_name || searchData.query || 'חלק'} ${i + 1}`,
        category: searchData.category || 'body',
        condition: searchData.condition || 'used',
        price: Math.floor(Math.random() * 500) + 50,
        supplier: `ספק ${Math.floor(Math.random() * 5) + 1}`,
        location: ['תל אביב', 'חיפה', 'ירושלים', 'באר שבע'][Math.floor(Math.random() * 4)],
        description: `תיאור מפורט של ${searchData.part_name || searchData.query || 'החלק'}`
      });
    }
    
    return results;
  }

  function displayResults(results) {
    searchResults = results;
    const resultsDiv = document.getElementById('partsResults');
    
    if (results.length === 0) {
      resultsDiv.innerHTML = `
        <div style="padding: 20px; text-align: center; color: #6c757d;">
          לא נמצאו תוצאות. נסה חיפוש אחר או שנה את הפרמטרים.
        </div>
      `;
      return;
    }

    resultsDiv.innerHTML = results.map((result, index) => `
      <div class="part-result" onclick="selectPartResult(${index})">
        <div class="part-name">${result.name}</div>
        <div class="part-details">
          <span>מצב: ${result.condition}</span>
          <span>מחיר: ₪${result.price}</span>
          <span>ספק: ${result.supplier}</span>
        </div>
        <div class="part-details">
          <span>מיקום: ${result.location}</span>
          <span>קטגוריה: ${result.category}</span>
          <span>${result.description}</span>
        </div>
      </div>
    `).join('');

    resultsDiv.style.display = 'block';
  }

  function updateResultsDisplay() {
    document.querySelectorAll('.part-result').forEach((el, index) => {
      const result = searchResults[index];
      const isSelected = selectedParts.find(p => p.id === result.id);
      el.classList.toggle('selected', !!isSelected);
    });
  }

  function updateSelectedPartsDisplay() {
    const selectedDiv = document.getElementById('selectedParts');
    const selectedList = document.getElementById('selectedPartsList');
    const addBtn = document.getElementById('addPartsBtn');
    
    if (selectedParts.length === 0) {
      selectedDiv.style.display = 'none';
      addBtn.style.display = 'none';
      return;
    }

    selectedDiv.style.display = 'block';
    addBtn.style.display = 'block';
    document.getElementById('selectedCount').textContent = selectedParts.length;

    selectedList.innerHTML = selectedParts.map(part => `
      <div class="selected-part">
        <span>${part.name} - ₪${part.price}</span>
        <button class="remove-part" onclick="removeSelectedPart('${part.id}')">הסר</button>
      </div>
    `).join('');
  }

  // Expose refresh function to global scope for automatic updates from builder
  window.refreshPartsResults = function () {
    console.log('🔄 Parts floating screen: refreshPartsResults called');
    // For parts search, we'll refresh the current search results if any exist
    if (searchResults && searchResults.length > 0) {
      displayResults(searchResults);
    }
  };

  // Add floating button to access parts search from any page
  if (!document.getElementById("partsFloatBtn")) {
    const floatBtn = document.createElement("button");
    floatBtn.id = "partsFloatBtn";
    floatBtn.innerHTML = "חיפוש חלקים";
    floatBtn.style.cssText = `
      position: fixed;
      top: 20px;
      left: 20px;
      background: #28a745;
      color: white;
      border: none;
      padding: 8px 12px;
      border-radius: 6px;
      cursor: pointer;
      font-size: 12px;
      font-weight: bold;
      z-index: 9998;
      box-shadow: 0 2px 8px rgba(0,0,0,0.2);
    `;
    floatBtn.onclick = togglePartsSearch;
    document.body.appendChild(floatBtn);
  }

})();