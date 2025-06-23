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
    const vatRate = parseFloat(this.vatInput.value || '17');
    localStorage.setItem('globalVAT', vatRate);

    const vault = {};
    this.legalBlocks.forEach(block => {
      const type = block.dataset.vaultType;
      vault[type] = block.value.trim();
    });

    const payload = {
      vat_rate: vatRate,
      vault_texts: vault,
      override_flags: this.state.overrideFlags,
      users: this.state.users,
      timestamp: new Date().toISOString()
    };

    sendToWebhook('DEV_ADMIN_UPDATE', payload);
    alert('🧾 שמירת נתונים בוצעה בהצלחה.');
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

  addUser(email, password) {
    this.state.users[email] = { password, created_at: new Date().toISOString() };
  },

  updatePassword(email, newPassword) {
    if (this.state.users[email]) this.state.users[email].password = newPassword;
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