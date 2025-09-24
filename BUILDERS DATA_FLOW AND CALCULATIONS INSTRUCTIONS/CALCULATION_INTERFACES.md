# 🧮 Calculation Interfaces for Final Report Modules

## Overview

This document describes the global calculation interfaces available for all final report modules (Private, Global, Total Loss, Sale in Damaged State). These interfaces provide standardized access to all calculation data from the estimate builder and Levi report systems.

## Available Interfaces

### 1. `window.EstimateCalculations` (from estimate-builder.html)
**Main interface for estimate builder calculations**

#### Core Functions:
```javascript
// Update calculations
EstimateCalculations.updateGrossMarketValueField()
EstimateCalculations.updateGrossPercentageField()  
EstimateCalculations.updateSummaryTotalsFromDamageCenters()
EstimateCalculations.updateAllCostDisplays()
EstimateCalculations.refreshAllCalculations() // Updates all calculations

// Get calculated values
EstimateCalculations.getGrossMarketValue()      // Returns: number (base + features + registration)
EstimateCalculations.getFullMarketValue()       // Returns: number (includes all adjustments)
EstimateCalculations.getTotalClaim()            // Returns: number (sum of all damage centers)
EstimateCalculations.getGrossPercentage()       // Returns: number (total claim ÷ gross market value × 100)

// Get damage centers data
EstimateCalculations.getDamageCentersData()     // Returns: array of damage centers
EstimateCalculations.calculateDamageCentersTotals() // Returns: {parts, works, repairs, total, totalWithVAT}
```

#### Example Usage in Final Report:
```javascript
// In your final report module
const grossMarketValue = EstimateCalculations.getGrossMarketValue();
const totalClaim = EstimateCalculations.getTotalClaim();
const grossPercentage = EstimateCalculations.getGrossPercentage();
const damageTotals = EstimateCalculations.calculateDamageCentersTotals();

// Use in report placeholders
document.getElementById('grossMarketValue').textContent = `₪${grossMarketValue.toLocaleString()}`;
document.getElementById('totalClaim').textContent = `₪${totalClaim.toLocaleString()}`;
document.getElementById('grossPercentage').textContent = `${grossPercentage}%`;
document.getElementById('totalDamageWithVAT').textContent = `₪${damageTotals.totalWithVAT.toLocaleString()}`;
```

### 2. `window.CalculationInterface` (from helper.js)
**Core calculation utilities using Math Engine**

#### Core Functions:
```javascript
// Get values from helper
CalculationInterface.getGrossMarketValue()      // Returns: number
CalculationInterface.getFullMarketValue()       // Returns: number  
CalculationInterface.getDamagePercentage()      // Returns: number
CalculationInterface.getTotalDamage()           // Returns: number

// Calculate values
CalculationInterface.calculateDamagePercentage(totalDamage, marketValue)
CalculationInterface.calculateWithVAT(amount, vatRate)

// Format values
CalculationInterface.formatCurrency(amount)     // Returns: "₪123,456"
CalculationInterface.formatPercentage(value)    // Returns: "12.5%"

// Update calculations
CalculationInterface.updateCalculations(newCalculations)
```

### 3. `window.MathEngine` (from math.js)
**Core mathematical calculation engine**

#### Key Functions:
```javascript
// Damage calculations
MathEngine.computeDamagePercentage(totalDamage, marketValue)
MathEngine.calculateDamageCenterTotal(damageCenter)
MathEngine.calculateAllDamageCentersTotal(damageCenters)

// Financial calculations
MathEngine.applyVAT(value, vatRate)
MathEngine.calculateFeesTotal(fees, vatRate)
MathEngine.computeTotalCompensation(totalDamage, depreciation, fees)

// Formatting
MathEngine.formatCurrency(num)
MathEngine.round(num)
```

## Data Structure Reference

### Helper.calculations Structure:
```javascript
{
  vehicle_value_gross: number,    // Base + features + registration only
  market_value: number,           // Full market value with all adjustments
  damage_percent: number,         // Damage percentage (gross)
  total_damage: number,           // Total damage amount
  base_damage: number,            // Base damage before adjustments
  depreciation_amount: number,    // Depreciation amount
  fees_total: number,             // Total fees with VAT
  vat_rate: number               // VAT rate used
}
```

### Damage Centers Structure:
```javascript
[
  {
    name: string,
    parts: [{ name: string, price: number }],
    works: [{ name: string, cost: number }],
    repairs: [{ name: string, cost: number }]
  }
]
```

## Integration Examples

### Final Report Private Module:
```javascript
// Load calculations
const calculations = {
  grossMarketValue: EstimateCalculations.getGrossMarketValue(),
  totalClaim: EstimateCalculations.getTotalClaim(),
  grossPercentage: EstimateCalculations.getGrossPercentage(),
  damageTotals: EstimateCalculations.calculateDamageCentersTotals()
};

// Populate report fields
document.getElementById('vehicleValueGross').textContent = CalculationInterface.formatCurrency(calculations.grossMarketValue);
document.getElementById('totalClaim').textContent = CalculationInterface.formatCurrency(calculations.totalClaim);
document.getElementById('damagePercentage').textContent = CalculationInterface.formatPercentage(calculations.grossPercentage);
```

### Final Report Global Module:
```javascript
// For global opinions, use full market value instead of gross
const fullMarketValue = EstimateCalculations.getFullMarketValue();
const totalClaim = EstimateCalculations.getTotalClaim();
const fullPercentage = MathEngine.computeDamagePercentage(totalClaim, fullMarketValue);

document.getElementById('marketValue').textContent = CalculationInterface.formatCurrency(fullMarketValue);
document.getElementById('damagePercentage').textContent = CalculationInterface.formatPercentage(fullPercentage);
```

### Total Loss Report Module:
```javascript
// Check if damage exceeds 60% threshold
const grossPercentage = EstimateCalculations.getGrossPercentage();
const isTotalLoss = grossPercentage > 60;

if (isTotalLoss) {
  document.getElementById('totalLossDeclaration').style.display = 'block';
  document.getElementById('totalLossPercentage').textContent = `${grossPercentage}%`;
}
```

## Best Practices

1. **Always use the interfaces** instead of directly accessing sessionStorage
2. **Refresh calculations** when switching between modules: `EstimateCalculations.refreshAllCalculations()`
3. **Use appropriate market values**: Gross for damage percentage, Full for global opinions
4. **Format numbers** using the provided formatting functions
5. **Handle errors** gracefully - all functions include error handling

## Debugging

Use the debug function in console:
```javascript
debugCalculations() // Shows complete calculation state
EstimateCalculations.refreshAllCalculations() // Force refresh all calculations
```

## Notes for Future Modules

- All calculation functions are **globally accessible** from any module
- Data is **automatically synced** to sessionStorage helper
- **Real-time updates** are supported through the interface functions
- **Consistent formatting** is provided for all currency and percentage values
- **Error handling** is built into all interface functions

This standardized approach ensures all final report modules can access the same calculation data and maintain consistency across the entire system.