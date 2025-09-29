# SmartVal Supabase Integration

This folder contains all SQL scripts, database functions, and migration files for the SmartVal Supabase integration.

## 📁 Directory Structure

### `/sql/` - Database Scripts
All PostgreSQL scripts for database setup, functions, and data processing.

**Key Files:**
- `DEPLOY_FUNCTIONS.sql` ⭐ - **READY TO DEPLOY** - Copy this to Supabase SQL Editor
- `smart_parts_search.sql` - New optimized search function (MAIN)
- `fix_reversed_hebrew.sql` - Hebrew text correction functions  
- `simple_hebrew_extraction.sql` - Simplified extraction functions
- `analyze_catalog_patterns.sql` - Data analysis scripts
- `complete_catalog_extraction.sql` - Full catalog processing
- `automatic_extraction_trigger.sql` - Auto-processing triggers

**Categories:**
- **Search Functions**: `smart_parts_search.sql`, `simple_hebrew_extraction.sql`
- **Hebrew Processing**: `fix_reversed_hebrew.sql`, `improved_hebrew_extraction.sql`
- **Data Extraction**: `*extraction*.sql`, `*batch*.sql`
- **Analysis**: `analyze_catalog_patterns.sql`, `check_*.sql`
- **Maintenance**: `debug_*.sql`, `fix_*.sql`

### `/migrations/` - Schema Migrations
Version-controlled database schema changes.

- `20250926_initial_schema.sql` - Initial database structure
- `20250926_storage_buckets.sql` - File storage setup

### `/` - Configuration Files
- `SETUP_INSTRUCTIONS.md` - Database setup guide
- `fix-rls-policies.sql` - Row Level Security policies
- `test-connection.js` - Connection testing utility

## 🚀 Quick Start

### 1. Deploy Core Search Function
```sql
-- EASIEST: Copy and paste sql/DEPLOY_FUNCTIONS.sql into Supabase SQL Editor
-- OR run this in psql:
\i sql/DEPLOY_FUNCTIONS.sql
```

### 2. Setup Hebrew Processing
```sql
-- For Hebrew text correction
\i sql/fix_reversed_hebrew.sql
\i sql/simple_hebrew_extraction.sql
```

### 3. Verify Installation
```javascript
// Test connection
node test-connection.js
```

## 📊 Migration Status

### ✅ Completed Migrations
- [x] Initial schema setup
- [x] Storage buckets configuration  
- [x] Parts catalog integration
- [x] Hebrew text processing functions
- [x] New search architecture implementation

### 🔄 Active Development
- [ ] Performance optimization
- [ ] Advanced search features
- [ ] Full-text search integration

## 🔧 Usage Examples

### Basic Search Function
```sql
SELECT * FROM smart_parts_search(
    free_query_param := 'פנס',
    make_param := 'טויוטה',
    limit_results := 50
);
```

### Hebrew Text Correction
```sql
SELECT fix_hebrew_words('סנפ ימדק טויוטה'); 
-- Returns: 'פנס קדמי טויוטה'
```

### Batch Processing
```sql
SELECT run_simple_hebrew_extraction(1000);
```

## 📋 File Index

### Search & Processing
| File | Purpose | Status |
|------|---------|--------|
| `smart_parts_search.sql` | Main search function | ✅ Active |
| `simple_hebrew_extraction.sql` | Text processing | ✅ Active |
| `fix_reversed_hebrew.sql` | Hebrew correction | ✅ Active |

### Data Management  
| File | Purpose | Status |
|------|---------|--------|
| `complete_catalog_extraction.sql` | Full data processing | 📦 Archived |
| `batch_extraction.sql` | Batch operations | 📦 Archived |
| `auto_process_all_catalogs.sql` | Automated processing | 📦 Archived |

### Analysis & Debug
| File | Purpose | Status |
|------|---------|--------|
| `analyze_catalog_patterns.sql` | Data analysis | 🔧 Utility |
| `check_current_tables.sql` | Structure verification | 🔧 Utility |
| `debug_extraction.sql` | Debugging tools | 🔧 Utility |

## 🛠️ Maintenance

### Regular Tasks
1. **Performance Monitoring**: Check search response times
2. **Data Quality**: Verify Hebrew text processing accuracy  
3. **Index Optimization**: Monitor and rebuild indexes as needed

### Troubleshooting
- Check `test-connection.js` for connectivity issues
- Review `fix-rls-policies.sql` for permission problems
- Use debug scripts in `/sql/debug_*.sql` for data issues

## 📞 Support

For technical issues:
1. Check connection with `test-connection.js`
2. Review error logs in application
3. Test individual functions with provided SQL examples

---

**Last Updated**: 2025-09-29  
**Version**: 2.0 (New Search Architecture)  
**Maintainer**: SmartVal Development Team