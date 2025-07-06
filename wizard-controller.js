// Wizard Controller - Unified flow management for damage centers and parts
(function() {
  'use strict';

  class WizardController {
    constructor() {
      this.currentStep = 0;
      this.wizardData = {
        damageCenter: {
          name: '',
          description: [],
          works: [],
          parts: [],
          repairs: []
        },
        damageCenters: [],
        totalParts: [],
        totalWorks: [],
        completedSteps: []
      };
      
      // Load existing data from sessionStorage
      this.loadExistingData();
    }

    loadExistingData() {
      try {
        const helper = JSON.parse(sessionStorage.getItem('helper') || '{}');
        if (helper.damage_sections) {
          this.wizardData.damageCenters = helper.damage_sections;
        }
        if (helper.damage_parts) {
          this.wizardData.totalParts = helper.damage_parts;
        }
        if (helper.damage_works) {
          this.wizardData.totalWorks = helper.damage_works;
        }
      } catch (e) {
        console.error('Error loading wizard data:', e);
      }
    }

    saveData() {
      try {
        const helper = JSON.parse(sessionStorage.getItem('helper') || '{}');
        helper.damage_sections = this.wizardData.damageCenters;
        helper.damage_parts = this.wizardData.totalParts;
        helper.damage_works = this.wizardData.totalWorks;
        helper.wizard_state = {
          currentStep: this.currentStep,
          completedSteps: this.wizardData.completedSteps,
          timestamp: new Date().toISOString()
        };
        sessionStorage.setItem('helper', JSON.stringify(helper));
        return true;
      } catch (e) {
        console.error('Error saving wizard data:', e);
        return false;
      }
    }

    // Navigation methods
    canNavigateNext() {
      // Validate current step before allowing navigation
      switch (this.currentStep) {
        case 0: // Damage center name
          return this.wizardData.damageCenter.name.trim() !== '';
        case 1: // Description
          return this.wizardData.damageCenter.description.length > 0;
        case 2: // Works
          return this.wizardData.damageCenter.works.length > 0;
        case 3: // Parts
          return this.wizardData.damageCenter.parts.length > 0;
        case 4: // Repairs
          return this.wizardData.damageCenter.repairs.length > 0;
        default:
          return false;
      }
    }

    navigateNext() {
      if (!this.canNavigateNext()) {
        alert('יש למלא את השדות הנדרשים לפני המעבר לשלב הבא');
        return false;
      }
      
      this.wizardData.completedSteps.push(this.currentStep);
      this.saveData();
      this.currentStep++;
      
      // Handle navigation based on step
      switch (this.currentStep) {
        case 1:
          window.location.href = 'damage-center-description.html';
          break;
        case 2:
          window.location.href = 'damage-center-works.html';
          break;
        case 3:
          window.location.href = 'parts-required.html?mode=wizard';
          break;
        case 4:
          window.location.href = 'damage-center-repairs.html';
          break;
        case 5:
          this.finishDamageCenter();
          break;
      }
      return true;
    }

    navigateBack() {
      if (this.currentStep === 0) {
        window.location.href = 'selection.html';
        return;
      }
      
      this.currentStep--;
      this.saveData();
      
      // Navigate to previous page
      switch (this.currentStep) {
        case 0:
          window.location.href = 'damage-center-flow.html';
          break;
        case 1:
          window.location.href = 'damage-center-description.html';
          break;
        case 2:
          window.location.href = 'damage-center-works.html';
          break;
        case 3:
          window.location.href = 'parts-required.html?mode=wizard';
          break;
      }
    }

    finishDamageCenter() {
      // Add current damage center to the list
      this.wizardData.damageCenters.push({
        ...this.wizardData.damageCenter,
        completedAt: new Date().toISOString()
      });
      
      // Add parts and works to totals
      this.wizardData.totalParts.push(...this.wizardData.damageCenter.parts);
      this.wizardData.totalWorks.push(...this.wizardData.damageCenter.works);
      
      this.saveData();
      
      if (confirm('מוקד הנזק נשמר בהצלחה! האם להוסיף מוקד נזק נוסף?')) {
        // Reset for new damage center
        this.wizardData.damageCenter = {
          name: '',
          description: [],
          works: [],
          parts: [],
          repairs: []
        };
        this.currentStep = 0;
        this.saveData();
        window.location.href = 'damage-center-flow.html';
      } else {
        // Go to summary
        window.location.href = 'expertise-summary.html';
      }
    }

    // Data management methods
    addItem(type, item) {
      if (!this.wizardData.damageCenter[type]) {
        this.wizardData.damageCenter[type] = [];
      }
      this.wizardData.damageCenter[type].push(item);
      this.saveData();
    }

    removeItem(type, index) {
      if (this.wizardData.damageCenter[type] && 
          this.wizardData.damageCenter[type][index] !== undefined) {
        this.wizardData.damageCenter[type].splice(index, 1);
        this.saveData();
      }
    }

    updateItem(type, index, value) {
      if (this.wizardData.damageCenter[type] && 
          this.wizardData.damageCenter[type][index] !== undefined) {
        this.wizardData.damageCenter[type][index] = value;
        this.saveData();
      }
    }

    // Helper methods
    getCurrentStepData() {
      const steps = ['center', 'description', 'works', 'parts', 'repairs'];
      const currentType = steps[this.currentStep];
      return {
        type: currentType,
        data: this.wizardData.damageCenter[currentType] || [],
        stepNumber: this.currentStep + 1,
        totalSteps: steps.length,
        title: this.getStepTitle(this.currentStep)
      };
    }

    getStepTitle(step) {
      const titles = [
        'בחירת מוקד נזק',
        'תיאור הנזק',
        'עבודות נדרשות',
        'חלקים נדרשים',
        'תיקונים נדרשים'
      ];
      return titles[step] || '';
    }

    getProgress() {
      const totalSteps = 5;
      return {
        current: this.currentStep + 1,
        total: totalSteps,
        percentage: Math.round(((this.currentStep + 1) / totalSteps) * 100),
        completedSteps: this.wizardData.completedSteps.length
      };
    }

    // Validation methods
    validateDamageCenter() {
      const dc = this.wizardData.damageCenter;
      const errors = [];
      
      if (!dc.name || dc.name.trim() === '') {
        errors.push('שם מוקד הנזק חסר');
      }
      if (!dc.description || dc.description.length === 0) {
        errors.push('תיאור הנזק חסר');
      }
      if (!dc.works || dc.works.length === 0) {
        errors.push('לא הוגדרו עבודות');
      }
      if (!dc.parts || dc.parts.length === 0) {
        errors.push('לא הוגדרו חלקים');
      }
      
      return {
        isValid: errors.length === 0,
        errors: errors
      };
    }

    // Export/Import functionality
    exportData() {
      return JSON.stringify(this.wizardData, null, 2);
    }

    importData(jsonData) {
      try {
        const data = JSON.parse(jsonData);
        this.wizardData = data;
        this.saveData();
        return true;
      } catch (e) {
        console.error('Error importing wizard data:', e);
        return false;
      }
    }

    // Reset functionality
    reset() {
      if (confirm('האם אתה בטוח שברצונך לאפס את כל הנתונים?')) {
        this.currentStep = 0;
        this.wizardData = {
          damageCenter: {
            name: '',
            description: [],
            works: [],
            parts: [],
            repairs: []
          },
          damageCenters: [],
          totalParts: [],
          totalWorks: [],
          completedSteps: []
        };
        this.saveData();
        return true;
      }
      return false;
    }
  }

  // Create global instance
  window.wizardController = new WizardController();

  // Expose utility functions
  window.wizardUtils = {
    next: () => window.wizardController.navigateNext(),
    back: () => window.wizardController.navigateBack(),
    save: () => window.wizardController.saveData(),
    reset: () => window.wizardController.reset(),
    getProgress: () => window.wizardController.getProgress(),
    getCurrentData: () => window.wizardController.getCurrentStepData(),
    addItem: (type, item) => window.wizardController.addItem(type, item),
    removeItem: (type, index) => window.wizardController.removeItem(type, index),
    updateItem: (type, index, value) => window.wizardController.updateItem(type, index, value)
  };

  console.log('✅ Wizard Controller initialized');

})();