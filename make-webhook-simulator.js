// 🌐 Make.com Webhook Response Simulator
// Simulates the rich car data that should come back from Make.com after case submission

// Global function to simulate Make.com sending rich car data back to the system
window.simulateMakeWebhookResponse = function(plateNumber = '5785269') {
  console.log(`🌐 Simulating Make.com webhook response for plate: ${plateNumber}`);
  
  // Simulate the rich car data that Make.com should return after database lookup
  const richCarData = {
    // Basic identification
    plate: plateNumber,
    case_id: `YC-${plateNumber}-${new Date().getFullYear()}`,
    
    // Vehicle details (from MOT database)
    manufacturer: 'ביואיק',
    model: 'LUCERNE',
    model_type: 'סדאן',
    vehicle_type: 'פרטי',
    trim: 'CXL',
    year: '2009',
    production_date: '05/2009',
    
    // Technical specifications
    chassis: '1G4HD57258U196450',
    engine_volume: '3791',
    fuel_type: 'בנזין',
    model_code: 'HD572',
    engine_model: '428',
    drive_type: '4X2',
    transmission: 'אוטומטית',
    
    // Registration details
    office_code: '156-11',
    registration_date: '2009-05-15',
    ownership_type: 'פרטי',
    category: 'רכב פרטי',
    
    // Owner information
    owner: 'כרמל כיוף',
    owner_address: '',
    owner_phone: '',
    
    // Location/garage info
    location: 'UMI חיפה',
    garage_name: 'UMI חיפה',
    garage_phone: '',
    garage_email: '',
    
    // Status and metadata
    status: 'active',
    last_updated: new Date().toISOString(),
    data_source: 'mot_database',
    
    // Additional features/options
    features: 'כיסא חשמלי, מזגן אוטומטי, ABS, כריות אוויר',
    color: '',
    km: '',
    
    // Insurance placeholders
    insurance_company: '',
    policy_number: '',
    
    // Make.com processing metadata
    make_com_processed: true,
    processing_timestamp: new Date().toISOString(),
    webhook_source: 'OPEN_CASE_UI'
  };
  
  console.log('📋 Rich car data generated:', richCarData);
  
  // Store in multiple locations for different modules to find
  sessionStorage.setItem('makeCarData', JSON.stringify(richCarData));
  sessionStorage.setItem('carDataFromMake', JSON.stringify(richCarData));
  sessionStorage.setItem('vehicleDetails', JSON.stringify(richCarData));
  
  // CRITICAL FIX: Store as carData for floating button
  sessionStorage.setItem('carData', JSON.stringify(richCarData));
  console.log('✅ Stored as carData for floating button compatibility');
  
  // Update helper if available
  if (typeof window.updateHelper === 'function') {
    // CRITICAL FIX: Create clean car_details without damage_date or timestamp
    const cleanCarDetails = { ...richCarData };
    delete cleanCarDetails.damage_date;  // Remove any damage_date
    delete cleanCarDetails.timestamp;    // Remove timestamp
    delete cleanCarDetails.processing_timestamp; // Remove processing timestamp
    
    window.updateHelper('car_details', cleanCarDetails);
    window.updateHelper('vehicle', richCarData);
    window.updateHelper('meta', {
      plate: richCarData.plate,
      case_id: richCarData.case_id,
      owner_name: richCarData.owner,
      inspection_location: richCarData.location
    });
    
    // CRITICAL FIX: Set proper case_info with correct field separation
    const currentYear = new Date().getFullYear();
    window.updateHelper('case_info', {
      case_id: `YC-${richCarData.plate}-${currentYear}`,  // Proper format: YC-PLATENUMBER-YEAR
      plate: richCarData.plate,
      inspection_location: richCarData.location,
      inspection_date: richCarData.timestamp ? richCarData.timestamp.split('T')[0] : new Date().toISOString().split('T')[0],
      created_at: new Date().toISOString(),
      status: 'active',
      report_type: '',        // Empty for expertise stage
      report_type_display: '' // Empty for expertise stage
      // Do NOT set damage_date here - it should remain empty until general info page
      // Do NOT set garage_name here - it's separate from location
    });
    console.log('✅ Rich car data stored in helper');
  }
  
  // Trigger data checking across all modules
  if (typeof window.checkForIncomingData === 'function') {
    window.checkForIncomingData().catch(console.error);
  }
  
  // Show notification that rich data was received - DISABLED to prevent UI popups
  // showRichDataNotification(richCarData); // Commented out to remove UI notifications
  console.log('✅ Rich data received (UI notification disabled):', richCarData);
  
  return richCarData;
};

// Different car examples for testing
window.simulateCarExamples = {
  buick_lucerne: () => simulateMakeWebhookResponse('5785269'),
  
  toyota_camry: () => simulateMakeWebhookResponse('1234567', {
    manufacturer: 'טויוטה',
    model: 'קאמרי',
    model_type: 'סדאן',
    year: '2020',
    chassis: '4T1BF1FK3LU123456',
    engine_volume: '2500',
    fuel_type: 'בנזין',
    owner: 'דוגמה טויוטה'
  }),
  
  honda_civic: () => simulateCarExamples('7891234', {
    manufacturer: 'הונדה',
    model: 'סיוויק',
    model_type: 'האצ\'בק',
    year: '2018',
    chassis: '2HGFC2F50JH123456',
    engine_volume: '1500',
    fuel_type: 'בנזין',
    owner: 'דוגמה הונדה'
  })
};

// Show rich data notification
function showRichDataNotification(carData) {
  const notification = document.createElement('div');
  notification.id = 'richDataNotification';
  notification.style.cssText = `
    position: fixed;
    top: 20px;
    left: 50%;
    transform: translateX(-50%);
    background: linear-gradient(135deg, #28a745, #20c997);
    color: white;
    padding: 20px;
    border-radius: 15px;
    font-weight: bold;
    z-index: 10000;
    box-shadow: 0 8px 25px rgba(0,0,0,0.3);
    font-family: 'Assistant', sans-serif;
    max-width: 600px;
    text-align: center;
    animation: slideDown 0.5s ease-out;
  `;
  
  // Add CSS animation
  if (!document.getElementById('richDataAnimations')) {
    const style = document.createElement('style');
    style.id = 'richDataAnimations';
    style.textContent = `
      @keyframes slideDown {
        from { transform: translateX(-50%) translateY(-100%); opacity: 0; }
        to { transform: translateX(-50%) translateY(0); opacity: 1; }
      }
      @keyframes slideUp {
        from { transform: translateX(-50%) translateY(0); opacity: 1; }
        to { transform: translateX(-50%) translateY(-100%); opacity: 0; }
      }
    `;
    document.head.appendChild(style);
  }
  
  notification.innerHTML = `
    <div style="display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 15px;">
      <div style="flex: 1;">
        <div style="font-size: 18px; margin-bottom: 8px;">🚗 נתוני רכב מעודכנים התקבלו!</div>
        <div style="font-size: 14px; opacity: 0.9;">
          ${carData.manufacturer} ${carData.model} • ${carData.year} • ${carData.plate}
        </div>
        <div style="font-size: 12px; opacity: 0.8; margin-top: 5px;">
          מקור: מאגר משרד התחבורה
        </div>
      </div>
      <div style="display: flex; gap: 10px; align-items: center;">
        <button onclick="showDetailedCarInfo()" style="background: rgba(255,255,255,0.2); border: 1px solid white; color: white; padding: 8px 15px; border-radius: 8px; cursor: pointer; font-size: 14px;">
          הצג פרטים
        </button>
        <button onclick="closeRichDataNotification()" style="background: rgba(255,255,255,0.2); border: none; color: white; width: 30px; height: 30px; border-radius: 50%; cursor: pointer; font-size: 16px;">
          ✕
        </button>
      </div>
    </div>
  `;
  
  document.body.appendChild(notification);
  
  // Store car data globally for detailed view
  window.currentRichCarData = carData;
  
  // Auto-hide after 10 seconds
  setTimeout(() => {
    closeRichDataNotification();
  }, 10000);
}

// Show detailed car information
window.showDetailedCarInfo = function() {
  const carData = window.currentRichCarData;
  if (!carData) return;
  
  let detailModal = document.getElementById('detailedCarModal');
  if (!detailModal) {
    detailModal = document.createElement('div');
    detailModal.id = 'detailedCarModal';
    detailModal.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(0,0,0,0.5);
      z-index: 10001;
      display: flex;
      align-items: center;
      justify-content: center;
      font-family: 'Assistant', sans-serif;
    `;
    document.body.appendChild(detailModal);
  }
  
  detailModal.innerHTML = `
    <div style="background: white; padding: 30px; border-radius: 20px; max-width: 700px; max-height: 80vh; overflow-y: auto; width: 90%;">
      <div style="background: linear-gradient(135deg, #007bff, #0056b3); color: white; margin: -30px -30px 25px -30px; padding: 25px; border-radius: 20px 20px 0 0; position: relative;">
        <h2 style="margin: 0; text-align: center; font-size: 24px;">🚗 פרטי רכב מלאים</h2>
        <button onclick="closeDetailedCarModal()" style="position: absolute; top: 20px; left: 20px; background: rgba(255,255,255,0.2); border: none; color: white; width: 35px; height: 35px; border-radius: 50%; cursor: pointer; font-size: 18px;">✕</button>
      </div>
      
      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 25px;">
        <div style="background: #f8f9fa; padding: 20px; border-radius: 12px;">
          <h3 style="margin: 0 0 15px 0; color: #007bff; font-size: 18px;">פרטי זיהוי</h3>
          <div style="display: grid; gap: 8px; font-size: 14px;">
            <div><strong>מספר רכב:</strong> ${carData.plate}</div>
            <div><strong>מספר שלדה:</strong> ${carData.chassis}</div>
            <div><strong>קוד משרד התחבורה:</strong> ${carData.office_code}</div>
            <div><strong>מספר תיק:</strong> ${carData.case_id}</div>
          </div>
        </div>
        
        <div style="background: #f8f9fa; padding: 20px; border-radius: 12px;">
          <h3 style="margin: 0 0 15px 0; color: #007bff; font-size: 18px;">פרטי רכב</h3>
          <div style="display: grid; gap: 8px; font-size: 14px;">
            <div><strong>יצרן:</strong> ${carData.manufacturer}</div>
            <div><strong>דגם:</strong> ${carData.model}</div>
            <div><strong>רמת גימור:</strong> ${carData.trim}</div>
            <div><strong>סוג דגם:</strong> ${carData.model_type}</div>
          </div>
        </div>
        
        <div style="background: #f8f9fa; padding: 20px; border-radius: 12px;">
          <h3 style="margin: 0 0 15px 0; color: #007bff; font-size: 18px;">מפרט טכני</h3>
          <div style="display: grid; gap: 8px; font-size: 14px;">
            <div><strong>שנת ייצור:</strong> ${carData.year}</div>
            <div><strong>נפח מנוע:</strong> ${carData.engine_volume}</div>
            <div><strong>סוג דלק:</strong> ${carData.fuel_type}</div>
            <div><strong>הנעה:</strong> ${carData.drive_type}</div>
          </div>
        </div>
        
        <div style="background: #f8f9fa; padding: 20px; border-radius: 12px;">
          <h3 style="margin: 0 0 15px 0; color: #007bff; font-size: 18px;">בעלות ומיקום</h3>
          <div style="display: grid; gap: 8px; font-size: 14px;">
            <div><strong>בעל הרכב:</strong> ${carData.owner}</div>
            <div><strong>סוג בעלות:</strong> ${carData.ownership_type}</div>
            <div><strong>מיקום:</strong> ${carData.location}</div>
            <div><strong>תאריך רישום:</strong> ${carData.registration_date}</div>
          </div>
        </div>
      </div>
      
      ${carData.features ? `
        <div style="background: #e9ecef; padding: 15px; border-radius: 10px; margin-bottom: 20px;">
          <h4 style="margin: 0 0 10px 0; color: #495057;">מאפיינים נוספים:</h4>
          <div style="font-size: 14px; color: #666;">${carData.features}</div>
        </div>
      ` : ''}
      
      <div style="background: #d1ecf1; padding: 15px; border-radius: 10px; font-size: 14px; color: #0c5460;">
        <strong>💡 המידע נטען ממאגר משרד התחבורה</strong><br>
        עודכן: ${new Date(carData.last_updated).toLocaleString('he-IL')}
      </div>
      
      <div style="text-align: center; margin-top: 20px;">
        <button onclick="closeDetailedCarModal()" style="background: #6c757d; color: white; border: none; padding: 12px 30px; border-radius: 8px; cursor: pointer; font-size: 16px; font-weight: bold;">
          סגור
        </button>
      </div>
    </div>
  `;
  
  detailModal.style.display = 'flex';
};

// Close notifications
window.closeRichDataNotification = function() {
  const notification = document.getElementById('richDataNotification');
  if (notification) {
    notification.style.animation = 'slideUp 0.3s ease-in forwards';
    setTimeout(() => {
      if (notification.parentNode) {
        notification.parentNode.removeChild(notification);
      }
    }, 300);
  }
};

window.closeDetailedCarModal = function() {
  const modal = document.getElementById('detailedCarModal');
  if (modal) {
    modal.style.display = 'none';
  }
};

// Auto-initialize if in browser
if (typeof window !== 'undefined') {
  console.log('🌐 Make.com webhook simulator loaded');
  console.log('💡 Use window.simulateMakeWebhookResponse() to test rich car data');
}