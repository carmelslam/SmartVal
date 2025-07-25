import { initializeHelperEvents } from './helper-events.js';
import { initHelper, initializeHelperUI } from './helper.js';
import { initializeEstimateEngine } from './estimate.js';
import { initializeDepreciationModule } from './depreciation_module.js';
import { initializeRouter } from './router.js';

document.addEventListener('DOMContentLoaded', () => {
  initHelper();
  initializeHelperUI();
  initializeHelperEvents();
  initializeDepreciationModule();
  initializeEstimateEngine();
  initializeRouter();
});
