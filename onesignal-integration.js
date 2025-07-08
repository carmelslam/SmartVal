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

        // Log current domain for debugging
        console.log('📱 OneSignal: Current domain:', window.location.origin);
        console.log('📱 OneSignal: Initializing on post-login page...');

        // Check if already initialized
        if (this.initialized) {
          console.log('📱 OneSignal: Already initialized');
          return;
        }

        // Check if OneSignal is already initialized from login page
        if (window.OneSignal && window.OneSignal.init) {
          console.log('📱 OneSignal: Using existing initialization from login page');
          this.initialized = true;
          
          // Set user external ID for targeting
          await this.setUserContext(auth);

          // Check subscription status
          await this.checkSubscriptionStatus();
          
          return;
        }

        // Load OneSignal SDK if not already loaded
        if (!window.OneSignal) {
          await this.loadOneSignalSDK();
        }

        // Initialize OneSignal
        window.OneSignalDeferred = window.OneSignalDeferred || [];
        
        return new Promise((resolve, reject) => {
          OneSignalDeferred.push(async (OneSignal) => {
            try {
              // Simplified configuration to avoid CORS issues
              const initConfig = {
                appId: ONESIGNAL_APP_ID,
                allowLocalhostAsSecureOrigin: true
              };
              
              console.log('📱 OneSignal: Init config:', initConfig);
              await OneSignal.init(initConfig);

              this.initialized = true;
              console.log('📱 OneSignal: Initialized successfully on post-login page');

              // Set user external ID for targeting
              await this.setUserContext(auth);

              // Check subscription status
              await this.checkSubscriptionStatus();

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

    async checkSubscriptionStatus() {
      try {
        if (!window.OneSignal) return;

        // Use browser's native permission API as fallback
        let permission;
        try {
          permission = await OneSignal.Notifications.permission;
        } catch (e) {
          // Fallback to browser native permission
          permission = Notification.permission;
        }
        
        this.subscribed = (permission === 'granted');

        console.log('📱 OneSignal: Subscription status:', {
          permission: permission,
          subscribed: this.subscribed
        });

        // Store subscription status
        sessionStorage.setItem('oneSignalSubscribed', this.subscribed.toString());

        return this.subscribed;
      } catch (error) {
        console.error('📱 OneSignal: Error checking subscription:', error);
        return false;
      }
    }

    async requestPermission() {
      try {
        console.log('📱 OneSignal: Requesting notification permission...');
        
        let permission;
        try {
          if (window.OneSignal && window.OneSignal.Notifications) {
            permission = await OneSignal.Notifications.requestPermission();
          } else {
            // Fallback to browser native permission
            const result = await Notification.requestPermission();
            permission = (result === 'granted');
          }
        } catch (e) {
          console.log('📱 OneSignal: Using fallback permission request');
          const result = await Notification.requestPermission();
          permission = (result === 'granted');
        }
        
        this.subscribed = permission;

        if (permission) {
          console.log('📱 OneSignal: Permission granted');
          await this.setUserContext(this.userToken || sessionStorage.getItem('auth'));
          // Force update subscription status
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
    `;

    function updateIndicator() {
      const status = window.oneSignalManager.getStatus();
      const subscribed = sessionStorage.getItem('oneSignalSubscribed') === 'true';
      
      if (subscribed) {
        indicator.style.background = '#d4edda';
        indicator.style.borderColor = '#c3e6cb';
        indicator.style.color = '#155724';
        indicator.innerHTML = '🔔 התראות פעילות';
        indicator.title = 'התראות פעילות - לחץ לבדיקה';
      } else {
        indicator.style.background = '#f8d7da';
        indicator.style.borderColor = '#f5c6cb';
        indicator.style.color = '#721c24';
        indicator.innerHTML = '🔕 התראות כבויות';
        indicator.title = 'התראות כבויות - לחץ להפעלה';
      }
    }

    indicator.addEventListener('click', async () => {
      const subscribed = sessionStorage.getItem('oneSignalSubscribed') === 'true';
      
      if (!subscribed) {
        const granted = await window.oneSignalManager.requestPermission();
        if (granted) {
          // Force update the session storage and indicator
          sessionStorage.setItem('oneSignalSubscribed', 'true');
          updateIndicator();
          alert('✅ התראות הופעלו בהצלחה!');
        } else {
          alert('❌ לא ניתן להפעיל התראות. אנא אפשר התראות בדפדפן.');
        }
      } else {
        // Send test notification
        const sent = await window.oneSignalManager.sendTestNotification();
        if (sent) {
          alert('📱 התראת בדיקה נשלחה!');
        } else {
          alert('❌ שגיאה בשליחת התראת בדיקה');
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