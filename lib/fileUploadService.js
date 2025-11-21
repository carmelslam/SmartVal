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
            originals: { maxSize: 50 * 1024 * 1024, allowedTypes: ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/heic', 'image/heif'] }, // Updated to 50MB + HEIC support
            processed: { maxSize: 20 * 1024 * 1024, allowedTypes: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'] }, // Updated to 20MB
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
        // Keep Unicode letters (including Hebrew), numbers, dots, hyphens, underscores
        // Remove only filesystem forbidden chars and invisible RTL/LTR markers
        const name = filename
            .replace(/[<>:"/\\|?*]/g, '_')  // Remove filesystem forbidden chars
            .replace(/[\u200E\u200F\u202A\u202B\u202C\u202D\u202E]/g, '') // Remove invisible RTL/LTR chars
            .replace(/\s+/g, '_');  // Replace spaces with underscores
        
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
     * Get webhook-friendly download URL for Make.com integration
     * This creates a longer-lasting URL for service-to-service communication
     */
    async getWebhookUrl(documentId, expiresInHours = 24) {
        try {
            const { data, error } = await supabase.rpc('generate_signed_url', {
                p_document_id: documentId,
                p_expires_in: `${expiresInHours} hours`
            });
            
            if (error) throw error;
            
            return {
                success: true,
                download_url: data.signed_url,
                expires_at: data.expires_at,
                document_id: documentId,
                filename: data.filename,
                size_bytes: data.size_bytes
            };
            
        } catch (error) {
            console.error('Error generating webhook URL:', error);
            return {
                success: false,
                error: error.message,
                document_id: documentId
            };
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

    // ============================================================================
    // IMAGE-SPECIFIC FUNCTIONS (Phase 1A - Pictures Module)
    // ============================================================================

    /**
     * Create image record in database after file upload
     * Links the uploaded document to the images table with image-specific metadata
     */
    async createImageRecord(imageData) {
        const {
            caseId,
            documentId,
            damageCenterId = null,
            originalUrl,
            filename,
            category = 'damage',
            width = null,
            height = null,
            exifData = null,
            source = 'direct_upload'
        } = imageData;

        try {
            // Get next display order for this case
            const nextOrder = await this.getNextDisplayOrder(caseId);

            // Create image record
            const { data: image, error } = await supabase
                .from('images')
                .insert({
                    case_id: caseId,
                    document_id: documentId,
                    damage_center_id: damageCenterId,
                    original_url: originalUrl,
                    filename: filename,
                    category: category,
                    display_order: nextOrder,
                    width: width,
                    height: height,
                    exif_data: exifData,
                    optimization_status: 'pending',
                    source: source,
                    created_by: (await supabase.auth.getUser()).data.user?.id
                })
                .select()
                .single();

            if (error) throw error;

            return {
                success: true,
                image: image
            };

        } catch (error) {
            console.error('Error creating image record:', error);
            throw error;
        }
    }

    /**
     * Get next display order for a case
     */
    async getNextDisplayOrder(caseId) {
        try {
            const { data, error } = await supabase
                .rpc('get_next_display_order', { p_case_id: caseId });

            if (error) throw error;
            return data || 0;

        } catch (error) {
            console.error('Error getting next display order:', error);
            // Fallback: calculate manually
            const { data: images } = await supabase
                .from('images')
                .select('display_order')
                .eq('case_id', caseId)
                .is('deleted_at', null)
                .order('display_order', { ascending: false })
                .limit(1);

            if (images && images.length > 0) {
                return images[0].display_order + 100;
            }
            return 0;
        }
    }

    /**
     * Get images for a case with full metadata
     */
    async getImagesByCaseId(caseId, options = {}) {
        const {
            category = null,
            damageCenterId = null,
            includeDeleted = false,
            orderBy = 'display_order',
            limit = 100,
            offset = 0
        } = options;

        try {
            let query = supabase
                .from('images')
                .select(`
                    *,
                    documents(
                        filename,
                        size_bytes,
                        bucket_name,
                        storage_path,
                        mime_type,
                        file_hash
                    ),
                    damage_centers(
                        id,
                        name,
                        type
                    )
                `)
                .eq('case_id', caseId);

            // Apply filters
            if (!includeDeleted) {
                query = query.is('deleted_at', null);
            }

            if (category) {
                query = query.eq('category', category);
            }

            if (damageCenterId) {
                query = query.eq('damage_center_id', damageCenterId);
            }

            // Apply ordering
            query = query.order(orderBy, { ascending: true });

            // Apply pagination
            if (limit) {
                query = query.limit(limit);
            }
            if (offset) {
                query = query.range(offset, offset + limit - 1);
            }

            const { data: images, error } = await query;

            if (error) throw error;

            // Generate signed URLs for each image
            const imagesWithUrls = await Promise.all(
                images.map(async (image) => {
                    try {
                        const { data: urlData } = await supabase.storage
                            .from(image.documents.bucket_name)
                            .createSignedUrl(image.documents.storage_path, 3600); // 1 hour

                        return {
                            ...image,
                            signed_url: urlData?.signedUrl || image.original_url
                        };
                    } catch (error) {
                        console.error(`Error generating URL for image ${image.id}:`, error);
                        return {
                            ...image,
                            signed_url: image.original_url
                        };
                    }
                })
            );

            return {
                success: true,
                images: imagesWithUrls,
                count: images.length
            };

        } catch (error) {
            console.error('Error getting images:', error);
            throw error;
        }
    }

    /**
     * Update display order for multiple images (batch reorder)
     */
    async updateImageOrder(imageOrders) {
        try {
            const { data, error } = await supabase
                .rpc('reorder_images', {
                    p_image_orders: imageOrders
                });

            if (error) throw error;

            return {
                success: true,
                updated_count: data
            };

        } catch (error) {
            console.error('Error reordering images:', error);
            throw error;
        }
    }

    /**
     * Soft delete an image
     */
    async softDeleteImage(imageId) {
        try {
            const { data, error } = await supabase
                .rpc('soft_delete_image', {
                    p_image_id: imageId
                });

            if (error) throw error;

            return {
                success: data,
                message: data ? 'Image deleted successfully' : 'Image not found or already deleted'
            };

        } catch (error) {
            console.error('Error deleting image:', error);
            throw error;
        }
    }

    /**
     * Restore a soft-deleted image
     */
    async restoreImage(imageId) {
        try {
            const { data, error } = await supabase
                .rpc('restore_image', {
                    p_image_id: imageId
                });

            if (error) throw error;

            return {
                success: data,
                message: data ? 'Image restored successfully' : 'Image not found or not deleted'
            };

        } catch (error) {
            console.error('Error restoring image:', error);
            throw error;
        }
    }

    /**
     * Update optimization status and URLs after Make.com processing
     */
    async updateOptimizationStatus(imageId, status, cloudinaryUrl = null, onedrivePath = null) {
        try {
            const { data, error } = await supabase
                .rpc('update_optimization_status', {
                    p_image_id: imageId,
                    p_status: status,
                    p_cloudinary_url: cloudinaryUrl,
                    p_onedrive_path: onedrivePath
                });

            if (error) throw error;

            return {
                success: data,
                message: data ? 'Status updated successfully' : 'Image not found'
            };

        } catch (error) {
            console.error('Error updating optimization status:', error);
            throw error;
        }
    }

    /**
     * Get pending images for Cloudinary processing
     */
    async getPendingOptimizations(limit = 50) {
        try {
            const { data: images, error } = await supabase
                .rpc('get_pending_optimizations', {
                    p_limit: limit
                });

            if (error) throw error;

            return {
                success: true,
                images: images,
                count: images.length
            };

        } catch (error) {
            console.error('Error getting pending optimizations:', error);
            throw error;
        }
    }

    /**
     * Get image count for a case
     */
    async getCaseImageCount(caseId) {
        try {
            const { data: count, error } = await supabase
                .rpc('get_case_image_count', {
                    p_case_id: caseId
                });

            if (error) throw error;
            return count || 0;

        } catch (error) {
            console.error('Error getting image count:', error);
            return 0;
        }
    }

    /**
     * Get image count by category for a case
     */
    async getCaseImageCountByCategory(caseId) {
        try {
            const { data: counts, error } = await supabase
                .rpc('get_case_image_count_by_category', {
                    p_case_id: caseId
                });

            if (error) throw error;
            return counts || {};

        } catch (error) {
            console.error('Error getting image count by category:', error);
            return {};
        }
    }

    /**
     * Extract image dimensions from file
     * Returns a promise that resolves with {width, height}
     */
    async getImageDimensions(file) {
        return new Promise((resolve, reject) => {
            if (!file.type.startsWith('image/')) {
                reject(new Error('File is not an image'));
                return;
            }

            const img = new Image();
            const objectUrl = URL.createObjectURL(file);

            img.onload = () => {
                URL.revokeObjectURL(objectUrl);
                resolve({
                    width: img.width,
                    height: img.height
                });
            };

            img.onerror = () => {
                URL.revokeObjectURL(objectUrl);
                reject(new Error('Failed to load image'));
            };

            img.src = objectUrl;
        });
    }

    /**
     * Upload image with full metadata extraction
     * Combines file upload + image record creation
     */
    async uploadImage(file, uploadOptions = {}) {
        const {
            caseId,
            category = 'damage',
            damageCenterId = null,
            onProgress = null,
            metadata = {}
        } = uploadOptions;

        try {
            // Extract image dimensions
            let dimensions = { width: null, height: null };
            try {
                dimensions = await this.getImageDimensions(file);
            } catch (error) {
                console.warn('Could not extract image dimensions:', error);
            }

            // Upload file to Supabase Storage
            const uploadResult = await this.uploadToSupabase(file, {
                caseId,
                category,
                onProgress,
                metadata: {
                    ...metadata,
                    width: dimensions.width,
                    height: dimensions.height
                }
            });

            if (!uploadResult.success) {
                throw new Error('File upload failed');
            }

            // Get public URL
            const { data: urlData } = await supabase.storage
                .from(uploadResult.bucket)
                .getPublicUrl(uploadResult.storagePath);

            // Create image record in database
            const imageResult = await this.createImageRecord({
                caseId,
                documentId: uploadResult.document.id,
                damageCenterId,
                originalUrl: urlData.publicUrl,
                filename: file.name,
                category,
                width: dimensions.width,
                height: dimensions.height,
                exifData: null, // Can be extracted later if needed
                source: 'direct_upload'
            });

            return {
                success: true,
                document: uploadResult.document,
                image: imageResult.image,
                storagePath: uploadResult.storagePath,
                bucket: uploadResult.bucket,
                publicUrl: urlData.publicUrl
            };

        } catch (error) {
            console.error('Error uploading image:', error);
            throw error;
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