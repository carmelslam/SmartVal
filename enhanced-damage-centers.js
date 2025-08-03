// 🧱 Enhanced Damage Centers Module  
import { helper, updateHelper, saveHelperToStorage, getDamageData, syncDamageData, getVehicleData } from './helper.js';
import { sendToWebhook } from './webhook.js';
import { PARTS_BANK } from './parts.js';
import { calculate, MathEngine } from './math.js';
import { capturePartsWebhookResponse, getPartsSearchData, updatePartsSearchData } from './DAMAGE CENTER MODULE.js';

class EnhancedDamageCenters {
  constructor() {
    this.damageData = getDamageData();
    this.vehicleData = getVehicleData();
    this.damageCenters = this.damageData.centers || [];
    this.currentCenterIndex = 0;
    this.unsavedChanges = false;
    this.totalCosts = { parts: 0, repairs: 0, works: 0, total: 0 };
  }

  init() {
    this.renderInterface();
    this.bindEvents();
    this.loadStoredData();
    this.calculateTotals();
    this.enableAutosave();
  }

  renderInterface() {
    const container = document.getElementById('app') || document.body;
    
    container.innerHTML = `
      <div class="damage-centers-container">
        <div class="damage-header">
          <h1>🧱 ניהול מוקדי נזק</h1>
          <div class="vehicle-info">
            <span>🚗 ${this.vehicleData.manufacturer || ''} ${this.vehicleData.model || ''} | ${this.vehicleData.plate || ''}</span>
          </div>
        </div>

        ${this.renderDamageLocationSelector()}
        ${this.renderCentersNavigation()}
        ${this.renderCurrentCenter()}
        ${this.renderCostSummary()}
        ${this.renderActions()}
      </div>

      <style>
        .damage-centers-container {
          max-width: 1200px;
          margin: 0 auto;
          padding: 20px;
          font-family: Arial, sans-serif;
          direction: rtl;
        }
        .damage-header {
          text-align: center;
          margin-bottom: 30px;
          padding: 20px;
          background: linear-gradient(135deg, #ff6b6b 0%, #ffa726 100%);
          color: white;
          border-radius: 12px;
        }
        .vehicle-info {
          font-size: 16px;
          margin-top: 10px;
          opacity: 0.9;
        }
        .section {
          background: white;
          padding: 25px;
          margin-bottom: 20px;
          border-radius: 12px;
          box-shadow: 0 2px 15px rgba(0,0,0,0.08);
          border: 1px solid #e0e0e0;
        }
        .section h3 {
          color: #333;
          margin-bottom: 20px;
          border-bottom: 3px solid #ff6b6b;
          padding-bottom: 10px;
          font-size: 18px;
        }
        .centers-nav {
          display: flex;
          gap: 10px;
          margin-bottom: 20px;
          flex-wrap: wrap;
          justify-content: center;
        }
        .center-tab {
          padding: 12px 20px;
          border: 2px solid #ddd;
          border-radius: 8px;
          cursor: pointer;
          background: white;
          transition: all 0.3s;
          font-weight: bold;
          min-width: 120px;
          text-align: center;
        }
        .center-tab.active {
          background: #ff6b6b;
          color: white;
          border-color: #ff6b6b;
        }
        .center-tab.has-data {
          border-color: #4caf50;
          background: #f8fff8;
        }
        .center-tab.has-data.active {
          background: #4caf50;
          border-color: #4caf50;
        }
        .damage-location-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
          gap: 10px;
          margin-bottom: 20px;
        }
        .location-btn {
          padding: 15px;
          border: 2px solid #ddd;
          border-radius: 8px;
          background: white;
          cursor: pointer;
          text-align: center;
          transition: all 0.3s;
          font-weight: bold;
        }
        .location-btn:hover {
          border-color: #ff6b6b;
          background: #fff5f5;
        }
        .location-btn.selected {
          background: #ff6b6b;
          color: white;
          border-color: #ff6b6b;
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
          margin-bottom: 8px;
          font-weight: bold;
          color: #333;
        }
        .form-group input, .form-group select, .form-group textarea {
          width: 100%;
          padding: 12px;
          border: 1px solid #ddd;
          border-radius: 8px;
          font-size: 14px;
          box-sizing: border-box;
          transition: border-color 0.3s;
        }
        .form-group input:focus, .form-group select:focus, .form-group textarea:focus {
          border-color: #ff6b6b;
          outline: none;
        }
        .items-container {
          border: 1px solid #e0e0e0;
          border-radius: 8px;
          margin-bottom: 20px;
        }
        .items-header {
          background: #f8f9fa;
          padding: 15px;
          border-bottom: 1px solid #e0e0e0;
          font-weight: bold;
          display: flex;
          justify-content: space-between;
          align-items: center;
        }
        .item-row {
          display: grid;
          grid-template-columns: 2fr 2fr 1fr 1fr auto;
          gap: 10px;
          padding: 10px 15px;
          border-bottom: 1px solid #f0f0f0;
          align-items: center;
        }
        .item-row:last-child {
          border-bottom: none;
        }
        .item-row input, .item-row select {
          padding: 8px;
          border: 1px solid #ddd;
          border-radius: 4px;
          font-size: 13px;
        }
        .btn {
          padding: 12px 20px;
          border: none;
          border-radius: 8px;
          cursor: pointer;
          font-size: 14px;
          font-weight: bold;
          margin: 5px;
          transition: all 0.3s;
          text-decoration: none;
          display: inline-block;
          text-align: center;
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
        .btn-warning {
          background: #ffc107;
          color: #000;
        }
        .btn:hover {
          opacity: 0.9;
          transform: translateY(-1px);
        }
        .btn-small {
          padding: 6px 12px;
          font-size: 12px;
        }
        .cost-summary {
          background: linear-gradient(135deg, #28a745 0%, #20c997 100%);
          color: white;
          padding: 20px;
          border-radius: 12px;
          text-align: center;
        }
        .cost-row {
          display: flex;
          justify-content: space-between;
          margin: 8px 0;
          font-size: 16px;
        }
        .cost-total {
          font-size: 20px;
          font-weight: bold;
          border-top: 2px solid rgba(255,255,255,0.3);
          padding-top: 10px;
          margin-top: 15px;
        }
        .suggestions-dropdown {
          position: absolute;
          background: white;
          border: 1px solid #ddd;
          border-radius: 6px;
          z-index: 1000;
          max-height: 200px;
          overflow-y: auto;
          width: calc(100% - 2px);
          box-shadow: 0 4px 6px rgba(0,0,0,0.1);
          display: none;
        }
        .suggestion-item {
          padding: 10px;
          cursor: pointer;
          border-bottom: 1px solid #eee;
        }
        .suggestion-item:hover {
          background: #f0f0f0;
        }
        .unsaved-indicator {
          position: fixed;
          top: 20px;
          right: 20px;
          background: #ffc107;
          color: #000;
          padding: 10px 15px;
          border-radius: 8px;
          font-weight: bold;
          display: none;
        }
        .severity-indicator {
          display: inline-block;
          width: 12px;
          height: 12px;
          border-radius: 50%;
          margin-left: 8px;
        }
        .severity-low { background: #28a745; }
        .severity-medium { background: #ffc107; }
        .severity-high { background: #dc3545; }
        @media (max-width: 768px) {
          .form-row {
            flex-direction: column;
          }
          .item-row {
            grid-template-columns: 1fr;
            gap: 5px;
          }
          .centers-nav {
            justify-content: stretch;
          }
          .center-tab {
            flex: 1;
            min-width: auto;
          }
        }
      </style>
    `;
  }

  renderDamageLocationSelector() {
    const locations = [
      'חזית', 'קדמי ימין', 'ימין קדמי', 'ימין',
      'אחורי ימין', 'ימין אחורי', 'אחורי', 'אחורי שמאל',
      'שמאל אחורי', 'שמאל', 'שמאל קדמי', 'קדמי שמאל',
      'גג', 'מכסה מנוע', 'תא מטען', 'פנים הרכב',
      'מערכת חשמל', 'מערכת מיזוג', 'מנוע', 'תיבת הילוכים',
      'מתלה', 'בלמים', 'מערכת הגה', 'סביב הרכב', 'אחר'
    ];

    return `
      <div class="section">
        <h3>🎯 בחר מיקום נזק</h3>
        <div class="damage-location-grid">
          ${locations.map(location => `
            <div class="location-btn" onclick="damageCentersModule.selectLocation('${location}')">
              ${location}
            </div>
          `).join('')}
        </div>
        <div class="form-group">
          <label>מיקום נזק מותאם אישית:</label>
          <input type="text" id="custom-location" placeholder="הזן מיקום נזק אחר...">
        </div>
      </div>
    `;
  }

  renderCentersNavigation() {
    return `
      <div class="section">
        <h3>📋 מוקדי נזק</h3>
        <div class="centers-nav">
          ${this.damageCenters.map((center, index) => `
            <div class="center-tab ${index === this.currentCenterIndex ? 'active' : ''} ${this.centerHasData(center) ? 'has-data' : ''}"
                 onclick="damageCentersModule.switchToCenter(${index})">
              <div>מוקד ${index + 1}</div>
              <div style="font-size: 12px; opacity: 0.8;">${center.location || 'לא מוגדר'}</div>
              ${this.renderSeverityIndicator(center.severity)}
            </div>
          `).join('')}
          <div class="center-tab" onclick="damageCentersModule.addNewCenter()">
            <div>➕ הוסף מוקד</div>
          </div>
        </div>
      </div>
    `;
  }

  renderCurrentCenter() {
    const center = this.damageCenters[this.currentCenterIndex] || this.createEmptyCenter();
    
    return `
      <div class="section">
        <h3>🔧 מוקד נזק ${this.currentCenterIndex + 1} - ${center.location || 'לא מוגדר'}</h3>
        
        ${this.renderCenterBasicInfo(center)}
        ${this.renderCenterParts(center)}
        ${this.renderCenterRepairs(center)}
        ${this.renderCenterWorks(center)}
        ${this.renderCenterDepreciation(center)}
        
        <div class="form-row" style="margin-top: 20px;">
          <button class="btn btn-danger" onclick="damageCentersModule.deleteCurrentCenter()">
            🗑️ מחק מוקד זה
          </button>
          <button class="btn btn-warning" onclick="damageCentersModule.duplicateCurrentCenter()">
            📋 שכפל מוקד זה
          </button>
        </div>
      </div>
    `;
  }

  renderCenterBasicInfo(center) {
    return `
      <div class="form-row">
        <div class="form-group">
          <label>מיקום הנזק:</label>
          <input type="text" id="center-location" value="${center.location || ''}" 
                 onchange="damageCentersModule.updateCenterField('location', this.value)">
        </div>
        <div class="form-group">
          <label>חומרת הנזק:</label>
          <select id="center-severity" onchange="damageCentersModule.updateCenterField('severity', this.value)">
            <option value="low" ${center.severity === 'low' ? 'selected' : ''}>קל</option>
            <option value="medium" ${center.severity === 'medium' ? 'selected' : ''}>בינוני</option>
            <option value="high" ${center.severity === 'high' ? 'selected' : ''}>חמור</option>
          </select>
        </div>
      </div>
      <div class="form-group">
        <label>תיאור הנזק:</label>
        <textarea id="center-description" rows="3" 
                  onchange="damageCentersModule.updateCenterField('description', this.value)">${center.description || ''}</textarea>
      </div>
    `;
  }

  renderCenterParts(center) {
    return `
      <div class="items-container">
        <div class="items-header">
          <span>🔧 חלקים נדרשים</span>
          <button class="btn btn-primary btn-small" onclick="damageCentersModule.addPart()">
            ➕ הוסף חלק
          </button>
        </div>
        ${(center.parts || []).map((part, index) => `
          <div class="item-row">
            <div style="position: relative;">
              <input type="text" value="${part.name || ''}" placeholder="שם החלק"
                     onchange="damageCentersModule.updatePartField(${index}, 'name', this.value)"
                     oninput="damageCentersModule.showPartSuggestions(this, ${index})">
              <div class="suggestions-dropdown" id="part-suggestions-${index}"></div>
            </div>
            <input type="text" value="${part.description || ''}" placeholder="תיאור"
                   onchange="damageCentersModule.updatePartField(${index}, 'description', this.value)">
            <input type="number" value="${part.price || ''}" placeholder="מחיר"
                   onchange="damageCentersModule.updatePartField(${index}, 'price', this.value)">
            <select onchange="damageCentersModule.updatePartField(${index}, 'source', this.value)">
              <option value="">מקור</option>
              <option value="מקורי" ${part.source === 'מקורי' ? 'selected' : ''}>מקורי</option>
              <option value="תחליפי" ${part.source === 'תחליפי' ? 'selected' : ''}>תחליפי</option>
              <option value="משומש" ${part.source === 'משומש' ? 'selected' : ''}>משומש</option>
            </select>
            <button class="btn btn-danger btn-small" onclick="damageCentersModule.removePart(${index})">
              ✕
            </button>
          </div>
        `).join('')}
        ${(center.parts || []).length === 0 ? '<div style="padding: 20px; text-align: center; color: #666;">אין חלקים נדרשים</div>' : ''}
      </div>
    `;
  }

  renderCenterRepairs(center) {
    return `
      <div class="items-container">
        <div class="items-header">
          <span>🔨 עבודות תיקון</span>
          <button class="btn btn-primary btn-small" onclick="damageCentersModule.addRepair()">
            ➕ הוסף תיקון
          </button>
        </div>
        ${(center.repairs || []).map((repair, index) => `
          <div class="item-row">
            <input type="text" value="${repair.name || ''}" placeholder="שם התיקון"
                   onchange="damageCentersModule.updateRepairField(${index}, 'name', this.value)">
            <input type="text" value="${repair.description || ''}" placeholder="תיאור"
                   onchange="damageCentersModule.updateRepairField(${index}, 'description', this.value)">
            <input type="number" value="${repair.cost || ''}" placeholder="עלות"
                   onchange="damageCentersModule.updateRepairField(${index}, 'cost', this.value)">
            <input type="number" value="${repair.hours || ''}" placeholder="שעות"
                   onchange="damageCentersModule.updateRepairField(${index}, 'hours', this.value)">
            <button class="btn btn-danger btn-small" onclick="damageCentersModule.removeRepair(${index})">
              ✕
            </button>
          </div>
        `).join('')}
        ${(center.repairs || []).length === 0 ? '<div style="padding: 20px; text-align: center; color: #666;">אין עבודות תיקון</div>' : ''}
      </div>
    `;
  }

  renderCenterWorks(center) {
    const workTypes = [
      'עבודות צבע', 'עבודות חשמל', 'עבודות מכונאות', 'עבודות מזגן',
      'עבודות ריפוד', 'עבודות זגגות', 'איטום וזיפות', 'בדיקת מתלה',
      'הנזק מחייב תקנה 309', 'כיול רדאר', 'העברת חיישנים', 'אחר'
    ];

    return `
      <div class="items-container">
        <div class="items-header">
          <span>⚙️ עבודות נדרשות</span>
          <button class="btn btn-primary btn-small" onclick="damageCentersModule.addWork()">
            ➕ הוסף עבודה
          </button>
        </div>
        ${(center.works || []).map((work, index) => `
          <div class="item-row">
            <select onchange="damageCentersModule.updateWorkField(${index}, 'type', this.value)">
              <option value="">בחר סוג עבודה</option>
              ${workTypes.map(type => `
                <option value="${type}" ${work.type === type ? 'selected' : ''}>${type}</option>
              `).join('')}
            </select>
            <input type="text" value="${work.description || ''}" placeholder="תיאור נוסף"
                   onchange="damageCentersModule.updateWorkField(${index}, 'description', this.value)">
            <input type="number" value="${work.cost || ''}" placeholder="עלות משוערת"
                   onchange="damageCentersModule.updateWorkField(${index}, 'cost', this.value)">
            <select onchange="damageCentersModule.updateWorkField(${index}, 'required', this.value === 'true')">
              <option value="true" ${work.required !== false ? 'selected' : ''}>חובה</option>
              <option value="false" ${work.required === false ? 'selected' : ''}>אופציונלי</option>
            </select>
            <button class="btn btn-danger btn-small" onclick="damageCentersModule.removeWork(${index})">
              ✕
            </button>
          </div>
        `).join('')}
        ${(center.works || []).length === 0 ? '<div style="padding: 20px; text-align: center; color: #666;">אין עבודות נדרשות</div>' : ''}
      </div>
    `;
  }

  renderCenterDepreciation(center) {
    return `
      <div class="form-row">
        <div class="form-group">
          <label>ירידת ערך למוקד זה (%):</label>
          <input type="number" value="${center.depreciation?.percentage || 0}" 
                 min="0" max="100" step="0.1"
                 onchange="damageCentersModule.updateDepreciation('percentage', this.value)">
        </div>
        <div class="form-group">
          <label>סיבה לירידת ערך:</label>
          <input type="text" value="${center.depreciation?.reason || ''}" 
                 placeholder="הסבר לירידת הערך"
                 onchange="damageCentersModule.updateDepreciation('reason', this.value)">
        </div>
      </div>
    `;
  }

  renderCostSummary() {
    return `
      <div class="section">
        <div class="cost-summary">
          <h3>💰 סיכום עלויות</h3>
          <div class="cost-row">
            <span>סה"כ חלקים:</span>
            <span>₪${this.totalCosts.parts.toLocaleString()}</span>
          </div>
          <div class="cost-row">
            <span>סה"כ תיקונים:</span>
            <span>₪${this.totalCosts.repairs.toLocaleString()}</span>
          </div>
          <div class="cost-row">
            <span>סה"כ עבודות:</span>
            <span>₪${this.totalCosts.works.toLocaleString()}</span>
          </div>
          <div class="cost-total">
            <div class="cost-row">
              <span>סה"כ כללי:</span>
              <span>₪${this.totalCosts.total.toLocaleString()}</span>
            </div>
          </div>
        </div>
      </div>
    `;
  }

  renderActions() {
    return `
      <div class="section">
        <h3>🎬 פעולות</h3>
        <div class="form-row">
          <button class="btn btn-success" onclick="damageCentersModule.saveAndContinue()">
            💾 שמור והמשך
          </button>
          <button class="btn btn-secondary" onclick="damageCentersModule.saveAsDraft()">
            📝 שמור כטיוטה
          </button>
          <button class="btn btn-primary" onclick="damageCentersModule.previewReport()">
            👁️ תצוגה מקדימה
          </button>
          <button class="btn btn-warning" onclick="damageCentersModule.exportData()">
            📊 ייצא נתונים
          </button>
        </div>
      </div>
      
      <div class="unsaved-indicator" id="unsaved-indicator">
        ⚠️ יש שינויים שלא נשמרו
      </div>
    `;
  }

  renderSeverityIndicator(severity) {
    const severityClass = `severity-${severity || 'medium'}`;
    return `<span class="severity-indicator ${severityClass}"></span>`;
  }

  // Event binding and interaction methods
  bindEvents() {
    // Auto-save on any input change
    document.addEventListener('input', () => {
      this.markUnsaved();
    });

    document.addEventListener('change', () => {
      this.markUnsaved();
      this.calculateTotals();
    });

    // Keyboard shortcuts
    document.addEventListener('keydown', (e) => {
      if (e.ctrlKey || e.metaKey) {
        if (e.key === 's') {
          e.preventDefault();
          this.saveAsDraft();
        }
        if (e.key === 'ArrowLeft') {
          e.preventDefault();
          this.switchToCenter(Math.max(0, this.currentCenterIndex - 1));
        }
        if (e.key === 'ArrowRight') {
          e.preventDefault();
          this.switchToCenter(Math.min(this.damageCenters.length - 1, this.currentCenterIndex + 1));
        }
      }
    });
  }

  // Core functionality methods
  selectLocation(location) {
    document.getElementById('center-location').value = location;
    this.updateCenterField('location', location);
    
    // Visual feedback
    document.querySelectorAll('.location-btn').forEach(btn => btn.classList.remove('selected'));
    event.target.classList.add('selected');
  }

  switchToCenter(index) {
    if (index >= 0 && index < this.damageCenters.length) {
      this.currentCenterIndex = index;
      this.renderInterface();
    }
  }

  addNewCenter() {
    const newCenter = this.createEmptyCenter();
    this.damageCenters.push(newCenter);
    this.currentCenterIndex = this.damageCenters.length - 1;
    this.renderInterface();
    this.markUnsaved();
  }

  deleteCurrentCenter() {
    if (this.damageCenters.length <= 1) {
      alert('חייב להישאר לפחות מוקד נזק אחד');
      return;
    }

    if (confirm('האם אתה בטוח שברצונך למחוק מוקד נזק זה?')) {
      this.damageCenters.splice(this.currentCenterIndex, 1);
      this.currentCenterIndex = Math.max(0, this.currentCenterIndex - 1);
      this.renderInterface();
      this.markUnsaved();
      this.calculateTotals();
    }
  }

  duplicateCurrentCenter() {
    const currentCenter = this.damageCenters[this.currentCenterIndex];
    const duplicatedCenter = JSON.parse(JSON.stringify(currentCenter));
    duplicatedCenter.location = (duplicatedCenter.location || '') + ' (עותק)';
    
    this.damageCenters.splice(this.currentCenterIndex + 1, 0, duplicatedCenter);
    this.currentCenterIndex++;
    this.renderInterface();
    this.markUnsaved();
  }

  createEmptyCenter() {
    return {
      id: `center_${Date.now()}`,
      location: '',
      description: '',
      severity: 'medium',
      parts: [],
      repairs: [],
      works: [],
      depreciation: {
        percentage: 0,
        amount: 0,
        reason: ''
      }
    };
  }

  updateCenterField(field, value) {
    if (!this.damageCenters[this.currentCenterIndex]) {
      this.damageCenters[this.currentCenterIndex] = this.createEmptyCenter();
    }
    
    this.damageCenters[this.currentCenterIndex][field] = value;
    this.markUnsaved();
    
    // Re-render navigation if location changed
    if (field === 'location') {
      this.renderInterface();
    }
  }

  // Parts management
  addPart() {
    const center = this.damageCenters[this.currentCenterIndex];
    if (!center.parts) center.parts = [];
    
    center.parts.push({
      name: '',
      description: '',
      price: 0,
      source: '',
      supplier: ''
    });
    
    this.renderInterface();
    this.markUnsaved();
  }

  updatePartField(partIndex, field, value) {
    const center = this.damageCenters[this.currentCenterIndex];
    if (!center.parts[partIndex]) return;
    
    center.parts[partIndex][field] = field === 'price' ? parseFloat(value) || 0 : value;
    this.markUnsaved();
    this.calculateTotals();
  }

  removePart(partIndex) {
    const center = this.damageCenters[this.currentCenterIndex];
    center.parts.splice(partIndex, 1);
    this.renderInterface();
    this.markUnsaved();
    this.calculateTotals();
  }

  showPartSuggestions(input, partIndex) {
    const query = input.value.trim();
    const dropdown = document.getElementById(`part-suggestions-${partIndex}`);
    
    if (!query || query.length < 2) {
      dropdown.style.display = 'none';
      return;
    }

    // Get suggestions from PARTS_BANK and stored data
    const suggestions = this.getPartSuggestions(query);
    
    if (suggestions.length === 0) {
      dropdown.style.display = 'none';
      return;
    }

    dropdown.innerHTML = suggestions.slice(0, 8).map(suggestion => `
      <div class="suggestion-item" onclick="damageCentersModule.selectPartSuggestion(${partIndex}, '${suggestion.name}', '${suggestion.description || ''}', '${suggestion.price || ''}', '${suggestion.source || ''}')">
        <strong>${suggestion.name}</strong>
        ${suggestion.description ? `<br><small>${suggestion.description}</small>` : ''}
        ${suggestion.price ? `<br><small>מחיר: ₪${suggestion.price}</small>` : ''}
      </div>
    `).join('');
    
    dropdown.style.display = 'block';
  }

  selectPartSuggestion(partIndex, name, description, price, source) {
    this.updatePartField(partIndex, 'name', name);
    this.updatePartField(partIndex, 'description', description);
    if (price) this.updatePartField(partIndex, 'price', price);
    if (source) this.updatePartField(partIndex, 'source', source);
    
    document.getElementById(`part-suggestions-${partIndex}`).style.display = 'none';
    this.renderInterface();
  }

  getPartSuggestions(query) {
    const suggestions = [];
    
    // Search in PARTS_BANK
    if (window.PARTS_BANK) {
      Object.keys(window.PARTS_BANK).forEach(category => {
        window.PARTS_BANK[category].forEach(part => {
          if (part.toLowerCase().includes(query.toLowerCase())) {
            suggestions.push({
              name: part,
              description: part,
              source: 'תחליפי',
              category: category
            });
          }
        });
      });
    }

    // Search in all stored results (including unselected)
    try {
      const helper = JSON.parse(localStorage.getItem('helper_data') || '{}');
      const allResults = helper.parts_search?.all_results || helper.parts_search?.results || [];
      allResults.forEach(result => {
        if ((result.name || '').toLowerCase().includes(query.toLowerCase()) ||
            (result.description || result.desc || '').toLowerCase().includes(query.toLowerCase())) {
          suggestions.push({
            name: result.name || result.description || result.desc,
            description: result.description || result.desc || result.name,
            price: result.price,
            source: result.source,
            fromSearch: true
          });
        }
      });
    } catch (e) {
      console.warn('Error loading stored results:', e);
    }

    return suggestions;
  }

  // Repairs management
  addRepair() {
    const center = this.damageCenters[this.currentCenterIndex];
    if (!center.repairs) center.repairs = [];
    
    center.repairs.push({
      name: '',
      description: '',
      cost: 0,
      hours: 0,
      type: ''
    });
    
    this.renderInterface();
    this.markUnsaved();
  }

  updateRepairField(repairIndex, field, value) {
    const center = this.damageCenters[this.currentCenterIndex];
    if (!center.repairs[repairIndex]) return;
    
    center.repairs[repairIndex][field] = (field === 'cost' || field === 'hours') ? parseFloat(value) || 0 : value;
    this.markUnsaved();
    this.calculateTotals();
  }

  removeRepair(repairIndex) {
    const center = this.damageCenters[this.currentCenterIndex];
    center.repairs.splice(repairIndex, 1);
    this.renderInterface();
    this.markUnsaved();
    this.calculateTotals();
  }

  // Works management
  addWork() {
    const center = this.damageCenters[this.currentCenterIndex];
    if (!center.works) center.works = [];
    
    center.works.push({
      type: '',
      description: '',
      cost: 0,
      required: true
    });
    
    this.renderInterface();
    this.markUnsaved();
  }

  updateWorkField(workIndex, field, value) {
    const center = this.damageCenters[this.currentCenterIndex];
    if (!center.works[workIndex]) return;
    
    if (field === 'cost') {
      center.works[workIndex][field] = parseFloat(value) || 0;
    } else if (field === 'required') {
      center.works[workIndex][field] = value;
    } else {
      center.works[workIndex][field] = value;
    }
    
    this.markUnsaved();
    this.calculateTotals();
  }

  removeWork(workIndex) {
    const center = this.damageCenters[this.currentCenterIndex];
    center.works.splice(workIndex, 1);
    this.renderInterface();
    this.markUnsaved();
    this.calculateTotals();
  }

  updateDepreciation(field, value) {
    const center = this.damageCenters[this.currentCenterIndex];
    if (!center.depreciation) center.depreciation = { percentage: 0, amount: 0, reason: '' };
    
    center.depreciation[field] = field === 'percentage' ? parseFloat(value) || 0 : value;
    this.markUnsaved();
    this.calculateTotals();
  }

  // Utility methods
  centerHasData(center) {
    return center.location || center.description || 
           (center.parts && center.parts.length > 0) ||
           (center.repairs && center.repairs.length > 0) ||
           (center.works && center.works.length > 0);
  }

  calculateTotals() {
    // Use MathEngine for consistent calculations
    const summary = MathEngine.calculateDamageSummary(this.damageCenters);
    
    this.totalCosts = {
      parts: summary.parts_total,
      repairs: summary.repairs_total,
      works: summary.works_total,
      total: summary.total_damage_amount
    };

    // Update the display
    const costSummary = document.querySelector('.cost-summary');
    if (costSummary) {
      costSummary.innerHTML = this.renderCostSummary().match(/<div class="cost-summary">(.*?)<\/div>/s)?.[1] || '';
    }
  }

  markUnsaved() {
    this.unsavedChanges = true;
    const indicator = document.getElementById('unsaved-indicator');
    if (indicator) {
      indicator.style.display = 'block';
    }
  }

  markSaved() {
    this.unsavedChanges = false;
    const indicator = document.getElementById('unsaved-indicator');
    if (indicator) {
      indicator.style.display = 'none';
    }
  }

  enableAutosave() {
    this.autosaveInterval = setInterval(() => {
      if (this.unsavedChanges) {
        this.saveAsDraft(false); // Silent save
      }
    }, 30000); // Auto-save every 30 seconds
  }

  loadStoredData() {
    try {
      const damageData = getDamageData();
      if (damageData.centers && damageData.centers.length > 0) {
        this.damageCenters = damageData.centers;
      } else if (this.damageCenters.length === 0) {
        this.damageCenters = [this.createEmptyCenter()];
      }
    } catch (e) {
      console.warn('Error loading stored data:', e);
      this.damageCenters = [this.createEmptyCenter()];
    }
  }

  saveAsDraft(showAlert = true) {
    try {
      const damageData = {
        centers: this.damageCenters,
        summary: {
          total_damage_amount: this.totalCosts.total,
          centers_count: this.damageCenters.length,
          last_updated: new Date().toISOString()
        }
      };

      syncDamageData(damageData);
      saveHelperToStorage();
      
      this.markSaved();
      
      if (showAlert) {
        alert('✅ הנתונים נשמרו בהצלחה כטיוטה');
      }
    } catch (error) {
      console.error('Error saving data:', error);
      if (showAlert) {
        alert('❌ שגיאה בשמירת הנתונים');
      }
    }
  }

  async saveAndContinue() {
    if (!this.validateData()) {
      return;
    }

    this.saveAsDraft(false);

    // Add legal disclaimer
    updateHelper('expertise', {
      summary: {
        legal_disclaimer: `כדי למנוע אי הבנה- שים לב להערות הר"מ:
יש להודיע לשמאי על כל נזק נוסף שיתגלה במהלך התיקון ולקבל אישור בכתב להוספתו.
הצעת תיקון זו כפופה לעיון בטופס התביעה.
החלקים שיפורקו מהרכב יעמדו לרשות חברת הביטוח.
הצעה זו אינה מחייבת את חברת הביטוח לתשלום כלשהו.`,
        status: 'completed',
        total_damage_amount: this.totalCosts.total
      }
    });

    // Send to webhook
    try {
      await sendToWebhook('DAMAGE_CENTERS_COMPLETED', {
        centers: this.damageCenters,
        totals: this.totalCosts,
        vehicle: this.vehicleData
      });
    } catch (error) {
      console.warn('Error sending to webhook:', error);
    }

    alert('✅ מוקדי הנזק נשמרו בהצלחה!');
    
    // Navigate to next step (assuming upload-images)
    if (window.ROUTER) {
      window.ROUTER.navigate('upload-images');
    } else {
      window.location.href = 'upload-images.html';
    }
  }

  validateData() {
    // Check if at least one center has data
    const hasValidCenters = this.damageCenters.some(center => this.centerHasData(center));
    
    if (!hasValidCenters) {
      alert('❌ יש להוסיף לפחות מוקד נזק אחד עם נתונים');
      return false;
    }

    // Check each center for required fields
    for (let i = 0; i < this.damageCenters.length; i++) {
      const center = this.damageCenters[i];
      if (this.centerHasData(center) && !center.location) {
        alert(`❌ חסר מיקום נזק במוקד ${i + 1}`);
        this.switchToCenter(i);
        return false;
      }
    }

    return true;
  }

  previewReport() {
    this.saveAsDraft(false);
    
    const reportData = {
      centers: this.damageCenters,
      totals: this.totalCosts,
      vehicle: this.vehicleData
    };
    
    const previewWindow = window.open('', '_blank');
    previewWindow.document.write(this.generatePreviewHTML(reportData));
    previewWindow.document.close();
  }

  generatePreviewHTML(data) {
    return `
      <!DOCTYPE html>
      <html dir="rtl" lang="he">
      <head>
        <meta charset="UTF-8">
        <title>תצוגה מקדימה - מוקדי נזק</title>
        <style>
          body { font-family: Arial, sans-serif; margin: 20px; direction: rtl; }
          .header { text-align: center; margin-bottom: 30px; }
          .center { margin-bottom: 25px; border: 1px solid #ddd; padding: 15px; border-radius: 8px; }
          .center h3 { color: #333; border-bottom: 2px solid #007bff; padding-bottom: 5px; }
          .items { margin: 10px 0; }
          .item { padding: 5px 0; border-bottom: 1px solid #eee; }
          .totals { background: #f8f9fa; padding: 15px; border-radius: 8px; font-weight: bold; }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>מוקדי נזק - ${data.vehicle.manufacturer} ${data.vehicle.model}</h1>
          <p>מספר רישוי: ${data.vehicle.plate}</p>
        </div>
        
        ${data.centers.map((center, i) => `
          <div class="center">
            <h3>מוקד ${i + 1}: ${center.location}</h3>
            <p><strong>תיאור:</strong> ${center.description}</p>
            
            ${center.parts && center.parts.length > 0 ? `
              <div class="items">
                <h4>חלקים:</h4>
                ${center.parts.map(part => `
                  <div class="item">${part.name} - ${part.description} (₪${part.price})</div>
                `).join('')}
              </div>
            ` : ''}
            
            ${center.repairs && center.repairs.length > 0 ? `
              <div class="items">
                <h4>תיקונים:</h4>
                ${center.repairs.map(repair => `
                  <div class="item">${repair.name} - ${repair.description} (₪${repair.cost})</div>
                `).join('')}
              </div>
            ` : ''}
            
            ${center.works && center.works.length > 0 ? `
              <div class="items">
                <h4>עבודות:</h4>
                ${center.works.map(work => `
                  <div class="item">${work.type} - ${work.description} ${work.required ? '(חובה)' : '(אופציונלי)'}</div>
                `).join('')}
              </div>
            ` : ''}
          </div>
        `).join('')}
        
        <div class="totals">
          <h3>סיכום עלויות</h3>
          <div>חלקים: ₪${data.totals.parts.toLocaleString()}</div>
          <div>תיקונים: ₪${data.totals.repairs.toLocaleString()}</div>
          <div>עבודות: ₪${data.totals.works.toLocaleString()}</div>
          <div style="border-top: 1px solid #333; margin-top: 10px; padding-top: 10px;">
            <strong>סה"כ: ₪${data.totals.total.toLocaleString()}</strong>
          </div>
        </div>
      </body>
      </html>
    `;
  }

  exportData() {
    const exportData = {
      vehicle: this.vehicleData,
      centers: this.damageCenters,
      totals: this.totalCosts,
      exported_at: new Date().toISOString()
    };

    const blob = new Blob([JSON.stringify(exportData, null, 2)], { 
      type: 'application/json' 
    });
    
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `damage_centers_${Date.now()}.json`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  // Clean up intervals to prevent memory leaks
  cleanup() {
    console.log('🧹 Cleaning up EnhancedDamageCenters intervals');
    if (this.autosaveInterval) {
      clearInterval(this.autosaveInterval);
      this.autosaveInterval = null;
    }
  }
}

// Global instance
window.damageCentersModule = null;

// Initialize module
function initEnhancedDamageCenters() {
  window.damageCentersModule = new EnhancedDamageCenters();
  window.damageCentersModule.init();
  
  // Clean up on page unload to prevent memory leaks
  window.addEventListener('beforeunload', () => {
    if (window.damageCentersModule) {
      window.damageCentersModule.cleanup();
    }
  });
}

// Auto-initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initEnhancedDamageCenters);
} else {
  initEnhancedDamageCenters();
}

export { EnhancedDamageCenters };