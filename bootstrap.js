// 🚀 Bootstrap System - Centralized Initialization Manager
// Prevents race conditions and ensures proper loading order for all modules

console.log('🚀 Loading bootstrap system...');

import { StorageUtils, TimeUtils } from './helper-utils.js';

class BootstrapManager {
  constructor() {
    this.initializationQueue = [];
    this.completedModules = new Set();
    this.failedModules = new Set();
    this.dependencies = new Map();
    this.isInitialized = false;
    this.startTime = Date.now();
    
    // Track initialization progress
    this.stats = {
      totalModules: 0,
      completedModules: 0,
      failedModules: 0,
      totalTime: 0
    };
    
    console.log('🚀 Bootstrap manager initialized');
  }

  /**
   * Register a module for initialization
   */
  registerModule(moduleName, initFunction, dependencies = [], priority = 5) {
    const module = {
      name: moduleName,
      init: initFunction,
      dependencies: dependencies,
      priority: priority,
      startTime: null,
      endTime: null,
      status: 'pending'
    };
    
    this.initializationQueue.push(module);
    this.dependencies.set(moduleName, dependencies);
    this.stats.totalModules++;
    
    console.log(`📋 Registered module: ${moduleName} (priority: ${priority}, deps: [${dependencies.join(', ')}])`);
  }

  /**
   * Check if all dependencies for a module are satisfied
   */
  areDependenciesSatisfied(moduleName) {
    const deps = this.dependencies.get(moduleName) || [];
    return deps.every(dep => this.completedModules.has(dep));
  }

  /**
   * Get next module ready for initialization
   */
  getNextReadyModule() {
    return this.initializationQueue
      .filter(module => 
        module.status === 'pending' && 
        this.areDependenciesSatisfied(module.name)
      )
      .sort((a, b) => a.priority - b.priority)[0]; // Lower priority number = higher priority
  }

  /**
   * Initialize a specific module
   */
  async initializeModule(module) {
    try {
      module.status = 'initializing';
      module.startTime = Date.now();
      
      console.log(`⚡ Initializing module: ${module.name}...`);
      
      // Call the module's initialization function
      if (typeof module.init === 'function') {
        await module.init();
      } else {
        throw new Error(`Module ${module.name} has invalid init function`);
      }
      
      module.endTime = Date.now();
      module.status = 'completed';
      this.completedModules.add(module.name);
      this.stats.completedModules++;
      
      const duration = module.endTime - module.startTime;
      console.log(`✅ Module ${module.name} initialized successfully (${duration}ms)`);
      
    } catch (error) {
      module.status = 'failed';
      module.error = error;
      this.failedModules.add(module.name);
      this.stats.failedModules++;
      
      console.error(`❌ Module ${module.name} failed to initialize:`, error);
      
      // Check if this is a critical module
      if (module.priority <= 2) {
        throw new Error(`Critical module ${module.name} failed: ${error.message}`);
      }
    }
  }

  /**
   * Initialize all registered modules in dependency order
   */
  async initializeAll() {
    if (this.isInitialized) {
      console.warn('⚠️ Bootstrap already initialized');
      return;
    }

    console.log(`🚀 Starting initialization of ${this.stats.totalModules} modules...`);
    
    let remainingModules = this.initializationQueue.filter(m => m.status === 'pending');
    let lastCount = remainingModules.length;
    let stuckCounter = 0;
    
    while (remainingModules.length > 0) {
      const readyModule = this.getNextReadyModule();
      
      if (readyModule) {
        await this.initializeModule(readyModule);
        remainingModules = this.initializationQueue.filter(m => m.status === 'pending');
        stuckCounter = 0;
      } else {
        stuckCounter++;
        
        if (stuckCounter > 10) {
          console.error('❌ Bootstrap stuck - circular dependencies or missing modules:', 
            remainingModules.map(m => `${m.name} (deps: [${m.dependencies.join(', ')}])`));
          break;
        }
        
        // Wait a bit and try again
        await new Promise(resolve => setTimeout(resolve, 100));
      }
    }
    
    this.isInitialized = true;
    this.stats.totalTime = Date.now() - this.startTime;
    
    console.log(`🎉 Bootstrap completed: ${this.stats.completedModules}/${this.stats.totalModules} modules in ${this.stats.totalTime}ms`);
    
    if (this.stats.failedModules > 0) {
      console.warn(`⚠️ ${this.stats.failedModules} modules failed to initialize`);
    }
    
    // Store bootstrap stats
    StorageUtils.setSession('bootstrap_stats', this.stats);
    
    // Dispatch bootstrap complete event
    document.dispatchEvent(new CustomEvent('bootstrap:complete', {
      detail: this.stats
    }));
  }

  /**
   * Get initialization statistics
   */
  getStats() {
    return {
      ...this.stats,
      completedModules: Array.from(this.completedModules),
      failedModules: Array.from(this.failedModules),
      pendingModules: this.initializationQueue
        .filter(m => m.status === 'pending')
        .map(m => m.name)
    };
  }

  /**
   * Check if a specific module is ready
   */
  isModuleReady(moduleName) {
    return this.completedModules.has(moduleName);
  }

  /**
   * Wait for a specific module to be ready
   */
  async waitForModule(moduleName, timeout = 30000) {
    if (this.isModuleReady(moduleName)) {
      return true;
    }
    
    return new Promise((resolve, reject) => {
      const startTime = Date.now();
      
      const checkModule = () => {
        if (this.isModuleReady(moduleName)) {
          resolve(true);
        } else if (this.failedModules.has(moduleName)) {
          reject(new Error(`Module ${moduleName} failed to initialize`));
        } else if (Date.now() - startTime > timeout) {
          reject(new Error(`Timeout waiting for module ${moduleName}`));
        } else {
          setTimeout(checkModule, 100);
        }
      };
      
      checkModule();
    });
  }
}

// Create global bootstrap instance
const bootstrap = new BootstrapManager();

// ✅ REGISTER CORE MODULES with proper dependencies and priorities

// Priority 1: Critical foundation modules (no dependencies)
bootstrap.registerModule('helper-system', async () => {
  // Import and initialize helper system
  const { initHelper } = await import('./helper.js');
  if (typeof initHelper === 'function') {
    await initHelper();
  }
  console.log('📦 Helper system initialized');
}, [], 1);

bootstrap.registerModule('security-manager', async () => {
  // Import and initialize security manager
  const { securityManager } = await import('./security-manager.js');
  if (securityManager && typeof securityManager.init === 'function') {
    securityManager.init();
  }
  console.log('🔒 Security manager initialized');
}, ['helper-system'], 1);

// Priority 2: Core infrastructure (depends on helper)
bootstrap.registerModule('webhook-system', async () => {
  // Import webhook system (no explicit init needed)
  await import('./webhook.js');
  console.log('🌐 Webhook system initialized');
}, ['helper-system'], 2);

bootstrap.registerModule('validation-system', async () => {
  // Import validation system
  await import('./validation-system.js');
  console.log('✅ Validation system initialized');
}, ['helper-system'], 2);

// Priority 3: Data capture and events (depends on helper and security)
bootstrap.registerModule('helper-events', async () => {
  // Import helper events system
  await import('./helper-events.js');
  console.log('📡 Helper events system initialized');
}, ['helper-system', 'security-manager'], 3);

bootstrap.registerModule('universal-data-capture', async () => {
  // Import universal data capture
  await import('./universal-data-capture.js');
  console.log('📊 Universal data capture initialized');
}, ['helper-system', 'helper-events'], 3);

// Priority 4: Module systems (depends on core infrastructure)
bootstrap.registerModule('fee-module', async () => {
  // Import fee module if present on page
  if (document.querySelector('#fee-module') || window.location.pathname.includes('fee')) {
    await import('./fee-module.js');
    console.log('💰 Fee module initialized');
  }
}, ['helper-system', 'helper-events'], 4);

bootstrap.registerModule('parts-module', async () => {
  // Import parts module if present on page
  if (document.querySelector('#parts-search') || window.location.pathname.includes('parts')) {
    await import('./parts-module.js');
    console.log('🔧 Parts module initialized');
  }
}, ['helper-system', 'webhook-system'], 4);

bootstrap.registerModule('damage-centers', async () => {
  // Import damage centers if present on page
  if (document.querySelector('#damageCentersContent') || document.querySelector('.editable-damage-card')) {
    await import('./DAMAGE CENTER MODULE.js');
    console.log('🎯 Damage centers module initialized');
  }
}, ['helper-system', 'helper-events'], 4);

bootstrap.registerModule('car-details', async () => {
  // Import car details if present on page
  if (document.querySelector('#car-details') || window.location.pathname.includes('car-details')) {
    await import('./CAR DETAILS MODULE.js');
    console.log('🚗 Car details module initialized');
  }
}, ['helper-system', 'helper-events'], 4);

// Priority 5: Report generators (depends on all data modules)
bootstrap.registerModule('estimate-generator', async () => {
  // Import estimate generator if present
  if (document.querySelector('#estimate-form') || window.location.pathname.includes('estimate')) {
    await import('./estimate-generator.js');
    console.log('📋 Estimate generator initialized');
  }
}, ['helper-system', 'webhook-system', 'validation-system'], 5);

bootstrap.registerModule('final-report-generator', async () => {
  // Import final report generator if present
  if (window.location.pathname.includes('final-report')) {
    await import('./final_report.js');
    console.log('📄 Final report generator initialized');
  }
}, ['helper-system', 'webhook-system', 'validation-system'], 5);

// Priority 6: Admin and auxiliary systems (lowest priority)
bootstrap.registerModule('admin-system', async () => {
  // Import admin system if on admin page
  if (window.location.pathname.includes('admin')) {
    await import('./admin.js');
    console.log('👤 Admin system initialized');
  }
}, ['helper-system', 'security-manager'], 6);

bootstrap.registerModule('logging-system', async () => {
  // Import logging system
  await import('./logging-system.js');
  console.log('📝 Logging system initialized');
}, ['security-manager'], 6);

// ✅ INITIALIZE ON DOM READY
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    console.log('📄 DOM ready, starting bootstrap...');
    bootstrap.initializeAll().catch(error => {
      console.error('❌ Bootstrap initialization failed:', error);
    });
  });
} else {
  // DOM already ready
  console.log('📄 DOM already ready, starting bootstrap...');
  bootstrap.initializeAll().catch(error => {
    console.error('❌ Bootstrap initialization failed:', error);
  });
}

// Export bootstrap instance for external use
export { bootstrap };
export default bootstrap;

console.log('✅ Bootstrap system loaded and configured');