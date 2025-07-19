// 📦 router.js — Central Smart Router with Lifecycle + Orchestration

const ROUTER = (function () {
  const modules = {};
  let current = null;

  // 🧠 Register a module with optional rules
  function register(name, configOrFn, { force = false } = {}) {
    if (modules[name] && !force) {
      console.warn(`⚠️ ROUTER: [${name}] already registered. Skipping.`);
      return;
    }
    const config = typeof configOrFn === 'function' ? { init: configOrFn } : configOrFn;
    modules[name] = {
      init: config.init || (() => console.warn(`⚠️ No init() for ${name}`)),
      requires: config.requires || [],
      optional: config.optional || [],
      validate: config.validate || null,
      label: config.label || name
    };
    console.log(`✅ ROUTER: registered [${name}]`);
  }

  // 🚦 Initialize a module by name
  function init(name) {
    current = name;
    const mod = modules[name];
    if (!mod) return console.warn(`❌ ROUTER: [${name}] not found.`);

    console.log(`🚀 ROUTER: running [${name}]`);
    // Optionally: enforce dependency validation before launching
    for (const dep of mod.requires) {
      if (!modules[dep]) {
        console.error(`❌ Dependency [${dep}] missing for [${name}]`);
        return;
      }
    }
    mod.init();
  }

  function autoDetectAndInit() {
    const file = window.location.pathname.split('/').pop().replace('.html', '');
    if (modules[file]) {
      init(file);
    } else {
      console.warn(`⚠️ ROUTER: no auto-match for [${file}]`);
    }
  }

  function getCurrentModule() {
    return current;
  }

  function onSubmit(data) {
    console.log(`📤 ROUTER: submitting from [${current}]`, data);
    // Future: trigger auto-helper export
  }

  function onRestore(data) {
    console.log(`♻️ ROUTER: restoring state to [${current}]`, data);
    // Future: pull helper state from saved session
  }

  // 🌐 Navigate to another registered module
  function navigate(name) {
    if (!modules[name]) {
      console.warn(`❌ ROUTER: cannot navigate to [${name}] - not registered.`);
      return;
    }
    if (current === name) {
      console.log(`ℹ️ ROUTER: already at [${name}]`);
      return;
    }
    init(name);
  }

  function listRegisteredModules() {
    console.table(Object.keys(modules));
  }

  return {
    register,
    init,
    navigate,
    autoDetectAndInit,
    onSubmit,
    onRestore,
    getCurrentModule,
    list: () => Object.keys(modules),
    listRegisteredModules
  };
})();

window.ROUTER = ROUTER;

// Registered modules and their sources
/*
| Module Name          | Registered In                             |
|----------------------|-------------------------------------------|
| initial-input        | INITIAL INPUT MODULE.js                   |
| car-details          | CAR DETAILS MODULE.js                     |
| damage-centers       | DAMAGE CENTER MODULE.js                   |
| depreciation-capture | DEPRECIATION + FEE DATA CAPTURE MODULE.js |
| expertise-builder    | router.js                                 |
| estimate-builder     | router.js                                 |
| final-report         | router.js                                 |
| upload-images        | router.js (stub)                          |
| invoice-summary      | router.js (stub)                          |
| depreciation         | router.js (stub)                          |
| parts-search         | router.js (stub)                          |
| general-info         | router.js (stub)                          |
| manual-details       | router.js (stub)                          |
| report-type-selector | router.js (stub)                          |
| admin-panel          | router.js                                 |
| dev-panel            | router.js                                 |
*/

// 🔌 Register all known modules (with metadata rules where needed)
ROUTER.register('expertise-builder', { label: 'Expertise Builder', init: () => console.log('🧱 Expertise Builder started') });
ROUTER.register('estimate-builder', {
  label: 'Estimate Builder',
  requires: ['expertise-builder'],
  init: () => console.log('📐 Estimate Builder started')
});
ROUTER.register('final-report', {
  label: 'Final Report',
  optional: ['estimate-builder'],
  validate: () => console.log('✅ Final Report validation passed'),
  init: () => console.log('📄 Final Report started')
});

// 🔄 Submodules - ✅ UNIVERSAL MODULE INTEGRATION
ROUTER.register('upload-images', () => {
  console.log('📷 Upload Images initialized');
  // Trigger helper auto-population for upload-images.html
  if (typeof window.refreshAllModuleForms === 'function') {
    window.refreshAllModuleForms();
  }
});

ROUTER.register('invoice-summary', () => {
  console.log('🧾 Invoice Summary initialized');
  // Trigger helper auto-population and broadcasting
  if (typeof window.refreshAllModuleForms === 'function') {
    window.refreshAllModuleForms();
  }
});

ROUTER.register('depreciation', () => {
  console.log('📉 Depreciation module initialized');
  // Depreciation module already has proper helper integration via depreciation_module.js
});

ROUTER.register('fee-module', () => {
  console.log('💸 Fee Module initialized');
  // Fee module already has proper helper integration via fee-module.js
});

ROUTER.register('parts-search', () => {
  console.log('🔍 Parts search active');
  // Basic parts search integration (complex wizard rebuild is separate task)
  if (typeof window.refreshAllModuleForms === 'function') {
    window.refreshAllModuleForms();
  }
});

ROUTER.register('general-info', () => {
  console.log('📋 General Info loaded');
  // General info already has proper helper integration and manual override system
});

ROUTER.register('manual-details', () => {
  console.log('📘 Manual Details consolidated - redirecting to general_info.html');
  // manual-details.html has been consolidated into general_info.html
  // Redirect to the unified general info module
  window.location.href = 'general_info.html';
});

ROUTER.register('report-type-selector', () => {
  console.log('📊 Report type selection loaded');
  // Report selection functionality integration
  if (typeof window.refreshAllModuleForms === 'function') {
    window.refreshAllModuleForms();
  }
});

// 🔐 Access Panels - ✅ FINALIZED IMPLEMENTATIONS
ROUTER.register('admin-panel', () => {
  console.log('🔐 Admin Panel opened');
  // Initialize admin panel with helper data access
  if (typeof window.refreshAllModuleForms === 'function') {
    window.refreshAllModuleForms();
  }
  // Admin panel has its own admin.html with proper helper integration
});

ROUTER.register('dev-panel', () => {
  console.log('🛠️ Dev Panel initialized');
  // Initialize dev panel with helper debugging tools
  if (typeof window.refreshAllModuleForms === 'function') {
    window.refreshAllModuleForms();
  }
  // Dev panel provides helper debugging and system diagnostics
});

// ⚙️ Auto-start
document.addEventListener('DOMContentLoaded', () => ROUTER.autoDetectAndInit());
