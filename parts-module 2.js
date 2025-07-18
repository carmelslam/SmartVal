// 🔧 Enhanced Parts Module (wizard + standalone)
import { getVehicleData, getDamageData, updateHelper } from './helper.js';
import { sendToWebhook } from './webhook.js';
import { PARTS_BANK } from './parts.js';

const urlParams = new URLSearchParams(window.location.search);
const mode = urlParams.get('mode') === 'wizard' ? 'wizard' : 'standalone';

class PartsModule {
  constructor() {
    this.mode = mode;
    this.carDetails = this.getCarDetails();
    this.selectedParts = [];
    this.searchResults = [];
    this.suggestions = [];
  }

  getCarDetails() {
    if (this.mode === 'wizard') {
      return getVehicleData();
    } else {
      // Standalone mode - get from form inputs
      return {
        plate: '',
        manufacturer: '',
        model: '',
        year: ''
      };
    }
  }

  init() {
    this.renderInterface();
    this.bindEvents();
    this.loadStoredResults();
  }

  renderInterface() {
    const root = document.getElementById('parts-module-root') || document.body;
    
    root.innerHTML = `
      <div class="parts-module-container">
        <div class="parts-header">
          <h2>מודול חיפוש וניהול חלקים</h2>
          <div class="mode-indicator">מצב: ${this.mode === 'wizard' ? 'אשף' : 'עצמאי'}</div>
        </div>
        
        ${this.renderVehicleSection()}
        ${this.renderSearchSection()}
        ${this.renderResultsSection()}
        ${this.renderSelectedPartsSection()}
        ${this.renderActionsSection()}
      </div>
      
      <style>
        .parts-module-container {
          max-width: 900px;
          margin: 0 auto;
          padding: 20px;
          font-family: Arial, sans-serif;
          direction: rtl;
        }
        .parts-header {
          text-align: center;
          margin-bottom: 30px;
          padding: 20px;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          border-radius: 12px;
        }
        .mode-indicator {
          font-size: 14px;
          opacity: 0.9;
          margin-top: 5px;
        }
        .section {
          background: white;
          padding: 20px;
          margin-bottom: 20px;
          border-radius: 12px;
          box-shadow: 0 2px 10px rgba(0,0,0,0.1);
        }
        .section h3 {
          color: #333;
          margin-bottom: 15px;
          border-bottom: 2px solid #007bff;
          padding-bottom: 8px;
        }
        .form-row {
          display: flex;
          gap: 15px;
          margin-bottom: 15px;
          flex-wrap: wrap;
        }
        .form-group {
          flex: 1;
          min-width: 200px;
        }
        .form-group label {
          display: block;
          margin-bottom: 5px;
          font-weight: bold;
          color: #333;
        }
        .form-group input, .form-group select, .form-group textarea {
          width: 100%;
          padding: 10px;
          border: 1px solid #ddd;
          border-radius: 6px;
          font-size: 14px;
          box-sizing: border-box;
        }
        .btn {
          padding: 10px 20px;
          border: none;
          border-radius: 6px;
          cursor: pointer;
          font-size: 14px;
          margin: 5px;
          transition: all 0.3s;
        }
        .btn-primary {
          background: #007bff;
          color: white;
        }
        .btn-secondary {
          background: #6c757d;
          color: white;
        }
        .btn-success {
          background: #28a745;
          color: white;
        }
        .btn-danger {
          background: #dc3545;
          color: white;
        }
        .btn:hover {
          opacity: 0.9;
          transform: translateY(-1px);
        }
        .parts-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
          gap: 15px;
          margin-top: 15px;
        }
        .part-card {
          border: 1px solid #ddd;
          border-radius: 8px;
          padding: 15px;
          background: #f8f9fa;
        }
        .part-card.selected {
          border-color: #007bff;
          background: #e7f3ff;
        }
        .suggestions-dropdown {
          position: absolute;
          background: white;
          border: 1px solid #ddd;
          border-radius: 6px;
          z-index: 1000;
          max-height: 200px;
          overflow-y: auto;
          width: 100%;
          box-shadow: 0 4px 6px rgba(0,0,0,0.1);
        }
        .suggestion-item {
          padding: 10px;
          cursor: pointer;
          border-bottom: 1px solid #eee;
        }
        .suggestion-item:hover {
          background: #f0f0f0;
        }
        .upload-area {
          border: 2px dashed #007bff;
          border-radius: 8px;
          padding: 30px;
          text-align: center;
          background: #f8f9fa;
          cursor: pointer;
          transition: all 0.3s;
        }
        .upload-area:hover {
          background: #e9ecef;
        }
        .upload-area.dragover {
          border-color: #28a745;
          background: #d4edda;
        }
        .results-container {
          max-height: 400px;
          overflow-y: auto;
          border: 1px solid #ddd;
          border-radius: 6px;
          padding: 10px;
        }
        .hidden {
          display: none;
        }
      </style>
    `;
  }

  renderVehicleSection() {
    if (this.mode === 'wizard') {
      return `
        <div class="section">
          <h3>פרטי הרכב</h3>
          <div class="form-row">
            <div class="form-group">
              <label>מספר רישוי:</label>
              <input type="text" id="vehicle-plate" value="${this.carDetails.plate || ''}" readonly>
            </div>
            <div class="form-group">
              <label>יצרן:</label>
              <input type="text" id="vehicle-manufacturer" value="${this.carDetails.manufacturer || ''}" readonly>
            </div>
            <div class="form-group">
              <label>דגם:</label>
              <input type="text" id="vehicle-model" value="${this.carDetails.model || ''}" readonly>
            </div>
            <div class="form-group">
              <label>שנה:</label>
              <input type="text" id="vehicle-year" value="${this.carDetails.year || ''}" readonly>
            </div>
          </div>
        </div>
      `;
    } else {
      return `
        <div class="section">
          <h3>פרטי הרכב</h3>
          <div class="form-row">
            <div class="form-group">
              <label>מספר רישוי:</label>
              <input type="text" id="vehicle-plate" placeholder="הזן מספר רישוי">
            </div>
            <div class="form-group">
              <label>יצרן:</label>
              <input type="text" id="vehicle-manufacturer" placeholder="הזן יצרן">
            </div>
            <div class="form-group">
              <label>דגם:</label>
              <input type="text" id="vehicle-model" placeholder="הזן דגם">
            </div>
            <div class="form-group">
              <label>שנה:</label>
              <input type="text" id="vehicle-year" placeholder="הזן שנה">
            </div>
          </div>
        </div>
      `;
    }
  }

  renderSearchSection() {
    return `
      <div class="section">
        <h3>חיפוש חלקים</h3>
        
        <!-- Manual Part Addition -->
        <div class="form-row">
          <div class="form-group" style="position: relative;">
            <label>שם החלק:</label>
            <input type="text" id="part-name" placeholder="הזן שם החלק" autocomplete="off">
            <div id="name-suggestions" class="suggestions-dropdown hidden"></div>
          </div>
          <div class="form-group">
            <label>תיאור:</label>
            <input type="text" id="part-description" placeholder="תיאור החלק">
          </div>
          <div class="form-group">
            <label>מחיר:</label>
            <input type="number" id="part-price" placeholder="מחיר" step="0.01">
          </div>
          <div class="form-group">
            <label>מקור:</label>
            <select id="part-source">
              <option value="">בחר מקור</option>
              <option value="מקורי">מקורי</option>
              <option value="תחליפי">תחליפי</option>
              <option value="משומש">משומש</option>
            </select>
          </div>
        </div>
        
        <div class="form-row">
          <button class="btn btn-primary" onclick="partsModule.addPart()">הוסף חלק לרשימה</button>
          <button class="btn btn-secondary" onclick="partsModule.searchParts()">חפש במאגר חלקים</button>
        </div>
        
        <!-- Image Upload for OCR -->
        <div class="upload-area" id="image-upload-area">
          <div>📸 לחץ או גרור תמונה לחיפוש OCR</div>
          <input type="file" id="part-image" accept="image/*" style="display: none;">
        </div>
        
        <!-- Search Results Upload -->
        <div class="form-row" style="margin-top: 20px;">
          <div class="form-group">
            <label>העלה תוצאות חיפוש (PDF/תמונה):</label>
            <input type="file" id="search-results-file" accept=".pdf,.jpg,.jpeg,.png,.html">
          </div>
          <button class="btn btn-secondary" onclick="partsModule.processSearchResults()">עבד תוצאות חיפוש</button>
        </div>
      </div>
    `;
  }

  renderResultsSection() {
    return `
      <div class="section">
        <h3>תוצאות חיפוש</h3>
        <div id="search-results" class="results-container">
          <div style="text-align: center; color: #666; padding: 20px;">
            אין תוצאות חיפוש עדיין
          </div>
        </div>
      </div>
    `;
  }

  renderSelectedPartsSection() {
    return `
      <div class="section">
        <h3>חלקים נבחרים</h3>
        <div id="selected-parts" class="parts-grid">
          <!-- Selected parts will be rendered here -->
        </div>
      </div>
    `;
  }

  renderActionsSection() {
    return `
      <div class="section">
        <h3>פעולות</h3>
        <div class="form-row">
          <button class="btn btn-success" onclick="partsModule.saveParts()">💾 שמור חלקים</button>
          <button class="btn btn-primary" onclick="partsModule.exportParts()">📄 ייצא לאקסל</button>
          <button class="btn btn-secondary" onclick="partsModule.openCarPartSite()">🔗 פתח אתר Car-Part</button>
          ${this.mode === 'wizard' ? '<button class="btn btn-primary" onclick="partsModule.continueWizard()">המשך באשף</button>' : ''}
        </div>
      </div>
    `;
  }

  bindEvents() {
    // Bind auto-suggestions
    const nameInput = document.getElementById('part-name');
    if (nameInput) {
      nameInput.addEventListener('input', (e) => this.showSuggestions(e.target.value));
      nameInput.addEventListener('blur', () => {
        setTimeout(() => this.hideSuggestions(), 200);
      });
    }

    // Bind image upload
    const uploadArea = document.getElementById('image-upload-area');
    const fileInput = document.getElementById('part-image');
    
    if (uploadArea && fileInput) {
      uploadArea.addEventListener('click', () => fileInput.click());
      uploadArea.addEventListener('dragover', (e) => {
        e.preventDefault();
        uploadArea.classList.add('dragover');
      });
      uploadArea.addEventListener('dragleave', () => {
        uploadArea.classList.remove('dragover');
      });
      uploadArea.addEventListener('drop', (e) => {
        e.preventDefault();
        uploadArea.classList.remove('dragover');
        const files = e.dataTransfer.files;
        if (files.length > 0) {
          fileInput.files = files;
          this.processImageOCR(files[0]);
        }
      });
      
      fileInput.addEventListener('change', (e) => {
        if (e.target.files.length > 0) {
          this.processImageOCR(e.target.files[0]);
        }
      });
    }
  }

  showSuggestions(query) {
    const container = document.getElementById('name-suggestions');
    if (!container) return;

    if (!query || query.length < 2) {
      container.classList.add('hidden');
      return;
    }

    // Search in PARTS_BANK
    const suggestions = [];
    Object.keys(PARTS_BANK).forEach(category => {
      PARTS_BANK[category].forEach(part => {
        if (part.toLowerCase().includes(query.toLowerCase())) {
          suggestions.push({ name: part, category });
        }
      });
    });

    // Also search in stored results
    try {
      const helper = JSON.parse(localStorage.getItem('helper_data') || '{}');
      const storedResults = helper.parts_search?.results || [];
      storedResults.forEach(result => {
        if ((result.name || '').toLowerCase().includes(query.toLowerCase()) ||
            (result.desc || '').toLowerCase().includes(query.toLowerCase())) {
          suggestions.push({
            name: result.name || result.desc,
            description: result.desc,
            price: result.price,
            source: result.source
          });
        }
      });
    } catch (e) {
      console.warn('Error loading stored results:', e);
    }

    if (suggestions.length === 0) {
      container.classList.add('hidden');
      return;
    }

    container.innerHTML = suggestions.slice(0, 10).map(suggestion => `
      <div class="suggestion-item" onclick="partsModule.selectSuggestion('${suggestion.name}', '${suggestion.description || ''}', '${suggestion.price || ''}', '${suggestion.source || ''}')">
        <strong>${suggestion.name}</strong>
        ${suggestion.category ? `<br><small>קטגוריה: ${suggestion.category}</small>` : ''}
        ${suggestion.description ? `<br><small>${suggestion.description}</small>` : ''}
        ${suggestion.price ? `<br><small>מחיר: ₪${suggestion.price}</small>` : ''}
      </div>
    `).join('');
    
    container.classList.remove('hidden');
  }

  hideSuggestions() {
    const container = document.getElementById('name-suggestions');
    if (container) {
      container.classList.add('hidden');
    }
  }

  selectSuggestion(name, description, price, source) {
    document.getElementById('part-name').value = name;
    if (description) document.getElementById('part-description').value = description;
    if (price) document.getElementById('part-price').value = price;
    if (source) document.getElementById('part-source').value = source;
    this.hideSuggestions();
  }

  addPart() {
    const name = document.getElementById('part-name').value.trim();
    const description = document.getElementById('part-description').value.trim();
    const price = parseFloat(document.getElementById('part-price').value) || 0;
    const source = document.getElementById('part-source').value;

    if (!name || !description) {
      alert('יש למלא לפחות שם החלק ותיאור');
      return;
    }

    const part = {
      id: Date.now().toString(),
      name,
      description,
      price,
      source,
      addedAt: new Date().toISOString()
    };

    this.selectedParts.push(part);
    this.renderSelectedParts();
    this.clearForm();
  }

  clearForm() {
    document.getElementById('part-name').value = '';
    document.getElementById('part-description').value = '';
    document.getElementById('part-price').value = '';
    document.getElementById('part-source').value = '';
  }

  renderSelectedParts() {
    const container = document.getElementById('selected-parts');
    if (!container) return;

    if (this.selectedParts.length === 0) {
      container.innerHTML = '<div style="text-align: center; color: #666; padding: 20px;">אין חלקים נבחרים</div>';
      return;
    }

    container.innerHTML = this.selectedParts.map(part => `
      <div class="part-card">
        <div style="display: flex; justify-content: space-between; align-items: start;">
          <div style="flex: 1;">
            <strong>${part.name}</strong>
            <div style="color: #666; margin: 5px 0;">${part.description}</div>
            <div style="font-size: 14px;">
              <span style="color: #28a745; font-weight: bold;">₪${part.price}</span>
              ${part.source ? ` | ${part.source}` : ''}
            </div>
          </div>
          <button class="btn btn-danger" style="padding: 5px 10px; font-size: 12px;" onclick="partsModule.removePart('${part.id}')">
            ✕
          </button>
        </div>
      </div>
    `).join('');
  }

  removePart(partId) {
    this.selectedParts = this.selectedParts.filter(part => part.id !== partId);
    this.renderSelectedParts();
  }

  async searchParts() {
    const vehicleData = this.getCurrentVehicleData();
    const query = document.getElementById('part-name').value.trim();
    
    if (!query) {
      alert('יש להזין שם חלק לחיפוש');
      return;
    }

    try {
      const payload = {
        task: 'PART_SEARCH',
        vehicle: vehicleData,
        query,
        timestamp: new Date().toISOString()
      };

      const response = await sendToWebhook('PART_SEARCH', payload);
      if (response && response.results) {
        this.displaySearchResults(response.results);
      } else {
        this.displaySearchResults([]);
      }
    } catch (error) {
      console.error('Part search error:', error);
      alert('שגיאה בחיפוש חלקים');
    }
  }

  async processImageOCR(file) {
    const formData = new FormData();
    formData.append('image', file);
    formData.append('task', 'PART_IMAGE_OCR');
    formData.append('vehicle', JSON.stringify(this.getCurrentVehicleData()));

    try {
      const response = await sendToWebhook('PART_IMAGE_OCR', formData);
      if (response && response.parts) {
        this.displaySearchResults(response.parts);
        alert(`נמצאו ${response.parts.length} חלקים בתמונה`);
      } else {
        alert('לא נמצאו חלקים בתמונה');
      }
    } catch (error) {
      console.error('OCR processing error:', error);
      alert('שגיאה בעיבוד התמונה');
    }
  }

  async processSearchResults() {
    const fileInput = document.getElementById('search-results-file');
    const file = fileInput.files[0];
    
    if (!file) {
      alert('יש לבחור קובץ תוצאות חיפוש');
      return;
    }

    const formData = new FormData();
    formData.append('file', file);
    formData.append('task', 'SEARCH_RESULTS_OCR');
    formData.append('vehicle', JSON.stringify(this.getCurrentVehicleData()));

    try {
      const response = await sendToWebhook('SEARCH_RESULTS_OCR', formData);
      if (response && response.parts) {
        this.displaySearchResults(response.parts);
        alert(`עובדו ${response.parts.length} חלקים מתוצאות החיפוש`);
      } else {
        alert('לא נמצאו חלקים בקובץ');
      }
    } catch (error) {
      console.error('Search results processing error:', error);
      alert('שגיאה בעיבוד תוצאות החיפוש');
    }
  }

  displaySearchResults(results) {
    const container = document.getElementById('search-results');
    if (!container) return;

    this.searchResults = results;

    if (results.length === 0) {
      container.innerHTML = '<div style="text-align: center; color: #666; padding: 20px;">לא נמצאו תוצאות</div>';
      return;
    }

    container.innerHTML = results.map((result, index) => `
      <div class="part-card" style="cursor: pointer;" onclick="partsModule.selectSearchResult(${index})">
        <strong>${result.name || result.description || 'חלק ללא שם'}</strong>
        ${result.description ? `<div style="color: #666; margin: 5px 0;">${result.description}</div>` : ''}
        <div style="font-size: 14px;">
          ${result.price ? `<span style="color: #28a745; font-weight: bold;">₪${result.price}</span>` : ''}
          ${result.source ? ` | ${result.source}` : ''}
          ${result.supplier ? ` | ${result.supplier}` : ''}
        </div>
        <small style="color: #999;">לחץ להוספה לרשימה</small>
      </div>
    `).join('');
  }

  selectSearchResult(index) {
    const result = this.searchResults[index];
    if (!result) return;

    const part = {
      id: Date.now().toString(),
      name: result.name || result.description || 'חלק מחיפוש',
      description: result.description || result.name || '',
      price: parseFloat(result.price) || 0,
      source: result.source || '',
      supplier: result.supplier || '',
      addedAt: new Date().toISOString(),
      fromSearch: true
    };

    this.selectedParts.push(part);
    this.renderSelectedParts();
  }

  getCurrentVehicleData() {
    return {
      plate: document.getElementById('vehicle-plate').value || '',
      manufacturer: document.getElementById('vehicle-manufacturer').value || '',
      model: document.getElementById('vehicle-model').value || '',
      year: document.getElementById('vehicle-year').value || ''
    };
  }

  saveParts() {
    if (this.selectedParts.length === 0) {
      alert('אין חלקים לשמירה');
      return;
    }

    const partsData = {
      parts: this.selectedParts,
      vehicle: this.getCurrentVehicleData(),
      timestamp: new Date().toISOString(),
      mode: this.mode
    };

    if (this.mode === 'wizard') {
      // Save to helper for wizard flow
      updateHelper('parts_search', {
        results: this.selectedParts,
        summary: {
          total_results: this.selectedParts.length,
          recommended: this.selectedParts.filter(p => p.fromSearch).length
        }
      });
    }

    // Save to localStorage
    try {
      const existingData = JSON.parse(localStorage.getItem('saved_parts') || '[]');
      existingData.push(partsData);
      localStorage.setItem('saved_parts', JSON.stringify(existingData));
      
      alert(`✅ נשמרו ${this.selectedParts.length} חלקים בהצלחה`);
    } catch (error) {
      console.error('Save error:', error);
      alert('שגיאה בשמירת החלקים');
    }
  }

  exportParts() {
    if (this.selectedParts.length === 0) {
      alert('אין חלקים לייצוא');
      return;
    }

    const csv = this.generateCSV();
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `parts_list_${Date.now()}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  generateCSV() {
    const headers = ['שם החלק', 'תיאור', 'מחיר', 'מקור', 'ספק', 'תאריך הוספה'];
    const rows = this.selectedParts.map(part => [
      part.name || '',
      part.description || '',
      part.price || 0,
      part.source || '',
      part.supplier || '',
      new Date(part.addedAt).toLocaleDateString('he-IL')
    ]);

    return [headers, ...rows].map(row => 
      row.map(field => `"${field}"`).join(',')
    ).join('\n');
  }

  openCarPartSite() {
    const url = 'https://www.car-part.co.il/Include/Generic/AccessSystem.jsp';
    window.open(url, '_blank');
    
    // Show credentials if available
    try {
      const credentials = window.dev_credentials?.carPart;
      if (credentials) {
        alert(`📋 פרטי גישה לאתר Car-Part:\nשם משתמש: ${credentials.username}\nסיסמה: ${credentials.password}`);
      }
    } catch (e) {
      console.warn('No credentials available');
    }
  }

  continueWizard() {
    if (this.mode === 'wizard') {
      this.saveParts();
      // Navigate to next step in wizard
      window.location.href = 'upload-images.html';
    }
  }

  loadStoredResults() {
    try {
      const helper = JSON.parse(localStorage.getItem('helper_data') || '{}');
      const storedResults = helper.parts_search?.results || [];
      if (storedResults.length > 0) {
        this.displaySearchResults(storedResults);
      }
    } catch (e) {
      console.warn('Error loading stored results:', e);
    }
  }
}

// Global instance
window.partsModule = null;

function renderPartsModule() {
  window.partsModule = new PartsModule();
  window.partsModule.init();
}

document.addEventListener('DOMContentLoaded', renderPartsModule);

export { PartsModule };