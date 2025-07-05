Comprehensive System Fix Plan - UPDATED                      │ │
│ │                                                              │ │
│ │ Phase 1: Core Infrastructure Fixes (Priority: Critical)      │ │
│ │                                                              │ │
│ │ 1.1 Module Loading System                                    │ │
│ │                                                              │ │
│ │ - Fix ES6 module dependency chain across all pages           │ │
│ │ (open-cases.html, admin functions, etc.)                     │ │
│ │ - Convert problematic modules from ES6 to regular scripts    │ │
│ │ where needed                                                 │ │
│ │ - Test webhook connections end-to-end for all modules        │ │
│ │                                                              │ │
│ │ 1.2 Webhook & Authentication Integrity                       │ │
│ │                                                              │ │
│ │ - Audit all webhook calls in system (open-cases, admin,      │ │
│ │ etc.)                                                        │ │
│ │ - Fix admin validation error despite 200 response from       │ │
│ │ Make.com                                                     │ │
│ │ - Standardize error handling across all webhook calls        │ │
│ │                                                              │ │
│ │ 1.3 NEW: Module Contamination Cleanup                        │ │
│ │                                                              │ │
│ │ - Remove contaminated scripts from depreciation-module.html: │ │
│ │   - Remove: car-details-float.js, levi-floating.js,          │ │
│ │ parts-floating.js                                            │ │
│ │   - Keep only: helper-events.js, depreciation_module.js,     │ │
│ │ internal-browser.js                                          │ │
│ │ - Remove contaminated scripts from fee-module.html:          │ │
│ │   - Remove: car-details-float.js, levi-floating.js,          │ │
│ │ parts-floating.js                                            │ │
│ │   - Keep only: helper-events.js, fee-module.js,              │ │
│ │ internal-browser.js                                          │ │
│ │ - Audit all modules for similar cross-contamination issues   │ │
│ │ - Ensure module-specific functionality stays within          │ │
│ │ appropriate boundaries                                       │ │
│ │                                                              │ │
│ │ Phase 2: Math Engine Integration (Priority: High)            │ │
│ │                                                              │ │
│ │ 2.1 Math Auto-Calculation                                    │ │
│ │                                                              │ │
│ │ - Import math.js properly in depreciation-module.html and    │ │
│ │ other calculation modules                                    │ │
│ │ - Add real-time calculation triggers on input changes        │ │
│ │ - Test auto-calculation in depreciation, fee-module, and     │ │
│ │ other math-dependent modules                                 │ │
│ │                                                              │ │
│ │ Phase 3: UI/UX Improvements (Priority: High)                 │ │
│ │                                                              │ │
│ │ 3.1 Navigation & Returns                                     │ │
│ │                                                              │ │
│ │ - Add return buttons to all modules in consistent system     │ │
│ │ style                                                        │ │
│ │ - Standardize navigation patterns across pages               │ │
│ │                                                              │ │
│ │ 3.2 Feedback & Loading States                                │ │
│ │                                                              │ │
│ │ - Add loading animations for all webhook calls and long      │ │
│ │ operations                                                   │ │
│ │ - Implement success/failure messages for all submissions     │ │
│ │ - Add progress indicators for multi-step processes           │ │
│ │                                                              │ │
│ │ 3.3 Part Search Toggle Relocation                            │ │
│ │                                                              │ │
│ │ - Move part search toggle from levi module to parts search   │ │
│ │ module and/or parts required module                          │ │
│ │ - Preserve existing toggle functionality as requested        │ │
│ │ - Remove part search elements from modules where they don't  │ │
│ │ belong (depreciation, fee, etc.)                             │ │
│ │                                                              │ │
│ │ Phase 4: Internal Browser Integration (Priority: Medium)     │ │
│ │                                                              │ │
│ │ 4.1 Credentials Vault Integration                            │ │
│ │                                                              │ │
│ │ - Connect internal browsers to credentials vault.md          │ │
│ │ - Implement auto-fill functionality for known sites          │ │
│ │ - Fix levi browser errors                                    │ │
│ │                                                              │ │
│ │ 4.2 Browser Stability                                        │ │
│ │                                                              │ │
│ │ - Debug and fix internal browser error handling              │ │
│ │ - Test cross-browser compatibility                           │ │
│ │                                                              │ │
│ │ Phase 5: Assistant & Notifications (Priority: Medium)        │ │
│ │                                                              │ │
│ │ 5.1 Assistant Accessibility                                  │ │
│ │                                                              │ │
│ │ - Research best UX patterns for assistant access (floating   │ │
│ │ button vs menu)                                              │ │
│ │ - Implement modern iOS-style approach for system-wide        │ │
│ │ assistant access                                             │ │
│ │ - Add assistant navigation from appropriate system locations │ │
│ │                                                              │ │
│ │ 5.2 OneSignal Integration                                    │ │
│ │                                                              │ │
│ │ - Debug OneSignal subscription prompt after login            │ │
│ │ - Test push notification flow end-to-end                     │ │
│ │ - Verify service worker registration                         │ │
│ │                                                              │ │
│ │ Phase 6: System Testing & Documentation (Priority: Low)      │ │
│ │                                                              │ │
│ │ 6.1 Comprehensive Testing                                    │ │
│ │                                                              │ │
│ │ - Test all workflows end-to-end                              │ │
│ │ - Verify math calculations across modules                    │ │
│ │ - Test all webhook connections                               │ │
│ │ - Verify module isolation after contamination cleanup        │ │
│ │                                                              │ │
│ │ 6.2 Documentation Update                                     │ │
│ │                                                              │ │
│ │ - Update todo.md with detailed tracking                      │ │
│ │ - Document fixes made for future reference                   │ │
│ │ - Document module boundaries and appropriate script          │ │
│ │ inclusions                                                   │ │
│ │                                                              │ │
│ │ NEW: Module Purity Guidelines                                │ │
│ │                                                              │ │
│ │ - Depreciation Module: Should only handle depreciation       │ │
│ │ calculations, no parts search or car details floating        │ │
│ │ elements                                                     │ │
│ │ - Fee Module: Should only handle fee calculations, no        │ │
│ │ external module UI elements                                  │ │
│ │ - Parts Modules: Parts search toggles and floating elements  │ │
│ │ belong here only                                             │ │
│ │ - Levi Module: Levi-specific floating elements stay here     │ │
│ │ only                                                         │ │
│ │ - Car Details Modules: Car details floating elements stay    │ │
│ │ here only                                                    │ │
│ │                                                              │ │
│ │ Implementation Order:                                        │ │
│ │                                                              │ │
│ │ 1. Fix module contamination (removes strange progress pipes) │ │
│ │ 2. Fix module loading (enables other fixes)                  │ │
│ │ 3. Fix webhooks & math engine (core functionality)           │ │
│ │ 4. Add UI improvements (user experience)                     │ │
│ │ 5. Integrate browser & credentials (advanced features)       │ │
│ │ 6. Complete assistant & notifications (nice-to-have)         │ │
│ │ 7. Final testing & documentation                             │ │
│ │                                                              │ │
│ │ This updated plan specifically addresses the module          │ │
│ │ contamination issue you identified, ensuring each module     │ │
│ │ maintains its intended functionality and UI without          │ │
│ │ interference from other modules.                             │ │
│ ╰──────────
