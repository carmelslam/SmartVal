// Test Supabase Connection
// Run this after setting up your .env file to verify connection

import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

// Load environment variables - try .env.local first, then .env
dotenv.config({ path: '.env.local' })
dotenv.config() // fallback to .env if needed

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase credentials in .env file')
  console.log('Make sure you have set:')
  console.log('- NEXT_PUBLIC_SUPABASE_URL')
  console.log('- NEXT_PUBLIC_SUPABASE_ANON_KEY')
  process.exit(1)
}

console.log('🔄 Connecting to Supabase...')
console.log('URL:', supabaseUrl)

const supabase = createClient(supabaseUrl, supabaseKey)

async function testConnection() {
  console.log('\n📊 Testing Database Connection...')
  
  try {
    // Test 1: Basic database query
    const { data, error } = await supabase
      .from('cases')
      .select('id')
      .limit(1)
      
    if (error) {
      if (error.message.includes('relation "public.cases" does not exist')) {
        console.error('❌ Tables not created yet. Please run the migration SQL first.')
        return false
      }
      throw error
    }
    
    console.log('✅ Database connection successful!')
    
    // Test 2: Check tables exist
    const tables = [
      'cases', 'case_helper', 'helper_versions', 
      'parts_required', 'invoices', 'documents'
    ]
    
    console.log('\n📋 Checking tables...')
    for (const table of tables) {
      const { error: tableError } = await supabase
        .from(table)
        .select('id')
        .limit(1)
        
      if (tableError) {
        console.log(`❌ Table '${table}' - NOT FOUND`)
      } else {
        console.log(`✅ Table '${table}' - OK`)
      }
    }
    
    // Test 3: Storage connection
    console.log('\n📦 Testing Storage Connection...')
    const { data: buckets, error: storageError } = await supabase
      .storage
      .listBuckets()
      
    if (storageError) {
      console.error('❌ Storage connection failed:', storageError.message)
    } else {
      console.log('✅ Storage connection successful!')
      
      const expectedBuckets = ['reports', 'originals', 'processed', 'docs', 'temp']
      console.log('\n📦 Checking storage buckets...')
      
      const bucketNames = buckets.map(b => b.name)
      for (const bucket of expectedBuckets) {
        if (bucketNames.includes(bucket)) {
          console.log(`✅ Bucket '${bucket}' - OK`)
        } else {
          console.log(`❌ Bucket '${bucket}' - NOT FOUND`)
        }
      }
    }
    
    // Test 4: Test insert (optional)
    console.log('\n🧪 Testing data operations...')
    const testCase = {
      plate: 'TEST-' + Date.now(),
      owner_name: 'Test Owner',
      status: 'OPEN'
    }
    
    const { data: insertedCase, error: insertError } = await supabase
      .from('cases')
      .insert([testCase])
      .select()
      .single()
      
    if (insertError) {
      console.error('❌ Insert test failed:', insertError.message)
    } else {
      console.log('✅ Insert test successful! Case ID:', insertedCase.id)
      
      // Clean up test data
      const { error: deleteError } = await supabase
        .from('cases')
        .delete()
        .eq('id', insertedCase.id)
        
      if (!deleteError) {
        console.log('✅ Test data cleaned up')
      }
    }
    
    console.log('\n🎉 All tests completed!')
    return true
    
  } catch (error) {
    console.error('\n❌ Connection test failed:', error.message)
    return false
  }
}

// Run the test
testConnection().then(success => {
  if (success) {
    console.log('\n✅ Supabase is ready for Phase 2!')
  } else {
    console.log('\n❌ Please fix the issues above before proceeding.')
  }
  process.exit(success ? 0 : 1)
})