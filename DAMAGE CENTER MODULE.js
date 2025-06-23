// 🧱 DAMAGE CENTER MODULE
import { helper, updateHelper, saveHelperToStorage } from './helper.js';
import { ROUTER } from './router.js';

export function damageCenters() {
  const container = document.getElementById('app');
  const currentDamageBlocks = helper.damage_blocks || [];

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
        <input type="text" class="part-name" placeholder="שם חלק" value="${p.name}" />
        <input type="text" class="part-desc" placeholder="תיאור" value="${p.description}" />
        <input type="text" class="part-source" placeholder="מקור" value="${p.source}" />
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
        currentDamageBlocks[i].parts.push({ name: '', description: '', source: '' });
        renderAll();
      };
    });
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
            source: p.querySelector('.part-source').value
          })),
          works: Array.from(block.querySelectorAll('.work-item')).map(w => ({
            type: w.querySelector('.work-type').value,
            note: w.querySelector('.work-note').value
          }))
        };
      });
      updateHelper('damage_blocks', updated);

      // ⬇️ Save fixed legal disclaimer + status field to helper
      updateHelper('expertise_summary', {
        legal_disclaimer: `כדי למנוע אי הבנה- שים לב להערות הר״מ:               יש להודיע לשמאי על כל נזק נוסף שיתגלה במהלך התיקון ולקבל אישור בכתב להוספתו.
הצעת תיקון זו כפופה לעיון בטופס התביעה.
החלקים שיפורקו מהרכב יעמדו לרשות חברת הביטוח.
הצעה זו אינה מחייבת את חברת הביטוח לתשלום כלשהו.`,
        status: ''
      });

      saveHelperToStorage();
      ROUTER.navigate('next-module');
    };
  }

  renderAll();
}

ROUTER.register('damage-centers', damageCenters);
