/**
 * Phase 7: File Storage & OneDrive Integration
 * Centralized File Upload Service for Supabase Storage
 * Date: 2025-11-06
 * Session: 99
 */

// Import Supabase client
import { supabase } from './supabaseClient.js';

class FileUploadService {
    constructor() {
        this.supportedBuckets = {
            reports: { maxSize: 50 * 1024 * 1024, allowedTypes: ['application/pdf'] },
            originals: { maxSize: 10 * 1024 * 1024, allowedTypes: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'] },
            processed: { maxSize: 10 * 1024 * 1024, allowedTypes: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'] },
            docs: { maxSize: 50 * 1024 * 1024, allowedTypes: ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', 'text/plain', 'text/csv'] },
            temp: { maxSize: 50 * 1024 * 1024, allowedTypes: ['*'] }
        };
        
        this.uploadQueue = new Map();
        this.activeUploads = new Map();
    }

    /**
     * Validate file before upload
     */
    validateFile(file, bucket = null, category = null) {
        const errors = [];
        
        // Basic file validation
        if (!file || !file.name) {
            errors.push('No file provided or invalid file');
            return { valid: false, errors };
        }
        
        // Determine bucket if not provided
        if (!bucket) {
            bucket = this.determineBucket(file.type, category);
        }
        
        // Check if bucket is supported
        if (!this.supportedBuckets[bucket]) {
            errors.push(`Unsupported bucket: ${bucket}`);
            return { valid: false, errors };
        }
        
        const bucketConfig = this.supportedBuckets[bucket];
        
        // Size validation
        if (file.size > bucketConfig.maxSize) {
            errors.push(`File size (${this.formatFileSize(file.size)}) exceeds limit for ${bucket} bucket (${this.formatFileSize(bucketConfig.maxSize)})`);
        }
        
        // Type validation
        if (bucketConfig.allowedTypes[0] !== '*' && !bucketConfig.allowedTypes.includes(file.type)) {
            errors.push(`File type ${file.type} not allowed in ${bucket} bucket. Allowed types: ${bucketConfig.allowedTypes.join(', ')}`);
        }
        
        // Filename validation
        const sanitizedName = this.sanitizeFilename(file.name);
        if (sanitizedName !== file.name) {
            console.warn(`Filename will be sanitized from "${file.name}" to "${sanitizedName}"`);
        }
        
        return {
            valid: errors.length === 0,
            errors,
            bucket,
            sanitizedName
        };
    }

    /**
     * Determine appropriate bucket based on file type and category
     */
    determineBucket(mimeType, category = null) {
        if (category === 'report' || mimeType === 'application/pdf') {
            return 'reports';
        }
        if (mimeType.startsWith('image/') && category === 'processed') {
            return 'processed';
        }
        if (mimeType.startsWith('image/')) {
            return 'originals';
        }
        if (mimeType.includes('document') || mimeType.includes('spreadsheet') || 
            mimeType.includes('text/') || mimeType.includes('csv')) {
            return 'docs';
        }
        return 'temp';
    }

    /**
     * Sanitize filename for storage
     */
    sanitizeFilename(filename) {
        // Remove special characters, keep only alphanumeric, dots, hyphens, underscores
        const name = filename.replace(/[^a-zA-Z0-9._-]/g, '_');
        
        // Ensure filename isn't too long
        const maxLength = 100;
        if (name.length > maxLength) {
            const ext = name.substring(name.lastIndexOf('.'));
            const nameWithoutExt = name.substring(0, name.lastIndexOf('.'));
            return nameWithoutExt.substring(0, maxLength - ext.length) + ext;
        }
        
        return name;
    }

    /**
     * Generate storage path for file
     */
    async generateStoragePath(caseId, category, filename) {
        try {
            const { data, error } = await supabase.rpc('generate_storage_path', {
                p_case_id: caseId,
                p_category: category,
                p_filename: filename
            });
            
            if (error) throw error;
            return data;
        } catch (error) {
            console.error('Error generating storage path:', error);
            // Fallback to manual generation
            const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
            const sanitizedFilename = this.sanitizeFilename(filename);
            return `case-${caseId}/${category || 'general'}/${timestamp}_${sanitizedFilename}`;
        }
    }

    /**
     * Calculate file hash for integrity verification
     */
    async calculateFileHash(file) {
        try {
            const arrayBuffer = await file.arrayBuffer();
            const hashBuffer = await crypto.subtle.digest('SHA-256', arrayBuffer);
            const hashArray = Array.from(new Uint8Array(hashBuffer));
            return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
        } catch (error) {
            console.error('Error calculating file hash:', error);
            return null;
        }
    }

    /**
     * Upload file to Supabase Storage
     */
    async uploadToSupabase(file, uploadOptions = {}) {
        const {
            caseId,
            category = 'general',
            bucket = null,
            onProgress = null,
            metadata = {},
            replaceExisting = false
        } = uploadOptions;
        
        // Validate file
        const validation = this.validateFile(file, bucket, category);
        if (!validation.valid) {
            throw new Error(`File validation failed: ${validation.errors.join(', ')}`);
        }
        
        const finalBucket = validation.bucket;
        const sanitizedFilename = validation.sanitizedName;
        
        // Generate unique upload ID
        const uploadId = crypto.randomUUID();
        
        try {
            // Generate storage path
            const storagePath = await this.generateStoragePath(caseId, category, sanitizedFilename);
            
            // Calculate file hash
            const fileHash = await this.calculateFileHash(file);
            
            // Check for duplicate files if hash is available
            if (fileHash && !replaceExisting) {
                const { data: existingFile } = await supabase
                    .from('documents')
                    .select('id, filename, storage_path')
                    .eq('file_hash', fileHash)
                    .eq('case_id', caseId)
                    .single();
                
                if (existingFile) {
                    throw new Error(`Duplicate file detected: ${existingFile.filename}`);
                }
            }
            
            // Create document record with pending status
            const documentData = {
                case_id: caseId,
                category: category,
                filename: sanitizedFilename,
                mime_type: file.type,
                size_bytes: file.size,
                bucket_name: finalBucket,
                storage_path: storagePath,
                upload_status: 'uploading',
                file_hash: fileHash,
                file_metadata: {
                    original_filename: file.name,
                    upload_id: uploadId,
                    upload_timestamp: new Date().toISOString(),
                    ...metadata
                },
                created_by: (await supabase.auth.getUser()).data.user?.id
            };
            
            const { data: document, error: docError } = await supabase
                .from('documents')
                .insert(documentData)
                .select()
                .single();
            
            if (docError) throw docError;
            
            // Track active upload
            this.activeUploads.set(uploadId, {
                documentId: document.id,
                filename: sanitizedFilename,
                progress: 0,
                status: 'uploading'
            });
            
            // Upload file to storage
            const { data: uploadData, error: uploadError } = await supabase.storage
                .from(finalBucket)
                .upload(storagePath, file, {
                    upsert: replaceExisting,
                    onUploadProgress: (progress) => {
                        const percentage = Math.round((progress.loaded / progress.total) * 100);
                        this.activeUploads.set(uploadId, {
                            ...this.activeUploads.get(uploadId),
                            progress: percentage
                        });
                        if (onProgress) onProgress(percentage, progress);
                    }
                });
            
            if (uploadError) {
                // Update document status to failed
                await supabase
                    .from('documents')
                    .update({ upload_status: 'failed' })
                    .eq('id', document.id);
                
                throw uploadError;
            }
            
            // Update document status to completed
            const { error: updateError } = await supabase
                .from('documents')
                .update({ 
                    upload_status: 'completed',
                    storage_key: uploadData.path // Keep for compatibility
                })
                .eq('id', document.id);
            
            if (updateError) {
                console.error('Error updating document status:', updateError);
            }
            
            // Remove from active uploads
            this.activeUploads.delete(uploadId);
            
            // Log successful upload
            await this.logFileOperation(document.id, 'upload_completed', {
                upload_id: uploadId,
                bucket: finalBucket,
                storage_path: storagePath,
                file_size: file.size,
                file_hash: fileHash
            });
            
            return {
                success: true,
                document: document,
                uploadData: uploadData,
                storagePath: storagePath,
                bucket: finalBucket
            };
            
        } catch (error) {
            // Remove from active uploads
            this.activeUploads.delete(uploadId);
            
            console.error('File upload error:', error);
            throw error;
        }
    }

    /**
     * Generate signed URL for file access
     */
    async getSignedUrl(documentId, expiresIn = '1 hour', accessType = 'view') {
        try {
            const { data, error } = await supabase.rpc('generate_signed_url', {
                p_document_id: documentId,
                p_expires_in: expiresIn,
                p_access_type: accessType
            });
            
            if (error) throw error;
            
            if (!data.success) {
                throw new Error(data.message || 'Failed to generate signed URL');
            }
            
            // Generate actual signed URL using Supabase client
            const { data: signedUrlData, error: urlError } = await supabase.storage
                .from(data.bucket_name)
                .createSignedUrl(data.storage_path, this.parseInterval(expiresIn));
            
            if (urlError) throw urlError;
            
            return {
                ...data,
                signed_url: signedUrlData.signedUrl,
                public_url: signedUrlData.signedUrl
            };
            
        } catch (error) {
            console.error('Error generating signed URL:', error);
            throw error;
        }
    }

    /**
     * Get file information
     */
    async getFileInfo(documentId) {
        try {
            const { data, error } = await supabase.rpc('get_file_info', {
                p_document_id: documentId
            });
            
            if (error) throw error;
            return data;
        } catch (error) {
            console.error('Error getting file info:', error);
            throw error;
        }
    }

    /**
     * Get files for a case
     */
    async getCaseFiles(caseId, category = null, limit = 50, offset = 0) {
        try {
            const { data, error } = await supabase.rpc('get_case_files', {
                p_case_id: caseId,
                p_category: category,
                p_limit: limit,
                p_offset: offset
            });
            
            if (error) throw error;
            return data;
        } catch (error) {
            console.error('Error getting case files:', error);
            throw error;
        }
    }

    /**
     * Delete file
     */
    async deleteFile(documentId) {
        try {
            // Get file info first
            const fileInfo = await this.getFileInfo(documentId);
            if (!fileInfo.success) {
                throw new Error('File not found or access denied');
            }
            
            const { bucket_name, storage_path } = fileInfo.document;
            
            // Delete from storage
            const { error: storageError } = await supabase.storage
                .from(bucket_name)
                .remove([storage_path]);
            
            if (storageError) {
                console.error('Error deleting from storage:', storageError);
                // Continue with database deletion even if storage deletion fails
            }
            
            // Delete from database
            const { error: dbError } = await supabase
                .from('documents')
                .delete()
                .eq('id', documentId);
            
            if (dbError) throw dbError;
            
            // Log deletion
            await this.logFileOperation(documentId, 'file_deleted', {
                bucket: bucket_name,
                storage_path: storage_path
            });
            
            return { success: true };
            
        } catch (error) {
            console.error('Error deleting file:', error);
            throw error;
        }
    }

    /**
     * Get upload progress
     */
    getUploadProgress(uploadId) {
        return this.activeUploads.get(uploadId) || null;
    }

    /**
     * Get all active uploads
     */
    getActiveUploads() {
        return Array.from(this.activeUploads.entries()).map(([id, upload]) => ({
            uploadId: id,
            ...upload
        }));
    }

    /**
     * Log file operation
     */
    async logFileOperation(documentId, operation, details = {}) {
        try {
            await supabase.rpc('log_file_operation', {
                p_document_id: documentId,
                p_operation: operation,
                p_details: details
            });
        } catch (error) {
            console.error('Error logging file operation:', error);
            // Don't throw - logging errors shouldn't break the main flow
        }
    }

    /**
     * Utility functions
     */
    formatFileSize(bytes) {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }

    parseInterval(interval) {
        // Convert PostgreSQL interval to seconds
        const matches = interval.match(/(\d+)\s*(second|minute|hour|day)s?/i);
        if (!matches) return 3600; // Default 1 hour
        
        const value = parseInt(matches[1]);
        const unit = matches[2].toLowerCase();
        
        switch (unit) {
            case 'second': return value;
            case 'minute': return value * 60;
            case 'hour': return value * 3600;
            case 'day': return value * 86400;
            default: return 3600;
        }
    }
}

// Create singleton instance
export const fileUploadService = new FileUploadService();

// Export class for testing or custom instances
export { FileUploadService };

// Usage example:
/*
// Upload a file
try {
    const result = await fileUploadService.uploadToSupabase(file, {
        caseId: 'case-uuid',
        category: 'invoice',
        onProgress: (percentage) => console.log(`Upload: ${percentage}%`),
        metadata: { invoiceNumber: 'INV-001' }
    });
    console.log('Upload successful:', result);
} catch (error) {
    console.error('Upload failed:', error);
}

// Get signed URL
try {
    const urlInfo = await fileUploadService.getSignedUrl(documentId, '2 hours', 'download');
    console.log('File URL:', urlInfo.signed_url);
} catch (error) {
    console.error('Failed to get URL:', error);
}

// Get case files
try {
    const files = await fileUploadService.getCaseFiles(caseId, 'invoice');
    console.log('Case files:', files);
} catch (error) {
    console.error('Failed to get files:', error);
}
*/