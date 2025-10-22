// Logout sound functionality for system-wide use
(async function() {
  'use strict';

  // Prevent multiple initializations
  if (window.logoutSoundLoaded) return;
  window.logoutSoundLoaded = true;
  
  // Load dependencies if not already available
  if (!window.supabase) {
    try {
      const { supabase } = await import('./lib/supabaseClient.js');
      window.supabase = supabase;
    } catch (err) {
      console.warn('⚠️ Could not load supabase client:', err);
    }
  }
  
  if (!window.supabaseHelperService) {
    try {
      const { supabaseHelperService } = await import('./services/supabaseHelperService.js');
      window.supabaseHelperService = supabaseHelperService;
    } catch (err) {
      console.warn('⚠️ Could not load supabaseHelperService:', err);
    }
  }
  
  if (!window.WEBHOOKS) {
    try {
      const { WEBHOOKS } = await import('./webhook.js');
      window.WEBHOOKS = WEBHOOKS;
    } catch (err) {
      console.warn('⚠️ Could not load WEBHOOKS:', err);
    }
  }

  // Initialize car driving away sound for logout
  let carDrivingAwaySound = null;
  
  try {
    carDrivingAwaySound = new Audio('./assets/car_driving_away.mp3');
    carDrivingAwaySound.volume = 0.5; // Set volume to 50%
    carDrivingAwaySound.addEventListener('canplaythrough', () => {
      console.log('🚗 Car driving away sound loaded successfully');
    });
    carDrivingAwaySound.addEventListener('error', (e) => {
      console.log('🔊 Car driving away sound failed to load:', e);
    });
  } catch(e) {
    console.log('🔊 Failed to initialize car driving away sound:', e.message);
  }
  
  // Global logout function with driving away sound and Supabase backup
  window.logoutWithSound = async function() {
    console.log('🚗 Logout initiated with driving away sound');
    
    // Play driving away sound
    if (carDrivingAwaySound) {
      carDrivingAwaySound.play().catch(e => 
        console.log('🔊 Driving away sound skipped:', e.message)
      );
    }
    
    // Show logout message
    showLogoutMessage();
    
    // Preserve helper data and save to Supabase
    const helperData = sessionStorage.getItem('helper');
    
    if (helperData) {
      try {
        const helper = JSON.parse(helperData);
        let plate = helper?.meta?.plate;
        const supabaseCaseId = helper?.case_info?.supabase_case_id;
        
        console.log('🔍 Logout - Helper state:', {
          plate: plate,
          supabaseCaseId: supabaseCaseId,
          hasSupabaseClient: !!window.supabase,
          case_info: helper?.case_info
        });
        
        // Normalize plate - remove dashes and special characters
        if (plate) {
          plate = plate.replace(/[-\/\s]/g, '');
        }
        
        // Query Supabase for next version number
        let version = 1;
        if (supabaseCaseId && window.supabase) {
          try {
            const { data: maxVer } = await window.supabase
              .from('case_helper')
              .select('version')
              .eq('case_id', supabaseCaseId)
              .order('version', { ascending: false })
              .limit(1)
              .single();
            
            version = (maxVer?.version || 0) + 1;
            console.log(`📊 Next version for logout: ${version}`);
          } catch (err) {
            console.warn('⚠️ Version query failed, defaulting to 1:', err);
          }
        } else {
          console.log('⚠️ No supabase_case_id or supabase client, using version 1');
        }
        
        const timestamp = new Date().toISOString();
        
        // Send to Make.com webhook
        if (window.WEBHOOKS && window.WEBHOOKS.HELPER_EXPORT) {
          const payload = {
            type: 'logout_backup',
            plate_helper_timestamp: `${plate}_helper_v${version}`,
            helper_data: helper,
            logout_time: timestamp,
            reason: 'auto_logout'
          };
          
          fetch(window.WEBHOOKS.HELPER_EXPORT, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
          }).catch(err => console.warn('Failed to send to Make.com:', err));
        }
        
        // Save to Supabase (non-blocking)
        if (window.supabaseHelperService && plate) {
          window.supabaseHelperService.saveHelper({
            plate: plate,
            helperData: helper,
            helperName: `${plate}_helper_v${version}`,
            timestamp: timestamp
          }).then(result => {
            if (result.success) {
              console.log(`✅ Helper v${version} backed up to Supabase`);
            } else {
              console.log('⚠️ Supabase backup failed (Make.com still worked)');
            }
          }).catch(err => {
            console.warn('⚠️ Supabase backup error (non-critical):', err);
          });
        }
        
        // Save to localStorage for persistence
        localStorage.setItem('lastCaseData', helperData);
        localStorage.setItem('lastCaseTimestamp', timestamp);
        
      } catch (error) {
        console.error('Error saving helper data on logout:', error);
      }
    }
    
    // Clear only auth-related session data
    sessionStorage.removeItem('auth');
    sessionStorage.removeItem('loginTime');
    sessionStorage.removeItem('lastActivityTime');
    
    // Redirect after sound duration (approximately 2.5 seconds)
    setTimeout(() => {
      window.location.href = 'index.html';
    }, 2500);
  };

  function showLogoutMessage() {
    // Create temporary logout overlay
    const overlay = document.createElement('div');
    overlay.id = 'logoutOverlay';
    overlay.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(30, 58, 138, 0.95);
      z-index: 10000;
      display: flex;
      justify-content: center;
      align-items: center;
      color: white;
      font-family: 'Assistant', Arial, sans-serif;
      font-size: 24px;
      text-align: center;
      direction: rtl;
    `;
    
    overlay.innerHTML = `
      <div style="background: rgba(255,255,255,0.1); padding: 40px; border-radius: 16px; border: 2px solid rgba(255,255,255,0.3);">
        <div style="font-size: 48px; margin-bottom: 20px;">🚗</div>
        <h2 style="margin: 0 0 10px 0; font-size: 28px;">להתראות!</h2>
        <p style="margin: 0; font-size: 18px; opacity: 0.9;">מעביר חזרה לדף הכניסה...</p>
      </div>
    `;
    
    document.body.appendChild(overlay);
    
    // Remove overlay when redirecting
    setTimeout(() => {
      if (overlay.parentNode) {
        overlay.parentNode.removeChild(overlay);
      }
    }, 2400);
  }

  // Enhanced logout function that can be used as a replacement for existing logout functions
  window.enhancedLogout = function() {
    return window.logoutWithSound();
  };

  console.log('🚗 Logout sound functionality loaded');

})();