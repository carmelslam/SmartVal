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
              // Minimal configuration to avoid ID errors
              const initConfig = {
                appId: ONESIGNAL_APP_ID,
                autoRegister: false,
                autoResubscribe: false,
                serviceWorkerParam: { scope: '/' },
                serviceWorkerPath: 'OneSignalSDKWorker.js'
              };
              
              console.log('📱 OneSignal: Init config:', initConfig);
              console.log('📱 OneSignal: Current hostname:', window.location.hostname);
              
              await OneSignal.init(initConfig);

              this.initialized = true;
              console.log('📱 OneSignal: Initialized successfully with minimal config');

              // Set user context (simplified)
              this.userToken = auth;
              
              // Don't try to get OneSignal ID immediately to avoid errors
              console.log('📱 OneSignal: Skipping automatic ID retrieval to prevent errors');

              // Simple permission check without subscription operations
              setTimeout(() => {
                this.checkBasicPermission();
              }, 1000);

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

    checkBasicPermission() {
      try {
        const permission = Notification.permission;
        this.subscribed = (permission === 'granted');
        
        console.log('📱 OneSignal: Basic permission check:', {
          permission: permission,
          subscribed: this.subscribed
        });

        // Store subscription status
        sessionStorage.setItem('oneSignalSubscribed', this.subscribed.toString());
        
        return this.subscribed;
      } catch (error) {
        console.error('📱 OneSignal: Error in basic permission check:', error);
        return false;
      }
    }

    async checkSubscriptionStatus() {
      try {
        if (!window.OneSignal) return;

        const isSafari = /^((?!chrome|android).)*safari/i.test(navigator.userAgent);
        let permission;
        let isSubscribed = false;
        let onesignalId = null;
        
        try {
          // Try to get OneSignal ID first
          if (window.OneSignal.User) {
            try {
              onesignalId = await window.OneSignal.User.getOnesignalId();
              if (onesignalId) {
                sessionStorage.setItem('onesignalId', onesignalId);
                this.playerId = onesignalId;
              }
            } catch (e) {
              console.log('📱 OneSignal: Could not get ID in check:', e.message);
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

        return this.subscribed;
      } catch (error) {
        console.error('📱 OneSignal: Error checking subscription:', error);
        return false;
      }
    }

    async requestPermission() {
      try {
        console.log('📱 OneSignal: Requesting notification permission (simplified)...');
        
        // Use browser native permission request to avoid OneSignal validation errors
        const result = await Notification.requestPermission();
        const permission = (result === 'granted');
        
        this.subscribed = permission;

        if (permission) {
          console.log('📱 OneSignal: Permission granted');
          sessionStorage.setItem('oneSignalSubscribed', 'true');
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
        if (!this.subscribed) {
          console.log('📱 OneSignal: User not subscribed, cannot send test notification');
          return false;
        }

        // Send test notification via webhook
        const response = await fetch('https://hook.eu2.make.com/e41e2zm9f26ju5m815yfgn1ou41wwwhd', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            type: 'test_notification',
            user_id: this.userToken,
            player_id: this.playerId,
            message: 'בדיקת התראות - המערכת פועלת כראוי!',
            title: 'מערכת השמאות',
            url: window.location.href
          })
        });

        if (response.ok) {
          console.log('📱 OneSignal: Test notification sent successfully');
          return true;
        } else {
          console.error('📱 OneSignal: Failed to send test notification');
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
      
      // Special handling for Safari
      if (isSafari) {
        // On Safari, check OneSignal subscription status directly
        if (window.OneSignal) {
          OneSignal.User.PushSubscription.optedIn.then(isSubscribed => {
            if (isSubscribed) {
              indicator.style.display = 'none';
              sessionStorage.setItem('oneSignalSubscribed', 'true');
            } else {
              indicator.style.display = 'block';
              indicator.style.background = '#f8d7da';
              indicator.style.borderColor = '#f5c6cb';
              indicator.style.color = '#721c24';
              indicator.innerHTML = '🔕 התראות כבויות';
              indicator.title = 'התראות כבויות - לחץ להפעלה';
            }
          }).catch(() => {
            // Fallback if OneSignal check fails
            if (permission === 'granted') {
              indicator.style.display = 'none';
            }
          });
        }
        return;
      }
      
      // For other browsers
      if (permission === 'granted' || subscribed) {
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