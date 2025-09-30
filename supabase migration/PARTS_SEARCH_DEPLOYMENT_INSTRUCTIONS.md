# Parts Search Module - Deployment Instructions

## Phase 1: Deploy SQL Functions to Supabase

### Step 1: Access Supabase SQL Editor
1. Go to your Supabase dashboard: https://nvqrptokmwdhvpiufrad.supabase.co
2. Navigate to the SQL Editor section (left sidebar)
3. Click "New Query" button

### Step 2: Deploy the Search Functions
1. Copy the ENTIRE content from the file: `/supabase/sql/DEPLOY_FUNCTIONS.sql`
2. Paste it into the SQL Editor
3. Click the "RUN" button
4. Wait for the success message: "SUCCESS: Functions deployed and tested!"

### Step 3: Verify Deployment
After running the SQL, you should see:
- Test results showing "Testing basic search..." and "Testing JSON wrapper..."
- A final message saying "SUCCESS: Functions deployed and tested!"

If you see any errors:
- Check that you copied the entire file content
- Make sure no previous version of these functions exists (they will be replaced)
- Contact support if errors persist

### Step 4: Test the Functions Manually (Optional)
You can test the functions with these queries:

```sql
-- Test Hebrew search
SELECT * FROM smart_parts_search(free_query_param := 'פנס') LIMIT 5;

-- Test make/model search
SELECT * FROM smart_parts_search(
    make_param := 'טויוטה',
    model_param := 'קורולה'
) LIMIT 5;

-- Test JSON wrapper
SELECT * FROM simple_parts_search('{
    "free_query": "כנף",
    "make": "טויוטה",
    "limit": 10
}'::jsonb);
```

## Next Steps
Once the SQL functions are deployed:
1. The search functionality will be available via the RPC endpoint
2. The service file will automatically use these functions
3. Hebrew text search will work correctly
4. Performance will be significantly improved

## Important Notes
- These functions replace any previous search functions
- They handle Hebrew text reversal issues automatically
- They support all search parameters from the UI
- Response time should be under 500ms for most queries