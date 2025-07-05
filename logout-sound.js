// Logout sound functionality for system-wide use
(function() {
  'use strict';

  // Prevent multiple initializations
  if (window.logoutSoundLoaded) return;
  window.logoutSoundLoaded = true;

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
  
  // Global logout function with driving away sound
  window.logoutWithSound = function() {
    console.log('🚗 Logout initiated with driving away sound');
    
    // Play driving away sound
    if (carDrivingAwaySound) {
      carDrivingAwaySound.play().catch(e => 
        console.log('🔊 Driving away sound skipped:', e.message)
      );
    }
    
    // Clear session data
    sessionStorage.clear();
    localStorage.clear();
    
    // Show logout message briefly on current page
    showLogoutMessage();
    
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