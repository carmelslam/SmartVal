// Version Recovery Service
// Allows users to view and restore previous helper versions

import { supabase } from '../lib/supabaseClient.js';

export const versionRecoveryService = {
  
  /**
   * Get all versions for a case (for version history UI)
   * @param {string} caseId - Case ID
   * @returns {Array} List of all versions with metadata
   */
  async getVersionHistory(caseId) {
    try {
      const { data: versions, error } = await supabase
        .from('case_helper')
        .select(`
          id,
          version,
          helper_name,
          is_current,
          updated_at,
          source,
          updated_by
        `)
        .eq('case_id', caseId)
        .order('version', { ascending: false });
      
      if (error) throw error;
      
      return versions.map(v => ({
        id: v.id,
        version: v.version,
        name: v.helper_name,
        isCurrent: v.is_current,
        savedAt: new Date(v.updated_at).toLocaleString('he-IL'),
        source: v.source,
        updatedBy: v.updated_by,
        description: this.generateVersionDescription(v)
      }));
      
    } catch (error) {
      console.error('❌ Error getting version history:', error);
      return [];
    }
  },
  
  /**
   * Generate human-readable version description
   */
  generateVersionDescription(version) {
    const date = new Date(version.updated_at);
    const timeAgo = this.getTimeAgo(date);
    const source = version.source === 'system' ? 'Auto-save' : version.source;
    
    return `${source} - ${timeAgo}${version.is_current ? ' (Current)' : ''}`;
  },
  
  /**
   * Get specific version data (for preview/restore)
   * @param {string} versionId - Version ID
   * @returns {Object} Full helper data
   */
  async getVersionData(versionId) {
    try {
      const { data: version, error } = await supabase
        .from('case_helper')
        .select('helper_json, version, helper_name, updated_at')
        .eq('id', versionId)
        .single();
      
      if (error) throw error;
      
      return {
        helper: version.helper_json,
        version: version.version,
        name: version.helper_name,
        savedAt: version.updated_at
      };
      
    } catch (error) {
      console.error('❌ Error getting version data:', error);
      return null;
    }
  },
  
  /**
   * Restore a previous version as the current version
   * @param {string} caseId - Case ID
   * @param {string} versionId - Version to restore
   * @returns {boolean} Success status
   */
  async restoreVersion(caseId, versionId) {
    try {
      // Get the version to restore
      const versionData = await this.getVersionData(versionId);
      if (!versionData) {
        throw new Error('Version not found');
      }
      
      // Get current max version number
      const { data: maxVersion } = await supabase
        .from('case_helper')
        .select('version')
        .eq('case_id', caseId)
        .order('version', { ascending: false })
        .limit(1)
        .single();
      
      const newVersion = (maxVersion?.version || 0) + 1;
      
      // Mark all versions as not current
      const userId = (window.caseOwnershipService?.getCurrentUser() || {}).userId || null;
      await supabase
        .from('case_helper')
        .update({ 
          is_current: false,
          updated_by: userId,
          updated_at: new Date().toISOString()
        })
        .eq('case_id', caseId);
      
      // Create new version based on restored data
      const { error: insertError } = await supabase
        .from('case_helper')
        .insert({
          case_id: caseId,
          version: newVersion,
          is_current: true,
          helper_name: `${versionData.helper.meta?.plate || 'UNKNOWN'}_helper_v${newVersion}`,
          helper_json: {
            ...versionData.helper,
            version: newVersion,
            last_modified: new Date().toISOString(),
            restored_from_version: versionData.version,
            restore_reason: 'User requested version restore'
          },
          source: 'version_restore',
          created_by: userId,
          updated_by: userId
        });
      
      if (insertError) throw insertError;
      
      console.log(`✅ Version ${versionData.version} restored as v${newVersion}`);
      return true;
      
    } catch (error) {
      console.error('❌ Error restoring version:', error);
      return false;
    }
  },
  
  /**
   * Generate human-readable report from helper data
   * @param {Object} helper - Helper JSON data
   * @returns {string} Formatted text report
   */
  generateReadableReport(helper) {
    let report = '';
    
    // Header
    report += `=== SMARTVAL CASE REPORT ===\n\n`;
    report += `Case: ${helper.meta?.plate || 'Unknown'}\n`;
    report += `Generated: ${new Date().toLocaleString('he-IL')}\n`;
    report += `Version: ${helper.version || 'N/A'}\n\n`;
    
    // Case Information
    if (helper.case_info) {
      report += `--- CASE INFORMATION ---\n`;
      report += `Customer: ${helper.case_info.customer_name || 'N/A'}\n`;
      report += `Phone: ${helper.case_info.customer_phone || 'N/A'}\n`;
      report += `Created: ${helper.case_info.created_at ? new Date(helper.case_info.created_at).toLocaleString('he-IL') : 'N/A'}\n\n`;
    }
    
    // Vehicle Information
    if (helper.vehicle) {
      report += `--- VEHICLE INFORMATION ---\n`;
      report += `Plate: ${helper.vehicle.plate || 'N/A'}\n`;
      report += `Make: ${helper.vehicle.make || 'N/A'}\n`;
      report += `Model: ${helper.vehicle.model || 'N/A'}\n`;
      report += `Year: ${helper.vehicle.year || 'N/A'}\n`;
      report += `Color: ${helper.vehicle.color || 'N/A'}\n\n`;
    }
    
    // Damage Assessment
    if (helper.damage_assessment) {
      report += `--- DAMAGE ASSESSMENT ---\n`;
      if (helper.damage_assessment.centers && Array.isArray(helper.damage_assessment.centers)) {
        helper.damage_assessment.centers.forEach((center, index) => {
          report += `Damage Center ${index + 1}: ${center.name || 'Unknown'}\n`;
          report += `  Damage Type: ${center.damage_type || 'N/A'}\n`;
          report += `  Severity: ${center.severity || 'N/A'}\n`;
          if (center.parts && Array.isArray(center.parts)) {
            report += `  Parts Affected: ${center.parts.map(p => p.name).join(', ')}\n`;
          }
        });
      }
      
      if (helper.damage_assessment.summary) {
        report += `\nDamage Summary:\n`;
        report += `  Total Estimate: ${helper.damage_assessment.summary.total_estimate || 'N/A'}\n`;
        report += `  Labor Hours: ${helper.damage_assessment.summary.labor_hours || 'N/A'}\n`;
      }
      report += '\n';
    }
    
    // Valuation
    if (helper.valuation) {
      report += `--- VALUATION ---\n`;
      report += `Market Value: ${helper.valuation.market_value || 'N/A'}\n`;
      report += `Repair Cost: ${helper.valuation.repair_cost || 'N/A'}\n`;
      report += `Total Loss: ${helper.valuation.is_total_loss ? 'Yes' : 'No'}\n\n`;
    }
    
    // Documents
    if (helper.documents && Array.isArray(helper.documents)) {
      report += `--- DOCUMENTS ---\n`;
      helper.documents.forEach(doc => {
        report += `• ${doc.name || doc.filename || 'Unknown Document'} (${doc.type || 'Unknown Type'})\n`;
      });
      report += '\n';
    }
    
    // System Information
    report += `--- SYSTEM INFORMATION ---\n`;
    report += `Last Modified: ${helper.last_modified ? new Date(helper.last_modified).toLocaleString('he-IL') : 'N/A'}\n`;
    report += `Modified By: ${helper.modified_by || 'System'}\n`;
    
    if (helper.restored_from_version) {
      report += `Restored From: Version ${helper.restored_from_version}\n`;
      report += `Restore Reason: ${helper.restore_reason || 'N/A'}\n`;
    }
    
    report += '\n=== END OF REPORT ===';
    
    return report;
  },
  
  /**
   * Export version as downloadable text file
   * @param {string} versionId - Version to export
   * @returns {Blob} Text file blob
   */
  async exportVersionAsText(versionId) {
    const versionData = await this.getVersionData(versionId);
    if (!versionData) return null;
    
    const readableReport = this.generateReadableReport(versionData.helper);
    return new Blob([readableReport], { type: 'text/plain;charset=utf-8' });
  },
  
  /**
   * Helper function to calculate time ago
   */
  getTimeAgo(date) {
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);
    
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins} minutes ago`;
    if (diffHours < 24) return `${diffHours} hours ago`;
    if (diffDays < 7) return `${diffDays} days ago`;
    
    return date.toLocaleDateString('he-IL');
  }
};

// Make available globally
if (typeof window !== 'undefined') {
  window.versionRecoveryService = versionRecoveryService;
}