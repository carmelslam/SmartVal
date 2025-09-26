// lib/supabaseClient.js
import { createClient } from '@supabase/supabase-js'

const url = process.env.NEXT_PUBLIC_SUPABASE_URL
const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

// Configure real-time options
const options = {
  realtime: {
    params: {
      eventsPerSecond: 10,
    },
  },
  // Add retry and reconnect options
  global: {
    headers: {
      'x-application-name': 'SmartVal',
    },
  },
}

export const supabase = createClient(url, key, options)

// Export for debugging
if (typeof window !== 'undefined') {
  window.supabaseClient = supabase;
}
