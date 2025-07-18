// 🎯 Floating Data Buttons System - Quick access to all data screens
(function() {
  'use strict';
  
  // Prevent multiple instantiations
  if (window.floatingButtonsInitialized) return;
  window.floatingButtonsInitialized = true;
  
  // Configuration for floating buttons
  const buttonsConfig = {
    position: { bottom: '180px', right: '20px' },
    zIndex: 9995,
    spacing: 60
  };
  
  // Button definitions
  const dataButtons = [
    {
      id: 'carDetailsBtn',
      icon: '🚗',
      label: 'פרטי רכב',
      onclick: 'toggleCarDetails',
      color: '#28a745'
    },
    {
      id: 'leviBtn', 
      icon: '📊',
      label: 'דו"ח לוי',
      onclick: 'toggleLeviDetails',
      color: '#007bff'
    },
    {
      id: 'partsBtn',
      icon: '🔧',
      label: 'חלקי חילוף',
      onclick: 'togglePartsResults',
      color: '#ffc107'
    },
    {
      id: 'invoiceBtn',
      icon: '📋',
      label: 'חשבונית',
      onclick: 'toggleInvoiceDetails',
      color: '#dc3545'
    }
  ];
  
  // Create floating buttons container
  function createFloatingButtons() {
    const container = document.createElement('div');
    container.id = 'floatingButtonsContainer';
    container.style.cssText = `
      position: fixed;
      bottom: ${buttonsConfig.position.bottom};
      right: ${buttonsConfig.position.right};
      z-index: ${buttonsConfig.zIndex};
      display: flex;
      flex-direction: column;
      gap: 10px;
    `;
    
    // Create each button
    dataButtons.forEach((buttonConfig, index) => {
      const button = createFloatingButton(buttonConfig, index);
      container.appendChild(button);
    });
    
    document.body.appendChild(container);
    console.log('✅ Floating data buttons created');
  }
  
  function createFloatingButton(config, index) {
    const button = document.createElement('button');
    button.id = config.id;
    button.setAttribute('aria-label', config.label);
    button.setAttribute('title', config.label);
    
    button.style.cssText = `
      width: 48px;
      height: 48px;
      border-radius: 50%;
      background: ${config.color};
      color: white;
      border: none;
      font-size: 20px;
      cursor: pointer;
      box-shadow: 0 2px 10px rgba(0,0,0,0.2);
      transition: all 0.3s ease;
      display: flex;
      align-items: center;
      justify-content: center;
      position: relative;
      opacity: 0.8;
    `;
    
    button.innerHTML = config.icon;
    
    // Hover effects
    button.addEventListener('mouseenter', () => {
      button.style.transform = 'scale(1.1)';
      button.style.opacity = '1';
      button.style.boxShadow = '0 4px 15px rgba(0,0,0,0.3)';
    });
    
    button.addEventListener('mouseleave', () => {
      button.style.transform = 'scale(1)';
      button.style.opacity = '0.8';
      button.style.boxShadow = '0 2px 10px rgba(0,0,0,0.2)';
    });
    
    // Click handler
    button.addEventListener('click', () => {
      console.log(`🎯 ${config.label} button clicked`);
      
      if (typeof window[config.onclick] === 'function') {
        window[config.onclick]();
      } else {
        console.warn(`Function ${config.onclick} not found`);
        // Try alternative function names
        const altNames = [
          `show${config.onclick.replace('toggle', '')}`,
          `open${config.onclick.replace('toggle', '')}`,
          config.onclick.replace('toggle', 'show')
        ];
        
        let functionCalled = false;
        for (const altName of altNames) {
          if (typeof window[altName] === 'function') {
            window[altName]();
            functionCalled = true;
            break;
          }
        }
        
        if (!functionCalled) {
          alert(`${config.label} - הפונקציה לא זמינה כרגע`);
        }
      }
    });
    
    return button;
  }
  
  // Initialize when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', createFloatingButtons);
  } else {
    createFloatingButtons();
  }
  
  console.log('🎯 Floating buttons system loaded');
})();