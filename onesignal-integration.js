// OneSignal Integration for System-wide Push Notifications
(function() {
  'use strict';

  // Prevent multiple initializations
  if (window.oneSignalIntegrationLoaded) return;
  window.oneSignalIntegrationLoaded = true;

  const ONESIGNAL_APP_ID = '3b924b99-c302-4919-a97e-baf909394696';
  
  // OneSignal manager class
  class OneSignalManager {
    constructor() {
      this.initialized = false;
      this.subscribed = false;
      this.playerId = null;
      this.userToken = null;
    }

    async init() {
      try {
        
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
              // Enhanced v16 configuration with proper subdomain handling
              const initConfig = {
                appId: ONESIGNAL_APP_ID,
                allowLocalhostAsSecureOrigin: true
              };
              
              // Safari requires specific configuration
              if (isSafari) {
                initConfig.safari_web_id = 'web.onesignal.auto.' + ONESIGNAL_APP_ID;
                // Force auto-prompt for better Safari compatibility
                initConfig.autoPrompt = true;
                initConfig.promptOptions = {
                  slidedown: {
                    enabled: true,
                    autoPrompt: true,
                    timeDelay: 5,
                    pageViews: 1,
                    actionMessage: "We'd like to show you notifications for updates.",
                    acceptButtonText: "Allow", 
                    cancelButtonText: "No Thanks"
                  }
                };
              } else {
                // For Chrome and other browsers - use auto prompt
                initConfig.autoPrompt = true;
              }
              
              console.log('📱 OneSignal: Init config:', initConfig);
              console.log('📱 OneSignal: Current hostname:', window.location.hostname);
              
              await OneSignal.init(initConfig);

              this.initialized = true;
              console.log('📱 OneSignal: Initialized successfully with v16 config');

              // Set user context
              this.userToken = auth;
              
              // Wait for OneSignal to be fully ready
              await new Promise(resolve => setTimeout(resolve, 2000));
              
              // Set up event listeners for subscription changes first
              this.setupSubscriptionListeners();
              
              // Wait for OneSignal ID to be available before proceeding
              const onesignalId = await this.waitForOnesignalId();
              
              // Only proceed if we have a OneSignal ID
              if (onesignalId) {
                // Check subscription status with retries only after ID is available
                setTimeout(async () => {
                  for (let i = 0; i < 3; i++) {
                    const success = await this.checkSubscriptionStatus();
                    if (success) break;
                    await new Promise(resolve => setTimeout(resolve, 1000));
                  }
                }, 1000);
              } else {
                console.warn('📱 OneSignal: Skipping subscription operations - no OneSignal ID available');
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
      
      // Try to get OneSignal ID with retries
      for (let i = 0; i < 10; i++) {
        try {
          const onesignalId = await OneSignal.User.getOnesignalId();
          if (onesignalId) {
            this.playerId = onesignalId;
            sessionStorage.setItem('onesignalId', onesignalId);
            console.log('📱 OneSignal: Got OneSignal ID:', onesignalId);
            return onesignalId;
          }
        } catch (e) {
          console.log(`📱 OneSignal: ID attempt ${i + 1} failed:`, e.message);
        }
        
        // Wait longer between retries
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
      
      console.warn('📱 OneSignal: Could not get OneSignal ID after 10 attempts');
      return null;
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
        
        const isSafari = /^((?!chrome|android).)*safari/i.test(navigator.userAgent);
        let permission = false;
        
        if (isSafari) {
          // Safari v16 API handling
          console.log('📱 OneSignal: Using Safari v16 API');
          try {
            if (window.OneSignal && window.OneSignal.Notifications) {
              // Use v16 API for Safari
              permission = await OneSignal.Notifications.requestPermission();
              console.log('📱 OneSignal: Safari v16 permission result:', permission);
            } else {
              // Fallback to native Safari prompt
              const result = await Notification.requestPermission();
              permission = (result === 'granted');
              console.log('📱 OneSignal: Safari native permission result:', permission);
            }
          } catch (e) {
            console.log('📱 OneSignal: Safari error, trying native:', e.message);
            const result = await Notification.requestPermission();
            permission = (result === 'granted');
          }
        } else {
          // Chrome and other browsers v16 API
          console.log('📱 OneSignal: Using Chrome v16 API');
          try {
            if (window.OneSignal && window.OneSignal.Notifications) {
              permission = await OneSignal.Notifications.requestPermission();
              console.log('📱 OneSignal: Chrome v16 permission result:', permission);
            } else {
              const result = await Notification.requestPermission();
              permission = (result === 'granted');
              console.log('📱 OneSignal: Chrome native permission result:', permission);
            }
          } catch (e) {
            console.log('📱 OneSignal: Chrome error, trying native:', e.message);
            const result = await Notification.requestPermission();
            permission = (result === 'granted');
          }
        }
        
        this.subscribed = permission;

        if (permission) {
          console.log('📱 OneSignal: Permission granted, getting OneSignal ID...');
          sessionStorage.setItem('oneSignalSubscribed', 'true');
          
          // Try to get OneSignal ID immediately and with retries
          for (let i = 0; i < 5; i++) {
            try {
              await new Promise(resolve => setTimeout(resolve, 1000 * (i + 1)));
              const onesignalId = await OneSignal.User.getOnesignalId();
              if (onesignalId) {
                this.playerId = onesignalId;
                sessionStorage.setItem('onesignalId', onesignalId);
                console.log('📱 OneSignal: Got ID after permission:', onesignalId);
                break;
              }
            } catch (e) {
              console.log(`📱 OneSignal: ID attempt ${i + 1} failed:`, e.message);
            }
          }
          
          // Final subscription status check
          setTimeout(async () => {
            await this.checkSubscriptionStatus();
          }, 3000);
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
      const status = window.oneSignalManager.getStatus();
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
        const granted = await window.oneSignalManager.requestPermission();
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

  // Add status indicator after DOM is ready and with a delay
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      setTimeout(addNotificationStatusIndicator, 3000);
    });
  } else {
    setTimeout(addNotificationStatusIndicator, 3000);
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
    }
  };

  console.log('📱 OneSignal Integration: System-wide integration loaded');

})();