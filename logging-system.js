// 📝 Action Log System - Centralized Logging Utility
// Comprehensive logging system for user actions, system events, errors, and audit trails

import { errorHandler } from './error-handler.js';
import { securityManager } from './security-manager.js';

// Log categories and types
export const LOG_TYPES = {
  USER_ACTION: 'user_action',
  SYSTEM_EVENT: 'system_event', 
  ERROR: 'error',
  AUDIT: 'audit'
};

export const LOG_LEVELS = {
  INFO: 'info',
  WARN: 'warn',
  ERROR: 'error',
  CRITICAL: 'critical'
};

// Webhook endpoints for log storage
const WEBHOOKS = {
  ADMIN_HUB: 'https://hook.eu2.make.com/tw4xhsqf8d37qg4tgs5k3hvobf7q5x1g',
  SYSTEM_LOGS: 'https://hook.eu2.make.com/tw4xhsqf8d37qg4tgs5k3hvobf7q5x1g' // Using same webhook for now
};

// Log buffer for offline scenarios
let logBuffer = [];
let isOnline = navigator.onLine;

// Monitor online status
window.addEventListener('online', () => {
  isOnline = true;
  flushLogBuffer();
});

window.addEventListener('offline', () => {
  isOnline = false;
});

/**
 * Main logging function - creates and stores log entries
 * @param {string} logType - Type of log (USER_ACTION, SYSTEM_EVENT, ERROR, AUDIT)
 * @param {string} level - Log level (INFO, WARN, ERROR, CRITICAL)
 * @param {string} module - Module/component generating the log
 * @param {string} action - Specific action being logged
 * @param {string} message - Descriptive message
 * @param {Object} metadata - Additional context data
 * @param {string} caseId - Case identifier (plate number)
 * @param {string} userId - User identifier
 */
export async function createLogEntry(logType, level, module, action, message, metadata = {}, caseId = '', userId = '') {
  try {
    const logEntry = {
      log_id: generateLogId(),
      timestamp: new Date().toISOString(),
      log_type: logType,
      level: level,
      module: module,
      action: action,
      message: message,
      case_id: caseId || getCurrentCaseId(),
      user_id: userId || getCurrentUserId(),
      metadata: {
        ...metadata,
        user_agent: navigator.userAgent,
        page_url: window.location.href,
        session_id: getSessionId()
      }
    };

    // Store locally first
    await storeLogLocally(logEntry);
    
    // Send to server if online
    if (isOnline) {
      await sendLogToServer(logEntry);
    } else {
      logBuffer.push(logEntry);
    }

    return logEntry;
  } catch (error) {
    console.error('Failed to create log entry:', error);
    // Fallback to basic console logging
    console.log(`[${logType}] ${module}:${action} - ${message}`, metadata);
  }
}

/**
 * Convenience functions for different log types
 */
export const Logger = {
  // User actions
  userAction: (module, action, message, metadata = {}, caseId = '') => 
    createLogEntry(LOG_TYPES.USER_ACTION, LOG_LEVELS.INFO, module, action, message, metadata, caseId),
  
  // System events
  systemEvent: (module, action, message, metadata = {}, caseId = '') =>
    createLogEntry(LOG_TYPES.SYSTEM_EVENT, LOG_LEVELS.INFO, module, action, message, metadata, caseId),
  
  // Error logging
  error: (module, action, message, metadata = {}, caseId = '') =>
    createLogEntry(LOG_TYPES.ERROR, LOG_LEVELS.ERROR, module, action, message, metadata, caseId),
  
  // Critical errors
  critical: (module, action, message, metadata = {}, caseId = '') =>
    createLogEntry(LOG_TYPES.ERROR, LOG_LEVELS.CRITICAL, module, action, message, metadata, caseId),
  
  // Audit trail
  audit: (module, action, message, metadata = {}, caseId = '') =>
    createLogEntry(LOG_TYPES.AUDIT, LOG_LEVELS.INFO, module, action, message, metadata, caseId),
  
  // Warnings
  warn: (module, action, message, metadata = {}, caseId = '') =>
    createLogEntry(LOG_TYPES.SYSTEM_EVENT, LOG_LEVELS.WARN, module, action, message, metadata, caseId)
};

/**
 * Retrieve logs from local storage
 * @param {Object} filters - Filter criteria
 * @returns {Array} Array of log entries
 */
export function getLocalLogs(filters = {}) {
  try {
    const logs = JSON.parse(localStorage.getItem('system-logs') || '[]');
    return filterLogs(logs, filters);
  } catch (error) {
    console.error('Failed to retrieve local logs:', error);
    return [];
  }
}

/**
 * Filter logs based on criteria
 * @param {Array} logs - Array of log entries
 * @param {Object} filters - Filter criteria
 * @returns {Array} Filtered logs
 */
export function filterLogs(logs, filters) {
  return logs.filter(log => {
    // Date range filter
    if (filters.startDate && new Date(log.timestamp) < new Date(filters.startDate)) {
      return false;
    }
    if (filters.endDate && new Date(log.timestamp) > new Date(filters.endDate)) {
      return false;
    }
    
    // Log type filter
    if (filters.logType && log.log_type !== filters.logType) {
      return false;
    }
    
    // Level filter
    if (filters.level && log.level !== filters.level) {
      return false;
    }
    
    // Module filter
    if (filters.module && log.module !== filters.module) {
      return false;
    }
    
    // Case ID filter
    if (filters.caseId && log.case_id !== filters.caseId) {
      return false;
    }
    
    // Text search
    if (filters.searchText) {
      const searchLower = filters.searchText.toLowerCase();
      return log.message.toLowerCase().includes(searchLower) ||
             log.action.toLowerCase().includes(searchLower) ||
             log.module.toLowerCase().includes(searchLower);
    }
    
    return true;
  });
}

/**
 * Export logs in different formats
 * @param {Array} logs - Log entries to export
 * @param {string} format - Export format (json, csv, txt)
 * @returns {string} Formatted log data
 */
export function exportLogs(logs, format = 'json') {
  switch (format.toLowerCase()) {
    case 'json':
      return JSON.stringify(logs, null, 2);
    
    case 'csv':
      return logsToCSV(logs);
    
    case 'txt':
      return logsToText(logs);
    
    default:
      return JSON.stringify(logs, null, 2);
  }
}

/**
 * Get log statistics
 * @param {Array} logs - Log entries
 * @returns {Object} Statistics object
 */
export function getLogStatistics(logs) {
  const stats = {
    total: logs.length,
    byType: {},
    byLevel: {},
    byModule: {},
    timeRange: {
      earliest: null,
      latest: null
    }
  };
  
  logs.forEach(log => {
    // Count by type
    stats.byType[log.log_type] = (stats.byType[log.log_type] || 0) + 1;
    
    // Count by level
    stats.byLevel[log.level] = (stats.byLevel[log.level] || 0) + 1;
    
    // Count by module
    stats.byModule[log.module] = (stats.byModule[log.module] || 0) + 1;
    
    // Track time range
    const timestamp = new Date(log.timestamp);
    if (!stats.timeRange.earliest || timestamp < stats.timeRange.earliest) {
      stats.timeRange.earliest = timestamp;
    }
    if (!stats.timeRange.latest || timestamp > stats.timeRange.latest) {
      stats.timeRange.latest = timestamp;
    }
  });
  
  return stats;
}

/**
 * Clear old logs based on retention policy
 * @param {number} maxAge - Maximum age in days
 * @param {number} maxCount - Maximum number of logs to keep
 */
export function cleanupLogs(maxAge = 30, maxCount = 1000) {
  try {
    const logs = JSON.parse(localStorage.getItem('system-logs') || '[]');
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - maxAge);
    
    // Filter by age and limit count
    const cleanedLogs = logs
      .filter(log => new Date(log.timestamp) > cutoffDate)
      .slice(-maxCount);
    
    localStorage.setItem('system-logs', JSON.stringify(cleanedLogs));
    
    Logger.systemEvent('logging-system', 'cleanup', 
      `Cleaned up logs. Removed ${logs.length - cleanedLogs.length} entries`, 
      { originalCount: logs.length, newCount: cleanedLogs.length }
    );
    
  } catch (error) {
    console.error('Failed to cleanup logs:', error);
  }
}

// Helper functions
function generateLogId() {
  return 'log-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9);
}

function getCurrentCaseId() {
  try {
    const helper = JSON.parse(sessionStorage.getItem('helper') || '{}');
    return helper.meta?.plate || helper.car_details?.plate || '';
  } catch {
    return '';
  }
}

function getCurrentUserId() {
  return sessionStorage.getItem('user-id') || 'anonymous';
}

function getSessionId() {
  let sessionId = sessionStorage.getItem('session-id');
  if (!sessionId) {
    sessionId = 'session-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9);
    sessionStorage.setItem('session-id', sessionId);
  }
  return sessionId;
}

async function storeLogLocally(logEntry) {
  try {
    const logs = JSON.parse(localStorage.getItem('system-logs') || '[]');
    logs.push(logEntry);
    
    // Keep only last 500 entries to prevent storage overflow
    if (logs.length > 500) {
      logs.splice(0, logs.length - 500);
    }
    
    localStorage.setItem('system-logs', JSON.stringify(logs));
  } catch (error) {
    console.error('Failed to store log locally:', error);
  }
}

async function sendLogToServer(logEntry) {
  try {
    const response = await fetch(WEBHOOKS.SYSTEM_LOGS, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'store_log',
        log_entry: logEntry
      })
    });
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
  } catch (error) {
    console.error('Failed to send log to server:', error);
    // Add to buffer for retry
    logBuffer.push(logEntry);
  }
}

async function flushLogBuffer() {
  if (logBuffer.length === 0) return;
  
  const logsToSend = [...logBuffer];
  logBuffer = [];
  
  for (const log of logsToSend) {
    await sendLogToServer(log);
  }
}

function logsToCSV(logs) {
  const headers = ['Timestamp', 'Type', 'Level', 'Module', 'Action', 'Message', 'Case ID', 'User ID'];
  const rows = logs.map(log => [
    log.timestamp,
    log.log_type,
    log.level,
    log.module,
    log.action,
    log.message,
    log.case_id,
    log.user_id
  ]);
  
  return [headers, ...rows].map(row => row.join(',')).join('\n');
}

function logsToText(logs) {
  return logs.map(log => 
    `[${log.timestamp}] ${log.level.toUpperCase()} ${log.module}:${log.action} - ${log.message}`
  ).join('\n');
}

// Initialize logging system
export function initializeLogging() {
  // Clean up old logs on startup
  cleanupLogs();
  
  // Log system initialization
  Logger.systemEvent('logging-system', 'initialize', 'Logging system initialized');
  
  // Set up periodic cleanup
  const cleanupInterval = setInterval(() => cleanupLogs(), 24 * 60 * 60 * 1000); // Daily cleanup
  
  // Clean up on page unload
  window.addEventListener('beforeunload', () => {
    clearInterval(cleanupInterval);
  });
}

// Auto-initialize when module is loaded
if (typeof window !== 'undefined') {
  window.addEventListener('DOMContentLoaded', initializeLogging);
}

export default Logger;