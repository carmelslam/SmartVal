// 📦 router.js — Central Smart Router with Lifecycle + Orchestration

const ROUTER = (function () {
  const modules = {};
  let current = null;

  // 🧠 Register a module with optional rules
  function register(name, configOrFn) {
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

  return {
    register,
    init,
    autoDetectAndInit,
    onSubmit,
    onRestore,
    getCurrentModule,
    list: () => Object.keys(modules)
  };
})();

window.ROUTER = ROUTER;

// 🔌 Register all known modules (with metadata rules where needed)
ROUTER.register('expertise-builder', { label: 'Expertise Builder', init: () => console.log('🧱 Expertise Builder started') });
ROUTER.register('estimate-builder', {
  label: 'Estimate Builder',
  requires: ['expertise-builder', 'levi-report'],
  init: () => console.log('📐 Estimate Builder started')
});
ROUTER.register('final-report', {
  label: 'Final Report',
  requires: ['draft-builder'],
  optional: ['estimate-builder'],
  validate: () => console.log('✅ Final Report validation passed'),
  init: () => console.log('📄 Final Report started')
});

// 🔄 Submodules
ROUTER.register('damage-centers', () => console.log('🔧 Damage Centers started'));
ROUTER.register('upload-images', () => console.log('📷 Upload Images initialized'));
ROUTER.register('invoice-summary', () => console.log('🧾 Invoice Summary initialized'));
ROUTER.register('depreciation', () => console.log('📉 Depreciation module initialized'));
ROUTER.register('parts-search', () => console.log('🔍 Parts search active'));
ROUTER.register('general-info', () => console.log('📋 General Info loaded'));
ROUTER.register('manual-details', () => console.log('📘 Manual Details ready'));
ROUTER.register('report-type-selector', () => console.log('📊 Report type selection loaded'));

// 🔐 Access Panels
ROUTER.register('admin-panel', () => console.log('🔐 Admin Panel opened'));
ROUTER.register('dev-panel', () => console.log('🛠️ Dev Panel initialized'));

// ⚙️ Auto-start
document.addEventListener('DOMContentLoaded', () => ROUTER.autoDetectAndInit());
