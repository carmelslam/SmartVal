/**
 * Dynamic Status Management System
 * Manages invoice and related entity statuses based on workflow stages
 * Automatically updates statuses based on user actions and system events
 */

class WorkflowStatusManager {
  constructor() {
    // Define workflow stages and their corresponding statuses
    this.workflowStages = {
      invoice: {
        'DRAFT': {
          description: 'טיוטה - חשבונית נוצרה אך לא הושלמה',
          nextStages: ['PENDING', 'CANCELLED'],
          actions: ['complete', 'cancel'],
          autoTransitions: []
        },
        'PENDING': {
          description: 'ממתין - חשבונית מוכנה להקצאה',
          nextStages: ['ASSIGNED', 'CANCELLED'],
          actions: ['assign', 'cancel'],
          autoTransitions: ['on_ocr_complete', 'on_validation_pass']
        },
        'ASSIGNED': {
          description: 'הוקצה - חשבונית הוקצתה לטיפול',
          nextStages: ['ACCEPTED', 'REJECTED', 'PENDING'],
          actions: ['accept', 'reject', 'reassign'],
          autoTransitions: []
        },
        'ACCEPTED': {
          description: 'אושר - חשבונית אושרה לטיפול',
          nextStages: ['SENT', 'REJECTED'],
          actions: ['send', 'reject'],
          autoTransitions: ['on_approval_complete']
        },
        'SENT': {
          description: 'נשלח - חשבונית נשלחה ללקוח/ספק',
          nextStages: ['PAID', 'REJECTED'],
          actions: ['mark_paid', 'reject'],
          autoTransitions: ['on_payment_received']
        },
        'PAID': {
          description: 'שולם - חשבונית שולמה',
          nextStages: [],
          actions: [],
          autoTransitions: [],
          isFinal: true
        },
        'CANCELLED': {
          description: 'בוטל - חשבונית בוטלה',
          nextStages: ['DRAFT'],
          actions: ['reopen'],
          autoTransitions: [],
          isFinal: true
        },
        'REJECTED': {
          description: 'נדחה - חשבונית נדחתה',
          nextStages: ['PENDING', 'CANCELLED'],
          actions: ['resubmit', 'cancel'],
          autoTransitions: []
        }
      },
      
      invoice_validation: {
        'pending': {
          description: 'ממתין לאימות',
          nextStages: ['in_review', 'auto_approved'],
          actions: ['start_review', 'auto_approve'],
          autoTransitions: ['on_invoice_create']
        },
        'in_review': {
          description: 'בבדיקה',
          nextStages: ['approved', 'rejected', 'requires_correction'],
          actions: ['approve', 'reject', 'request_correction'],
          autoTransitions: []
        },
        'requires_correction': {
          description: 'דורש תיקון',
          nextStages: ['in_review', 'rejected'],
          actions: ['resubmit', 'reject'],
          autoTransitions: ['on_correction_submit']
        },
        'approved': {
          description: 'אושר',
          nextStages: [],
          actions: [],
          autoTransitions: [],
          isFinal: true
        },
        'rejected': {
          description: 'נדחה',
          nextStages: ['pending'],
          actions: ['resubmit'],
          autoTransitions: [],
          isFinal: true
        },
        'auto_approved': {
          description: 'אושר אוטומטית',
          nextStages: ['in_review'],
          actions: ['manual_review'],
          autoTransitions: ['on_high_confidence_validation'],
          isFinal: true
        }
      },
      
      damage_center_mapping: {
        'pending': {
          description: 'ממתין למיפוי',
          nextStages: ['mapped', 'failed'],
          actions: ['map', 'mark_failed'],
          autoTransitions: ['on_invoice_process']
        },
        'mapped': {
          description: 'מומפה',
          nextStages: ['approved', 'rejected', 'pending'],
          actions: ['approve', 'reject', 'remap'],
          autoTransitions: ['on_auto_mapping_complete']
        },
        'approved': {
          description: 'מאושר',
          nextStages: ['rejected'],
          actions: ['reject'],
          autoTransitions: [],
          isFinal: true
        },
        'rejected': {
          description: 'נדחה',
          nextStages: ['pending', 'mapped'],
          actions: ['remap', 'approve_override'],
          autoTransitions: []
        },
        'failed': {
          description: 'נכשל',
          nextStages: ['pending'],
          actions: ['retry'],
          autoTransitions: []
        }
      }
    };

    // Status display mappings (Hebrew translations)
    this.statusDisplayMap = {
      // Invoice statuses
      'DRAFT': 'טיוטה',
      'PENDING': 'ממתין',
      'ASSIGNED': 'הוקצה',
      'ACCEPTED': 'אושר',
      'SENT': 'נשלח',
      'PAID': 'שולם',
      'CANCELLED': 'בוטל',
      'REJECTED': 'נדחה',
      
      // Validation statuses
      'pending': 'ממתין לאימות',
      'in_review': 'בבדיקה',
      'requires_correction': 'דורש תיקון',
      'approved': 'מאושר',
      'rejected': 'נדחה',
      'auto_approved': 'אושר אוטומטית',
      
      // Mapping statuses
      'mapped': 'מומפה',
      'failed': 'נכשל'
    };

    // Redundant status detection
    this.redundantStatusPatterns = {
      // If all records in a table have the same status, it's likely redundant
      threshold: 0.95, // 95% of records have same status = redundant
      excludeStatuses: ['DRAFT', 'pending'] // These are expected to be common
    };
  }

  /**
   * Transition entity status based on action or event
   * @param {string} entityType - Type of entity (invoice, invoice_validation, etc.)
   * @param {string} currentStatus - Current status
   * @param {string} action - Action being performed
   * @param {Object} context - Additional context (user, timestamp, etc.)
   * @returns {Object} Transition result
   */
  transitionStatus(entityType, currentStatus, action, context = {}) {
    const workflow = this.workflowStages[entityType];
    if (!workflow) {
      throw new Error(`Unknown entity type: ${entityType}`);
    }

    const currentStage = workflow[currentStatus];
    if (!currentStage) {
      throw new Error(`Unknown status: ${currentStatus} for entity: ${entityType}`);
    }

    // Check if action is allowed
    if (!currentStage.actions.includes(action)) {
      throw new Error(`Action '${action}' not allowed from status '${currentStatus}'`);
    }

    // Determine next status based on action
    const nextStatus = this.getNextStatusForAction(entityType, currentStatus, action);
    
    // Create transition record
    const transition = {
      entityType,
      fromStatus: currentStatus,
      toStatus: nextStatus,
      action,
      timestamp: new Date().toISOString(),
      userId: context.userId || null,
      reason: context.reason || null,
      metadata: context.metadata || {},
      isValid: true
    };

    // Add Hebrew descriptions
    transition.fromStatusDisplay = this.getStatusDisplay(currentStatus);
    transition.toStatusDisplay = this.getStatusDisplay(nextStatus);

    return transition;
  }

  /**
   * Get next status for a specific action
   */
  getNextStatusForAction(entityType, currentStatus, action) {
    // Define action-to-status mappings
    const actionMappings = {
      invoice: {
        'complete': 'PENDING',
        'assign': 'ASSIGNED',
        'accept': 'ACCEPTED',
        'send': 'SENT',
        'mark_paid': 'PAID',
        'cancel': 'CANCELLED',
        'reject': 'REJECTED',
        'reassign': 'PENDING',
        'reopen': 'DRAFT',
        'resubmit': 'PENDING'
      },
      invoice_validation: {
        'start_review': 'in_review',
        'approve': 'approved',
        'reject': 'rejected',
        'request_correction': 'requires_correction',
        'resubmit': 'in_review',
        'auto_approve': 'auto_approved',
        'manual_review': 'in_review'
      },
      damage_center_mapping: {
        'map': 'mapped',
        'approve': 'approved',
        'reject': 'rejected',
        'remap': 'pending',
        'mark_failed': 'failed',
        'retry': 'pending',
        'approve_override': 'approved'
      }
    };

    const entityMappings = actionMappings[entityType];
    if (!entityMappings) {
      throw new Error(`No action mappings defined for entity: ${entityType}`);
    }

    const nextStatus = entityMappings[action];
    if (!nextStatus) {
      throw new Error(`No status mapping for action '${action}' in entity '${entityType}'`);
    }

    return nextStatus;
  }

  /**
   * Check for automatic status transitions based on events
   * @param {string} entityType - Entity type
   * @param {string} currentStatus - Current status
   * @param {string} event - Event that occurred
   * @param {Object} context - Event context
   * @returns {Object|null} Automatic transition or null
   */
  checkAutoTransition(entityType, currentStatus, event, context = {}) {
    const workflow = this.workflowStages[entityType];
    const currentStage = workflow?.[currentStatus];
    
    if (!currentStage || !currentStage.autoTransitions.includes(event)) {
      return null;
    }

    // Define auto-transition logic
    const autoTransitionMappings = {
      invoice: {
        'on_ocr_complete': () => context.ocrConfidence > 80 ? 'PENDING' : currentStatus,
        'on_validation_pass': () => 'ASSIGNED',
        'on_approval_complete': () => 'SENT',
        'on_payment_received': () => 'PAID'
      },
      invoice_validation: {
        'on_invoice_create': () => 'pending',
        'on_correction_submit': () => 'in_review',
        'on_high_confidence_validation': () => context.confidence > 90 ? 'auto_approved' : currentStatus
      },
      damage_center_mapping: {
        'on_invoice_process': () => 'pending',
        'on_auto_mapping_complete': () => context.mappingConfidence > 85 ? 'approved' : 'mapped'
      }
    };

    const entityMappings = autoTransitionMappings[entityType];
    if (!entityMappings || !entityMappings[event]) {
      return null;
    }

    const nextStatus = entityMappings[event]();
    if (nextStatus === currentStatus) {
      return null; // No transition needed
    }

    return {
      entityType,
      fromStatus: currentStatus,
      toStatus: nextStatus,
      trigger: event,
      timestamp: new Date().toISOString(),
      isAutomatic: true,
      context
    };
  }

  /**
   * Get Hebrew display text for status
   */
  getStatusDisplay(status) {
    return this.statusDisplayMap[status] || status;
  }

  /**
   * Check if a status field is redundant in a dataset
   * @param {Array} records - Array of records to analyze
   * @param {string} statusField - Name of the status field
   * @returns {Object} Redundancy analysis
   */
  analyzeStatusRedundancy(records, statusField = 'status') {
    if (!records || records.length === 0) {
      return { isRedundant: false, reason: 'No records to analyze' };
    }

    // Count status occurrences
    const statusCounts = {};
    let totalRecords = 0;

    records.forEach(record => {
      const status = record[statusField];
      if (status) {
        statusCounts[status] = (statusCounts[status] || 0) + 1;
        totalRecords++;
      }
    });

    // Find most common status
    const statusEntries = Object.entries(statusCounts);
    const mostCommon = statusEntries.reduce((a, b) => a[1] > b[1] ? a : b);
    const [mostCommonStatus, count] = mostCommon;
    
    const percentage = count / totalRecords;
    const isRedundant = percentage >= this.redundantStatusPatterns.threshold && 
                       !this.redundantStatusPatterns.excludeStatuses.includes(mostCommonStatus);

    return {
      isRedundant,
      mostCommonStatus,
      percentage: Math.round(percentage * 100),
      count,
      totalRecords,
      recommendation: isRedundant ? 
        `המצב '${this.getStatusDisplay(mostCommonStatus)}' מופיע ב-${Math.round(percentage * 100)}% מהרשומות. שקול להסתיר שדה זה בממשק המשתמש.` :
        'שדה הסטטוס מספק מידע שימושי ויש להציגו.',
      statusDistribution: statusCounts
    };
  }

  /**
   * Get allowed actions for current status
   * @param {string} entityType - Entity type
   * @param {string} currentStatus - Current status
   * @returns {Array} Array of allowed actions with Hebrew labels
   */
  getAllowedActions(entityType, currentStatus) {
    const workflow = this.workflowStages[entityType];
    const currentStage = workflow?.[currentStatus];
    
    if (!currentStage) {
      return [];
    }

    // Action labels in Hebrew
    const actionLabels = {
      'complete': 'השלם',
      'assign': 'הקצה',
      'accept': 'אשר',
      'send': 'שלח',
      'mark_paid': 'סמן כשולם',
      'cancel': 'בטל',
      'reject': 'דחה',
      'reassign': 'הקצה מחדש',
      'reopen': 'פתח מחדש',
      'resubmit': 'הגש מחדש',
      'start_review': 'התחל בדיקה',
      'approve': 'אשר',
      'request_correction': 'בקש תיקון',
      'auto_approve': 'אשר אוטומטית',
      'manual_review': 'בדיקה ידנית',
      'map': 'מפה',
      'remap': 'מפה מחדש',
      'mark_failed': 'סמן כנכשל',
      'retry': 'נסה שוב',
      'approve_override': 'אשר בכפיה'
    };

    return currentStage.actions.map(action => ({
      action,
      label: actionLabels[action] || action,
      nextStatus: this.getNextStatusForAction(entityType, currentStatus, action),
      nextStatusDisplay: this.getStatusDisplay(this.getNextStatusForAction(entityType, currentStatus, action))
    }));
  }

  /**
   * Bulk update statuses with user tracking
   * @param {string} tableName - Table name
   * @param {Array} updates - Array of {id, newStatus, reason} objects
   * @param {string} userId - User performing the update
   * @returns {Promise} Update results
   */
  async bulkUpdateStatuses(tableName, updates, userId) {
    if (!window.supabase) {
      throw new Error('Supabase client not available');
    }

    const results = [];
    
    for (const update of updates) {
      try {
        const { error } = await window.supabase
          .from(tableName)
          .update({
            status: update.newStatus,
            updated_by: userId,
            updated_at: new Date().toISOString(),
            status_change_reason: update.reason || null
          })
          .eq('id', update.id);

        if (error) {
          results.push({ id: update.id, success: false, error: error.message });
        } else {
          results.push({ id: update.id, success: true, newStatus: update.newStatus });
        }
      } catch (error) {
        results.push({ id: update.id, success: false, error: error.message });
      }
    }

    return results;
  }
}

// Export for use in other modules
window.WorkflowStatusManager = WorkflowStatusManager;

// Usage example:
// const statusManager = new WorkflowStatusManager();
// const transition = statusManager.transitionStatus('invoice', 'DRAFT', 'complete', { userId: 'user123' });
// console.log('Status changed from', transition.fromStatusDisplay, 'to', transition.toStatusDisplay);