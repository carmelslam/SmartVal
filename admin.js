// admin.js — Developer Control Panel Logic with user + override extensions

import { sendToWebhook } from './webhook.js';

const AdminPanel = {
  state: {
    users: {},
    overrideFlags: {
      allowEmptyDepreciation: false,
      allowDraftExport: false,
      unlockFinalReportWithoutInvoice: false
    }
  },

  init() {
    this.vatInput = document.getElementById('vat-input');
    this.legalBlocks = document.querySelectorAll('[data-vault-type]');
    this.saveBtn = document.getElementById('save-admin-settings');
    this.previewBtn = document.getElementById('preview-legal');
    this.previewOutput = document.getElementById('legal-preview');

    const savedVAT = localStorage.getItem('globalVAT');
    if (savedVAT) this.vatInput.value = savedVAT;

    // optional: load state from localStorage or webhook if needed

    this.saveBtn.addEventListener('click', () => this.save());
    this.previewBtn.addEventListener('click', () => this.preview());
  },

  save() {
    try {
      const vatRate = parseFloat(this.vatInput.value || '17');
      
      // Save VAT locally only (no webhook needed)
      localStorage.setItem('globalVAT', vatRate);
      sessionStorage.setItem('globalVAT', vatRate);

      // Save legal text blocks locally
      const vault = {};
      this.legalBlocks.forEach(block => {
        const type = block.dataset.vaultType;
        vault[type] = block.value.trim();
      });
      
      // Store legal texts in localStorage
      localStorage.setItem('legalTexts', JSON.stringify(vault));
      sessionStorage.setItem('legalTexts', JSON.stringify(vault));

      alert('🧾 שמירת נתונים בוצעה בהצלחה.');
    } catch (error) {
      console.error('Error saving admin settings:', error);
      alert(`❌ שגיאה בשמירת הגדרות: ${error.message}`);
    }
  },

  preview() {
    const selected = document.querySelector('[data-vault-type].active');
    if (!selected) return alert('בחר סוג בלוק להצגה');

    const content = selected.value.trim();
    this.previewOutput.innerHTML = content
      .replace(/%שווי_שוק%/g, '84,000 ₪')
      .replace(/%שווי_פיצוי%/g, '22,450 ₪')
      .replace(/%אחוז_נזק%/g, '37.1%')
      .replace(/%ירידת_ערך%/g, '5,400 ₪')
      .replace(/%שווי_מחירון%/g, '91,000 ₪')
      .replace(/%שווי_נטו%/g, '70,200 ₪')
      .replace(/%ימי_מוסך%/g, '4');
  },

  // --- User Management ---

  async hashPassword(password) {
    const data = new TextEncoder().encode(password);
    const buf = await crypto.subtle.digest('SHA-256', data);
    return Array.from(new Uint8Array(buf))
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');
  },

  async addUser(email, password) {
    const hashed = await this.hashPassword(password);
    this.state.users[email] = {
      password: hashed,
      created_at: new Date().toISOString()
    };
  },

  async updatePassword(email, newPassword) {
    if (this.state.users[email]) {
      const hashed = await this.hashPassword(newPassword);
      this.state.users[email].password = hashed;
    }
  },

  async verifyPassword(email, password) {
    const user = this.state.users[email];
    if (!user) return false;
    const hashed = await this.hashPassword(password);
    return hashed === user.password;
  },

  deleteUser(email) {
    delete this.state.users[email];
  },

  // --- Override Flags ---

  setOverride(flagName, value) {
    if (flagName in this.state.overrideFlags) {
      this.state.overrideFlags[flagName] = value;
    }
  },

  getOverride(flagName) {
    return this.state.overrideFlags[flagName];
  }
};

window.adminPanel = AdminPanel;
document.addEventListener('DOMContentLoaded', () => AdminPanel.init());

console.log('✅ admin.js loaded with override and user management logic');