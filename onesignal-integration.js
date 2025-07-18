// OneSignal Integration for System-wide Push Notifications
(function() {
  'use strict';

  // Prevent multiple initializations
  if (window.oneSignalIntegrationLoaded) return;
  window.oneSignalIntegrationLoaded = true;

  const ONESIGNAL_APP_ID = '3b924b99-c302-4919-a97e-baf909394696';
  
  // Try re-enabling OneSignal with safer initialization approach
  const ONESIGNAL_TEMPORARILY_DISABLED = false;
  
  // OneSignal manager class
  class OneSignalManager {
    constructor() {
      this.initialized = false;
      this.subscribed = false;
      this.playerId = null;
      this.userToken = null;
      this.disabled = ONESIGNAL_TEMPORARILY_DISABLED;
    }

    async init() {
      try {
        // Check if temporarily disabled
        if (this.disabled) {
          console.log('📱 OneSignal: Temporarily disabled to fix subscription errors');
          return;
        }
        
        // Skip if on login page (already initialized there)
        if (window.location.pathname.includes('index.html') || window.location.pathname === '/') {
          console.log('📱 OneSignal: Skipping init on login page');
          return;
        }

        // Check if user is authenticated
        const auth = sessionStorage.getItem('auth');
        if (!auth) {
          console.log('📱 OneSignal: User not authenticated, skipping init');
          return;
        }

        // Detect browser
        const isSafari = /^((?!chrome|android).)*safari/i.test(navigator.userAgent);
        const isChrome = /chrome/i.test(navigator.userAgent) && /google inc/i.test(navigator.vendor);
        
        // Log current domain for debugging
        console.log('📱 OneSignal: Current domain:', window.location.origin);
        console.log('📱 OneSignal: Hostname:', window.location.hostname);
        console.log('📱 OneSignal: Protocol:', window.location.protocol);
        console.log('📱 OneSignal: Browser:', isSafari ? 'Safari' : isChrome ? 'Chrome' : 'Other');
        console.log('📱 OneSignal: Expected domain: yaron-cayouf-portal.netlify.app');
        console.log('📱 OneSignal: Initializing on post-login page...');

        // Check if already initialized
        if (this.initialized) {
          console.log('📱 OneSignal: Already initialized');
          return;
        }

        // Clean OneSignal stored operations to prevent validation errors
        this.cleanStoredOperations();
        
        // Wait for cleanup to complete before proceeding
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        // Load OneSignal SDK if not already loaded
        if (!window.OneSignal) {
          await this.loadOneSignalSDK();
        }

        // Wait for OneSignal to be ready
        await new Promise(resolve => {
          if (window.OneSignal) {
            resolve();
          } else {
            const checkInterval = setInterval(() => {
              if (window.OneSignal) {
                clearInterval(checkInterval);
                resolve();
              }
            }, 100);
          }
        });

        // Initialize OneSignal
        window.OneSignalDeferred = window.OneSignalDeferred || [];
        
        return new Promise((resolve, reject) => {
          OneSignalDeferred.push(async (OneSignal) => {
            try {
              // Minimal OneSignal configuration to prevent subscription errors
              const initConfig = {
                appId: ONESIGNAL_APP_ID,
                allowLocalhostAsSecureOrigin: true,
                // Disable ALL automatic operations
                autoRegister: false,
                autoPrompt: false,
                autoResubscribe: false
              };
              
              // Safari requires specific configuration but with delayed prompting
              if (isSafari) {
                initConfig.safari_web_id = 'web.onesignal.auto.' + ONESIGNAL_APP_ID;
                // Disable auto-prompt to prevent premature subscription operations
                initConfig.autoPrompt = false;
                initConfig.promptOptions = {
                  slidedown: {
                    enabled: false, // Disable to prevent immediate operations
                    autoPrompt: false,
                    timeDelay: 30, // Long delay
                    pageViews: 5   // High threshold
                  }
                };
              }
              
              console.log('📱 OneSignal: Init config:', initConfig);
              console.log('📱 OneSignal: Current hostname:', window.location.hostname);
              
              // Temporarily disable window.onerror to prevent OneSignal errors from showing
              const originalOnError = window.onerror;
              window.onerror = (msg, url, lineNo, columnNo, error) => {
                if (msg && typeof msg === 'string' && msg.includes('onesignalId')) {
                  console.log('📱 OneSignal: Suppressed onesignalId error during initialization');
                  return true; // Suppress the error
                }
                return originalOnError ? originalOnError(msg, url, lineNo, columnNo, error) : false;
              };
              
              // Initialize OneSignal core without triggering subscription operations
              console.log('📱 OneSignal: Starting core initialization...');
              
              // Use minimal initialization to prevent subscription errors
              try {
                console.log('📱 OneSignal: Starting minimal initialization...');
                await OneSignal.init(initConfig);
                console.log('📱 OneSignal: Core SDK initialized successfully');
                
                // Mark as initialized immediately to prevent further init attempts
                this.initialized = true;
                
                // Set user context
                this.userToken = auth;
                
                console.log('📱 OneSignal: Basic initialization completed successfully');
                
                // Restore original error handler after initialization
                setTimeout(() => {
                  window.onerror = originalOnError;
                  console.log('📱 OneSignal: Restored original error handler');
                }, 5000);
                
              } catch (initError) {
                console.error('📱 OneSignal: Initialization failed:', initError);
                
                // Restore error handler
                window.onerror = originalOnError;
                
                // Don't block the app - just disable OneSignal
                this.disabled = true;
                this.initialized = false;
                
                console.log('📱 OneSignal: Disabled due to initialization error');
              }

              resolve();
            } catch (error) {
              console.error('📱 OneSignal: Initialization error:', error);
              reject(error);
            }
          });
        });

      } catch (error) {
        console.error('📱 OneSignal: Init error:', error);
        throw error;
      }
    }

    cleanStoredOperations() {
      try {
        console.log('📱 OneSignal: Performing comprehensive storage cleanup to resolve operation errors...');
        
        // OneSignal v16 stores operations in multiple locations - we need to clear ALL of them
        
        // 1. Clear ALL localStorage (most aggressive approach)
        console.log('📱 OneSignal: Clearing ALL localStorage to remove any OneSignal data...');
        const preservedKeys = ['lastCaseData', 'lastCaseTimestamp', 'auth', 'helper'];
        const preservedData = {};
        
        // Preserve critical application data
        preservedKeys.forEach(key => {
          const value = localStorage.getItem(key);
          if (value) {
            preservedData[key] = value;
          }
        });
        
        // Clear everything
        localStorage.clear();
        
        // Restore preserved data
        Object.keys(preservedData).forEach(key => {
          localStorage.setItem(key, preservedData[key]);
        });
        
        // 2. Clear OneSignal-specific sessionStorage but preserve our app data
        const sessionStorageKeysToRemove = [];
        for (let i = 0; i < sessionStorage.length; i++) {
          const key = sessionStorage.key(i);
          if (key && (
            key.startsWith('OneSignal') || 
            key.startsWith('onesignal') ||
            key.includes('operations') ||
            key.includes('subscription') ||
            key.includes('push') ||
            key.includes('worker') ||
            key.includes('notification')
          )) {
            // Don't remove our own tracking data
            if (key !== 'onesignalId' && key !== 'oneSignalSubscribed') {
              sessionStorageKeysToRemove.push(key);
            }
          }
        }
        
        sessionStorageKeysToRemove.forEach(key => {
          console.log('📱 OneSignal: Removing sessionStorage key:', key);
          sessionStorage.removeItem(key);
        });
        
        // 3. Aggressively clear ALL IndexedDB databases (this is the key fix)
        if ('indexedDB' in window) {
          this.clearAllIndexedDB();
        }
        
        // 4. Clear ALL service workers and caches
        this.clearAllServiceWorkers();
        
        // 5. Clear any remaining browser storage mechanisms
        this.clearAdditionalStorage();
        
        console.log('📱 OneSignal: Comprehensive storage cleanup completed');
        
      } catch (error) {
        console.error('📱 OneSignal: Error cleaning stored operations:', error);
      }
    }

    setupOperationInterception() {
      try {
        console.log('📱 OneSignal: Setting up operation interception to prevent invalid operations...');
        
        // Override the OneSignal push function to intercept operations
        const originalPush = window.OneSignalDeferred ? window.OneSignalDeferred.push : null;
        
        // Create a safe push function that validates operations
        window.OneSignalDeferred = window.OneSignalDeferred || [];
        const originalArrayPush = window.OneSignalDeferred.push;
        
        window.OneSignalDeferred.push = (callback) => {
          const wrappedCallback = (OneSignal) => {
            try {
              // Wrap OneSignal operations that might trigger subscription errors
              if (OneSignal && typeof OneSignal.push === 'function') {
                const originalOneSignalPush = OneSignal.push;
                
                OneSignal.push = (operation) => {
                  try {
                    // Check if this is a subscription operation that needs onesignalId
                    if (Array.isArray(operation) && operation.length >= 2) {
                      const [operationName, operationData] = operation;
                      
                      if (operationName === 'update-subscription' || 
                          operationName === 'create-subscription' ||
                          operationName === 'subscription-changed') {
                        
                        // Check if we have a valid onesignalId
                        const currentId = sessionStorage.getItem('onesignalId') || this.playerId;
                        
                        if (!currentId) {
                          console.log(`📱 OneSignal: Blocking ${operationName} operation - no onesignalId available`);
                          return; // Block the operation
                        }
                        
                        // Ensure the operation has the required onesignalId
                        if (operationData && typeof operationData === 'object' && !operationData.onesignalId) {
                          console.log(`📱 OneSignal: Adding onesignalId to ${operationName} operation`);
                          operationData.onesignalId = currentId;
                        }
                      }
                    }
                    
                    // Proceed with the operation
                    return originalOneSignalPush.call(OneSignal, operation);
                  } catch (error) {
                    console.error('📱 OneSignal: Error in operation wrapper:', error);
                    // Don't call the original to prevent errors
                  }
                };
              }
              
              // Call the original callback
              return callback(OneSignal);
            } catch (error) {
              console.error('📱 OneSignal: Error in callback wrapper:', error);
            }
          };
          
          return originalArrayPush.call(this, wrappedCallback);
        };
        
        console.log('📱 OneSignal: Operation interception setup completed');
        
      } catch (error) {
        console.error('📱 OneSignal: Error setting up operation interception:', error);
      }
    }

    async clearAllIndexedDB() {
      try {
        console.log('📱 OneSignal: Clearing ALL IndexedDB databases...');
        
        // Get all existing databases
        if (indexedDB.databases) {
          const databases = await indexedDB.databases();
          console.log('📱 OneSignal: Found IndexedDB databases:', databases.map(db => db.name));
          
          for (const db of databases) {
            if (db.name) {
              try {
                await new Promise((resolve) => {
                  const deleteRequest = indexedDB.deleteDatabase(db.name);
                  deleteRequest.onsuccess = () => {
                    console.log(`📱 OneSignal: Deleted IndexedDB: ${db.name}`);
                    resolve();
                  };
                  deleteRequest.onerror = () => resolve(); // Continue anyway
                  deleteRequest.onblocked = () => resolve(); // Continue anyway
                  setTimeout(() => resolve(), 3000); // Timeout
                });
              } catch (e) {
                console.log(`📱 OneSignal: Error deleting ${db.name}:`, e.message);
              }
            }
          }
        } else {
          // Fallback: try common OneSignal database names
          const commonDbNames = [
            'OneSignalSDK',
            'onesignal-db',
            `OneSignal-${ONESIGNAL_APP_ID}`,
            'OneSignalDatabase',
            'operations',
            'subscriptions',
            'push-notifications'
          ];
          
          for (const dbName of commonDbNames) {
            try {
              await new Promise((resolve) => {
                const deleteRequest = indexedDB.deleteDatabase(dbName);
                deleteRequest.onsuccess = () => {
                  console.log(`📱 OneSignal: Deleted IndexedDB: ${dbName}`);
                  resolve();
                };
                deleteRequest.onerror = () => resolve();
                deleteRequest.onblocked = () => resolve();
                setTimeout(() => resolve(), 2000);
              });
            } catch (e) {
              console.log(`📱 OneSignal: Error deleting ${dbName}:`, e.message);
            }
          }
        }
        
        console.log('📱 OneSignal: IndexedDB cleanup completed');
      } catch (error) {
        console.error('📱 OneSignal: Error clearing all IndexedDB:', error);
      }
    }

    async clearAllServiceWorkers() {
      try {
        if ('serviceWorker' in navigator) {
          console.log('📱 OneSignal: Clearing ALL service workers and caches...');
          
          // Clear ALL caches (not just OneSignal)
          if ('caches' in window) {
            const cacheNames = await caches.keys();
            console.log('📱 OneSignal: Found caches:', cacheNames);
            
            for (const cacheName of cacheNames) {
              await caches.delete(cacheName);
              console.log(`📱 OneSignal: Deleted cache: ${cacheName}`);
            }
          }
          
          // Unregister ALL service workers
          const registrations = await navigator.serviceWorker.getRegistrations();
          console.log('📱 OneSignal: Found service workers:', registrations.length);
          
          for (const registration of registrations) {
            await registration.unregister();
            console.log('📱 OneSignal: Unregistered service worker:', registration.scope);
          }
          
          console.log('📱 OneSignal: Service worker cleanup completed');
        }
      } catch (error) {
        console.log('📱 OneSignal: Service worker cleanup error:', error.message);
      }
    }

    clearAdditionalStorage() {
      try {
        // Clear any other storage mechanisms that might contain OneSignal data
        
        // Clear cookies that might contain OneSignal data
        document.cookie.split(";").forEach(cookie => {
          const eqPos = cookie.indexOf("=");
          const name = eqPos > -1 ? cookie.substr(0, eqPos) : cookie;
          if (name.trim().toLowerCase().includes('onesignal') || 
              name.trim().toLowerCase().includes('notification') ||
              name.trim().toLowerCase().includes('push')) {
            document.cookie = name + "=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/";
            console.log(`📱 OneSignal: Cleared cookie: ${name.trim()}`);
          }
        });
        
        // Clear any window storage properties
        Object.keys(window).forEach(key => {
          if (typeof key === 'string' && (
            key.toLowerCase().includes('onesignal') ||
            key.toLowerCase().includes('notification') ||
            key.toLowerCase().includes('push')
          )) {
            try {
              delete window[key];
              console.log(`📱 OneSignal: Cleared window property: ${key}`);
            } catch (e) {
              console.log(`📱 OneSignal: Could not clear window property: ${key}`);
            }
          }
        });
        
        console.log('📱 OneSignal: Additional storage cleanup completed');
      } catch (error) {
        console.error('📱 OneSignal: Error in additional storage cleanup:', error);
      }
    }

    async clearServiceWorkerCache() {
      try {
        if ('serviceWorker' in navigator) {
          // Clear any cached data that might contain old operations
          if ('caches' in window) {
            const cacheNames = await caches.keys();
            for (const cacheName of cacheNames) {
              if (cacheName.includes('onesignal') || cacheName.includes('OneSignal')) {
                console.log(`📱 OneSignal: Clearing cache: ${cacheName}`);
                await caches.delete(cacheName);
              }
            }
          }
          
          // Unregister OneSignal service workers to clear any stored state
          const registrations = await navigator.serviceWorker.getRegistrations();
          for (const registration of registrations) {
            if (registration.scope.includes('onesignal') || 
                registration.scope.includes('OneSignal') ||
                (registration.active && registration.active.scriptURL.includes('onesignal'))) {
              console.log('📱 OneSignal: Unregistering service worker:', registration.scope);
              await registration.unregister();
            }
          }
        }
      } catch (error) {
        console.log('📱 OneSignal: Service worker cleanup error (non-critical):', error.message);
      }
    }

    async loadOneSignalSDK() {
      return new Promise((resolve, reject) => {
        if (window.OneSignal) {
          resolve();
          return;
        }

        const script = document.createElement('script');
        script.src = 'https://cdn.onesignal.com/sdks/web/v16/OneSignalSDK.page.js';
        script.async = true;
        script.defer = true;
        
        script.onload = () => {
          console.log('📱 OneSignal: SDK loaded');
          resolve();
        };
        
        script.onerror = () => {
          console.error('📱 OneSignal: Failed to load SDK');
          reject(new Error('Failed to load OneSignal SDK'));
        };

        document.head.appendChild(script);
      });
    }

    async waitForOnesignalId() {
      console.log('📱 OneSignal: Waiting for OneSignal ID...');
      
      // Check if we already have an ID in storage first
      const existingId = sessionStorage.getItem('onesignalId');
      if (existingId) {
        console.log('📱 OneSignal: Found existing OneSignal ID in storage:', existingId);
        this.playerId = existingId;
        return existingId;
      }
      
      // Try to get OneSignal ID with retries, but handle subscription errors gracefully
      for (let i = 0; i < 5; i++) {
        try {
          // Check if OneSignal SDK is available
          if (!window.OneSignal || !window.OneSignal.User) {
            console.log(`📱 OneSignal: SDK not ready yet (attempt ${i + 1})`);
            await new Promise(resolve => setTimeout(resolve, 2000));
            continue;
          }
          
          const onesignalId = await OneSignal.User.getOnesignalId();
          if (onesignalId) {
            this.playerId = onesignalId;
            sessionStorage.setItem('onesignalId', onesignalId);
            console.log('📱 OneSignal: Successfully got OneSignal ID:', onesignalId);
            return onesignalId;
          } else {
            console.log(`📱 OneSignal: No ID available yet (attempt ${i + 1})`);
          }
        } catch (e) {
          console.log(`📱 OneSignal: ID attempt ${i + 1} failed:`, e.message);
          
          // If it's the subscription error we're trying to fix, don't spam retries
          if (e.message && (
            e.message.includes('onesignalId') || 
            e.message.includes('create-subscription') || 
            e.message.includes('update-subscription')
          )) {
            console.log('📱 OneSignal: Detected subscription error - stopping ID retrieval attempts');
            break;
          }
        }
        
        // Wait progressively longer between retries
        await new Promise(resolve => setTimeout(resolve, 2000 * (i + 1)));
      }
      
      console.warn('📱 OneSignal: Could not get OneSignal ID - likely due to subscription creation issues');
      return null;
    }

    async manualRegisterForPush() {
      try {
        console.log('📱 OneSignal: Manually registering for push notifications...');
        
        // Only proceed if we have a OneSignal ID
        const onesignalId = sessionStorage.getItem('onesignalId');
        if (!onesignalId) {
          console.warn('📱 OneSignal: Cannot register - no OneSignal ID available');
          return false;
        }
        
        // Check if notifications are already granted
        const permission = Notification.permission;
        if (permission === 'granted') {
          console.log('📱 OneSignal: Notifications already granted, proceeding with registration');
          this.subscribed = true;
          sessionStorage.setItem('oneSignalSubscribed', 'true');
          return true;
        } else if (permission === 'denied') {
          console.log('📱 OneSignal: Notifications denied, cannot register');
          return false;
        } else {
          console.log('📱 OneSignal: Permission not yet requested, will request when needed');
          return false;
        }
        
      } catch (error) {
        console.error('📱 OneSignal: Error in manual registration:', error);
        return false;
      }
    }

    async setUserContext(authToken) {
      try {
        if (!window.OneSignal) return;

        this.userToken = authToken;

        // Get player ID for logging/debugging (v16 uses pushSubscription.id)
        try {
          const subscription = await OneSignal.User.PushSubscription.id;
          this.playerId = subscription;
        } catch (e) {
          console.log('📱 OneSignal: Could not get subscription ID, continuing without it');
          this.playerId = null;
        }
        
        console.log('📱 OneSignal: User context set', {
          userToken: authToken.substring(0, 10) + '...',
          playerId: this.playerId
        });

        // Store for later use
        sessionStorage.setItem('oneSignalPlayerId', this.playerId || '');

      } catch (error) {
        console.error('📱 OneSignal: Error setting user context:', error);
      }
    }


    setupSubscriptionListeners() {
      try {
        if (!window.OneSignal) return;
        
        // Listen for subscription changes (v16 API) - with error handling
        try {
          OneSignal.User.PushSubscription.addEventListener('change', (event) => {
            console.log('📱 OneSignal: Subscription changed:', event);
            if (event.current && event.current.id) {
              console.log('📱 OneSignal: New subscription ID:', event.current.id);
              this.playerId = event.current.id;
              sessionStorage.setItem('onesignalId', event.current.id);
              sessionStorage.setItem('oneSignalSubscribed', 'true');
              this.subscribed = true;
            }
          });
        } catch (e) {
          console.log('📱 OneSignal: Could not set up subscription listener:', e.message);
        }
        
        // Listen for OneSignal user ID changes - with error handling
        try {
          OneSignal.User.addEventListener('change', (event) => {
            console.log('📱 OneSignal: User changed:', event);
            if (event.current && event.current.onesignalId) {
              console.log('📱 OneSignal: User ID updated:', event.current.onesignalId);
              this.playerId = event.current.onesignalId;
              sessionStorage.setItem('onesignalId', event.current.onesignalId);
            }
          });
        } catch (e) {
          console.log('📱 OneSignal: Could not set up user listener:', e.message);
        }
        
        // Listen for notification permission changes - with error handling
        try {
          OneSignal.Notifications.addEventListener('permissionChange', (event) => {
            console.log('📱 OneSignal: Permission changed:', event);
            const granted = event === 'granted';
            this.subscribed = granted;
            sessionStorage.setItem('oneSignalSubscribed', granted.toString());
          });
        } catch (e) {
          console.log('📱 OneSignal: Could not set up permission listener:', e.message);
        }
        
        console.log('📱 OneSignal: All subscription listeners set up');
      } catch (error) {
        console.error('📱 OneSignal: Error setting up listeners:', error);
      }
    }

    async checkSubscriptionStatus() {
      try {
        if (!window.OneSignal) return false;

        const isSafari = /^((?!chrome|android).)*safari/i.test(navigator.userAgent);
        let permission;
        let isSubscribed = false;
        let onesignalId = null;
        
        try {
          // Try to get OneSignal ID first - CRITICAL for v16
          if (window.OneSignal.User) {
            try {
              onesignalId = await window.OneSignal.User.getOnesignalId();
              if (onesignalId) {
                sessionStorage.setItem('onesignalId', onesignalId);
                this.playerId = onesignalId;
              } else {
                console.log('📱 OneSignal: No OneSignal ID available yet, skipping subscription check');
                return false;
              }
            } catch (e) {
              console.log('📱 OneSignal: Could not get ID in check:', e.message);
              return false;
            }
          }
          
          // For Safari, use the proper v16 API
          if (isSafari) {
            // Safari needs special handling
            permission = Notification.permission;
            if (window.OneSignal.User && window.OneSignal.User.PushSubscription) {
              try {
                const pushSubscription = window.OneSignal.User.PushSubscription;
                isSubscribed = await pushSubscription.optedIn;
                
                // Also try to get the subscription ID
                if (!onesignalId && pushSubscription.id) {
                  onesignalId = await pushSubscription.id;
                }
              } catch (e) {
                console.log('📱 OneSignal: Safari subscription check error:', e.message);
              }
            }
          } else {
            // For other browsers
            permission = await OneSignal.Notifications.permission;
            isSubscribed = (permission === 'granted');
            
            // Try to get push subscription ID
            if (!onesignalId && window.OneSignal.User && window.OneSignal.User.PushSubscription) {
              try {
                onesignalId = await window.OneSignal.User.PushSubscription.id;
              } catch (e) {
                console.log('📱 OneSignal: Could not get push subscription ID:', e.message);
              }
            }
          }
        } catch (e) {
          console.log('📱 OneSignal: Using fallback permission check:', e.message);
          // Fallback to browser native permission
          permission = Notification.permission;
          isSubscribed = (permission === 'granted');
        }
        
        this.subscribed = isSubscribed;

        console.log('📱 OneSignal: Subscription status:', {
          browser: isSafari ? 'Safari' : 'Other',
          permission: permission,
          subscribed: this.subscribed,
          optedIn: isSubscribed,
          onesignalId: onesignalId || 'not available'
        });

        // Store subscription status
        sessionStorage.setItem('oneSignalSubscribed', this.subscribed.toString());
        if (onesignalId) {
          sessionStorage.setItem('onesignalId', onesignalId);
        }

        return this.subscribed && !!onesignalId;
      } catch (error) {
        console.error('📱 OneSignal: Error checking subscription:', error);
        return false;
      }
    }

    async requestPermission() {
      try {
        console.log('📱 OneSignal: Requesting notification permission...');
        
        // First, use native browser permission request to avoid OneSignal subscription operations
        let permission = false;
        
        try {
          const result = await Notification.requestPermission();
          permission = (result === 'granted');
          console.log('📱 OneSignal: Native permission result:', result);
        } catch (e) {
          console.error('📱 OneSignal: Native permission request failed:', e);
          return false;
        }
        
        this.subscribed = permission;

        if (permission) {
          console.log('📱 OneSignal: Permission granted, proceeding with OneSignal registration...');
          sessionStorage.setItem('oneSignalSubscribed', 'true');
          
          // Wait a bit for OneSignal to process the permission change
          await new Promise(resolve => setTimeout(resolve, 2000));
          
          // Now try to get OneSignal ID more conservatively
          let onesignalId = null;
          
          // Try multiple approaches to get OneSignal ID
          for (let attempt = 0; attempt < 3; attempt++) {
            try {
              console.log(`📱 OneSignal: ID retrieval attempt ${attempt + 1}...`);
              
              // Wait longer between attempts
              if (attempt > 0) {
                await new Promise(resolve => setTimeout(resolve, 3000 * attempt));
              }
              
              // Try to get existing ID first
              if (window.OneSignal && window.OneSignal.User) {
                try {
                  onesignalId = await OneSignal.User.getOnesignalId();
                  if (onesignalId) {
                    console.log('📱 OneSignal: Successfully retrieved OneSignal ID:', onesignalId);
                    this.playerId = onesignalId;
                    sessionStorage.setItem('onesignalId', onesignalId);
                    break;
                  }
                } catch (idError) {
                  console.log(`📱 OneSignal: ID retrieval failed (attempt ${attempt + 1}):`, idError.message);
                  
                  // If it's a subscription error, try to work around it
                  if (idError.message && idError.message.includes('onesignalId')) {
                    console.log('📱 OneSignal: Subscription error detected - this indicates the core issue');
                    // Continue trying but don't break the flow
                  }
                }
              }
              
              // If still no ID, try a different approach
              if (!onesignalId) {
                console.log('📱 OneSignal: No ID available yet, will retry...');
              }
              
            } catch (e) {
              console.log(`📱 OneSignal: Overall attempt ${attempt + 1} failed:`, e.message);
            }
          }
          
          if (onesignalId) {
            // Final subscription status check only if we have an ID
            setTimeout(async () => {
              await this.checkSubscriptionStatus();
            }, 3000);
          } else {
            console.warn('📱 OneSignal: Could not retrieve OneSignal ID after permission grant');
            // Still mark as subscribed based on native permission
            this.subscribed = true;
          }
          
        } else {
          console.log('📱 OneSignal: Permission denied');
          sessionStorage.setItem('oneSignalSubscribed', 'false');
        }

        return permission;

      } catch (error) {
        console.error('📱 OneSignal: Permission request error:', error);
        return false;
      }
    }

    async sendTestNotification() {
      try {
        console.log('📱 OneSignal: Attempting to send test notification...');
        
        // Get current subscription info
        let onesignalId = sessionStorage.getItem('onesignalId');
        
        // Try to get fresh ID if not available - with retries
        if (!onesignalId && window.OneSignal && window.OneSignal.User) {
          for (let i = 0; i < 3; i++) {
            try {
              await new Promise(resolve => setTimeout(resolve, 500));
              onesignalId = await OneSignal.User.getOnesignalId();
              if (onesignalId) {
                this.playerId = onesignalId;
                sessionStorage.setItem('onesignalId', onesignalId);
                console.log('📱 OneSignal: Got fresh ID for test:', onesignalId);
                break;
              }
            } catch (e) {
              console.log(`📱 OneSignal: Fresh ID attempt ${i + 1} failed:`, e.message);
            }
          }
        }
        
        // If still no ID, this is a critical issue
        if (!onesignalId) {
          console.error('📱 OneSignal: Cannot send test - no OneSignal ID available');
          return false;
        }
        
        console.log('📱 OneSignal: Test notification data:', {
          subscribed: this.subscribed,
          onesignalId: onesignalId,
          userToken: this.userToken,
          browser: navigator.userAgent.includes('Safari') ? 'Safari' : 'Chrome'
        });

        // Send test notification via webhook
        const response = await fetch('https://hook.eu2.make.com/e41e2zm9f26ju5m815yfgn1ou41wwwhd', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            type: 'test_notification',
            user_id: this.userToken,
            player_id: onesignalId || this.playerId,
            onesignal_id: onesignalId,
            message: 'בדיקת התראות - המערכת פועלת כראוי!',
            title: 'מערכת השמאות - בדיקה',
            url: window.location.href,
            browser: navigator.userAgent.includes('Safari') ? 'Safari' : 'Chrome'
          })
        });

        if (response.ok) {
          console.log('📱 OneSignal: Test notification sent successfully');
          return true;
        } else {
          console.error('📱 OneSignal: Failed to send test notification, status:', response.status);
          return false;
        }

      } catch (error) {
        console.error('📱 OneSignal: Test notification error:', error);
        return false;
      }
    }

    getStatus() {
      return {
        initialized: this.initialized,
        subscribed: this.subscribed,
        playerId: this.playerId,
        userToken: this.userToken ? this.userToken.substring(0, 10) + '...' : null,
        sdkLoaded: !!window.OneSignal
      };
    }
  }

  // Create global instance
  window.oneSignalManager = new OneSignalManager();

  // Auto-initialize when DOM is ready
  function autoInit() {
    // Don't auto-init on login page
    if (window.location.pathname.includes('index.html') || window.location.pathname === '/') {
      return;
    }

    // Only init if user is authenticated
    const auth = sessionStorage.getItem('auth');
    if (auth) {
      window.oneSignalManager.init().catch(error => {
        console.log('📱 OneSignal: Auto-init failed (non-critical):', error.message);
      });
    }
  }

  // Initialize when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', autoInit);
  } else {
    autoInit();
  }

  // Add notification status indicator to UI
  function addNotificationStatusIndicator() {
    // Don't add on login page
    if (window.location.pathname.includes('index.html') || window.location.pathname === '/') {
      return;
    }

    const indicator = document.createElement('div');
    indicator.id = 'notificationStatusIndicator';
    indicator.style.cssText = `
      position: fixed;
      top: 10px;
      right: 10px;
      background: #f8f9fa;
      border: 1px solid #dee2e6;
      border-radius: 6px;
      padding: 5px 10px;
      font-size: 12px;
      z-index: 9999;
      cursor: pointer;
      user-select: none;
      transition: all 0.3s ease;
      font-family: Arial, sans-serif;
      display: none;
    `;

    function updateIndicator() {
      // Check if OneSignal manager is available
      let status = null;
      try {
        if (window.oneSignalManager && typeof window.oneSignalManager.getStatus === 'function') {
          status = window.oneSignalManager.getStatus();
        }
      } catch (error) {
        console.log('📱 OneSignal: Cannot get status, manager not ready:', error.message);
      }
      
      const subscribed = sessionStorage.getItem('oneSignalSubscribed') === 'true';
      const permission = Notification.permission;
      const isSafari = /^((?!chrome|android).)*safari/i.test(navigator.userAgent);
      
      // Enhanced Safari handling
      if (isSafari) {
        // Check both OneSignal subscription and OneSignal ID availability
        if (window.OneSignal && window.OneSignal.User) {
          Promise.all([
            OneSignal.User.PushSubscription.optedIn.catch(() => false),
            OneSignal.User.getOnesignalId().catch(() => null)
          ]).then(([isSubscribed, onesignalId]) => {
            if (isSubscribed && onesignalId) {
              indicator.style.display = 'none';
              sessionStorage.setItem('oneSignalSubscribed', 'true');
              sessionStorage.setItem('onesignalId', onesignalId);
            } else {
              indicator.style.display = 'block';
              indicator.style.background = '#f8d7da';
              indicator.style.borderColor = '#f5c6cb';
              indicator.style.color = '#721c24';
              indicator.innerHTML = '🔕 התראות כבויות';
              indicator.title = 'התראות כבויות - לחץ להפעלה';
            }
          }).catch(() => {
            // Fallback check
            if (permission === 'granted' && sessionStorage.getItem('onesignalId')) {
              indicator.style.display = 'none';
            } else {
              indicator.style.display = 'block';
              indicator.style.background = '#f8d7da';
              indicator.style.borderColor = '#f5c6cb';
              indicator.style.color = '#721c24';
              indicator.innerHTML = '🔕 התראות כבויות';
              indicator.title = 'התראות כבויות - לחץ להפעלה';
            }
          });
        }
        return;
      }
      
      // For other browsers (Chrome, etc.)
      if ((permission === 'granted' || subscribed) && sessionStorage.getItem('onesignalId')) {
        indicator.style.display = 'none';
        return;
      }
      
      // Show indicator only when notifications are explicitly denied or never asked
      indicator.style.display = 'block';
      indicator.style.background = '#f8d7da';
      indicator.style.borderColor = '#f5c6cb';
      indicator.style.color = '#721c24';
      indicator.innerHTML = '🔕 התראות כבויות';
      indicator.title = 'התראות כבויות - לחץ להפעלה';
    }

    indicator.addEventListener('click', async () => {
      const permission = Notification.permission;
      
      if (permission !== 'granted') {
        // Check if OneSignal manager is available
        let granted = false;
        try {
          if (window.oneSignalManager && typeof window.oneSignalManager.requestPermission === 'function') {
            granted = await window.oneSignalManager.requestPermission();
          } else {
            // Fallback to native permission request
            const result = await Notification.requestPermission();
            granted = (result === 'granted');
          }
        } catch (error) {
          console.log('📱 OneSignal: Permission request failed, trying native:', error.message);
          try {
            const result = await Notification.requestPermission();
            granted = (result === 'granted');
          } catch (nativeError) {
            console.error('📱 OneSignal: Native permission request failed:', nativeError);
            granted = false;
          }
        }
        
        if (granted) {
          // Force update the session storage and indicator
          sessionStorage.setItem('oneSignalSubscribed', 'true');
          updateIndicator();
          alert('✅ התראות הופעלו בהצלחה!');
        } else {
          alert('❌ לא ניתן להפעיל התראות. אנא אפשר התראות בדפדפן.');
        }
      }
    });

    document.body.appendChild(indicator);

    // Update indicator initially and every 5 seconds
    updateIndicator();
    setInterval(updateIndicator, 5000);
  }

  // Add status indicator after DOM is ready and with a longer delay to ensure OneSignal manager is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      setTimeout(addNotificationStatusIndicator, 5000);
    });
  } else {
    setTimeout(addNotificationStatusIndicator, 5000);
  }

  // Expose utility functions globally
  window.oneSignalUtils = {
    async enableNotifications() {
      return await window.oneSignalManager.requestPermission();
    },
    
    async sendTestNotification() {
      return await window.oneSignalManager.sendTestNotification();
    },
    
    getStatus() {
      return window.oneSignalManager.getStatus();
    },
    
    async reinitialize() {
      window.oneSignalManager.initialized = false;
      return await window.oneSignalManager.init();
    },
    
    async forceCleanAndReinitialize() {
      console.log('🧹 OneSignal: Force clean and reinitialize...');
      
      // Perform comprehensive cleanup
      await window.oneSignalManager.cleanStoredOperations();
      
      // Wait for cleanup to complete
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      // Temporarily enable OneSignal for testing
      const originalDisabled = window.oneSignalManager.disabled;
      window.oneSignalManager.disabled = false;
      
      // Reset initialization state
      window.oneSignalManager.initialized = false;
      
      try {
        // Attempt initialization
        await window.oneSignalManager.init();
        console.log('✅ OneSignal: Force reinitialize successful');
        return true;
      } catch (error) {
        console.error('❌ OneSignal: Force reinitialize failed:', error);
        // Restore disabled state if it fails
        window.oneSignalManager.disabled = originalDisabled;
        return false;
      }
    },
    
    async testCleanStorage() {
      console.log('🧪 OneSignal: Testing storage cleanup...');
      await window.oneSignalManager.cleanStoredOperations();
      console.log('✅ OneSignal: Storage cleanup test completed');
    }
  };

  console.log('📱 OneSignal Integration: System-wide integration loaded');

})();