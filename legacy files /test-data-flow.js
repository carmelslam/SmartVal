// 🧪 Complete Data Flow Testing Script
// Tests webhook data capture, UI input capture, and helper integration after fixes

console.log('🧪 Loading Complete Data Flow Test...');

class DataFlowTester {
  constructor() {
    this.testResults = [];
    this.testsPassed = 0;
    this.testsFailed = 0;
  }

  async runAllTests() {
    console.log('🚀 Starting Complete Data Flow Tests...');
    
    await this.testHelperInitialization();
    await this.testWebhookDataCapture();
    await this.testUIInputCapture();
    await this.testMultilingualSupport();
    await this.testSessionStorageIntegration();
    await this.testFormHandlerIntegration();
    await this.testDataPersistence();
    
    this.printTestSummary();
  }

  async testHelperInitialization() {
    console.log('\n📋 Test 1: Helper System Initialization');
    
    try {
      // Test helper utility functions
      const helper = await window.safeGetHelper();
      this.assert(helper && typeof helper === 'object', 'Helper object should be available');
      
      const validation = window.validateHelper(helper);
      this.assert(validation.isValid, 'Helper structure should be valid');
      
      // Test essential sections
      const requiredSections = ['meta', 'vehicle', 'stakeholders', 'damage_assessment'];
      requiredSections.forEach(section => {
        this.assert(helper[section], `Helper should have ${section} section`);
      });
      
      console.log('✅ Helper initialization test passed');
    } catch (error) {
      console.error('❌ Helper initialization test failed:', error);
      this.testResults.push({ test: 'Helper Initialization', passed: false, error: error.message });
      this.testsFailed++;
    }
  }

  async testWebhookDataCapture() {
    console.log('\n📡 Test 2: Webhook Data Capture');
    
    try {
      // Test Hebrew Levi data processing
      const hebrewTestData = {
        Body: `פרטי רכב 1234567
יצרן: טויוטה
דגם: קמרי
שנת ייצור: 2020
בעל הרכב: יוסי כהן
מס' ק"מ: 50,000
מספר שילדה: ABC123456789
מחיר בסיס: 120,000`
      };
      
      // Clear helper first
      window.helper = {};
      sessionStorage.removeItem('helper');
      
      // Test processIncomingData function
      if (typeof window.processIncomingData === 'function') {
        const result = await window.processIncomingData(hebrewTestData, 'test_hebrew_webhook');
        
        this.assert(result.success, 'Hebrew webhook data should be processed successfully');
        this.assert(result.helperUpdated, 'Helper should be updated with webhook data');
        
        // Verify data extraction
        const helper = await window.safeGetHelper();
        this.assert(helper.vehicle?.plate === '1234567', 'Plate number should be extracted');
        this.assert(helper.vehicle?.manufacturer, 'Manufacturer should be extracted');
        this.assert(helper.stakeholders?.owner?.name, 'Owner name should be extracted');
        
        console.log('✅ Hebrew webhook data capture test passed');
      } else {
        throw new Error('processIncomingData function not available');
      }
      
      // Test direct object data
      const directTestData = {
        plate: '7654321',
        manufacturer: 'Honda',
        model: 'Civic',
        year: '2019',
        owner: 'David Smith'
      };
      
      const directResult = await window.processIncomingData(directTestData, 'test_direct_webhook');
      this.assert(directResult.success, 'Direct object webhook data should be processed successfully');
      
      console.log('✅ Webhook data capture test passed');
    } catch (error) {
      console.error('❌ Webhook data capture test failed:', error);
      this.testResults.push({ test: 'Webhook Data Capture', passed: false, error: error.message });
      this.testsFailed++;
    }
  }

  async testUIInputCapture() {
    console.log('\n🖱️ Test 3: UI Input Capture');
    
    try {
      // Create test input elements
      const testInput = document.createElement('input');
      testInput.id = 'test-plate';
      testInput.value = 'UI12345';
      document.body.appendChild(testInput);
      
      const testOwnerInput = document.createElement('input');
      testOwnerInput.id = 'owner';
      testOwnerInput.value = 'UI Test Owner';
      document.body.appendChild(testOwnerInput);
      
      // Test universal data capture if available
      if (window.universalCapture) {
        window.universalCapture.captureField(testInput, 'vehicle.plate');
        window.universalCapture.captureField(testOwnerInput, 'stakeholders.owner.name');
        
        // Wait for debounced updates
        await new Promise(resolve => setTimeout(resolve, 600));
        
        const helper = await window.safeGetHelper();
        this.assert(helper.vehicle?.plate === 'UI12345', 'UI input should be captured in helper');
        this.assert(helper.stakeholders?.owner?.name === 'UI Test Owner', 'UI owner input should be captured');
        
        console.log('✅ UI input capture test passed');
      } else {
        console.log('⚠️ Universal capture not available, testing direct helper update');
        
        const updateSuccess = await window.safeUpdateHelper('vehicle', { plate: 'UI12345' }, 'ui_test');
        this.assert(updateSuccess, 'Direct helper update should succeed');
      }
      
      // Cleanup
      document.body.removeChild(testInput);
      document.body.removeChild(testOwnerInput);
      
    } catch (error) {
      console.error('❌ UI input capture test failed:', error);
      this.testResults.push({ test: 'UI Input Capture', passed: false, error: error.message });
      this.testsFailed++;
    }
  }

  async testMultilingualSupport() {
    console.log('\n🌐 Test 4: Multilingual Support');
    
    try {
      // Test Hebrew text processing
      const hebrewData = {
        Body: `שם היצרן: מאזדה
מס' ק"מ: 75,000
בעל הרכב: משה לוי`
      };
      
      const result = await window.processIncomingData(hebrewData, 'test_hebrew');
      this.assert(result.success, 'Hebrew text should be processed successfully');
      
      // Test English data
      const englishData = {
        manufacturer: 'Toyota',
        km: '60000',
        owner: 'John Doe'
      };
      
      const englishResult = await window.processIncomingData(englishData, 'test_english');
      this.assert(englishResult.success, 'English text should be processed successfully');
      
      // Verify encoding integrity
      const helper = await window.safeGetHelper();
      if (helper.stakeholders?.owner?.name) {
        const hasHebrew = /[\u0590-\u05FF]/.test(helper.stakeholders.owner.name);
        this.assert(hasHebrew || helper.stakeholders.owner.name.includes('John'), 'Hebrew or English text should be preserved');
      }
      
      console.log('✅ Multilingual support test passed');
    } catch (error) {
      console.error('❌ Multilingual support test failed:', error);
      this.testResults.push({ test: 'Multilingual Support', passed: false, error: error.message });
      this.testsFailed++;
    }
  }

  async testSessionStorageIntegration() {
    console.log('\n💾 Test 5: Session Storage Integration');
    
    try {
      // Test data save to session storage
      const testData = {
        vehicle: {
          plate: 'STORAGE123',
          manufacturer: 'Storage Test',
          model: 'Test Model'
        }
      };
      
      const updateSuccess = await window.safeUpdateHelper('vehicle', testData.vehicle, 'storage_test');
      this.assert(updateSuccess, 'Helper update should succeed');
      
      // Verify session storage
      const sessionData = sessionStorage.getItem('helper');
      this.assert(sessionData, 'Helper data should be saved to sessionStorage');
      
      const parsedSession = JSON.parse(sessionData);
      this.assert(parsedSession.vehicle?.plate === 'STORAGE123', 'Session storage should contain correct data');
      
      // Test backup to localStorage
      const localData = localStorage.getItem('helper_data');
      this.assert(localData, 'Helper data should be backed up to localStorage');
      
      console.log('✅ Session storage integration test passed');
    } catch (error) {
      console.error('❌ Session storage integration test failed:', error);
      this.testResults.push({ test: 'Session Storage Integration', passed: false, error: error.message });
      this.testsFailed++;
    }
  }

  async testFormHandlerIntegration() {
    console.log('\n📝 Test 6: Form Handler Integration');
    
    try {
      // Test safe form wrapper
      let formCalled = false;
      const testFormHandler = function(event) {
        formCalled = true;
        return { success: true };
      };
      
      const wrappedHandler = window.withHelperIntegration(testFormHandler, 'test_module');
      this.assert(typeof wrappedHandler === 'function', 'Form wrapper should return a function');
      
      // Test wrapped handler execution
      await wrappedHandler({});
      this.assert(formCalled, 'Original form handler should be called');
      
      console.log('✅ Form handler integration test passed');
    } catch (error) {
      console.error('❌ Form handler integration test failed:', error);
      this.testResults.push({ test: 'Form Handler Integration', passed: false, error: error.message });
      this.testsFailed++;
    }
  }

  async testDataPersistence() {
    console.log('\n🔄 Test 7: Data Persistence');
    
    try {
      // Save test data
      const persistenceData = {
        test_field: 'persistence_test_' + Date.now(),
        timestamp: new Date().toISOString()
      };
      
      await window.safeUpdateHelper('test_section', persistenceData, 'persistence_test');
      
      // Clear window.helper to simulate page reload
      const savedData = JSON.parse(sessionStorage.getItem('helper'));
      window.helper = null;
      
      // Reload helper
      const reloadedHelper = await window.safeGetHelper();
      this.assert(reloadedHelper.test_section?.test_field === persistenceData.test_field, 'Data should persist across helper reloads');
      
      console.log('✅ Data persistence test passed');
    } catch (error) {
      console.error('❌ Data persistence test failed:', error);
      this.testResults.push({ test: 'Data Persistence', passed: false, error: error.message });
      this.testsFailed++;
    }
  }

  assert(condition, message) {
    if (condition) {
      this.testsPassed++;
      console.log(`  ✅ ${message}`);
    } else {
      this.testsFailed++;
      console.log(`  ❌ ${message}`);
      throw new Error(message);
    }
  }

  printTestSummary() {
    console.log('\n📊 Test Summary:');
    console.log(`Total Tests: ${this.testsPassed + this.testsFailed}`);
    console.log(`Passed: ${this.testsPassed}`);
    console.log(`Failed: ${this.testsFailed}`);
    
    if (this.testsFailed === 0) {
      console.log('🎉 All tests passed! Data flow is working correctly.');
    } else {
      console.log('⚠️ Some tests failed. Check the details above.');
    }
    
    return {
      totalTests: this.testsPassed + this.testsFailed,
      passed: this.testsPassed,
      failed: this.testsFailed,
      success: this.testsFailed === 0
    };
  }
}

// Create global tester instance
window.dataFlowTester = new DataFlowTester();

// Auto-run tests if requested
window.testDataFlow = function() {
  return window.dataFlowTester.runAllTests();
};

console.log('✅ Data Flow Tester loaded. Run window.testDataFlow() to start tests.');

export default DataFlowTester;