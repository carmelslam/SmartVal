/**
 * Nicole Query Handler Service
 * Phase 9: Admin Hub Enhancement
 *
 * Purpose: Handle all Nicole smart assistant queries to Supabase
 * Integration: Connects Nicole UI to Supabase SQL functions
 * Fallback: Make.com for external searches
 */

import { supabase } from './supabaseClient.js';

/**
 * Nicole Query Handler Class
 */
class NicoleQueryHandler {
  constructor() {
    this.queryCache = new Map();
    this.cacheTimeout = 5 * 60 * 1000; // 5 minutes
  }

  /**
   * Main query router - determines query type and routes appropriately
   * @param {string} queryText - User's query text
   * @param {string} plateNumber - Optional plate number
   * @returns {Promise<Object>} Formatted response
   */
  async handleQuery(queryText, plateNumber = null) {
    console.log('[Nicole] Handling query:', { queryText, plateNumber });

    try {
      // Determine query type
      const queryType = this._detectQueryType(queryText, plateNumber);
      console.log('[Nicole] Query type detected:', queryType);

      // Route to appropriate handler
      switch (queryType) {
        case 'plate_lookup':
          return await this.queryByPlate(plateNumber || queryText);

        case 'payment_status':
          return await this.queryPaymentStatus(plateNumber || this._extractPlate(queryText));

        case 'statistics':
          return await this.queryStatistics(queryText);

        case 'reminders':
          return await this.queryReminders(plateNumber || this._extractPlate(queryText));

        case 'search':
          return await this.searchAll(queryText);

        case 'trends':
          return await this.queryTrends();

        default:
          return await this.searchAll(queryText);
      }
    } catch (error) {
      console.error('[Nicole] Query error:', error);
      return this._formatError(error);
    }
  }

  /**
   * Query by plate number - get complete case details
   */
  async queryByPlate(plate) {
    console.log('[Nicole] Querying plate:', plate);

    try {
      const { data, error } = await supabase
        .rpc('nicole_get_case_details', { plate_input: plate });

      if (error) throw error;

      if (!data || Object.keys(data.case || {}).length === 0) {
        return this._formatResponse(
          'לא נמצא',
          `לא נמצאו נתונים עבור רכב ${plate}`,
          null
        );
      }

      // Format comprehensive response
      return this._formatCaseDetails(data, plate);
    } catch (error) {
      console.error('[Nicole] Plate query error:', error);
      throw error;
    }
  }

  /**
   * Query payment status for a plate
   */
  async queryPaymentStatus(plate) {
    console.log('[Nicole] Querying payment status:', plate);

    try {
      const { data, error } = await supabase
        .rpc('nicole_get_payment_status', { plate_input: plate });

      if (error) throw error;

      if (!data || data.length === 0) {
        return this._formatResponse(
          'אין תשלומים',
          `לא נמצאו תשלומים עבור רכב ${plate}`,
          null
        );
      }

      return this._formatPaymentStatus(data, plate);
    } catch (error) {
      console.error('[Nicole] Payment query error:', error);
      throw error;
    }
  }

  /**
   * Query statistics - comprehensive or specific
   */
  async queryStatistics(queryText = '') {
    console.log('[Nicole] Querying statistics:', queryText);

    try {
      // Determine which statistics to fetch
      const statsType = this._detectStatisticsType(queryText);

      let data, error;

      switch (statsType) {
        case 'payments':
          ({ data, error } = await supabase.rpc('nicole_get_payment_statistics'));
          break;

        case 'reminders':
          ({ data, error } = await supabase.rpc('nicole_get_reminder_statistics'));
          break;

        case 'garages':
          ({ data, error } = await supabase.rpc('nicole_get_garage_statistics', { limit_count: 10 }));
          break;

        case 'manufacturers':
          ({ data, error } = await supabase.rpc('nicole_get_manufacturer_statistics', { limit_count: 10 }));
          break;

        case 'damage':
          ({ data, error } = await supabase.rpc('nicole_get_damage_statistics'));
          break;

        case 'financial':
          ({ data, error } = await supabase.rpc('nicole_get_financial_statistics'));
          break;

        case 'dashboard':
        default:
          ({ data, error } = await supabase.rpc('nicole_get_dashboard_statistics'));
          break;
      }

      if (error) throw error;

      return this._formatStatistics(data, statsType);
    } catch (error) {
      console.error('[Nicole] Statistics query error:', error);
      throw error;
    }
  }

  /**
   * Query reminders
   */
  async queryReminders(plate = null) {
    console.log('[Nicole] Querying reminders:', plate);

    try {
      const { data, error } = await supabase
        .rpc('nicole_get_reminders', {
          plate_input: plate,
          status_filter: 'ממתין'
        });

      if (error) throw error;

      if (!data || data.length === 0) {
        return this._formatResponse(
          'אין תזכורות',
          plate ? `אין תזכורות פעילות עבור רכב ${plate}` : 'אין תזכורות פעילות במערכת',
          null
        );
      }

      return this._formatReminders(data, plate);
    } catch (error) {
      console.error('[Nicole] Reminders query error:', error);
      throw error;
    }
  }

  /**
   * Search all data
   */
  async searchAll(searchQuery) {
    console.log('[Nicole] Searching all:', searchQuery);

    // Check cache first
    const cached = this._getFromCache(searchQuery);
    if (cached) {
      console.log('[Nicole] Returning cached result');
      return cached;
    }

    try {
      const { data, error } = await supabase
        .rpc('nicole_search_all', { search_query: searchQuery });

      if (error) throw error;

      if (!data || data.length === 0) {
        return this._formatResponse(
          'לא נמצאו תוצאות',
          `לא נמצאו תוצאות עבור "${searchQuery}"`,
          null
        );
      }

      const result = this._formatSearchResults(data, searchQuery);

      // Cache the result
      this._addToCache(searchQuery, result);

      return result;
    } catch (error) {
      console.error('[Nicole] Search error:', error);
      throw error;
    }
  }

  /**
   * Query trends
   */
  async queryTrends(daysBack = 30) {
    console.log('[Nicole] Querying trends:', daysBack);

    try {
      const { data, error } = await supabase
        .rpc('nicole_get_trends', { days_back: daysBack });

      if (error) throw error;

      return this._formatTrends(data, daysBack);
    } catch (error) {
      console.error('[Nicole] Trends query error:', error);
      throw error;
    }
  }

  // ============================================
  // FORMATTING METHODS
  // ============================================

  /**
   * Format case details response
   */
  _formatCaseDetails(data, plate) {
    const caseInfo = data.case || {};
    const tracking = data.tracking || {};
    const payments = data.payments || [];
    const reminders = data.reminders || [];
    const expertise = data.expertise || [];

    let response = `📋 **פרטי תיק: ${plate}**\n\n`;

    // Basic info
    if (caseInfo.owner_name) {
      response += `👤 **בעלים:** ${caseInfo.owner_name}\n`;
    }
    if (tracking.manufacturer) {
      response += `🚗 **יצרן:** ${tracking.manufacturer}`;
      if (tracking.year) response += ` (${tracking.year})`;
      response += '\n';
    }
    if (tracking.vehicle_value) {
      response += `💰 **שווי רכב:** ${this._formatCurrency(tracking.vehicle_value)}\n`;
    }
    if (tracking.garage) {
      response += `🔧 **מוסך:** ${tracking.garage}\n`;
    }
    if (caseInfo.status) {
      response += `📊 **סטטוס:** ${caseInfo.status}\n`;
    }

    // Payments
    if (payments.length > 0) {
      response += `\n💳 **תשלומים (${payments.length}):**\n`;
      payments.forEach(p => {
        response += `  • ${p.payment_status} - ${this._formatCurrency(p.total_fee)}`;
        if (p.expected_payment_date) {
          response += ` (צפי: ${this._formatDate(p.expected_payment_date)})`;
        }
        response += '\n';
      });
    }

    // Reminders
    if (reminders.length > 0) {
      response += `\n⏰ **תזכורות (${reminders.length}):**\n`;
      reminders.forEach(r => {
        response += `  • ${r.title} - ${this._formatDate(r.due_date)}`;
        if (r.priority === 'דחוף') response += ' 🔴';
        response += '\n';
      });
    }

    // Damage centers
    if (expertise.length > 0) {
      response += `\n🔨 **מוקדי נזק (${expertise.length}):**\n`;
      expertise.forEach(e => {
        response += `  • ${e.damage_center || 'לא צוין'}\n`;
      });
    }

    return this._formatResponse('מידע על תיק', response, data);
  }

  /**
   * Format payment status response
   */
  _formatPaymentStatus(payments, plate) {
    let response = `💳 **סטטוס תשלומים - ${plate}**\n\n`;

    payments.forEach((p, index) => {
      response += `**תשלום ${index + 1}:**\n`;
      response += `  • סכום: ${this._formatCurrency(p.total_fee)}\n`;
      response += `  • סטטוס: ${p.payment_status}\n`;

      if (p.expected_payment_date) {
        response += `  • תאריך צפוי: ${this._formatDate(p.expected_payment_date)}\n`;

        if (p.is_overdue) {
          response += `  • ⚠️ באיחור!\n`;
        } else if (p.days_until_due !== null && p.days_until_due <= 7) {
          response += `  • ⏰ ${p.days_until_due} ימים עד לתשלום\n`;
        }
      }

      if (p.notes) {
        response += `  • הערות: ${p.notes}\n`;
      }

      response += '\n';
    });

    return this._formatResponse('מצב תשלומים', response, payments);
  }

  /**
   * Format statistics response
   */
  _formatStatistics(data, statsType) {
    let response = '';

    switch (statsType) {
      case 'payments':
        response = this._formatPaymentStatistics(data);
        break;
      case 'reminders':
        response = this._formatReminderStatistics(data);
        break;
      case 'garages':
        response = this._formatGarageStatistics(data);
        break;
      case 'manufacturers':
        response = this._formatManufacturerStatistics(data);
        break;
      case 'damage':
        response = this._formatDamageStatistics(data);
        break;
      case 'financial':
        response = this._formatFinancialStatistics(data);
        break;
      case 'dashboard':
      default:
        response = this._formatDashboardStatistics(data);
        break;
    }

    return this._formatResponse('סטטיסטיקות', response, data);
  }

  /**
   * Format dashboard statistics
   */
  _formatDashboardStatistics(data) {
    const cases = data.cases || {};
    const payments = data.payments || {};
    const reminders = data.reminders || {};

    let response = `📊 **סיכום מערכת**\n\n`;

    // Cases
    response += `📁 **תיקים:**\n`;
    response += `  • סה"כ: ${cases.total_cases || 0}\n`;
    response += `  • פתוחים: ${cases.by_status?.OPEN || 0}\n`;
    response += `  • חדשים (30 יום): ${cases.created_last_30_days || 0}\n\n`;

    // Payments
    response += `💰 **תשלומים:**\n`;
    response += `  • סה"כ: ${payments.total_payments || 0}\n`;
    response += `  • ממתינים: ${payments.pending?.count || 0}`;
    if (payments.pending?.total_amount) {
      response += ` (${this._formatCurrency(payments.pending.total_amount)})`;
    }
    response += '\n';
    response += `  • באיחור: ${payments.overdue?.count || 0}`;
    if (payments.overdue?.total_amount) {
      response += ` (${this._formatCurrency(payments.overdue.total_amount)})`;
    }
    response += '\n\n';

    // Reminders
    response += `⏰ **תזכורות:**\n`;
    response += `  • ממתינות: ${reminders.by_status?.ממתין || 0}\n`;
    response += `  • באיחור: ${reminders.overdue || 0}\n`;
    response += `  • השבוע: ${reminders.due_this_week || 0}\n`;

    return response;
  }

  /**
   * Format payment statistics
   */
  _formatPaymentStatistics(data) {
    let response = `💰 **סטטיסטיקות תשלומים**\n\n`;

    response += `סה"כ תשלומים: ${data.total_payments || 0}\n`;
    response += `סה"כ סכום: ${this._formatCurrency(data.total_fees || 0)}\n\n`;

    if (data.by_status) {
      response += `**לפי סטטוס:**\n`;
      for (const [status, count] of Object.entries(data.by_status)) {
        response += `  • ${status}: ${count}\n`;
      }
    }

    if (data.upcoming_week && data.upcoming_week.count > 0) {
      response += `\n⏰ **השבוע הקרוב:**\n`;
      response += `  • ${data.upcoming_week.count} תשלומים\n`;
      response += `  • ${this._formatCurrency(data.upcoming_week.total_amount)}\n`;
    }

    return response;
  }

  /**
   * Format reminder statistics
   */
  _formatReminderStatistics(data) {
    let response = `⏰ **סטטיסטיקות תזכורות**\n\n`;

    response += `סה"כ תזכורות: ${data.total_reminders || 0}\n\n`;

    if (data.by_status) {
      response += `**לפי סטטוס:**\n`;
      for (const [status, count] of Object.entries(data.by_status)) {
        response += `  • ${status}: ${count}\n`;
      }
    }

    response += `\n**תזכורות דחופות:**\n`;
    response += `  • באיחור: ${data.overdue || 0}\n`;
    response += `  • היום: ${data.due_today || 0}\n`;
    response += `  • השבוע: ${data.due_this_week || 0}\n`;

    return response;
  }

  /**
   * Format garage statistics
   */
  _formatGarageStatistics(data) {
    let response = `🔧 **סטטיסטיקות מוסכים**\n\n`;

    response += `סה"כ מוסכים: ${data.total_garages || 0}\n\n`;

    if (data.top_garages_by_cases && data.top_garages_by_cases.length > 0) {
      response += `**מוסכים מובילים:**\n`;
      data.top_garages_by_cases.forEach((garage, index) => {
        response += `${index + 1}. ${garage.garage} - ${garage.case_count} תיקים\n`;
      });
    }

    return response;
  }

  /**
   * Format manufacturer statistics
   */
  _formatManufacturerStatistics(data) {
    let response = `🚗 **סטטיסטיקות יצרנים**\n\n`;

    response += `סה"כ יצרנים: ${data.total_manufacturers || 0}\n\n`;

    if (data.top_manufacturers && data.top_manufacturers.length > 0) {
      response += `**יצרנים מובילים:**\n`;
      data.top_manufacturers.forEach((mfr, index) => {
        response += `${index + 1}. ${mfr.manufacturer} - ${mfr.case_count} תיקים\n`;
      });
    }

    return response;
  }

  /**
   * Format damage statistics
   */
  _formatDamageStatistics(data) {
    let response = `🔨 **סטטיסטיקות נזקים**\n\n`;

    response += `תיקים עם חוות דעת: ${data.total_cases_with_expertise || 0}\n`;
    response += `סה"כ מוקדי נזק: ${data.total_damage_centers || 0}\n`;
    response += `ממוצע מוקדים לתיק: ${data.avg_damage_centers_per_case || 0}\n`;

    return response;
  }

  /**
   * Format financial statistics
   */
  _formatFinancialStatistics(data) {
    const totals = data.totals || {};
    const averages = data.averages || {};

    let response = `💵 **סטטיסטיקות כספיות**\n\n`;

    response += `**סיכומים:**\n`;
    response += `  • חלקים: ${this._formatCurrency(totals.total_parts || 0)}\n`;
    response += `  • עבודות: ${this._formatCurrency(totals.total_work || 0)}\n`;
    response += `  • תביעות: ${this._formatCurrency(totals.total_claims || 0)}\n`;
    response += `  • פיצויים: ${this._formatCurrency(totals.total_compensation || 0)}\n\n`;

    response += `**ממוצעים:**\n`;
    response += `  • חלקים: ${this._formatCurrency(averages.avg_parts || 0)}\n`;
    response += `  • עבודות: ${this._formatCurrency(averages.avg_work || 0)}\n`;
    response += `  • תביעה: ${this._formatCurrency(averages.avg_claim || 0)}\n`;

    return response;
  }

  /**
   * Format search results
   */
  _formatSearchResults(results, searchQuery) {
    let response = `🔍 **תוצאות חיפוש: "${searchQuery}"**\n\n`;
    response += `נמצאו ${results.length} תוצאות:\n\n`;

    results.slice(0, 10).forEach((result, index) => {
      response += `${index + 1}. ${result.title}\n`;
      if (result.description) {
        response += `   ${result.description}\n`;
      }
      response += `   מקור: ${this._translateSource(result.source)}\n\n`;
    });

    if (results.length > 10) {
      response += `ועוד ${results.length - 10} תוצאות...\n`;
    }

    return this._formatResponse('תוצאות חיפוש', response, results);
  }

  /**
   * Format reminders
   */
  _formatReminders(reminders, plate) {
    let response = plate
      ? `⏰ **תזכורות - ${plate}**\n\n`
      : `⏰ **תזכורות פעילות**\n\n`;

    reminders.forEach((reminder, index) => {
      response += `${index + 1}. ${reminder.title}\n`;
      response += `   📅 ${this._formatDate(reminder.due_date)}`;

      if (reminder.is_overdue) {
        response += ` 🔴 באיחור!`;
      } else if (reminder.days_until_due <= 3) {
        response += ` ⚠️ ${reminder.days_until_due} ימים`;
      }

      response += `\n   קטגוריה: ${reminder.category}\n`;

      if (reminder.description) {
        response += `   ${reminder.description}\n`;
      }

      response += '\n';
    });

    return this._formatResponse('תזכורות', response, reminders);
  }

  /**
   * Format trends
   */
  _formatTrends(data, daysBack) {
    let response = `📈 **מגמות (${daysBack} ימים אחרונים)**\n\n`;

    if (data.cases_by_day && data.cases_by_day.length > 0) {
      const totalCases = data.cases_by_day.reduce((sum, day) => sum + day.count, 0);
      response += `תיקים חדשים: ${totalCases}\n`;
    }

    if (data.payments_by_status_trend) {
      response += `\n**תשלומים:**\n`;
      for (const [status, count] of Object.entries(data.payments_by_status_trend)) {
        response += `  • ${status}: ${count}\n`;
      }
    }

    return this._formatResponse('מגמות', response, data);
  }

  // ============================================
  // HELPER METHODS
  // ============================================

  /**
   * Detect query type from text
   */
  _detectQueryType(queryText, plateNumber) {
    const text = queryText.toLowerCase();

    if (plateNumber || this._isPlateNumber(queryText)) {
      return 'plate_lookup';
    }

    if (text.includes('תשלום') || text.includes('חיוב') || text.includes('כסף') || text.includes('payment')) {
      return 'payment_status';
    }

    if (text.includes('סטטיסטיק') || text.includes('נתונ') || text.includes('דוח') || text.includes('statistic')) {
      return 'statistics';
    }

    if (text.includes('תזכורת') || text.includes('reminder')) {
      return 'reminders';
    }

    if (text.includes('מגמ') || text.includes('trend')) {
      return 'trends';
    }

    return 'search';
  }

  /**
   * Detect statistics type from query text
   */
  _detectStatisticsType(queryText) {
    const text = queryText.toLowerCase();

    if (text.includes('תשלום') || text.includes('payment')) return 'payments';
    if (text.includes('תזכורת') || text.includes('reminder')) return 'reminders';
    if (text.includes('מוסך') || text.includes('garage')) return 'garages';
    if (text.includes('יצרן') || text.includes('manufacturer')) return 'manufacturers';
    if (text.includes('נזק') || text.includes('damage')) return 'damage';
    if (text.includes('כספ') || text.includes('financial')) return 'financial';

    return 'dashboard';
  }

  /**
   * Check if string is a plate number
   */
  _isPlateNumber(text) {
    // Israeli plate numbers: 7-8 digits or 2 digits + 3 digits + 2 digits
    return /^\d{7,8}$/.test(text) || /^\d{2}-\d{3}-\d{2}$/.test(text);
  }

  /**
   * Extract plate number from text
   */
  _extractPlate(text) {
    const plateMatch = text.match(/\d{7,8}|\d{2}-\d{3}-\d{2}/);
    return plateMatch ? plateMatch[0] : null;
  }

  /**
   * Translate source type to Hebrew
   */
  _translateSource(source) {
    const translations = {
      'case': 'תיק',
      'tracking_general': 'מעקב כללי',
      'payment_tracking': 'תשלומים',
      'reminder': 'תזכורות',
      'tracking_expertise': 'חוות דעת'
    };
    return translations[source] || source;
  }

  /**
   * Format currency in Hebrew locale
   */
  _formatCurrency(amount) {
    if (!amount) return '0 ₪';
    return `${Number(amount).toLocaleString('he-IL')} ₪`;
  }

  /**
   * Format date in Hebrew locale
   */
  _formatDate(dateString) {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('he-IL', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    });
  }

  /**
   * Format response object
   */
  _formatResponse(title, message, data) {
    return {
      success: true,
      title,
      message,
      data,
      source: 'supabase',
      timestamp: new Date().toISOString()
    };
  }

  /**
   * Format error response
   */
  _formatError(error) {
    return {
      success: false,
      title: 'שגיאה',
      message: `אירעה שגיאה: ${error.message}`,
      error: error,
      source: 'supabase',
      timestamp: new Date().toISOString()
    };
  }

  /**
   * Cache management
   */
  _getFromCache(key) {
    const cached = this.queryCache.get(key);
    if (!cached) return null;

    const now = Date.now();
    if (now - cached.timestamp > this.cacheTimeout) {
      this.queryCache.delete(key);
      return null;
    }

    return cached.data;
  }

  _addToCache(key, data) {
    this.queryCache.set(key, {
      data,
      timestamp: Date.now()
    });

    // Clean old cache entries if too many
    if (this.queryCache.size > 50) {
      const firstKey = this.queryCache.keys().next().value;
      this.queryCache.delete(firstKey);
    }
  }

  /**
   * Clear cache
   */
  clearCache() {
    this.queryCache.clear();
    console.log('[Nicole] Cache cleared');
  }
}

// Export singleton instance
export const nicoleQueryHandler = new NicoleQueryHandler();

// Also export the class for testing
export { NicoleQueryHandler };
