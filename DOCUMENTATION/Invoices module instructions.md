# Claude Cursor Instructions: Invoice Module Implementation

## Project Overview
You are tasked with creating a comprehensive invoice processing module that integrates OCR capabilities, damage center management, and real-time cost validation. This module will handle invoice uploads, process them through OCR, and allow users to map invoice items to damage centers with full editing capabilities.

## Technical Architecture & Requirements

### Core Technologies
- **Frontend Framework**: React with TypeScript for type safety
- **State Management**: Redux Toolkit or Zustand for complex state handling
- **UI Components**: Material-UI or Ant Design for consistent UI
- **OCR Integration**: Webhook-based async processing
- **Data Format**: JSON for all data exchanges
- **Iframe Communication**: postMessage API for secure cross-origin communication

### Module Structure
```
invoice-module/
├── components/
│   ├── InvoiceUploader/
│   ├── OCRProcessor/
│   ├── CostValidator/
│   ├── DamageCenterIframe/
│   ├── InvoiceTable/
│   └── StandardizationEngine/
├── services/
│   ├── ocr.service.ts
│   ├── webhook.service.ts
│   ├── damageCenter.service.ts
│   └── standardization.service.ts
├── store/
│   ├── invoice.slice.ts
│   ├── damageCenter.slice.ts
│   └── helper.slice.ts
├── types/
│   ├── invoice.types.ts
│   ├── damageCenter.types.ts
│   └── ocr.types.ts
└── utils/
    ├── validation.utils.ts
    └── formatting.utils.ts
```

## Detailed Implementation Prompt

### 1. Invoice Upload & OCR Processing

Create an `InvoiceUploader` component that:
- Accepts PDF, PNG, JPG, and JPEG formats (max 10MB)
- Shows upload progress with a visual indicator
- Implements drag-and-drop functionality
- On successful upload, triggers OCR service call

```typescript
interface OCRRequest {
  invoiceId: string;
  fileUrl: string;
  callbackUrl: string;
  metadata: {
    uploadTimestamp: number;
    userId: string;
    sessionId: string;
  };
}

interface OCRResponse {
  invoiceId: string;
  status: 'processing' | 'completed' | 'failed';
  extractedData?: {
    items: InvoiceItem[];
    totalAmount: number;
    vatAmount: number;
    invoiceNumber: string;
    invoiceDate: string;
    vendor: VendorInfo;
  };
  error?: string;
}
```

### 2. Webhook Handler

Implement a webhook receiver that:
- Listens for OCR completion callbacks
- Validates webhook signatures for security
- Updates application state with OCR results
- Triggers user notification for validation

```typescript
interface WebhookPayload {
  eventType: 'ocr.completed' | 'ocr.failed';
  invoiceId: string;
  timestamp: number;
  signature: string;
  data: OCRResponse;
}
```

### 3. Cost Validation Interface

Create a `CostValidator` component that:
- Displays OCR-extracted costs in an editable table
- Highlights suspicious or anomalous values
- Allows bulk editing with keyboard shortcuts
- Implements undo/redo functionality
- Shows cost breakdown (base cost, VAT, total)

### 4. Damage Centers Iframe Integration

Implement `DamageCenterIframe` with:

```typescript
interface DamageCenterField {
  id: string;
  type: 'work' | 'part' | 'repair';
  name: string;
  description?: string;
  serialNumber?: string;
  costWithoutVat: number;
  quantity: number;
  selected: boolean;
}

interface DamageCenterData {
  centerId: string;
  centerName: string;
  fields: DamageCenterField[];
  totalCost: number;
  lastModified: Date;
}
```

**Key Features:**
- Secure iframe communication using postMessage
- Auto-complete functionality with fuzzy search
- Single-letter triggered dropdown showing filtered OCR items
- Real-time field synchronization
- Field validation before saving

### 5. Auto-complete & Selection Logic

Implement intelligent auto-complete:
- Trigger on single character input
- Filter OCR items based on:
  - Partial text match
  - Category (work/part/repair)
  - Cost range similarity
- Display matches in categorized dropdown
- On selection, auto-populate all related fields

```typescript
interface AutoCompleteItem {
  ocrItemId: string;
  displayText: string;
  category: 'work' | 'part' | 'repair';
  matchScore: number;
  originalData: {
    name: string;
    description?: string;
    serialNumber?: string;
    costWithoutVat: number;
  };
}
```

### 6. Helper State Management

Implement helper synchronization:
- Track all damage center modifications
- Maintain version history
- Update helper.centers only on explicit save
- Implement optimistic updates with rollback capability

```typescript
interface HelperState {
  centers: DamageCenterData[];
  originalCenters: DamageCenterData[];
  modifications: Array<{
    centerId: string;
    fieldId: string;
    changes: Partial<DamageCenterField>;
    timestamp: number;
  }>;
  isDirty: boolean;
}
```

### 7. Save & Synchronization Logic

Implement save functionality that:
- Validates all modified fields
- Creates a diff between original and modified data
- Updates helper.centers with modified values only
- Preserves unmodified centers
- Implements conflict resolution for concurrent edits
- Provides save confirmation with change summary

### 8. Universal Invoice Table

Create `InvoiceTable` component with:
- Responsive grid layout
- Sortable columns
- Inline editing capabilities
- Export functionality (CSV, PDF)
- Column customization
- Row selection for bulk operations

```typescript
interface InvoiceTableColumn {
  key: string;
  label: string;
  type: 'text' | 'number' | 'currency' | 'date';
  editable: boolean;
  sortable: boolean;
  width?: number;
  formatter?: (value: any) => string;
}
```

### 9. Invoice Standardization Engine

Implement `StandardizationService` that:
- Detects invoice format patterns
- Maps varied field names to standard schema
- Handles multiple date formats
- Normalizes currency representations
- Processes different VAT calculation methods

```typescript
interface StandardizationRule {
  pattern: RegExp | string;
  fieldMapping: Record<string, string>;
  transformer?: (value: any) => any;
  priority: number;
}

interface StandardizedInvoice {
  format: 'standard-v1';
  originalFormat: string;
  mappingConfidence: number;
  data: {
    header: InvoiceHeader;
    items: StandardizedItem[];
    totals: InvoiceTotals;
    metadata: InvoiceMetadata;
  };
}
```

### 10. Error Handling & Recovery

Implement comprehensive error handling:
- OCR failure recovery with manual entry option
- Network failure retry logic with exponential backoff
- Data validation errors with clear user feedback
- Iframe communication failures with fallback UI
- Partial save capability for large updates

### 11. Performance Optimizations

- Implement virtual scrolling for large invoice lists
- Use memoization for expensive calculations
- Debounce auto-complete searches
- Lazy load damage center data
- Implement request cancellation for outdated searches

### 12. Security Considerations

- Validate all iframe messages origin
- Sanitize OCR input to prevent XSS
- Implement CSRF protection for saves
- Use secure webhook signatures
- Encrypt sensitive data in transit

## Testing Requirements

Write comprehensive tests for:
- OCR webhook processing
- Auto-complete filtering logic
- Save synchronization
- Invoice standardization rules
- Iframe communication protocol
- Error recovery mechanisms

## Documentation Requirements

Provide:
- API documentation for all services
- Component prop documentation
- State management flow diagrams
- Iframe communication protocol specification
- Invoice standardization rule documentation

---

**Note to Claude**: When implementing this module, prioritize:
1. Type safety throughout the codebase
2. Clean separation of concerns
3. Reusable, testable components
4. Clear error messages for users
5. Performance optimization for large datasets
6. Accessibility compliance (WCAG 2.1 AA)

The module should be production-ready with proper error boundaries, loading states, and user feedback mechanisms. All asynchronous operations should show appropriate loading indicators and handle edge cases gracefully.