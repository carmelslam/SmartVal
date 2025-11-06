# Phase 7: File Storage & OneDrive Integration - SQL Files

**Session 99 - 2025-11-06**  
**Phase**: 7 - File Storage & OneDrive Integration

## Overview

This folder contains all SQL files for Phase 7 of the Supabase migration project. Phase 7 implements a comprehensive file storage system that uses Supabase Storage as the primary storage with OneDrive as a backup mechanism.

## File Execution Order

Execute these SQL files in the following order:

### 1. `01_enhance_documents_table.sql`
**Purpose**: Enhance the documents table for Supabase Storage integration
**What it does**:
- Adds new columns for storage management (bucket_name, storage_path, upload_status, file_hash, etc.)
- Creates helper functions for path generation and bucket determination
- Adds triggers for auto-population of storage fields
- Creates indexes for performance
- Sets up RLS policies

### 2. `02_create_sync_functions.sql`
**Purpose**: OneDrive sync management system
**What it does**:
- Creates `file_sync_status` table for tracking sync operations
- Implements functions for triggering and managing OneDrive sync
- Adds retry logic for failed syncs
- Creates auto-sync triggers
- Provides sync queue management

### 3. `03_create_signed_url_functions.sql`
**Purpose**: Secure file access with signed URLs
**What it does**:
- Creates file access logging table
- Implements permission checking functions
- Provides signed URL generation with access control
- Adds batch URL generation capabilities
- Creates file information retrieval functions

### 4. `04_create_file_versioning.sql`
**Purpose**: File versioning and history management
**What it does**:
- Creates `file_versions` table for version tracking
- Implements version creation and restoration functions
- Provides version comparison capabilities
- Adds cleanup functions for old versions
- Creates version statistics views

### 5. `05_create_storage_policies.sql`
**Purpose**: Storage bucket RLS policies and security
**What it does**:
- Defines Row Level Security policies for all storage buckets
- Creates validation functions for file uploads
- Implements access control for different user roles
- Adds storage usage monitoring

### 6. `06_create_file_operations.sql`
**Purpose**: Advanced file operations and maintenance
**What it does**:
- Creates file operations logging
- Implements advanced file search functionality
- Provides bulk file operations
- Adds file export manifest generation
- Creates comprehensive cleanup functions

## Key Features Implemented

### Storage Management
- **5 Storage Buckets**: reports, originals, processed, docs, temp
- **Automatic Path Generation**: Organized by case and category
- **File Validation**: Size limits, MIME type checking, security validation
- **Duplicate Detection**: Hash-based duplicate prevention

### OneDrive Integration
- **Automatic Sync**: Files automatically backed up to OneDrive after Supabase upload
- **Retry Logic**: Failed syncs automatically retried with exponential backoff
- **Status Tracking**: Real-time sync status monitoring
- **Queue Management**: Priority-based sync queue

### Security Features
- **Row Level Security**: Access control based on case ownership and user roles
- **Signed URLs**: Secure, time-limited file access
- **Permission Validation**: Multi-level access checking
- **Audit Logging**: Complete access and operation tracking

### File Versioning
- **Automatic Versioning**: Track changes to files over time
- **Version Restoration**: Restore previous versions when needed
- **Version Comparison**: Compare differences between versions
- **Retention Management**: Automatic cleanup of old versions

### Advanced Operations
- **File Search**: Multi-criteria search across all file metadata
- **Bulk Operations**: Update, delete, or move multiple files
- **Export Manifests**: Generate complete case file listings
- **Maintenance**: Automated cleanup of temporary and failed files

## Database Objects Created

### Tables
- `file_sync_status` - OneDrive sync tracking
- `file_access_log` - File access audit trail
- `file_versions` - File version history
- `file_operations_log` - Bulk operations tracking

### Functions (RPC)
- `generate_storage_path()` - Storage path generation
- `determine_bucket()` - Bucket selection logic
- `trigger_onedrive_sync()` - Initiate OneDrive backup
- `generate_signed_url()` - Secure URL generation
- `search_files()` - Advanced file search
- `bulk_file_operation()` - Bulk file operations
- `create_file_version()` - Version management
- And many more...

### Views
- `file_statistics` - File storage statistics
- `sync_statistics` - Sync operation statistics
- `file_access_statistics` - Access pattern analysis
- `storage_usage_summary` - Storage usage by bucket

## Integration with Existing System

### Helper Integration
The file upload service integrates seamlessly with the existing helper system:
- Files are associated with case IDs from helper.case_info.supabase_case_id
- File metadata stored in helper can reference Supabase document IDs
- Real-time updates via Supabase Realtime

### Make.com Integration
- OneDrive sync triggered via webhooks to existing Make.com scenarios
- OCR and image processing continues through Make.com
- External file processing results stored back in Supabase

### UI Integration
- All file displays use signed URLs for security
- File upload progress tracked in real-time
- Case file listings powered by database queries

## Configuration Requirements

### Environment Variables
Add to your environment:
```bash
SUPABASE_STORAGE_URL=https://your-project.supabase.co/storage/v1
ONEDRIVE_SYNC_WEBHOOK=https://hook.eu2.make.com/SYNC_TO_ONEDRIVE
```

### Storage Bucket Setup
Ensure these buckets exist in Supabase Storage:
- `reports` (50MB limit, PDFs only)
- `originals` (10MB limit, images only)
- `processed` (10MB limit, processed images)
- `docs` (50MB limit, documents)
- `temp` (50MB limit, any file type)

### RLS Policies
After running the SQL files, verify that RLS policies are active for all storage buckets via the Supabase dashboard.

## Usage Examples

### JavaScript Integration
```javascript
import { fileUploadService } from './lib/fileUploadService.js';

// Upload a file
const result = await fileUploadService.uploadToSupabase(file, {
  caseId: helper.case_info.supabase_case_id,
  category: 'invoice',
  onProgress: (percentage) => updateProgressBar(percentage)
});

// Get signed URL for display
const urlInfo = await fileUploadService.getSignedUrl(documentId);
document.getElementById('fileLink').href = urlInfo.signed_url;
```

### SQL Queries
```sql
-- Search files
SELECT search_files('{"filename": "invoice", "case_id": "uuid-here"}');

-- Get case files
SELECT get_case_files('case-uuid'::uuid, 'invoice', 20, 0);

-- Trigger sync
SELECT trigger_onedrive_sync('document-uuid'::uuid, 'high');
```

## Monitoring and Maintenance

### Regular Maintenance
Run these queries periodically:
```sql
-- Cleanup old files (run daily)
SELECT comprehensive_file_cleanup('{"temp_files_days": 1}');

-- Retry failed syncs (run hourly)
SELECT retry_failed_syncs();

-- Check storage usage
SELECT * FROM storage_usage_summary;
```

### Health Checks
```sql
-- Check sync status
SELECT * FROM sync_statistics;

-- Check failed uploads
SELECT COUNT(*) FROM documents WHERE upload_status = 'failed';

-- Check pending syncs
SELECT COUNT(*) FROM file_sync_status WHERE status = 'pending';
```

## Security Considerations

1. **Access Control**: All file access goes through RLS policies
2. **Signed URLs**: Files never directly accessible, always through secure URLs
3. **Audit Trail**: All file operations logged for security review
4. **Role-Based Access**: Different permissions for admin, user, assessor roles
5. **File Validation**: All uploads validated for size, type, and content

## Support and Troubleshooting

### Common Issues
1. **Upload Failures**: Check bucket policies and file size limits
2. **Sync Issues**: Review file_sync_status table for error details
3. **Access Denied**: Verify case ownership and user permissions
4. **Storage Full**: Monitor storage_usage_summary for capacity

### Debug Queries
```sql
-- Check file operation logs
SELECT * FROM file_operations_status WHERE status = 'failed';

-- Check access denials
SELECT * FROM file_access_log WHERE access_granted = false;

-- Check sync failures
SELECT * FROM file_sync_status WHERE status = 'failed';
```

## Next Steps

After deploying these SQL files:

1. **Test File Upload**: Verify basic upload functionality
2. **Test OneDrive Sync**: Confirm backup mechanism works
3. **Test Access Control**: Verify RLS policies work correctly
4. **Update UI Components**: Integrate new file service
5. **Monitor Performance**: Check query performance and storage usage

## Files Modified in Other Phases

This phase enhances but doesn't replace:
- Existing `documents` table (Phase 1)
- Case and user management (Phase 6)
- Make.com webhook integrations (existing)

---

**Last Updated**: 2025-11-06  
**Created By**: Claude (Sonnet 4) - Session 99  
**Phase**: 7 - File Storage & OneDrive Integration