// 🚗 CAR DETAILS MODULE (Enhanced with Field Mapping)
import { helper, updateHelper, saveHelperToStorage, getVehicleData, syncVehicleData } from './helper.js';
import { ROUTER } from './router.js';
import { populateUIFromHelper, getNestedValue } from './field-mapping-dictionary.js';

export function carDetails() {
  const container = document.getElementById('app');
  const vehicle = getVehicleData();

  container.innerHTML = `
    <div class="module">
      <h2>פרטי רכב שהתקבלו</h2>
      <label>מספר תיק: YC-${getNestedValue(helper, 'vehicle.plate', '')}-${new Date().getFullYear()}</label><br/>
      <label>מספר רכב: <input type="text" id="plate" value="${getNestedValue(helper, 'vehicle.plate', '')}" /></label><br/>
      <label>שם היצרן: <input type="text" id="manufacturer" value="${getNestedValue(helper, 'vehicle.manufacturer', '')}" /></label><br/>
      <label>דגם: <input type="text" id="model" value="${getNestedValue(helper, 'vehicle.model', '')}" /></label><br/>
      <label>רמת גימור: <input type="text" id="trim" value="${getNestedValue(helper, 'vehicle.trim', '')}" /></label><br/>
      <label>מספר שילדה: <input type="text" id="chassis" value="${getNestedValue(helper, 'vehicle.chassis', '')}" /></label><br/>
      <label>שנת ייצור: <input type="number" id="year" value="${getNestedValue(helper, 'vehicle.year', '')}" /></label><br/>
     <label>קוד משרד התחבורה: <input type="text" id="office_code" value="${getNestedValue(helper, 'vehicle.office_code', '')}" /></label><br/>
      <label>סוג הדגם: <input type="text" id="model_type" value="${getNestedValue(helper, 'vehicle.model_type', '')}" /></label><br/>
      <label>מד אוץ (קילומטראז׳): <input type="number" id="km" value="${getNestedValue(helper, 'vehicle.km', '')}" /></label><br/>
      <label>תאריך נזק: <input type="date" id="damage_date" value="${getNestedValue(helper, 'case_info.damage_date', '')}" /></label><br/>
      <label>תאריך בדיקה: <input type="date" id="inspection_date" value="${getNestedValue(helper, 'case_info.inspection_date', '')}" /></label><br/>
      <label>קוד דגם: <input type="text" id="model_code" value="${getNestedValue(helper, 'vehicle.model_code', '')}" /></label><br/>
      <label>סוג הרכב: <input type="text" id="ownership" value="${getNestedValue(helper, 'vehicle.ownership_type', '')}" /></label><br/>
      <label>שם בעל הרכב: <input type="text" id="owner_name" value="${getNestedValue(helper, 'stakeholders.owner.name', '')}" /></label><br/>
      <label>כתובת: <input type="text" id="address" value="${getNestedValue(helper, 'stakeholders.owner.address', '')}" /></label><br/>
      <label>טלפון: <input type="text" id="phone" value="${getNestedValue(helper, 'stakeholders.owner.phone', '')}" /></label><br/>
      <label>מוסך: <input type="text" id="garage" value="${getNestedValue(helper, 'stakeholders.garage.name', '')}" /></label><br/>
      <label>אימייל מוסך: <input type="email" id="garage_email" value="${getNestedValue(helper, 'stakeholders.garage.email', '')}" /></label><br/>
      <label>טלפון מוסך: <input type="text" id="garage_phone" value="${getNestedValue(helper, 'stakeholders.garage.phone', '')}" /></label><br/>
      <label>חברת ביטוח: <input type="text" id="insurance_company" value="${getNestedValue(helper, 'stakeholders.insurance.company', '')}" /></label><br/>
      <label>אימייל חברת ביטוח: <input type="email" id="insurance_email" value="${getNestedValue(helper, 'stakeholders.insurance.email', '')}" /></label><br/>
      <label>סוכן ביטוח: <input type="text" id="insurance_agent" value="${getNestedValue(helper, 'stakeholders.insurance.agent.name', '')}" /></label><br/>
      <label>טלפון סוכן ביטוח: <input type="text" id="insurance_agent_phone" value="${getNestedValue(helper, 'stakeholders.insurance.agent.phone', '')}" /></label><br/>
      <label>אימייל סוכן ביטוח: <input type="email" id="insurance_agent_email" value="${getNestedValue(helper, 'stakeholders.insurance.agent.email', '')}" /></label><br/>
      <label>סוג נזק: <input type="text" id="damage_type" value="${getNestedValue(helper, 'case_info.damage_type', '')}" /></label><br/>
      <label>מקום בדיקה: <input type="text" id="inspection_location" value="${getNestedValue(helper, 'case_info.inspection_location', '')}" /></label><br/>
      <label>מחיר בסיס: <input type="text" id="base_price" value="${vehicle.base_price || ''}" /></label><br/>
      <label>נפח מנוע: <input type="text" id="engine_volume" value="${vehicle.engine_volume || ''}" /></label><br/>
      <label>סוג דלק: <input type="text" id="fuel_type" value="${vehicle.fuel_type || ''}" /></label><br/>
      <label>מספר דגם הרכב: <input type="text" id="model_code_number" value="${vehicle.model_code_number || ''}" /></label><br/>
      <label>דגם מנוע: <input type="text" id="engine_model" value="${vehicle.engine_model || ''}" /></label><br/>
      <label>הנעה: <input type="text" id="drive" value="${vehicle.drive || ''}" /></label><br/>

      <button id="save-car">שמור והמשך</button>
    </div>
  `;

  document.getElementById('save-car').onclick = () => {
    // Use synchronized vehicle data update
    const vehicleData = {
      plate: document.getElementById('plate').value.trim(),
      manufacturer: document.getElementById('manufacturer').value.trim(),
      model: document.getElementById('model').value.trim(),
      model_type: document.getElementById('model_type').value.trim(),
      year: +document.getElementById('year').value,
      chassis: document.getElementById('chassis').value.trim(),
      km: +document.getElementById('km').value,
      trim: document.getElementById('trim').value.trim(),
      model_code: document.getElementById('model_code').value.trim(),
      ownership_type: document.getElementById('ownership').value.trim(),
      engine_volume: document.getElementById('engine_volume').value.trim(),
      fuel_type: document.getElementById('fuel_type').value.trim(),
      engine_model: document.getElementById('engine_model').value.trim(),
      drive: document.getElementById('drive').value.trim(),
      base_price: document.getElementById('base_price').value.trim(),
      office_code: document.getElementById('office_code').value.trim()
    };
    syncVehicleData(vehicleData);
    
    // Update meta with additional case information
    updateHelper('meta', {
      inspection_date: document.getElementById('inspection_date').value,
      damage_date: document.getElementById('damage_date').value,
      owner_name: document.getElementById('owner_name').value.trim(),
      address: document.getElementById('address').value.trim(),
      phone: document.getElementById('phone').value.trim(),
      garage: document.getElementById('garage').value.trim(),
      garage_email: document.getElementById('garage_email').value.trim(),
      garage_phone: document.getElementById('garage_phone').value.trim(),
      insurance_company: document.getElementById('insurance_company').value.trim(),
      insurance_email: document.getElementById('insurance_email').value.trim(),
      insurance_agent: document.getElementById('insurance_agent').value.trim(),
      insurance_agent_phone: document.getElementById('insurance_agent_phone').value.trim(),
      insurance_agent_email: document.getElementById('insurance_agent_email').value.trim(),
      damage_type: document.getElementById('damage_type').value.trim(),
      inspection_location: document.getElementById('inspection_location').value.trim()
    });
    saveHelperToStorage();
    ROUTER.navigate('damage-centers');
  }
}

ROUTER.register('car-details', carDetails);
