# SmartVal Supabase Setup Instructions

## Phase 1: Foundation Setup

### Step 1: Create Supabase Project

1. Go to [https://supabase.com](https://supabase.com)
2. Sign up or log in
3. Click "New project"
4. Fill in:
   - Project name: `SmartVal` (or `SmartVal-Dev` for development)
   - Database password: (save this securely!)
   - Region: Choose closest to your users
   - Pricing plan: Free tier is fine for development

5. Wait for project to be created (takes 1-2 minutes)

### Step 2: Get Your Credentials

Once your project is ready:

1. Go to Settings → API
2. Copy these values:
   - **Project URL**: `https://YOUR_PROJECT_REF.supabase.co`
   - **Anon/Public Key**: `eyJhbGc...` (long string)
   - **Service Role Key**: `eyJhbGc...` (different long string)

⚠️ **Important**: 
- Never expose the Service Role Key in client-side code
- Keep it secure and use only in server-side operations

### Step 3: Configure Environment

1. Copy `.env.example` to `.env`:
   ```bash
   cp .env.example .env
   ```

2. Edit `.env` and add your Supabase credentials:
   ```
   NEXT_PUBLIC_SUPABASE_URL=https://YOUR_PROJECT_REF.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
   SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here
   ```

### Step 4: Apply Database Migrations

#### Option A: Using Supabase Dashboard (Easiest)

1. Go to your Supabase project dashboard
2. Navigate to SQL Editor
3. Click "New query"
4. Copy contents of `/supabase/migrations/20250926_initial_schema.sql`
5. Paste and click "Run"
6. Repeat for `/supabase/migrations/20250926_storage_buckets.sql`

#### Option B: Using Supabase CLI

1. Install Supabase CLI:
   ```bash
   npm install -g supabase
   ```

2. Login and link project:
   ```bash
   supabase login
   supabase link --project-ref YOUR_PROJECT_REF
   ```

3. Apply migrations:
   ```bash
   supabase db push
   ```

### Step 5: Verify Setup

1. Go to Supabase Dashboard → Table Editor
2. You should see these tables:
   - cases
   - case_helper
   - helper_versions
   - parts_required
   - invoices
   - ... and others

3. Go to Storage
4. You should see these buckets:
   - reports
   - originals
   - processed
   - docs
   - temp

### Step 6: Test Connection

Create a test file `test-connection.js`:

```javascript
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

const supabase = createClient(supabaseUrl, supabaseKey)

async function testConnection() {
  try {
    // Test database connection
    const { data, error } = await supabase
      .from('cases')
      .select('count')
      
    if (error) throw error
    
    console.log('✅ Database connection successful!')
    
    // Test storage connection
    const { data: buckets, error: storageError } = await supabase
      .storage
      .listBuckets()
      
    if (storageError) throw storageError
    
    console.log('✅ Storage connection successful!')
    console.log('📦 Available buckets:', buckets.map(b => b.name))
    
  } catch (error) {
    console.error('❌ Connection failed:', error.message)
  }
}

testConnection()
```

Run with: `node test-connection.js`

## What's Next?

After completing Phase 1:

1. **No changes to existing system** - everything still works via Make.com
2. **Infrastructure ready** - database and storage are set up
3. **Connection verified** - we can connect from the application

Next phase (Phase 2) will implement dual-write to start copying data to Supabase while keeping the current system running.

## Troubleshooting

### Cannot connect to database
- Check your Supabase URL and keys are correct
- Ensure your project is active (not paused)
- Verify network connectivity

### Migrations fail
- Check for SQL syntax errors
- Ensure you're running in the correct order
- Try running smaller chunks if needed

### Storage buckets not created
- Storage bucket creation requires specific permissions
- Try creating them manually in the dashboard
- Check the storage policies are applied

## Support

- Supabase Documentation: https://supabase.com/docs
- Supabase Discord: https://discord.supabase.com
- Project Documentation: See SUPABASE_MIGRATION_PROJECT.md