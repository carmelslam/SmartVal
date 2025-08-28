// vault-loader.js — Legal Text Vault Loader

class VaultLoader {
  constructor() {
    this.vaultTexts = {};
    this.loadDefaultTexts();
  }

  loadDefaultTexts() {
    // Load default legal texts from the legal texts vault
    this.vaultTexts = {
      "private": {
        "title": "חוות דעת פרטית",
        "legal_basis": "חוות דעת זו ניתנת בהתאם לבקשתכם ומבוססת על בדיקה ויזואלית של הרכב.",
        "intellectual": "זכויות היוצרים על חוות דעת זו שמורות לירון כיוף שמאות.",
        "assessor_intro": "ירון כיוף, שמאי מוסמך מספר רישיון 1097",
        "assessor_qual": "שמאי מוסמך עם ותק של מעל 15 שנה בתחום הערכת נזקי רכב.",
        "legal_summary": "סיכום משפטי לחוות דעת פרטית",
        "legal_declaration": "הצהרה משפטית סטנדרטית",
        "attachments": "<strong>לוטה</strong><br>תצלומי הרכב הניזוק<br>חשבוניות תיקון<br>ערך רכב ממוחשב<br>צילום רישיון הרכב<br>חשכ\"ט"
      },
      "global": {
        "title": "חוות דעת גלובאלי",
        "text": "בהתאם לבקשה סיכמנו את חוות דעתנו בטרם קבלת חשבנות התיקון, (גלובאלי).\n\nהערכת הנזקים אינה כוללת נזקים בלתי נראים מראש העלולים להתגלות במהלך פירוק.\n\nמחירי החלפים נבדקו על ידינו בתוכנת מולטיקט חלפים.\n\nערך הרכב המצויין לעיל בהתאם למחירון ואינו מתייחס למקוריות הרכב בעבר וארוע תאונתי.\n\nמאחר ובעלי הרכב מעוניין בתיקון רכבו בכוחות עצמו, ובתאום עם בעלי הרכב. התביעה הנ\"ל נסגירה על בסיס גלובאלי בסך %שווי_פיצוי% ש\"ח כולל מע\"מ. את הרכב יתקנו הבעלים בכוחות עצמם.\n\nחוות דעתינו כוללת סעיף י\"ע בשיעור %ירידת_ערך%% מערך הרכב המצויין לעיל בגין הפגיעה באירוע הנדון.\n\nאושר מע\"מ בהתאם לפסקי דין רלוונטיים.\n\nהערכתנו מתייחסת לנזקים כפי שהוצגו בפנינו, ולנסיבות המקרה כפי שתוארו לנו ע\"י בעל הרכב אשר לדבריו.\n\nלטענת בעל הרכב %מספר_מוקדים% מוקדי הנזק מאירוע הנדון.\n\nאנו מערכים שהיית הרכב במוסך לצורך תיקונים בכ %ימי_מוסך% ימים.",
        "attachments": "<strong>לוטה</strong><br>תצלומי הרכב הניזוק<br>חשבוניות תיקון<br>ערך רכב ממוחשב<br>צילום רישיון הרכב<br>חשכ\"ט"
      },
      "total_loss": {
        "title": "חוות דעת טוטלוסט",
        "text": "חוות דעתינו בוצעה בטרם בוצעו התיקונים בפועל ואינה כוללת את הנזקים הסמויים בשלב זה של הבדיקה.\n\nבהתאם לבדיקתנו הנזק ברכב הדון הינו מעל 60% מערך הרכב, ובהתאם לתקנות התעבורה סעיף 9 לצו הפיקוח על המצרכים והשירותים סעיף ב, הוכרז הרכב הנ\"ל כניזוק ב \"אובדן גמור (טוטאלוס)\".\n\nמאחר וערך הנזק הראשוני הינו מעל 60% מערך הרכב הנ\"ל, ואין כל כדאיות כלכלית ו/או בטיחותית בתיקון הרכב, לכן הרכב הוכרז כניזוק ב \"אובדן גמור (טוטאלוס)\" ויועד לפירוק בלבד.\n\nרשיון הרכב בוטל על ידי משרדינו בהתאם להנחיית משרד התחבורה.\n\nשרידי הרכב לפירוק הוערכו על ידינו בסך %שווי_שרידים% ש\"ח.\n\nמחירי החלפים נבדקו על ידינו בתוכנת מולטיקט חלפים.\n\nאנו ממלצים לפצות את המבוטח על בסיס אובדן גמור (טוטאלוס).\n\nרשיון הרכב בצירוף טופס 587 נשלח למשרד הרישוי. שרדי הרכב נשארו בידי המבוטח לפירוק בלבד.\n\nבדיקותינו העלו כי מספר השלדה אשר נבדק על ידנו ברכב תואם רישיון הרכב.",
        "attachments": "<strong>לוטה</strong><br>תצלומי הרכב הניזוק<br>חשבוניות תיקון<br>ערך רכב ממוחשב<br>צילום רישיון הרכב<br>חשכ\"ט"
      },
      "damaged_sale": {
        "title": "מכירה מצבו הניזוק",
        "text": "בהתאם לבקשה סיכמנו את חוות דעתנו בטרם תיקון הרכב, זאת בהתייחסות לעוצמת הפגיעה נמכר הרכב במצבו הניזוק.\n\nהרכב נמכר ע\"י בעליו.\n\nהרכב במצבו הניזוק נמכר בסך %מחיר_מכירה% ש\"ח, %שיטת_תשלום%. מצורף זיכרון דברים בין שני הצדדים, והעברת בעלות.\n\nערך הרכב המצוין לעיל בהתאם למחירון ואינו מתייחס למקוריות הרכב בעבר ואירוע תאונתי.\n\nמחירי החלפים נבדקו על ידינו בתוכנת מולטיקט חלפים.\n\nהערכת הנזקים אינה כוללת נזקים בלתי נראים מראש העלולים להתגלות במהלך הפירוק.\n\nמצו\"ב צילום זיכרון דברים בגין מכירת הרכב.\n\nירידת ערך צפויה לרכב הנ\"ל %ירידת_ערך%% מערך הרכב הנ\"ל באירוע הנדון.\n\nאנו מערכים את משך שהיית הרכב במוסך לצורך תיקונים ב / כ %ימי_מוסך% ימי עבודה.",
        "attachments": "<strong>לוטה</strong><br>תצלומי הרכב הניזוק<br>חשבוניות תיקון<br>ערך רכב ממוחשב<br>צילום רישיון הרכב<br>חשכ\"ט"
      },
      "estimate_אובדן_להלכה": {
        "title": "אומדן ראשוני - אובדן להלכה",
        "text": "ערך הרכב המצויין לעיל בהתאם למחירון ואינו מתייחס למקוריות הרכב בעבר וארוע תאונתי.\n\nהצעה זו אינה סופית ויתכן שינויים במהלך תיקון הרכב.\n\nהערכתנו מתייחסת לנזקים כפי שהוצגו בפנינו, ולנסיבות המקרה כפי שתוארו לנו ע\"י בעל הרכב אשר לדבריו.\n\nקוד דגם רישיון הרכב נבדק בהתאם לטבלת המרה של לוי יצחק ונמצא %קוד_דגם%.\n\nאחוז הנזק ברכב הנ\"ל הוא %אחוז_נזק% מערך הרכב.\n\nהצעה זו אינה כוללת נזקים בלתי נראים מראש העלולים להתגלות במהלך פירוק ו/או תיקון.\n\nלהערכתינו ירידת ערך צפויה כ %ירידת_ערך% מערך הרכב הנ\"ל מאירוע הנדון.\n\nלטענת בעל הרכב %מוקדי_נזק% מוקדי הנזק מאירוע הנדון.\n\nלאור היקף הנזקים אנו ממלצים לסלק את התביעה הנ\"ל על בסיס \"אובדן להלכה\" ללא תיקון בפועל.\n\nלהערכתינו זמן השהייה במוסך לצורך תיקון %ימי_מוסך% ימי עבודה.",
        "attachments": "<strong>לוטה</strong><br>תצלומי הרכב הניזוק<br>אומדן ראשוני<br>ערך רכב ממוחשב<br>צילום רישיון הרכב<br>חשכ\"ט"
      },
      "estimate_טוטלוס": {
        "title": "אומדן ראשוני - טוטלוס",
        "text": "חוות דעתינו מתבצעת בטרם תיקונים בפועל ואינה כוללת נזקים סמויים.\n\nבהתאם לבדיקה הנזק ברכב מוערך ביותר מ-60% מערך הרכב, ומשכך הרכב מסווג כטוטלוס.\n\nערך הרכב המחושב לפי מחירון לוי יצחק: %שווי_רכב%.\n\nשווי השרידים: %שווי_שרידים%.\n\nניכוי ירידת ערך: %ירידת_ערך%\n\nהערכת נזקים מבוססת על הנתונים שנמסרו ע\"י בעל הרכב, אשר לדבריו.\n\nהצהרה: אני החת\"מ: ירון כיוף, תעודת שמאי מס' 1097. הנני נותן את חוות דעתי זו במקום עדות בשבועה בבית משפט. הדין של חוות דעת זו הוא כדין עדות בשבועה.",
        "attachments": "<strong>לוטה</strong><br>תצלומי הרכב הניזוק<br>אומדן ראשוני<br>ערך רכב ממוחשב<br>צילום רישיון הרכב<br>חשכ\"ט"
      },
      "intellectual_property": "כל הזכויות במסמך זה שמורות לירון כיוף שמאות. אין לשכפל, להעתיק או להפיץ מסמך זה ללא אישור בכתב מהשמאי.",
      "assessor_introduction": "ירון כיוף, שמאי מוסמך מספר רישיון 1097, בעל ותק של מעל 15 שנה בתחום הערכת נזקי רכב ורכוש.",
      "assessor_qualifications": "השכלה מקצועית בתחום השמאות, חבר בלשכת השמאים, עובר השתלמויות מקצועיות רציפות.",
      "fees_desclaimer": {
        "text": "שכר שמאי לפי זמן המושקע בתיק (שעת עבודה (placeholder)\n\nהוצאות משרד על פי תחשיב יועץ מס (נסיעות לפי \"חשב\")\n\nחשבון זה אינו מהווה חשבונית מס.\n\nחשבונית מס תומצא לאחר קבלת התשלום.\n\nפטור מלא מניכוי מס במקור\n========================================================================\nחוות דעת זו הינה רכושה הבלעדי של \"ירון כיוף שמאות\", חל איסור מוחלט לבצע בו כל שימוש, באם לא שולם מלוא התמורה וזו נפרעה בפועל בגינו.\n\nחל איסור מוחלט להעתיק, לצלם, למסור או לעשות שימוש בדו\"ח זה, או בחלק ממנו למי שאינו מוסמך ורשאי לכך, לרבות באם לא שילם את התמורה כאמור.\n========================================================================"
      }
    };
  }

  // Load custom texts from dev configuration
  async loadCustomTexts() {
    try {
      const devConfig = localStorage.getItem('dev_system_config');
      if (devConfig) {
        const config = JSON.parse(devConfig);
        if (config.text_overrides && config.text_overrides.enabled) {
          const customTexts = config.text_overrides.custom_texts;
          
          // Override default texts with custom ones
          if (customTexts.private_expert) {
            this.vaultTexts.private.text = customTexts.private_expert;
          }
          if (customTexts.estimate_loss) {
            this.vaultTexts.estimate_אובדן_להלכה.text = customTexts.estimate_loss;
          }
          if (customTexts.estimate_total) {
            this.vaultTexts.estimate_טוטלוס.text = customTexts.estimate_total;
          }
          if (customTexts.global_expert) {
            this.vaultTexts.global.text = customTexts.global_expert;
          }
          if (customTexts.total_loss) {
            this.vaultTexts.total_loss.text = customTexts.total_loss;
          }
          if (customTexts.damaged_sale) {
            this.vaultTexts.damaged_sale.text = customTexts.damaged_sale;
          }
        }
      }
    } catch (error) {
      console.error('Error loading custom texts:', error);
    }
  }

  // Get text by key
  getText(key, subkey = 'text') {
    if (this.vaultTexts[key] && this.vaultTexts[key][subkey]) {
      return this.vaultTexts[key][subkey];
    }
    return '';
  }

  // Get all texts for a specific type
  getTextBlock(type) {
    return this.vaultTexts[type] || {};
  }

  // Replace placeholders in text
  fillPlaceholders(text, replacements) {
    if (!text || typeof text !== 'string') return '';
    
    return text.replace(/%([^%]+)%/g, (match, key) => {
      return replacements[key] !== undefined ? replacements[key] : match;
    });
  }

  // Update text dynamically
  updateText(key, subkey, newText) {
    if (!this.vaultTexts[key]) {
      this.vaultTexts[key] = {};
    }
    this.vaultTexts[key][subkey] = newText;
  }

  // Export vault for backup
  exportVault() {
    return JSON.stringify(this.vaultTexts, null, 2);
  }

  // Import vault from backup
  importVault(vaultData) {
    try {
      const parsed = JSON.parse(vaultData);
      this.vaultTexts = { ...this.vaultTexts, ...parsed };
      return true;
    } catch (error) {
      console.error('Error importing vault:', error);
      return false;
    }
  }

  // Initialize vault and expose globally
  async init() {
    await this.loadCustomTexts();
    window.vaultTexts = this.vaultTexts;
    window.vaultLoader = this;
    return this.vaultTexts;
  }
}

// Create and initialize vault loader
const vaultLoader = new VaultLoader();

// Auto-initialize when DOM is ready
document.addEventListener('DOMContentLoaded', async () => {
  await vaultLoader.init();
  console.log('✅ Vault loader initialized with legal texts');
});

// Convenience function for loading legal text
export function loadLegalText(key, subkey = 'text') {
  return vaultLoader.getText(key, subkey);
}

// Export for module use
export { VaultLoader, vaultLoader };
export default vaultLoader;