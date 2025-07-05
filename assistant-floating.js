// System-wide floating assistant with modern UX accessibility
(function() {
  'use strict';

  // Prevent multiple instantiations
  if (window.assistantFloatingInitialized) return;
  window.assistantFloatingInitialized = true;

  // Assistant configuration
  const assistantConfig = {
    position: { bottom: '20px', right: '20px' },
    zIndex: 9997,
    hotkey: 'F1',
    autoHide: true,
    contextualHelp: true
  };

  // Create floating assistant button and interface
  function createFloatingAssistant() {
    // Create main floating button
    const floatingBtn = document.createElement('button');
    floatingBtn.id = 'assistantFloatingBtn';
    floatingBtn.setAttribute('aria-label', 'פתח עוזר מערכת - נגישות F1');
    floatingBtn.setAttribute('role', 'button');
    floatingBtn.setAttribute('tabindex', '0');
    
    floatingBtn.style.cssText = `
      position: fixed;
      bottom: ${assistantConfig.position.bottom};
      right: ${assistantConfig.position.right};
      width: 60px;
      height: 60px;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      border: none;
      border-radius: 50%;
      cursor: pointer;
      z-index: ${assistantConfig.zIndex};
      box-shadow: 0 4px 20px rgba(0,0,0,0.3);
      transition: all 0.3s ease;
      font-size: 24px;
      color: white;
      display: flex;
      align-items: center;
      justify-content: center;
      outline: none;
    `;

    floatingBtn.innerHTML = '🤖';
    
    // Hover and focus effects
    floatingBtn.addEventListener('mouseenter', () => {
      floatingBtn.style.transform = 'scale(1.1)';
      floatingBtn.style.boxShadow = '0 6px 25px rgba(0,0,0,0.4)';
    });
    
    floatingBtn.addEventListener('mouseleave', () => {
      floatingBtn.style.transform = 'scale(1)';
      floatingBtn.style.boxShadow = '0 4px 20px rgba(0,0,0,0.3)';
    });

    floatingBtn.addEventListener('focus', () => {
      floatingBtn.style.outline = '3px solid #667eea';
    });

    floatingBtn.addEventListener('blur', () => {
      floatingBtn.style.outline = 'none';
    });

    // Click handler
    floatingBtn.addEventListener('click', openAssistantModal);
    
    // Keyboard accessibility
    floatingBtn.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        openAssistantModal();
      }
    });

    document.body.appendChild(floatingBtn);
  }

  // Create assistant modal interface
  function createAssistantModal() {
    const modal = document.createElement('div');
    modal.id = 'assistantModal';
    modal.setAttribute('role', 'dialog');
    modal.setAttribute('aria-labelledby', 'assistantTitle');
    modal.setAttribute('aria-describedby', 'assistantDescription');
    modal.setAttribute('aria-modal', 'true');
    
    modal.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(0,0,0,0.7);
      z-index: ${assistantConfig.zIndex + 1};
      display: none;
      justify-content: center;
      align-items: center;
      backdrop-filter: blur(5px);
    `;

    const modalContent = document.createElement('div');
    modalContent.style.cssText = `
      background: white;
      border-radius: 16px;
      padding: 30px;
      max-width: 600px;
      width: 90%;
      max-height: 80vh;
      overflow-y: auto;
      box-shadow: 0 20px 60px rgba(0,0,0,0.3);
      direction: rtl;
      font-family: 'Assistant', Arial, sans-serif;
      position: relative;
    `;

    modalContent.innerHTML = `
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
        <h2 id="assistantTitle" style="margin: 0; color: #2c3e50; font-size: 24px;">עוזר המערכת</h2>
        <button id="closeAssistant" aria-label="סגור עוזר" style="background: none; border: none; font-size: 24px; cursor: pointer; color: #666; padding: 0; width: 30px; height: 30px; display: flex; align-items: center; justify-content: center; border-radius: 50%; transition: background-color 0.2s;">×</button>
      </div>
      
      <div id="assistantDescription" style="margin-bottom: 20px; color: #666; font-size: 14px;">
        שאל שאלה או בקש עזרה בכל נושא הקשור למערכת השמאות
      </div>

      <div id="assistantTabs" style="display: flex; margin-bottom: 20px; border-bottom: 1px solid #e1e8ed;">
        <button class="assistant-tab active" data-tab="help" style="flex: 1; padding: 10px; border: none; background: none; cursor: pointer; border-bottom: 2px solid #667eea; color: #667eea; font-weight: bold;">עזרה כללית</button>
        <button class="assistant-tab" data-tab="contextual" style="flex: 1; padding: 10px; border: none; background: none; cursor: pointer; border-bottom: 2px solid transparent; color: #666;">עזרה בדף זה</button>
        <button class="assistant-tab" data-tab="shortcuts" style="flex: 1; padding: 10px; border: none; background: none; cursor: pointer; border-bottom: 2px solid transparent; color: #666;">קיצורי דרך</button>
      </div>

      <div id="assistantContent">
        <div id="helpTab" class="assistant-tab-content">
          <div style="margin-bottom: 15px;">
            <h3 style="color: #667eea; margin-bottom: 10px;">שאלות נפוצות</h3>
            <div class="faq-item" style="margin-bottom: 10px; padding: 10px; background: #f8f9fa; border-radius: 8px; cursor: pointer;" onclick="showAnswer('general')">
              <strong>איך אני פותח תיק חדש?</strong>
            </div>
            <div class="faq-item" style="margin-bottom: 10px; padding: 10px; background: #f8f9fa; border-radius: 8px; cursor: pointer;" onclick="showAnswer('levi')">
              <strong>איך אני מעלה דו"ח לוי יצחק?</strong>
            </div>
            <div class="faq-item" style="margin-bottom: 10px; padding: 10px; background: #f8f9fa; border-radius: 8px; cursor: pointer;" onclick="showAnswer('validation')">
              <strong>איך מאמתים דו"ח סופי?</strong>
            </div>
          </div>
          
          <div style="margin-top: 20px;">
            <input type="text" id="assistantQuery" placeholder="שאל שאלה..." style="width: 100%; padding: 12px; border: 1px solid #ddd; border-radius: 8px; font-size: 14px; box-sizing: border-box;" />
            <button id="askAssistant" style="width: 100%; margin-top: 10px; padding: 12px; background: #667eea; color: white; border: none; border-radius: 8px; cursor: pointer; font-size: 16px;">שאל את העוזר</button>
          </div>
        </div>

        <div id="contextualTab" class="assistant-tab-content" style="display: none;">
          <div id="contextualHelp">
            <!-- Contextual help content will be populated dynamically -->
          </div>
        </div>

        <div id="shortcutsTab" class="assistant-tab-content" style="display: none;">
          <h3 style="color: #667eea; margin-bottom: 15px;">קיצורי מקלדת</h3>
          <div style="font-family: monospace; font-size: 14px;">
            <div style="margin-bottom: 8px;"><strong>F1</strong> - פתח עוזר המערכת</div>
            <div style="margin-bottom: 8px;"><strong>Ctrl + S</strong> - שמור נתונים</div>
            <div style="margin-bottom: 8px;"><strong>Ctrl + Enter</strong> - שלח טופס</div>
            <div style="margin-bottom: 8px;"><strong>Esc</strong> - סגור חלונות קופצים</div>
            <div style="margin-bottom: 8px;"><strong>Tab</strong> - נווט בין שדות</div>
            <div style="margin-bottom: 8px;"><strong>Shift + Tab</strong> - נווט לאחור</div>
          </div>
        </div>
      </div>

      <div id="assistantResponse" style="margin-top: 20px; padding: 15px; background: #f0f8ff; border-radius: 8px; display: none;">
        <div id="responseContent"></div>
      </div>
    `;

    modal.appendChild(modalContent);
    document.body.appendChild(modal);

    // Add event listeners for modal
    setupModalEventListeners(modal);
  }

  function setupModalEventListeners(modal) {
    // Close button
    const closeBtn = modal.querySelector('#closeAssistant');
    closeBtn.addEventListener('click', closeAssistantModal);
    
    // Close on escape key
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && modal.style.display === 'flex') {
        closeAssistantModal();
      }
    });

    // Close on backdrop click
    modal.addEventListener('click', (e) => {
      if (e.target === modal) {
        closeAssistantModal();
      }
    });

    // Tab switching
    const tabs = modal.querySelectorAll('.assistant-tab');
    tabs.forEach(tab => {
      tab.addEventListener('click', () => switchTab(tab.dataset.tab));
    });

    // Ask assistant button
    const askBtn = modal.querySelector('#askAssistant');
    const queryInput = modal.querySelector('#assistantQuery');
    
    askBtn.addEventListener('click', handleAssistantQuery);
    queryInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        handleAssistantQuery();
      }
    });

    // Generate contextual help when modal opens
    generateContextualHelp();
  }

  function switchTab(tabName) {
    // Update tab buttons
    const tabs = document.querySelectorAll('.assistant-tab');
    tabs.forEach(tab => {
      if (tab.dataset.tab === tabName) {
        tab.classList.add('active');
        tab.style.borderBottomColor = '#667eea';
        tab.style.color = '#667eea';
        tab.style.fontWeight = 'bold';
      } else {
        tab.classList.remove('active');
        tab.style.borderBottomColor = 'transparent';
        tab.style.color = '#666';
        tab.style.fontWeight = 'normal';
      }
    });

    // Update content visibility
    const contents = document.querySelectorAll('.assistant-tab-content');
    contents.forEach(content => {
      content.style.display = 'none';
    });

    const activeContent = document.getElementById(tabName + 'Tab');
    if (activeContent) {
      activeContent.style.display = 'block';
    }
  }

  function generateContextualHelp() {
    const contextualDiv = document.getElementById('contextualHelp');
    const currentPage = getCurrentPageContext();
    
    let helpContent = `<h3 style="color: #667eea; margin-bottom: 15px;">עזרה עבור: ${currentPage.title}</h3>`;
    helpContent += `<p style="margin-bottom: 15px;">${currentPage.description}</p>`;
    
    if (currentPage.tips && currentPage.tips.length > 0) {
      helpContent += '<h4 style="color: #667eea; margin-bottom: 10px;">טיפים שימושיים:</h4>';
      helpContent += '<ul style="margin-right: 20px;">';
      currentPage.tips.forEach(tip => {
        helpContent += `<li style="margin-bottom: 5px;">${tip}</li>`;
      });
      helpContent += '</ul>';
    }

    contextualDiv.innerHTML = helpContent;
  }

  function getCurrentPageContext() {
    const path = window.location.pathname;
    const filename = path.split('/').pop();
    
    const pageContexts = {
      'index.html': {
        title: 'דף הבית',
        description: 'זהו דף הכניסה למערכת. כאן אתה מתחבר עם הסיסמה שלך.',
        tips: ['וודא שהסיסמה נכונה', 'השתמש בכפתור "זכור אותי" לנוחות']
      },
      'selection.html': {
        title: 'דף בחירת פעולות',
        description: 'כאן אתה בוחר את הפעולה שתרצה לבצע במערכת.',
        tips: ['לחץ על הכפתור המתאים לפעולה שתרצה לבצע', 'ניתן לחזור לדף זה בכל עת']
      },
      'open-cases.html': {
        title: 'פתיחת תיק חדש',
        description: 'טופס לפתיחת תיק חדש עבור רכב שנפגע.',
        tips: ['מלא את כל השדות הנדרשים', 'מספר הרכב חייב להיות מדויק', 'בחר תאריך נכון']
      },
      'general_info.html': {
        title: 'פרטים כלליים',
        description: 'מילוי פרטי הרכב והנזק הבסיסיים.',
        tips: ['מלא את פרטי הבעלים במדויק', 'וודא שפרטי הביטוח נכונים', 'שמור לפני המעבר הבא']
      },
      'upload-levi.html': {
        title: 'העלאת דו"ח לוי יצחק',
        description: 'העלה את דו"ח לוי יצחק לעיבוד OCR.',
        tips: ['וודא שהקובץ ברור וקריא', 'פורמט PDF מועדף', 'המתן לסיום העיבוד']
      },
      'depreciation-module.html': {
        title: 'מודול ירידת ערך',
        description: 'חישוב ירידת ערך ויצירת דו"ח סופי.',
        tips: ['בדוק את חישובי ירידת הערך', 'בחר את סוג חוות הדעת הנכון', 'שמור לפני סיום']
      },
      'validation-workflow.html': {
        title: 'אימות דו"ח סופי',
        description: 'תהליך אימות הדו"ח הסופי לפני שליחה.',
        tips: ['עבור על כל הסעיפים', 'אמת כל מידע לפני אישור סופי', 'לא ניתן לשנות אחרי אישור']
      }
    };

    return pageContexts[filename] || {
      title: 'דף לא מזוהה',
      description: 'מידע עזרה כללי עבור המערכת.',
      tips: ['השתמש בתפריט הראשי לניווט', 'שמור את העבודה שלך באופן קבוע']
    };
  }

  async function handleAssistantQuery() {
    const query = document.getElementById('assistantQuery').value.trim();
    if (!query) return;

    const responseDiv = document.getElementById('assistantResponse');
    const responseContent = document.getElementById('responseContent');
    
    // Show loading state
    responseDiv.style.display = 'block';
    responseContent.innerHTML = '<div style="text-align: center;"><div style="display: inline-block; width: 20px; height: 20px; border: 3px solid #f3f3f3; border-top: 3px solid #667eea; border-radius: 50%; animation: spin 1s linear infinite;"></div> מחפש תשובה...</div>';

    try {
      // In a real implementation, this would call the assistant webhook
      // For now, provide basic contextual responses
      const response = await getAssistantResponse(query);
      responseContent.innerHTML = `<strong>תשובה:</strong><br>${response}`;
    } catch (error) {
      responseContent.innerHTML = `<strong style="color: red;">שגיאה:</strong> לא ניתן לקבל תשובה כרגע. נסה שוב מאוחר יותר.`;
    }
  }

  async function getAssistantResponse(query) {
    // Basic pattern matching for common queries
    const lowercaseQuery = query.toLowerCase();
    
    if (lowercaseQuery.includes('תיק') || lowercaseQuery.includes('פתיחה')) {
      return 'לפתיחת תיק חדש: 1) לחץ על "פתיחת תיק חדש" בדף הבחירה 2) מלא את פרטי הרכב 3) בחר תאריך הנזק 4) לחץ "פתח תיק"';
    }
    
    if (lowercaseQuery.includes('לוי') || lowercaseQuery.includes('דוח')) {
      return 'להעלאת דו"ח לוי יצחק: 1) לחץ על "העלאת דו"ח לוי יצחק" 2) בחר קובץ PDF או תמונה 3) המתן לעיבוד OCR 4) בדוק שהמידע נקרא נכון';
    }
    
    if (lowercaseQuery.includes('אימות') || lowercaseQuery.includes('סופי')) {
      return 'לאימות דו"ח סופי: 1) וודא שכל המידע מלא ונכון 2) עבור דרך כל שלבי האימות 3) אשר כל סעיף 4) לחץ "אישור סופי"';
    }
    
    if (lowercaseQuery.includes('שמירה') || lowercaseQuery.includes('שמור')) {
      return 'המערכת שומרת אוטומטית את העבודה שלך. תמיד לחץ "שמור" לפני מעבר בין דפים. השתמש ב-Ctrl+S לשמירה מהירה.';
    }
    
    // Default response
    return 'שאלתך התקבלה. למידע נוסף, עיין במדריך המשתמש או פנה לתמיכה הטכנית.';
  }

  window.showAnswer = function(type) {
    const responseDiv = document.getElementById('assistantResponse');
    const responseContent = document.getElementById('responseContent');
    
    const answers = {
      general: 'לפתיחת תיק חדש: לחץ על "פתיחת תיק חדש" בדף הבחירה, מלא את פרטי הרכב והנזק, ולחץ "פתח תיק".',
      levi: 'להעלאת דו"ח לוי יצחק: לחץ על "העלאת דו"ח לוי יצחק", בחר קובץ PDF או תמונה, והמתן לעיבוד האוטומטי.',
      validation: 'לאימות דו"ח סופי: עבור דרך כל שלבי האימות, בדוק שכל המידע נכון, ולחץ "אישור סופי".'
    };
    
    responseDiv.style.display = 'block';
    responseContent.innerHTML = `<strong>תשובה:</strong><br>${answers[type]}`;
  };

  function openAssistantModal() {
    const modal = document.getElementById('assistantModal');
    if (!modal) {
      createAssistantModal();
      return openAssistantModal();
    }
    
    modal.style.display = 'flex';
    
    // Focus management for accessibility
    const firstFocusable = modal.querySelector('button, input, [tabindex]');
    if (firstFocusable) {
      firstFocusable.focus();
    }

    // Generate fresh contextual help
    generateContextualHelp();
  }

  function closeAssistantModal() {
    const modal = document.getElementById('assistantModal');
    if (modal) {
      modal.style.display = 'none';
    }
    
    // Return focus to the floating button
    const floatingBtn = document.getElementById('assistantFloatingBtn');
    if (floatingBtn) {
      floatingBtn.focus();
    }
  }

  // Keyboard shortcuts
  document.addEventListener('keydown', (e) => {
    if (e.key === 'F1') {
      e.preventDefault();
      openAssistantModal();
    }
  });

  // Initialize the floating assistant when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', createFloatingAssistant);
  } else {
    createFloatingAssistant();
  }

  // Add CSS animations
  const style = document.createElement('style');
  style.textContent = `
    @keyframes spin {
      0% { transform: rotate(0deg); }
      100% { transform: rotate(360deg); }
    }
    
    .faq-item:hover {
      background: #e9ecef !important;
      transform: translateX(-2px);
      transition: all 0.2s ease;
    }
    
    #assistantFloatingBtn:focus-visible {
      outline: 3px solid #667eea;
      outline-offset: 2px;
    }
    
    .assistant-tab:focus {
      outline: 2px solid #667eea;
      outline-offset: -2px;
    }
  `;
  document.head.appendChild(style);

})();