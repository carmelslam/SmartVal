// 🧱 DAMAGE CENTER MODULE - Enhanced with Parts Search Integration
import { helper, updateHelper, saveHelperToStorage, getDamageData, syncDamageData } from './helper.js';
import { ROUTER } from './router.js';
import { PARTS_BANK } from './parts.js';

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
            cost: r.querySelector('.repair-cost').value
          })),
          parts: Array.from(block.querySelectorAll('.part-item')).map(p => ({
            name: p.querySelector('.part-name').value,
            description: p.querySelector('.part-desc').value,
            source: p.querySelector('.part-source').value,
            price: parseFloat(p.querySelector('.part-price').value) || 0
          })),
          works: Array.from(block.querySelectorAll('.work-item')).map(w => ({
            type: w.querySelector('.work-type').value,
            note: w.querySelector('.work-note').value
          }))
        };
      });
      // Update using synchronized data flow
      syncDamageData({ centers: updated });

      // ⬇️ Save fixed legal disclaimer + status field to helper

      updateHelper('expertise', {
        summary: {
          legal_disclaimer: `כדי למנוע אי הבנה- שים לב להערות הר״מ:
יש להודיע לשמאי על כל נזק נוסף שיתגלה במהלך התיקון ולקבל אישור בכתב להוספתו.
הצעת תיקון זו כפופה לעיון בטופס התביעה.
החלקים שיפורקו מהרכב יעמדו לרשות חברת הביטוח.
הצעה זו אינה מחייבת את חברת הביטוח לתשלום כלשהו.`,
          status: ''
        }
      });

      saveHelperToStorage();
      ROUTER.navigate('upload-images');
    };
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
  
  // Search in PARTS_BANK
  if (window.PARTS_BANK) {
    Object.keys(window.PARTS_BANK).forEach(category => {
      window.PARTS_BANK[category].forEach(part => {
        if (part.toLowerCase().includes(query.toLowerCase())) {
          suggestions.push({
            name: part,
            description: category,
            source: 'מקורי'
          });
        }
      });
    });
  }
  
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
    const helper = JSON.parse(localStorage.getItem('helper_data') || '{}');
    const allResults = helper.parts_search?.all_results || helper.parts_search?.results || [];
    
    if (allResults.length === 0) {
      alert('לא נמצאו תוצאות חיפוש לייבוא');
      return;
    }
    
    // Show selection dialog for importing specific results
    const selectedResults = allResults.filter((result, index) => {
      return confirm(`האם לייבא: ${result.name || result.description || `חלק ${index + 1}`}?`);
    });
    
    if (selectedResults.length === 0) {
      alert('לא נבחרו חלקים לייבוא');
      return;
    }
    
    const center = currentDamageBlocks[centerIndex];
    if (!center.parts) center.parts = [];
    
    selectedResults.forEach(result => {
      center.parts.push({
        name: result.name || result.description || result.desc || '',
        description: result.description || result.desc || result.name || '',
        source: result.source || 'תחליפי',
        price: parseFloat(result.price) || 0
      });
      
      // Mark as selected in helper
      result.selected = true;
      result.used_in_center = centerIndex;
    });
    
    // Update helper with selection status
    localStorage.setItem('helper_data', JSON.stringify(helper));
    
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

window.importSearchResults = importSearchResults;
window.removePart = removePart;

ROUTER.register('damage-centers', damageCenters);
