// System-wide floating assistant with modern UX accessibility
(function() {
  'use strict';

  // Prevent multiple instantiations
  if (window.assistantFloatingInitialized) return;
  window.assistantFloatingInitialized = true;

  // Assistant configuration
  const assistantConfig = {
    position: { bottom: '100px', right: '20px' },
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
      width: 52px;
      height: 52px;
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
        <button class="assistant-tab active" data-tab="help" style="flex: 1; padding: 8px; border: none; background: none; cursor: pointer; border-bottom: 2px solid #667eea; color: #667eea; font-weight: bold; font-size: 13px;">עזרה כללית</button>
        <button class="assistant-tab" data-tab="contextual" style="flex: 1; padding: 8px; border: none; background: none; cursor: pointer; border-bottom: 2px solid transparent; color: #666; font-size: 13px;">עזרה בדף זה</button>
        <button class="assistant-tab" data-tab="workflow" style="flex: 1; padding: 8px; border: none; background: none; cursor: pointer; border-bottom: 2px solid transparent; color: #666; font-size: 13px;">תהליכי עבודה</button>
        <button class="assistant-tab" data-tab="shortcuts" style="flex: 1; padding: 8px; border: none; background: none; cursor: pointer; border-bottom: 2px solid transparent; color: #666; font-size: 13px;">קיצורי דרך</button>
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

        <div id="workflowTab" class="assistant-tab-content" style="display: none;">
          <h3 style="color: #667eea; margin-bottom: 15px;">תהליכי עבודה מרכזיים</h3>
          <div id="workflowDiagrams">
            
            <div class="workflow-item" style="margin-bottom: 20px; padding: 15px; background: #f8f9fa; border-radius: 12px; border-right: 4px solid #667eea;">
              <h4 style="color: #2c3e50; margin-bottom: 12px; display: flex; align-items: center; gap: 8px;">
                📋 תהליך פתיחת תיק חדש
              </h4>
              <div class="workflow-steps" style="display: flex; flex-direction: column; gap: 8px;">
                <div class="step" style="display: flex; align-items: center; gap: 10px; padding: 8px; background: white; border-radius: 8px;">
                  <span style="background: #667eea; color: white; border-radius: 50%; width: 24px; height: 24px; display: flex; align-items: center; justify-content: center; font-size: 12px; font-weight: bold;">1</span>
                  <span>דף הבחירה → "התחלת דו"ח חדש"</span>
                </div>
                <div class="step" style="display: flex; align-items: center; gap: 10px; padding: 8px; background: white; border-radius: 8px;">
                  <span style="background: #667eea; color: white; border-radius: 50%; width: 24px; height: 24px; display: flex; align-items: center; justify-content: center; font-size: 12px; font-weight: bold;">2</span>
                  <span>מילוי פרטי רכב ובעלים</span>
                </div>
                <div class="step" style="display: flex; align-items: center; gap: 10px; padding: 8px; background: white; border-radius: 8px;">
                  <span style="background: #667eea; color: white; border-radius: 50%; width: 24px; height: 24px; display: flex; align-items: center; justify-content: center; font-size: 12px; font-weight: bold;">3</span>
                  <span>פרטי ביטוח ותאריכים</span>
                </div>
                <div class="step" style="display: flex; align-items: center; gap: 10px; padding: 8px; background: #e8f5e8; border-radius: 8px;">
                  <span style="background: #22c55e; color: white; border-radius: 50%; width: 24px; height: 24px; display: flex; align-items: center; justify-content: center; font-size: 12px; font-weight: bold;">✓</span>
                  <span>שמירה ופתיחת התיק</span>
                </div>
              </div>
            </div>

            <div class="workflow-item" style="margin-bottom: 20px; padding: 15px; background: #f8f9fa; border-radius: 12px; border-right: 4px solid #f59e0b;">
              <h4 style="color: #2c3e50; margin-bottom: 12px; display: flex; align-items: center; gap: 8px;">
                📄 תהליך דו"ח לוי יצחק
              </h4>
              <div class="workflow-steps" style="display: flex; flex-direction: column; gap: 8px;">
                <div class="step" style="display: flex; align-items: center; gap: 10px; padding: 8px; background: white; border-radius: 8px;">
                  <span style="background: #f59e0b; color: white; border-radius: 50%; width: 24px; height: 24px; display: flex; align-items: center; justify-content: center; font-size: 12px; font-weight: bold;">1</span>
                  <span>העלאת קובץ PDF/תמונה</span>
                </div>
                <div class="step" style="display: flex; align-items: center; gap: 10px; padding: 8px; background: white; border-radius: 8px;">
                  <span style="background: #f59e0b; color: white; border-radius: 50%; width: 24px; height: 24px; display: flex; align-items: center; justify-content: center; font-size: 12px; font-weight: bold;">2</span>
                  <span>עיבוד OCR אוטומטי (30 שניות)</span>
                </div>
                <div class="step" style="display: flex; align-items: center; gap: 10px; padding: 8px; background: white; border-radius: 8px;">
                  <span style="background: #f59e0b; color: white; border-radius: 50%; width: 24px; height: 24px; display: flex; align-items: center; justify-content: center; font-size: 12px; font-weight: bold;">3</span>
                  <span>אימות וגם תיקון נתונים</span>
                </div>
                <div class="step" style="display: flex; align-items: center; gap: 10px; padding: 8px; background: #e8f5e8; border-radius: 8px;">
                  <span style="background: #22c55e; color: white; border-radius: 50%; width: 24px; height: 24px; display: flex; align-items: center; justify-content: center; font-size: 12px; font-weight: bold;">✓</span>
                  <span>שמירה והשלמה</span>
                </div>
              </div>
            </div>

            <div class="workflow-item" style="margin-bottom: 20px; padding: 15px; background: #f8f9fa; border-radius: 12px; border-right: 4px solid #dc2626;">
              <h4 style="color: #2c3e50; margin-bottom: 12px; display: flex; align-items: center; gap: 8px;">
                🔧 ניהול מוקדי נזק
              </h4>
              <div class="workflow-steps" style="display: flex; flex-direction: column; gap: 8px;">
                <div class="step" style="display: flex; align-items: center; gap: 10px; padding: 8px; background: white; border-radius: 8px;">
                  <span style="background: #dc2626; color: white; border-radius: 50%; width: 24px; height: 24px; display: flex; align-items: center; justify-content: center; font-size: 12px; font-weight: bold;">1</span>
                  <span>הגדרת מוקדי נזק</span>
                </div>
                <div class="step" style="display: flex; align-items: center; gap: 10px; padding: 8px; background: white; border-radius: 8px;">
                  <span style="background: #dc2626; color: white; border-radius: 50%; width: 24px; height: 24px; display: flex; align-items: center; justify-content: center; font-size: 12px; font-weight: bold;">2</span>
                  <span>הוספת חלקים ומחירים</span>
                </div>
                <div class="step" style="display: flex; align-items: center; gap: 10px; padding: 8px; background: white; border-radius: 8px;">
                  <span style="background: #dc2626; color: white; border-radius: 50%; width: 24px; height: 24px; display: flex; align-items: center; justify-content: center; font-size: 12px; font-weight: bold;">3</span>
                  <span>עבודות תיקון ושעות</span>
                </div>
                <div class="step" style="display: flex; align-items: center; gap: 10px; padding: 8px; background: #e8f5e8; border-radius: 8px;">
                  <span style="background: #22c55e; color: white; border-radius: 50%; width: 24px; height: 24px; display: flex; align-items: center; justify-content: center; font-size: 12px; font-weight: bold;">✓</span>
                  <span>חישוב אוטומטי סה"כ</span>
                </div>
              </div>
            </div>

            <div class="workflow-item" style="margin-bottom: 20px; padding: 15px; background: #f8f9fa; border-radius: 12px; border-right: 4px solid #7c3aed;">
              <h4 style="color: #2c3e50; margin-bottom: 12px; display: flex; align-items: center; gap: 8px;">
                ✅ אימות דו"ח סופי
              </h4>
              <div class="workflow-steps" style="display: flex; flex-direction: column; gap: 8px;">
                <div class="step" style="display: flex; align-items: center; gap: 10px; padding: 8px; background: white; border-radius: 8px;">
                  <span style="background: #7c3aed; color: white; border-radius: 50%; width: 24px; height: 24px; display: flex; align-items: center; justify-content: center; font-size: 12px; font-weight: bold;">1</span>
                  <span>בדיקת שלמות כל המודולים</span>
                </div>
                <div class="step" style="display: flex; align-items: center; gap: 10px; padding: 8px; background: white; border-radius: 8px;">
                  <span style="background: #7c3aed; color: white; border-radius: 50%; width: 24px; height: 24px; display: flex; align-items: center; justify-content: center; font-size: 12px; font-weight: bold;">2</span>
                  <span>אימות נתונים וחישובים</span>
                </div>
                <div class="step" style="display: flex; align-items: center; gap: 10px; padding: 8px; background: white; border-radius: 8px;">
                  <span style="background: #7c3aed; color: white; border-radius: 50%; width: 24px; height: 24px; display: flex; align-items: center; justify-content: center; font-size: 12px; font-weight: bold;">3</span>
                  <span>תהליך אישור סופי</span>
                </div>
                <div class="step" style="display: flex; align-items: center; gap: 10px; padding: 8px; background: #e8f5e8; border-radius: 8px;">
                  <span style="background: #22c55e; color: white; border-radius: 50%; width: 24px; height: 24px; display: flex; align-items: center; justify-content: center; font-size: 12px; font-weight: bold;">✓</span>
                  <span>יצירת דו"ח PDF</span>
                </div>
              </div>
            </div>

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
    // Enhanced knowledge base with comprehensive responses
    const lowercaseQuery = query.toLowerCase();
    
    // Knowledge base structured by categories
    const knowledgeBase = {
      // File opening and case management
      caseMgmt: {
        keywords: ['תיק', 'פתיחה', 'חדש', 'תיק חדש', 'התחלה'],
        response: `לפתיחת תיק חדש:
1. בדף הבחירה, לחץ על "התחלת דו"ח חדש"
2. מלא את פרטי הרכב: מספר רכב, יצרן, דגם, שנה
3. הזן פרטי בעלים: שם, טלפון, כתובת
4. מלא פרטי ביטוח: חברה, סוכן, מספר פוליסה
5. בחר תאריך נזק ותאריך בדיקה
6. לחץ "פתח תיק" לשמירה

טיפ: וודא שמספר הרכב נכון - זה המזהה הראשי של התיק.`
      },
      
      // Levi report
      levi: {
        keywords: ['לוי', 'דוח', 'לוי יצחק', 'ocr', 'סריקה'],
        response: `להעלאת דו"ח לוי יצחק:
1. בדף הבחירה, לחץ על "העלאת דו"ח לוי יצחק"
2. לחץ על "בחר קובץ" ובחר PDF או תמונה של הדו"ח
3. המתן לעיבוד OCR (עד 30 שניות)
4. בדוק שהנתונים נקראו נכון:
   - מחיר בסיס
   - התאמות מחיר
   - מחיר סופי
5. תקן ידנית אם נדרש
6. לחץ "שמור וסיים"

פורמטים נתמכים: PDF, JPG, PNG
טיפ: וודא שהסריקה ברורה וקריאה לתוצאות מיטביות.`
      },
      
      // Damage centers
      damage: {
        keywords: ['נזק', 'מוקד', 'חלקים', 'תיקון', 'אומדן'],
        response: `לניהול מוקדי נזק:
1. בדף הבחירה, לחץ על "פתיחת מוקד נזק (אשף מלא)"
2. הגדר מוקדי נזק:
   - שם המוקד (כגון: פגוש קדמי)
   - סוג הנזק
   - תיאור מפורט
3. הוסף חלקים לכל מוקד:
   - מספר קטלוגי
   - תיאור חלק
   - מחיר
   - כמות
4. הוסף עבודות תיקון:
   - תיאור עבודה
   - שעות עבודה
   - מחיר לשעה
5. המערכת תחשב אוטומטית סה"כ לכל מוקד

טיפ: ניתן להוסיף מספר מוקדי נזק לאותו רכב.`
      },
      
      // Parts module
      parts: {
        keywords: ['חלקים', 'חיפוש', 'קטלוג', 'מחיר'],
        response: `למודול חלקים:
1. בדף הבחירה, לחץ על "מודול חלקים"
2. חפש חלקים:
   - לפי מספר קטלוגי
   - לפי תיאור
   - לפי יצרן
3. בחר חלקים מהרשימה
4. הגדר כמות לכל חלק
5. המערכת תחשב מחיר כולל

תכונות נוספות:
- השוואת מחירים בין ספקים
- היסטוריית מחירים
- חלקים חלופיים

טיפ: שמור רשימות חלקים נפוצות לשימוש חוזר.`
      },
      
      // Depreciation
      depreciation: {
        keywords: ['ירידת ערך', 'פחת', 'חישוב', 'אחוז'],
        response: `למודול ירידת ערך:
1. בדף הבחירה, לחץ על "מודול ירידת ערך"
2. בחר סוג חוות דעת:
   - פרטית
   - גלובלית
   - מכירה מצבו הניזוק
   - טוטלוסט
   - אובדן להלכה
3. הגדר מוקדי ירידת ערך:
   - החלק הניזוק
   - מהות התיקון
   - אחוז ירידת ערך
4. הוסף הפרשים אם קיימים (כולל מע"מ)
5. המערכת תחשב אוטומטית:
   - סה"כ ירידת ערך
   - פיצוי כספי
   - סה"כ כולל מע"מ

טיפ: שים לב לחישוב המע"מ האוטומטי בהפרשים.`
      },
      
      // Fee module
      fee: {
        keywords: ['שכר', 'טרחה', 'עמלה', 'תשלום'],
        response: `למודול שכר טרחה:
1. לאחר השלמת מודול ירידת ערך
2. לחץ "המשך למודול שכר טרחה"
3. הגדר:
   - אחוז שכר טרחה
   - מינימום/מקסימום
   - תוספות מיוחדות
4. המערכת תחשב אוטומטית לפי התעריף

טיפים:
- התעריף המומלץ: 10-15%
- בדוק תעריפים מיוחדים לחברות ביטוח
- שמור תבניות תעריפים לשימוש חוזר`
      },
      
      // Final report
      finalReport: {
        keywords: ['דוח סופי', 'הפקה', 'אימות', 'סיום'],
        response: `להפקת דו"ח סופי:
1. וודא שכל המודולים הושלמו:
   - פרטי רכב ובעלים
   - דו"ח לוי יצחק
   - מוקדי נזק וחלקים
   - ירידת ערך
   - שכר טרחה
2. בדף הבחירה, לחץ על "בחר דו"ח להפקה"
3. בחר "חוות דעת סופית"
4. עבור דרך תהליך האימות:
   - אמת פרטי רכב
   - אמת נתוני לוי
   - אמת מוקדי נזק
   - אמת חישובים
5. לחץ "אישור סופי ויצירת דו"ח"

חשוב: לאחר האישור הסופי לא ניתן לערוך!`
      },
      
      // Image upload
      images: {
        keywords: ['תמונות', 'צילום', 'העלאה', 'תיעוד'],
        response: `להעלאת תמונות:
1. בדף הבחירה, לחץ על "העלאת תמונות"
2. לחץ "בחר קבצים" או גרור תמונות
3. העלה עד 20 תמונות בכל פעם
4. הוסף תיאור לכל תמונה
5. סדר לפי קטגוריות:
   - נזק כללי
   - פרטי נזק
   - מסמכים
   - אחר

פורמטים: JPG, PNG, WEBP
גודל מקסימלי: 10MB לתמונה
טיפ: צלם בתאורה טובה ומזוויות שונות.`
      },
      
      // Invoice
      invoice: {
        keywords: ['חשבונית', 'קבלה', 'תשלום'],
        response: `להעלאת חשבונית:
1. בדף הבחירה, לחץ על "העלאת חשבונית"
2. מלא פרטי חשבונית:
   - מספר חשבונית
   - תאריך
   - ספק
   - סכום לפני מע"מ
   - מע"מ
   - סה"כ
3. העלה סריקה של החשבונית
4. המערכת תבצע OCR ותמלא אוטומטית
5. בדוק ותקן אם נדרש

טיפ: שמור קבלות מקור לתיעוד.`
      },
      
      // Nicole assistant
      nicole: {
        keywords: ['ניקול', 'עוזרת', 'שאלה', 'עזרה'],
        response: `ניקול - מנהלת הידע:
1. בדף הבחירה, לחץ על "שאל את ניקול"
2. הקלד שאלה או השתמש במיקרופון
3. ניקול יכולה לעזור ב:
   - הסברים על תהליכים
   - מידע על חוקים ותקנות
   - טיפים מקצועיים
   - פתרון בעיות
4. התשובות נשמרות להיסטוריה

טיפ: ניקול זמינה 24/7 ומתעדכנת תמיד!`
      },
      
      // Admin
      admin: {
        keywords: ['ניהול', 'מנהל', 'הגדרות', 'admin'],
        response: `לכניסה לניהול מערכת:
1. בדף הבחירה, לחץ על "ניהול מערכת (Admin)"
2. הזן סיסמת מנהל
3. אפשרויות ניהול:
   - צפייה בכל התיקים
   - עריכת תבניות
   - ניהול משתמשים
   - הגדרות מערכת
   - דוחות וסטטיסטיקות
   - גיבויים

הרשאה: רק למנהלים מורשים!`
      },
      
      // Saving
      save: {
        keywords: ['שמירה', 'שמור', 'גיבוי'],
        response: `שמירת נתונים:
- המערכת שומרת אוטומטית כל 30 שניות
- תמיד לחץ "שמור" לפני מעבר בין דפים
- קיצור מקלדת: Ctrl+S (או Cmd+S במק)

גיבויים:
- גיבוי אוטומטי יומי
- ניתן לשחזר עד 30 יום אחורה
- ליצוא גיבוי ידני: ניהול מערכת > גיבויים

טיפ: אל תסמוך רק על שמירה אוטומטית!`
      },
      
      // Navigation
      navigation: {
        keywords: ['ניווט', 'תפריט', 'חזרה', 'דפים'],
        response: `ניווט במערכת:
- דף הבית: כניסה למערכת
- דף בחירה: התפריט הראשי
- חזרה: כפתור "חזור" בכל דף
- יציאה: כפתור "יציאה מהמערכת"

קיצורי מקלדת:
- F1: עזרה
- Esc: סגור חלונות
- Tab: מעבר בין שדות
- Ctrl+Enter: שליחת טופס

טיפ: השתמש בפירורי לחם למעקב אחר מיקומך.`
      },
      
      // Errors
      errors: {
        keywords: ['שגיאה', 'בעיה', 'תקלה', 'לא עובד'],
        response: `פתרון בעיות נפוצות:
1. "הגישה חסומה": התחבר מחדש דרך דף הבית
2. "שדה חובה": מלא את כל השדות המסומנים ב-*
3. "שגיאת רשת": בדוק חיבור אינטרנט
4. "קובץ גדול מדי": הקטן את הקובץ מתחת ל-10MB
5. "פורמט לא נתמך": השתמש ב-PDF/JPG/PNG

לא נפתר? פנה לתמיכה:
- טלפון: 1-800-YARON
- מייל: support@yaron-appraisal.com`
      },
      
      // Integration and automation
      integration: {
        keywords: ['אוטומציה', 'make.com', 'אינטגרציה', 'וובהוק', 'API'],
        response: `על האוטומציה במערכת:
המערכת עובדת עם אוטומציות Make.com לעיבוד מידע:

🔧 תכונות אוטומטיות:
- עיבוד OCR אוטומטי לדוחות לוי יצחק
- יצירת דוחות אוטומטית
- שליחת התראות ועדכונים
- גיבוי אוטומטי של נתונים

⚡ ביצועים:
- זמן תגובה: בדרך כלל פחות מ-30 שניות
- זמינות: 24/7
- גיבוי: כל שעה

🛠️ אם יש בעיות:
1. המתן עד דקה לעיבוד
2. בדוק חיבור אינטרנט
3. רענן את הדף
4. פנה לתמיכה טכנית`
      },
      
      // Data management and backup
      backup: {
        keywords: ['גיבוי', 'שחזור', 'נתונים', 'איפוס', 'מחיקה'],
        response: `ניהול נתונים וגיבויים:

💾 גיבויים אוטומטיים:
- גיבוי שעתי של כל הנתונים
- שמירה ל-30 יום אחורה
- גיבוי לענן מאובטח

🔄 שחזור נתונים:
1. כנס לניהול מערכת (Admin)
2. לחץ על "גיבויים ושחזור"
3. בחר תאריך לשחזור
4. אשר את הפעולה

⚠️ זהירות:
- שחזור מחליף את כל הנתונים הנוכחיים
- יש לוודא שהתאריך נכון
- פעולה בלתי הפיכה לאחר אישור

📁 ייצוא נתונים:
- ניתן לייצא תיקים בפורמט PDF
- ייצוא נתונים גולמיים ב-JSON
- שמירה מקומית או ענן`
      },
      
      // Advanced features
      advanced: {
        keywords: ['מתקדם', 'אפשרויות', 'הגדרות', 'קונפיגורציה', 'התאמה אישית'],
        response: `תכונות מתקדמות במערכת:

🎯 התאמה אישית:
- תבניות דוחות מותאמות אישית
- שדות מותאמים לכל לקוח
- זיווי עלויות אוטומטי
- תעריפים מותאמים

📊 דוחות מתקדמים:
- ניתוח נתונים סטטיסטי
- דוחות תקופתיים
- השוואת מחירים
- מגמות נזקים

🔗 אינטגרציות:
- חיבור לחברות ביטוח
- סנכרון עם מוסכים
- עדכוני מחירים אוטומטיים
- יצוא לחשבשבת

⚙️ כיצד לגשת:
1. ניהול מערכת > הגדרות מתקדמות
2. בחר את התכונה הרצויה
3. עקוב אחר ההוראות
4. שמור את השינויים`
      },
      
      // Quality control
      quality: {
        keywords: ['איכות', 'בקרה', 'אימות', 'ביקורת', 'תקינות'],
        response: `בקרת איכות וחוק:

✅ בדיקות תקינות:
- אימות אוטומטי של נתונים
- בדיקת עקביות מחירים
- וולידציה של פרטי רכב
- בקרת תקינות מסמכים

📋 תהליך האימות:
1. המערכת בודקת אוטומטית כל שדה
2. מסמנת שגיאות או חוסרים
3. מציעה תיקונים אוטומטיים
4. מאפשרת אישור סופי רק אחרי תיקון

🎖️ תקני איכות:
- עמידה בתקני הביטוח הישראליים
- התאמה לדרישות רש"ת
- סיווג נזקים לפי בסיס החוק
- מחירון עדכני ומאושר

🛡️ אבטחת מידע:
- הצפנת נתונים ברמה בנקאית
- גישה מוגבלת לפי הרשאות
- מעקב אחר כל הפעולות
- גיבויים מוצפנים`
      }
    };
    
    // Search through knowledge base
    for (const [key, category] of Object.entries(knowledgeBase)) {
      for (const keyword of category.keywords) {
        if (lowercaseQuery.includes(keyword)) {
          return category.response;
        }
      }
    }
    
    // Default response with suggestions
    return `לא מצאתי תשובה ספציפית לשאלתך. הנה כמה נושאים שאני יכול לעזור בהם:
- פתיחת תיק חדש
- העלאת דו"ח לוי יצחק
- ניהול מוקדי נזק
- חישוב ירידת ערך
- הפקת דו"ח סופי
- פתרון בעיות

נסה לשאול שאלה יותר ספציפית או בחר אחד מהנושאים למעלה.`;
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