// 🧱 DAMAGE CENTER MODULE - Enhanced with Parts Search Integration
import { helper, updateHelper, saveHelperToStorage, getDamageData, syncDamageData } from './helper.js';
import { ROUTER } from './router.js';
import { PARTS_BANK } from './parts.js';
import { MathEngine } from './math.js';

// Enhanced parts search integration with helper.parts_search structure
function getPartsSearchData() {
  return window.helper?.parts_search || {
    selected_parts: [],
    unselected_parts: [],
    global_parts_bank: { all_parts: [] },
    current_session: { results: [] }
  };
}

function updatePartsSearchData(section, data) {
  if (!window.helper.parts_search) {
    window.helper.parts_search = {
      selected_parts: [],
      unselected_parts: [],
      global_parts_bank: { all_parts: [] },
      current_session: { results: [] },
      case_search_history: [],
      case_summary: {
        total_searches: 0,
        total_results: 0,
        selected_count: 0,
        unselected_count: 0,
        last_search: '',
        estimated_total_cost: 0
      }
    };
  }
  
  updateHelper('parts_search', { [section]: data });
}

// Webhook response capture for parts search
function capturePartsWebhookResponse(webhookData, searchContext = {}) {
  console.log('🔗 Capturing parts webhook response for damage centers:', webhookData);
  
  const partsData = getPartsSearchData();
  
  // Add to current session results
  if (webhookData.results && Array.isArray(webhookData.results)) {
    partsData.current_session.results = webhookData.results;
    partsData.current_session.search_query = searchContext.query || '';
    partsData.current_session.timestamp = new Date().toISOString();
    partsData.current_session.vehicle_context = searchContext.vehicle || {};
    
    // Add to global parts bank
    webhookData.results.forEach(part => {
      const partEntry = {
        ...part,
        id: `part_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        added_date: new Date().toISOString(),
        source_webhook: true,
        vehicle_context: searchContext.vehicle || {},
        case_context: {
          plate: window.helper?.vehicle?.plate || '',
          case_id: window.helper?.case_info?.case_id || ''
        }
      };
      
      partsData.global_parts_bank.all_parts.push(partEntry);
    });
    
    // Update search history
    partsData.case_search_history.push({
      timestamp: new Date().toISOString(),
      query: searchContext.query || '',
      results_count: webhookData.results.length,
      method: 'webhook_response',
      damage_center_context: searchContext.damageCenter || null
    });
    
    // Update summary
    partsData.case_summary.total_searches++;
    partsData.case_summary.total_results += webhookData.results.length;
    partsData.case_summary.last_search = new Date().toISOString();
    
    updatePartsSearchData('webhook_captured', partsData);
  }
  
  return webhookData;
}

// Cache for parts suggestions - built once, reused
let partsCache = null;
function buildPartsCache() {
  if (partsCache) return partsCache;
  
  partsCache = [];
  if (window.PARTS_BANK) {
    Object.keys(window.PARTS_BANK).forEach(category => {
      window.PARTS_BANK[category].forEach(part => {
        partsCache.push({
          name: part,
          description: category,
          source: 'מקורי',
          searchText: part.toLowerCase()
        });
      });
    });
  }
  return partsCache;
}

export function damageCenters() {
  const container = document.getElementById('app');
  const damageData = getDamageData();
  const currentDamageBlocks = damageData.centers || [];

  function renderDamageCenter(index) {
    const center = currentDamageBlocks[index] || { center: '', description: '', repairs: [], parts: [], works: [] };

    const renderRepairs = center.repairs.map((r, i) => `
      <div class="repair-item">
        <input type="text" class="repair-name" placeholder="שם תיקון" value="${r.name}" />
        <input type="text" class="repair-desc" placeholder="תיאור" value="${r.description}" />
        <input type="text" class="repair-cost" placeholder="עלות" value="${r.cost}" />
      </div>
    `).join('');

    const renderParts = center.parts.map((p, i) => `
      <div class="part-item">
        <input type="text" class="part-name" placeholder="שם חלק" value="${p.name}" data-suggestions="true" />
        <input type="text" class="part-desc" placeholder="תיאור" value="${p.description}" />
        <input type="text" class="part-source" placeholder="מקור" value="${p.source}" />
        <input type="number" class="part-price" placeholder="מחיר" value="${p.price || ''}" />
        <button class="remove-part" onclick="removePart(${index}, ${i})">🗑️</button>
      </div>
    `).join('');

    const renderWorks = center.works.map((w, i) => `
      <div class="work-item">
        <select class="work-type">
          <option ${w.type === 'עבודות צבע' ? 'selected' : ''}>עבודות צבע</option>
          <option ${w.type === 'עבודות חשמל' ? 'selected' : ''}>עבודות חשמל</option>
          <option ${w.type === 'עבודות מכונאות' ? 'selected' : ''}>עבודות מכונאות</option>
          <option ${w.type === 'עבודות מזגן' ? 'selected' : ''}>עבודות מזגן</option>
          <option ${w.type === 'עבודות ריפוד' ? 'selected' : ''}>עבודות ריפוד</option>
          <option ${w.type === 'עבודות זגגות' ? 'selected' : ''}>עבודות זגגות</option>
          <option ${w.type === 'איטום וזיפות' ? 'selected' : ''}>איטום וזיפות</option>
          <option ${w.type === 'בדיקת מתלה' ? 'selected' : ''}>בדיקת מתלה</option>
          <option ${w.type === 'הנזק מחייב תקנה 309' ? 'selected' : ''}>הנזק מחייב תקנה 309</option>
          <option ${w.type === 'כיול רדאר' ? 'selected' : ''}>כיול רדאר</option>
          <option ${w.type === 'העברת חיישנים' ? 'selected' : ''}>העברת חיישנים</option>
          <option ${w.type === 'אחר' ? 'selected' : ''}>אחר</option>
        </select>
        <input type="text" class="work-note" placeholder="הערה" value="${w.note}" />
      </div>
    `).join('');

    return `
      <div class="damage-block" data-index="${index}">
        <h3>מוקד נזק ${index + 1}</h3>
        <label>מוקד נזק:
          <select class="center-label">
            <option value="">בחר</option>
            <option>חזית</option><option>קדמי ימין</option><option>ימין קדמי</option><option>ימין</option>
            <option>אחורי ימין</option><option>ימין אחורי</option><option>אחורי</option><option>אחורי שמאל</option>
            <option>שמאל אחורי</option><option>שמאל</option><option>שמאל קדמי</option><option>קדמי שמאל</option>
            <option>סביב הרכב</option><option>פנים הרכב</option><option>מיכאני</option><option>אחר</option>
          </select>
        </label>

        <label>תיאור נזק:
          <textarea class="center-description">${center.description}</textarea>
        </label>

        <div class="repairs">${renderRepairs}</div>
        <button class="add-repair">➕ הוסף תיקון</button>

        <div class="parts">${renderParts}</div>
        <button class="add-part">➕ הוסף חלק</button>
        <button class="import-search-parts" onclick="importSearchResults(${index})">📋 ייבא מתוצאות חיפוש</button>

        <div class="works">${renderWorks}</div>
        <button class="add-work">➕ הוסף עבודה</button>
      </div>
    `;
  }

  function renderAll() {
    container.innerHTML = `
      <div class="module">
        <h2>מרכזי נזק</h2>
        <div id="damage-centers">
          ${currentDamageBlocks.map((_, i) => renderDamageCenter(i)).join('')}
        </div>
        <button id="add-damage-block">➕ הוסף מוקד נזק</button>
        <button id="save-damages">שמור והמשך</button>
      </div>
    `;

    document.querySelector('#add-damage-block').onclick = () => {
      currentDamageBlocks.push({ center: '', description: '', repairs: [], parts: [], works: [] });
      renderAll();
    };

    document.querySelectorAll('.add-repair').forEach((btn, i) => {
      btn.onclick = () => {
        currentDamageBlocks[i].repairs.push({ name: '', description: '', cost: '' });
        renderAll();
      };
    });
    document.querySelectorAll('.add-part').forEach((btn, i) => {
      btn.onclick = () => {
        currentDamageBlocks[i].parts.push({ name: '', description: '', source: '', price: 0 });
        renderAll();
      };
    });
    
    // Add parts search suggestions
    setupPartsSuggestions();
    document.querySelectorAll('.add-work').forEach((btn, i) => {
      btn.onclick = () => {
        currentDamageBlocks[i].works.push({ type: '', note: '' });
        renderAll();
      };
    });

    document.querySelector('#save-damages').onclick = () => {
      const updated = Array.from(document.querySelectorAll('.damage-block')).map(block => {
        return {
          center: block.querySelector('.center-label').value,
          description: block.querySelector('.center-description').value,
          repairs: Array.from(block.querySelectorAll('.repair-item')).map(r => ({
            name: r.querySelector('.repair-name').value,
            description: r.querySelector('.repair-desc').value,
            cost: parseFloat(r.querySelector('.repair-cost').value) || 0
          })),
          parts: Array.from(block.querySelectorAll('.part-item')).map(p => ({
            name: p.querySelector('.part-name').value,
            description: p.querySelector('.part-desc').value,
            source: p.querySelector('.part-source').value,
            price: parseFloat(p.querySelector('.part-price').value) || 0
          })),
          works: Array.from(block.querySelectorAll('.work-item')).map(w => ({
            type: w.querySelector('.work-type').value,
            note: w.querySelector('.work-note').value,
            cost: parseFloat(w.querySelector('.work-cost')?.value) || 0
          }))
        };
      });
      
      // Update using synchronized data flow
      syncDamageData({ centers: updated });

      // Calculate final totals using math engine
      const finalTotals = calculateAllCentersTotals();
      
      // Update damage assessment summary
      const damageData = getDamageData();
      damageData.summary.total_damage_amount = finalTotals.total;
      damageData.summary.assessment_notes = `סיכום אוטומטי: ${finalTotals.centerCount} מוקדי נזק בסך ${finalTotals.formatted.total}`;
      syncDamageData(damageData);

      // ⬇️ Save fixed legal disclaimer + status field to helper
      updateHelper('expertise', {
        summary: {
          legal_disclaimer: `כדי למנוע אי הבנה- שים לב להערות הר״מ:
יש להודיע לשמאי על כל נזק נוסף שיתגלה במהלך התיקון ולקבל אישור בכתב להוספתו.
הצעת תיקון זו כפופה לעיון בטופס התביעה.
החלקים שיפורקו מהרכב יעמדו לרשות חברת הביטוח.
הצעה זו אינה מחייבת את חברת הביטוח לתשלום כלשהו.`,
          status: `הושלם - ${finalTotals.centerCount} מוקדי נזק`,
          total_amount: finalTotals.total,
          calculation_timestamp: new Date().toISOString()
        }
      });

      saveHelperToStorage();
      
      // Show completion summary
      alert(`✅ נשמרו ${finalTotals.centerCount} מוקדי נזק\nסה"כ: ${finalTotals.formatted.total}`);
      
      ROUTER.navigate('upload-images');
    };
    
    // Setup auto-calculation system
    setupAutoCalculation();
  }

  renderAll();
}

// Parts search integration functions
function setupPartsSuggestions() {
  document.querySelectorAll('input[data-suggestions="true"]').forEach(input => {
    input.addEventListener('input', function() {
      const query = this.value;
      if (query.length > 2) {
        showPartsSuggestions(this, query);
      }
    });
  });
}

function showPartsSuggestions(input, query) {
  const suggestions = getPartsSuggestions(query);
  
  // Remove existing suggestions
  const existingSuggestions = document.querySelector('.parts-suggestions');
  if (existingSuggestions) {
    existingSuggestions.remove();
  }
  
  if (suggestions.length > 0) {
    const suggestionsList = document.createElement('div');
    suggestionsList.className = 'parts-suggestions';
    suggestionsList.style.cssText = `
      position: absolute;
      background: white;
      border: 1px solid #ddd;
      border-radius: 4px;
      max-height: 200px;
      overflow-y: auto;
      z-index: 1000;
      box-shadow: 0 2px 5px rgba(0,0,0,0.2);
    `;
    
    suggestions.slice(0, 10).forEach(suggestion => {
      const item = document.createElement('div');
      item.className = 'suggestion-item';
      item.style.cssText = 'padding: 8px; cursor: pointer; border-bottom: 1px solid #eee;';
      item.textContent = `${suggestion.name} - ${suggestion.description || ''}`;
      
      item.addEventListener('click', () => {
        input.value = suggestion.name;
        const partItem = input.closest('.part-item');
        if (partItem) {
          const descInput = partItem.querySelector('.part-desc');
          const sourceInput = partItem.querySelector('.part-source');
          const priceInput = partItem.querySelector('.part-price');
          
          if (descInput) descInput.value = suggestion.description || '';
          if (sourceInput) sourceInput.value = suggestion.source || '';
          if (priceInput) priceInput.value = suggestion.price || '';
        }
        suggestionsList.remove();
      });
      
      suggestionsList.appendChild(item);
    });
    
    input.parentNode.style.position = 'relative';
    input.parentNode.appendChild(suggestionsList);
  }
}

function getPartsSuggestions(query) {
  const suggestions = [];
  const queryLower = query.toLowerCase();
  
  // Search in cached PARTS_BANK (much faster)
  const cache = buildPartsCache();
  cache.forEach(part => {
    if (part.searchText.includes(queryLower)) {
      suggestions.push({
        name: part.name,
        description: part.description,
        source: part.source
      });
    }
  });
  
  // Search in all stored search results (including unselected)
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
          source: result.source || 'תחליפי',
          fromAllResults: true
        });
      }
    });
  } catch (e) {
    console.warn('Error loading stored search results:', e);
  }
  
  return suggestions;
}

function importSearchResults(centerIndex) {
  try {
    const partsData = getPartsSearchData();
    
    // Get all available parts from multiple sources
    const availableParts = [
      ...partsData.current_session.results || [],
      ...partsData.global_parts_bank.all_parts || [],
      ...partsData.unselected_parts || []
    ];
    
    if (availableParts.length === 0) {
      alert('לא נמצאו תוצאות חיפוש לייבוא');
      return;
    }
    
    // Enhanced selection dialog with part details
    const selectedResults = availableParts.filter((part, index) => {
      const partName = part.name || part.description || part.desc || `חלק ${index + 1}`;
      const partPrice = part.price ? ` - ₪${part.price}` : '';
      const partSource = part.source ? ` (${part.source})` : '';
      return confirm(`האם לייבא: ${partName}${partPrice}${partSource}?`);
    });
    
    if (selectedResults.length === 0) {
      alert('לא נבחרו חלקים לייבוא');
      return;
    }
    
    const center = currentDamageBlocks[centerIndex];
    if (!center.parts) center.parts = [];
    
    selectedResults.forEach(result => {
      const newPart = {
        name: result.name || result.description || result.desc || '',
        description: result.description || result.desc || result.name || '',
        source: result.source || 'תחליפי',
        price: parseFloat(result.price) || 0,
        part_id: result.id || `part_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        selected_date: new Date().toISOString(),
        damage_center_id: centerIndex
      };
      
      center.parts.push(newPart);
      
      // Add to selected_parts in helper.parts_search
      partsData.selected_parts.push({
        ...newPart,
        selected_for_center: centerIndex,
        case_context: {
          plate: window.helper?.vehicle?.plate || '',
          case_id: window.helper?.case_info?.case_id || ''
        }
      });
      
      // Remove from unselected_parts if it exists there
      const unselectedIndex = partsData.unselected_parts.findIndex(p => 
        p.id === result.id || (p.name === result.name && p.price === result.price)
      );
      if (unselectedIndex !== -1) {
        partsData.unselected_parts.splice(unselectedIndex, 1);
      }
    });
    
    // Update parts search summary
    partsData.case_summary.selected_count = partsData.selected_parts.length;
    partsData.case_summary.unselected_count = partsData.unselected_parts.length;
    partsData.case_summary.estimated_total_cost = partsData.selected_parts.reduce(
      (sum, part) => sum + (parseFloat(part.price) || 0), 0
    );
    
    // Save updated parts data
    updatePartsSearchData('import_completed', partsData);
    
    // Update damage assessment integration
    const damageData = getDamageData();
    damageData.integrations.parts_search.linked_searches.push({
      timestamp: new Date().toISOString(),
      action: 'import_to_center',
      center_index: centerIndex,
      parts_count: selectedResults.length,
      total_cost: selectedResults.reduce((sum, part) => sum + (parseFloat(part.price) || 0), 0)
    });
    damageData.integrations.parts_search.last_sync = new Date().toISOString();
    
    syncDamageData(damageData);
    renderAll();
    alert(`✅ יובאו ${selectedResults.length} חלקים מתוצאות החיפוש`);
  } catch (e) {
    console.error('Error importing search results:', e);
    alert('שגיאה בייבוא תוצאות החיפוש');
  }
}

function removePart(centerIndex, partIndex) {
  currentDamageBlocks[centerIndex].parts.splice(partIndex, 1);
  renderAll();
}

// Enhanced calculation functions using math engine
function calculateCenterTotals(center) {
  if (!center) return { subtotal: 0, vat: 0, total: 0 };
  
  const partsTotal = MathEngine.calculatePartsTotal(center.parts || []);
  const repairsTotal = MathEngine.calculateRepairsTotal(center.repairs || []);
  const worksTotal = MathEngine.calculateWorksTotal(center.works || []);
  
  const subtotal = MathEngine.round(partsTotal + repairsTotal + worksTotal);
  const vatAmount = MathEngine.calculateVatAmount(subtotal);
  const total = MathEngine.round(subtotal + vatAmount);
  
  return {
    parts: partsTotal,
    repairs: repairsTotal,
    works: worksTotal,
    subtotal,
    vat: vatAmount,
    total,
    formatted: {
      parts: MathEngine.formatCurrency(partsTotal),
      repairs: MathEngine.formatCurrency(repairsTotal),
      works: MathEngine.formatCurrency(worksTotal),
      subtotal: MathEngine.formatCurrency(subtotal),
      vat: MathEngine.formatCurrency(vatAmount),
      total: MathEngine.formatCurrency(total)
    }
  };
}

function calculateAllCentersTotals() {
  const damageData = getDamageData();
  const centers = damageData.centers || [];
  
  let totalSubtotal = 0;
  let totalVat = 0;
  let totalParts = 0;
  let totalRepairs = 0;
  let totalWorks = 0;
  
  centers.forEach(center => {
    const calculations = calculateCenterTotals(center);
    totalParts += calculations.parts;
    totalRepairs += calculations.repairs;
    totalWorks += calculations.works;
    totalSubtotal += calculations.subtotal;
    totalVat += calculations.vat;
  });
  
  const grandTotal = MathEngine.round(totalSubtotal + totalVat);
  
  return {
    breakdown: {
      parts: totalParts,
      repairs: totalRepairs,
      works: totalWorks
    },
    subtotal: totalSubtotal,
    vat: totalVat,
    total: grandTotal,
    centerCount: centers.length,
    formatted: {
      breakdown: {
        parts: MathEngine.formatCurrency(totalParts),
        repairs: MathEngine.formatCurrency(totalRepairs),
        works: MathEngine.formatCurrency(totalWorks)
      },
      subtotal: MathEngine.formatCurrency(totalSubtotal),
      vat: MathEngine.formatCurrency(totalVat),
      total: MathEngine.formatCurrency(grandTotal)
    }
  };
}

// Auto-calculation trigger for real-time updates
function triggerAutoCalculation() {
  const damageData = getDamageData();
  const totals = calculateAllCentersTotals();
  
  // Update damage assessment totals
  damageData.totals = {
    all_centers_subtotal: totals.subtotal,
    all_centers_vat: totals.vat,
    all_centers_total: totals.total,
    breakdown: totals.breakdown,
    last_calculated: new Date().toISOString(),
    calculation_method: 'auto_math_engine'
  };
  
  // Update statistics
  damageData.statistics.total_centers = totals.centerCount;
  damageData.statistics.avg_cost_per_center = totals.centerCount > 0 ? 
    MathEngine.round(totals.total / totals.centerCount) : 0;
  
  syncDamageData(damageData);
  
  // Trigger UI updates
  updateCalculationDisplays(totals);
  
  return totals;
}

// Update calculation displays in UI
function updateCalculationDisplays(totals) {
  // Update main summary display
  const summaryElement = document.querySelector('.calculation-summary');
  if (summaryElement) {
    summaryElement.innerHTML = `
      <div class="calculation-row">
        <span>חלקים:</span>
        <span>${totals.formatted.breakdown.parts}</span>
      </div>
      <div class="calculation-row">
        <span>תיקונים:</span>
        <span>${totals.formatted.breakdown.repairs}</span>
      </div>
      <div class="calculation-row">
        <span>עבודות:</span>
        <span>${totals.formatted.breakdown.works}</span>
      </div>
      <div class="calculation-row">
        <span>סכום ביניים:</span>
        <span>${totals.formatted.subtotal}</span>
      </div>
      <div class="calculation-row">
        <span>מע"מ (18%):</span>
        <span>${totals.formatted.vat}</span>
      </div>
      <div class="calculation-row">
        <span>סה"כ:</span>
        <span>${totals.formatted.total}</span>
      </div>
    `;
  }
  
  // Update individual center displays
  document.querySelectorAll('.damage-block').forEach((block, index) => {
    const damageData = getDamageData();
    const center = damageData.centers?.[index];
    if (center) {
      const centerTotals = calculateCenterTotals(center);
      const centerSummary = block.querySelector('.center-summary');
      if (centerSummary) {
        centerSummary.innerHTML = `
          <div class="center-total">סה"כ מוקד: ${centerTotals.formatted.total}</div>
        `;
      }
    }
  });
}

// Event listeners for automatic calculation
function setupAutoCalculation() {
  // Add event listeners to all input fields that affect calculations
  document.addEventListener('input', (e) => {
    if (e.target.matches('.part-price, .repair-cost, .work-cost, .parts-quantity')) {
      // Debounce calculation updates
      clearTimeout(window.calculationTimer);
      window.calculationTimer = setTimeout(() => {
        triggerAutoCalculation();
      }, 500);
    }
  });
  
  // Trigger initial calculation
  setTimeout(() => {
    triggerAutoCalculation();
  }, 1000);
}

// Export functions for global access
window.importSearchResults = importSearchResults;
window.removePart = removePart;
window.capturePartsWebhookResponse = capturePartsWebhookResponse;
window.getPartsSearchData = getPartsSearchData;
window.updatePartsSearchData = updatePartsSearchData;
window.calculateCenterTotals = calculateCenterTotals;
window.calculateAllCentersTotals = calculateAllCentersTotals;
window.triggerAutoCalculation = triggerAutoCalculation;

// Export for module usage
export { damageCenters, capturePartsWebhookResponse, getPartsSearchData, updatePartsSearchData };

ROUTER.register('damage-centers', damageCenters);
