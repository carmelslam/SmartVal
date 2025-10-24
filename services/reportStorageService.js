// services/reportStorageService.js
// Service for uploading report PDFs to Supabase storage and tracking in documents table

class ReportStorageService {
  constructor() {
    this._supabase = null;
  }

  get supabase() {
    if (!this._supabase) {
      this._supabase = window.supabase || window.supabaseClient;
    }
    if (!this._supabase) {
      throw new Error('Supabase client not available');
    }
    return this._supabase;
  }

  /**
   * Upload PDF to Supabase storage and create document record
   * @param {Blob|File} pdfBlob - The PDF file as Blob or File
   * @param {string} caseId - UUID of the case
   * @param {string} plate - License plate number
   * @param {string} reportType - Type: 'expertise', 'estimate', or 'final'
   * @param {string} filename - Custom filename (optional)
   * @returns {Promise<{success: boolean, url?: string, error?: string}>}
   */
  async uploadReportPDF(pdfBlob, caseId, plate, reportType, filename = null) {
    try {
      console.log('📤 Uploading report PDF:', { caseId, plate, reportType });

      // Validate inputs
      if (!pdfBlob || !caseId || !plate || !reportType) {
        throw new Error('Missing required parameters');
      }

      // Map report type to Hebrew name
      const reportNames = {
        'expertise': 'אקספרטיזה',
        'estimate': 'אומדן',
        'final': 'דו"ח_סופי'
      };

      const hebrewName = reportNames[reportType] || reportType;

      // Generate filename if not provided
      const timestamp = Date.now();
      const actualFilename = filename || `${hebrewName}_${plate}_${timestamp}.pdf`;

      // Storage path: {case_id}/{filename}
      const storagePath = `${caseId}/${actualFilename}`;

      console.log('📁 Storage path:', storagePath);

      // Get current user for tracking
      const { data: { session } } = await this.supabase.auth.getSession();
      const userId = session?.user?.id;

      // 1. Upload to Supabase Storage (reports bucket - private)
      const { data: uploadData, error: uploadError } = await this.supabase.storage
        .from('reports')
        .upload(storagePath, pdfBlob, {
          contentType: 'application/pdf',
          upsert: true // Overwrite if exists
        });

      if (uploadError) {
        console.error('❌ Storage upload error:', uploadError);
        throw new Error(`Upload failed: ${uploadError.message}`);
      }

      console.log('✅ PDF uploaded to storage:', storagePath);

      // 2. Create record in documents table
      const documentRecord = {
        case_id: caseId,
        category: 'report',
        filename: actualFilename,
        mime_type: 'application/pdf',
        size_bytes: pdfBlob.size,
        storage_key: storagePath,
        created_by: userId || null
      };

      const { data: docData, error: docError } = await this.supabase
        .from('documents')
        .insert([documentRecord])
        .select()
        .single();

      if (docError) {
        console.error('❌ Documents table error:', docError);
        // File is uploaded but not tracked - not critical
        console.warn('⚠️ PDF uploaded but document record failed');
      } else {
        console.log('✅ Document record created:', docData.id);
      }

      // 3. Create signed URL for immediate access (1 hour expiry)
      const { data: urlData, error: urlError } = await this.supabase.storage
        .from('reports')
        .createSignedUrl(storagePath, 3600);

      if (urlError) {
        console.warn('⚠️ Failed to create signed URL:', urlError);
      }

      const signedUrl = urlData?.signedUrl;

      console.log('✅ Report uploaded successfully');

      return {
        success: true,
        url: signedUrl,
        storagePath: storagePath,
        documentId: docData?.id,
        filename: actualFilename
      };

    } catch (error) {
      console.error('❌ Error uploading report PDF:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Upload PDF from URL (for Make.com integration)
   * @param {string} pdfUrl - URL of the PDF to download and upload
   * @param {string} caseId - UUID of the case
   * @param {string} plate - License plate number
   * @param {string} reportType - Type: 'expertise', 'estimate', or 'final'
   */
  async uploadReportFromURL(pdfUrl, caseId, plate, reportType) {
    try {
      console.log('📥 Downloading PDF from URL:', pdfUrl);

      // Fetch the PDF
      const response = await fetch(pdfUrl);
      if (!response.ok) {
        throw new Error(`Failed to fetch PDF: ${response.status}`);
      }

      const pdfBlob = await response.blob();
      console.log('✅ PDF downloaded, size:', pdfBlob.size);

      // Upload to Supabase
      return await this.uploadReportPDF(pdfBlob, caseId, plate, reportType);

    } catch (error) {
      console.error('❌ Error uploading from URL:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Get existing report URL
   * @param {string} caseId - UUID of the case
   * @param {string} reportType - Type of report
   * @returns {Promise<{success: boolean, url?: string, error?: string}>}
   */
  async getReportURL(caseId, reportType) {
    try {
      const reportNames = {
        'expertise': 'אקספרטיזה',
        'estimate': 'אומדן',
        'final': 'דו"ח_סופי'
      };

      const hebrewName = reportNames[reportType];

      // Query documents table
      const { data: documents, error } = await this.supabase
        .from('documents')
        .select('storage_key')
        .eq('case_id', caseId)
        .eq('category', 'report')
        .ilike('filename', `%${hebrewName}%`)
        .order('created_at', { ascending: false })
        .limit(1);

      if (error || !documents || documents.length === 0) {
        return {
          success: false,
          error: 'Report not found'
        };
      }

      // Create signed URL
      const { data: urlData, error: urlError } = await this.supabase.storage
        .from('reports')
        .createSignedUrl(documents[0].storage_key, 3600);

      if (urlError) {
        throw new Error(urlError.message);
      }

      return {
        success: true,
        url: urlData.signedUrl
      };

    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }
}

// Export singleton instance
window.reportStorageService = window.reportStorageService || new ReportStorageService();
